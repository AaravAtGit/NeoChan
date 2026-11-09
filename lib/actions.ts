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
  if (honeypot?.trim()) throw new Error("Bot activity detected.");

  const isThread = threadNo === null;
  if (!input.comment?.trim()) throw new Error("Comment is required.");
  if (isThread && !input.image) throw new Error("An image is required to start a thread.");

  const ip = await getClientIp();
  await checkPostRateLimit(ip, isThread, input.comment);
  await addPost(board, threadNo, { ...input, date: nowStamp() });
  await recordPostRateLimit(ip, isThread, input.comment);

  revalidatePath(`/${board}`);
  revalidatePath("/all");
  revalidatePath("/");
  if (threadNo) revalidatePath(`/${board}/${threadNo}`);
}
