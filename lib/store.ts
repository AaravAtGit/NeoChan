import { Board, Post, Thread } from "./types";
import { boards, getBoardBySlug } from "./boards";
import { redis } from "./redis";

const MAX_THREADS_PER_BOARD = 67;


export function getBoards(): Board[] {
  return boards;
}

export function getBoard(slug: string): Board | undefined {
  return getBoardBySlug(slug);
}


export async function getThreads(board: string): Promise<Thread[]> {
  const threadNos: string[] = await redis.zrange(`board:${board}:threads`, 0, -1, { rev: true });

  if (threadNos.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const no of threadNos) {
    pipeline.hgetall(`thread:${no}`);
    pipeline.lrange(`thread:${no}:replies`, 0, -1);
  }

  const results = await pipeline.exec();

  const threads: Thread[] = [];
  for (let i = 0; i < threadNos.length; i++) {
    const meta = results[i * 2] as Record<string, string> | null;
    const rawReplies = results[i * 2 + 1] as (string | Post)[] | null;

    if (!meta || !meta.op) continue;

    const op: Post = typeof meta.op === "string" ? JSON.parse(meta.op) : meta.op;
    const replies: Post[] = (rawReplies ?? []).map((r) =>
      typeof r === "string" ? JSON.parse(r) : r
    );

    threads.push({
      no: Number(meta.no),
      board: meta.board as string,
      subject: meta.subject as string,
      op,
      replies,
      bumpedAt: Number(meta.bumpedAt),
    });
  }

  return threads;
}

export async function getThread(board: string, no: number): Promise<Thread | undefined> {
  const meta = await redis.hgetall(`thread:${no}`) as Record<string, string> | null;
  if (!meta || !meta.op || meta.board !== board) return undefined;

  const rawReplies = await redis.lrange(`thread:${no}:replies`, 0, -1) as (string | Post)[];

  const op: Post = typeof meta.op === "string" ? JSON.parse(meta.op) : meta.op;
  const replies: Post[] = rawReplies.map((r) =>
    typeof r === "string" ? JSON.parse(r) : r
  );

  return {
    no: Number(meta.no),
    board: meta.board as string,
    subject: meta.subject as string,
    op,
    replies,
    bumpedAt: Number(meta.bumpedAt),
  };
}


async function generatePostNo(): Promise<number> {
  for (let i = 0; i < 20; i++) {
    const candidate = Math.floor(1000 + Math.random() * 9000);
    const exists = await redis.exists(`post:${candidate}:loc`);
    if (!exists) return candidate;
  }
  const count = await redis.incr("global:nextNo");
  return 1000 + (count % 9000);
}

export async function addPost(
  board: string,
  threadNo: number | null,
  post: Omit<Post, "no" | "op"> & { date?: string }
): Promise<Post> {
  const postNo = await generatePostNo();

  const newPost: Post = {
    ...post,
    no: postNo,
    date: post.date ?? new Date().toLocaleString("en-US", { hour12: false }),
    op: false,
  };

  if (threadNo === null) {
    if (!post.comment?.trim() || !post.image) {
      throw new Error("Both image and comment are required to create a new thread.");
    }
    const op: Post = { ...newPost, op: true };
    const now = Date.now();
    
    const threadMeta = {
      no: String(op.no),
      board,
      subject: post.subject ?? "UNTITLED",
      bumpedAt: String(now),
      op: JSON.stringify(op),
    };

    const pipe = redis.pipeline();
    pipe.hset(`thread:${op.no}`, threadMeta);
    pipe.zadd(`board:${board}:threads`, { score: now, member: String(op.no) });
    pipe.set(`post:${op.no}:loc`, JSON.stringify({ board, threadNo: op.no }));
    await pipe.exec();

    const count = await redis.zcard(`board:${board}:threads`);
    if (count > MAX_THREADS_PER_BOARD) {
      const excess = count - MAX_THREADS_PER_BOARD;
      const candidates: string[] = await redis.zrange(
        `board:${board}:threads`,
        0,
        excess + (board === "oc" ? 5 : 0)
      );

      // Hardcoding to reserve the OG Thread. 
      const toPrune = (
        board === "oc" ? candidates.filter((no) => no !== "1" && Number(no) !== 1) : candidates
      ).slice(0, excess);

      for (const oldNo of toPrune) {
        await deleteThread(board, oldNo);
      }
    }

    return op;
  } else {
    if (!post.comment?.trim()) {
      throw new Error("Comment is required for replies.");
    }
    const exists = await redis.exists(`thread:${threadNo}`);
    if (!exists) throw new Error("thread not found");

    const pipe = redis.pipeline();
    pipe.rpush(`thread:${threadNo}:replies`, JSON.stringify(newPost));
    pipe.set(`post:${newPost.no}:loc`, JSON.stringify({ board, threadNo }));

    if (!post.sage) {
      const now = Date.now();
      pipe.hset(`thread:${threadNo}`, { bumpedAt: String(now) });
      pipe.zadd(`board:${board}:threads`, { score: now, member: String(threadNo) });
    }

    await pipe.exec();
    return newPost;
  }
}


