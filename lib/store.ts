import { Board, Post, Thread } from "./types";
import { mockBoards, mockThreads } from "./mock";

// === Module-level store. In Step 2, replace with Upstash Redis calls. ===
const boards: Map<string, Board> = new Map(mockBoards.map((b) => [b.slug, b]));
const threads: Map<string, Thread[]> = new Map(
  mockBoards.map((b) => [b.slug, mockThreads.filter((t) => t.board === b.slug)])
);
let nextNo = 900000;

export function getBoards(): Board[] {
  return Array.from(boards.values());
}

export function getBoard(slug: string): Board | undefined {
  return boards.get(slug);
}

export function getThreads(board: string): Thread[] {
  const list = threads.get(board) ?? [];
  // newest bump first — 4chan default sort
  return [...list].sort((a, b) => b.bumpedAt - a.bumpedAt);
}

export function getThread(board: string, no: number): Thread | undefined {
  return (threads.get(board) ?? []).find((t) => t.no === no);
}



export function addPost(
  board: string,
  threadNo: number | null,
  post: Omit<Post, "no" | "op"> & { date?: string }
): Post {
  const newPost: Post = {
    ...post,
    no: nextNo++,
    date: post.date ?? new Date().toLocaleString("en-US", { hour12: false }),
    op: false,
  };

  if (threadNo === null) {
    // new thread
    const op: Post = { ...newPost, op: true };
    const t: Thread = {
      no: op.no,
      board,
      subject: post.subject ?? "UNTITLED",
      op,
      replies: [],
      bumpedAt: Date.now(),
    };
    const list = threads.get(board) ?? [];
    list.unshift(t);
    threads.set(board, list);
    return op;
  } else {
    // reply
    const list = threads.get(board) ?? [];
    const t = list.find((x) => x.no === threadNo);
    if (!t) throw new Error("thread not found");
    t.replies.push(newPost);
    if (!post.sage) t.bumpedAt = Date.now();
    return newPost;
  }
}

export function getPostByNo(no: number): Post | undefined {
  for (const threadList of threads.values()) {
    for (const t of threadList) {
      if (t.no === no) return t.op;
      const found = t.replies.find((r) => r.no === no);
      if (found) return found;
    }
  }
  return undefined;
}

export function getPostWithContext(no: number): (Post & { threadNo: number; board: string }) | undefined {
  for (const threadList of threads.values()) {
    for (const t of threadList) {
      if (t.no === no) return { ...t.op, threadNo: t.no, board: t.board };
      const found = t.replies.find((r) => r.no === no);
      if (found) return { ...found, threadNo: t.no, board: t.board };
    }
  }
  return undefined;
}