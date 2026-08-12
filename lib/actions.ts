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
  if (threadNo === null) {
    if (!input.comment?.trim() || !input.image) {
      throw new Error("Both image and comment are required for creating new threads.");
    }
  } else {
    if (!input.comment?.trim()) {
      throw new Error("Comment is required for replies.");
    }
  }

  const serverStamp = nowStamp();
  await addPost(board, threadNo, { ...input, date: serverStamp });
  revalidatePath(`/${board}`);
  if (threadNo) revalidatePath(`/${board}/${threadNo}`);
}