async function deleteThread(board: string, threadNo: string): Promise<void> {
  // Hardcoded rule: Never delete thread/post No. 1 on /oc/
  if (board === "oc" && (String(threadNo) === "1" || Number(threadNo) === 1)) {
    return;
  }

  const rawReplies = await redis.lrange(`thread:${threadNo}:replies`, 0, -1) as (string | Post)[];
  const replyNos: number[] = rawReplies.map((r) => {
    const parsed: Post = typeof r === "string" ? JSON.parse(r) : r;
    return parsed.no;
  });

  const pipe = redis.pipeline();
  pipe.zrem(`board:${board}:threads`, threadNo);
  pipe.del(`thread:${threadNo}`);
  pipe.del(`thread:${threadNo}:replies`);
  pipe.del(`post:${threadNo}:loc`);
  for (const rNo of replyNos) {
    if (board === "oc" && (String(rNo) === "1" || Number(rNo) === 1)) {
      continue;
    }
    pipe.del(`post:${rNo}:loc`);
  }
  await pipe.exec();
}


export async function getPostByNo(no: number): Promise<Post | undefined> {
  const loc = await redis.get(`post:${no}:loc`) as string | { board: string; threadNo: number } | null;
  if (!loc) return undefined;

  const { threadNo } = typeof loc === "string" ? JSON.parse(loc) : loc;

  if (threadNo === no) {
    const meta = await redis.hgetall(`thread:${no}`) as Record<string, string> | null;
    if (!meta?.op) return undefined;
    return typeof meta.op === "string" ? JSON.parse(meta.op) : meta.op;
  }

  const rawReplies = await redis.lrange(`thread:${threadNo}:replies`, 0, -1) as (string | Post)[];
  for (const r of rawReplies) {
    const parsed: Post = typeof r === "string" ? JSON.parse(r) : r;
    if (parsed.no === no) return parsed;
  }

  return undefined;
}

export async function getPostWithContext(no: number): Promise<(Post & { threadNo: number; board: string }) | undefined> {
  const loc = await redis.get(`post:${no}:loc`) as string | { board: string; threadNo: number } | null;
  if (!loc) return undefined;

  const { board, threadNo } = typeof loc === "string" ? JSON.parse(loc) : loc;

  if (threadNo === no) {
    const meta = await redis.hgetall(`thread:${no}`) as Record<string, string> | null;
    if (!meta?.op) return undefined;
    const op: Post = typeof meta.op === "string" ? JSON.parse(meta.op) : meta.op;
    return { ...op, threadNo, board };
  }

  const rawReplies = await redis.lrange(`thread:${threadNo}:replies`, 0, -1) as (string | Post)[];
  for (const r of rawReplies) {
    const parsed: Post = typeof r === "string" ? JSON.parse(r) : r;
    if (parsed.no === no) return { ...parsed, threadNo, board };
  }

  return undefined;
}

