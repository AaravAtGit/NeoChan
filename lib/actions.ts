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

  const serverStamp = nowStamp();
  await addPost(board, threadNo, { ...input, date: serverStamp });
  revalidatePath(`/${board}`);
  if (threadNo) revalidatePath(`/${board}/${threadNo}`);
}
