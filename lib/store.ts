import { Post, Thread } from "./types";
import { boards } from "./boards";
import { redis } from "./redis";

const MAX_THREADS_PER_BOARD = 67;

type ThreadMeta = Record<string, string> | null;
type Loc = { board: string; threadNo: number };

// Upstash auto-deserializes JSON, so values may come back as strings or objects.
function parse<T>(v: string | T): T {
  return typeof v === "string" ? JSON.parse(v) : v;
}

function toThread(meta: ThreadMeta, rawReplies: (string | Post)[] | null): Thread | undefined {
  if (!meta?.op) return undefined;
  return {
    no: Number(meta.no),
    board: meta.board,
    subject: meta.subject,
    op: parse<Post>(meta.op),
    replies: (rawReplies ?? []).map((r) => parse<Post>(r)),
    bumpedAt: Number(meta.bumpedAt),
  };
}

export async function getThreads(board: string): Promise<Thread[]> {
  if (board === "all") return getAllThreads();

  const threadNos: string[] = await redis.zrange(`board:${board}:threads`, 0, -1, { rev: true });
  if (threadNos.length === 0) return [];

  const pipe = redis.pipeline();
  for (const no of threadNos) {
    pipe.hgetall(`thread:${no}`);
    pipe.lrange(`thread:${no}:replies`, 0, -1);
  }
  const results = await pipe.exec();

  const threads: Thread[] = [];
  for (let i = 0; i < threadNos.length; i++) {
    const t = toThread(results[i * 2] as ThreadMeta, results[i * 2 + 1] as (string | Post)[] | null);
    if (t) threads.push(t);
  }
  return threads;
}

async function getAllThreads(): Promise<Thread[]> {
  const nested = await Promise.all(boards.filter((b) => b.slug !== "all").map((b) => getThreads(b.slug)));
  return nested.flat().sort((a, b) => b.bumpedAt - a.bumpedAt);
}

export async function getThread(board: string, no: number): Promise<Thread | undefined> {
  const meta = (await redis.hgetall(`thread:${no}`)) as ThreadMeta;
  if (!meta?.op || (board !== "all" && meta.board !== board)) return undefined;
  const replies = (await redis.lrange(`thread:${no}:replies`, 0, -1)) as (string | Post)[];
  return toThread(meta, replies);
}

async function generatePostNo(): Promise<number> {
  for (let i = 0; i < 20; i++) {
    const candidate = Math.floor(1000 + Math.random() * 9000);
    if (!(await redis.exists(`post:${candidate}:loc`))) return candidate;
  }
  const count = await redis.incr("global:nextNo");
  return 1000 + (count % 9000);
}

export async function addPost(
  board: string,
  threadNo: number | null,
  post: Omit<Post, "no" | "op">
): Promise<Post> {
  const actualBoard = board === "all" ? "b" : board;
  const newPost: Post = { ...post, no: await generatePostNo(), op: threadNo === null };
  const now = Date.now();

  if (threadNo === null) {
    const pipe = redis.pipeline();
    pipe.hset(`thread:${newPost.no}`, {
      no: String(newPost.no),
      board: actualBoard,
      subject: post.subject ?? "UNTITLED",
      bumpedAt: String(now),
      op: JSON.stringify(newPost),
    });
    pipe.zadd(`board:${actualBoard}:threads`, { score: now, member: String(newPost.no) });
    pipe.set(`post:${newPost.no}:loc`, JSON.stringify({ board: actualBoard, threadNo: newPost.no }));
    await pipe.exec();

    await pruneBoard(actualBoard);
    return newPost;
  }

  if (!(await redis.exists(`thread:${threadNo}`))) throw new Error("Thread not found.");

  const pipe = redis.pipeline();
  pipe.rpush(`thread:${threadNo}:replies`, JSON.stringify(newPost));
  pipe.set(`post:${newPost.no}:loc`, JSON.stringify({ board: actualBoard, threadNo }));
  if (!post.sage) {
    pipe.hset(`thread:${threadNo}`, { bumpedAt: String(now) });
    pipe.zadd(`board:${actualBoard}:threads`, { score: now, member: String(threadNo) });
  }
  await pipe.exec();
  return newPost;
}

async function pruneBoard(board: string): Promise<void> {
  const count = await redis.zcard(`board:${board}:threads`);
  if (count <= MAX_THREADS_PER_BOARD) return;
  const oldest: string[] = await redis.zrange(`board:${board}:threads`, 0, count - MAX_THREADS_PER_BOARD - 1);
  for (const no of oldest) await deleteThread(board, no);
}

async function deleteThread(board: string, threadNo: string): Promise<void> {
  const rawReplies = (await redis.lrange(`thread:${threadNo}:replies`, 0, -1)) as (string | Post)[];

  const pipe = redis.pipeline();
  pipe.zrem(`board:${board}:threads`, threadNo);
  pipe.del(`thread:${threadNo}`, `thread:${threadNo}:replies`, `post:${threadNo}:loc`);
  for (const r of rawReplies) pipe.del(`post:${parse<Post>(r).no}:loc`);
  await pipe.exec();
}

export async function getPostWithContext(no: number): Promise<(Post & Loc) | undefined> {
  const raw = (await redis.get(`post:${no}:loc`)) as string | Loc | null;
  if (!raw) return undefined;
  const { board, threadNo } = parse<Loc>(raw);

  if (threadNo === no) {
    const meta = (await redis.hgetall(`thread:${no}`)) as ThreadMeta;
    return meta?.op ? { ...parse<Post>(meta.op), threadNo, board } : undefined;
  }

  const rawReplies = (await redis.lrange(`thread:${threadNo}:replies`, 0, -1)) as (string | Post)[];
  const post = rawReplies.map((r) => parse<Post>(r)).find((p) => p.no === no);
  return post && { ...post, threadNo, board };
}
