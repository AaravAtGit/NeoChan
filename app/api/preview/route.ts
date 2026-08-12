import { NextResponse } from "next/server";
import { getPostWithContext } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const no = parseInt(searchParams.get("no") || "", 10);
  if (!no || Number.isNaN(no)) {
    return NextResponse.json({ error: "bad no" }, { status: 400 });
  }
  const post = await getPostWithContext(no);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(post);
}