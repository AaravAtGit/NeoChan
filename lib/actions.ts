"use server";
import { revalidatePath } from "next/cache";
import { addPost } from "./store";
import { nowStamp } from "./utils";
import { Post } from "./types";
import { getClientIp, checkPostRateLimit, recordPostRateLimit } from "./ratelimit";

export async function addPostAction(
  board: string,
  threadNo: number | null,
  input: Omit<Post, "no" | "date" | "op">,
  honeypot?: string
) {
  if (honeypot && honeypot.trim().length > 0) {
    throw new Error("Bot activity detected.");
  }

  const isThread = threadNo === null;

  if (isThread) {
    if (!input.comment?.trim() || !input.image) {
      throw new Error("Both image and comment are required for creating new threads.");
    }
  } else {
    if (!input.comment?.trim()) {
      throw new Error("Comment is required for replies.");
    }
  }

  const ip = await getClientIp();

  
  await checkPostRateLimit(ip, isThread, input.comment);

  const serverStamp = nowStamp();
  await addPost(board, threadNo, { ...input, date: serverStamp });

 
  await recordPostRateLimit(ip, isThread, input.comment);

  revalidatePath(`/${board}`);
  if (threadNo) revalidatePath(`/${board}/${threadNo}`);
}

