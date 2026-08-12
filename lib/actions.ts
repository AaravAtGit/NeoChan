"use server";
import { revalidatePath } from "next/cache";
import { addPost } from "./store";
import { nowStamp } from "./utils";
import { Post } from "./types";

export async function addPostAction(
  board: string,
  threadNo: number | null,
  input: Omit<Post, "no" | "date" | "op">
) {
  // Server-side: override client date with server time
  const serverStamp = nowStamp();
  addPost(board, threadNo, { ...input, date: serverStamp });
  revalidatePath(`/${board}`);
  if (threadNo) revalidatePath(`/${board}/${threadNo}`);
}
