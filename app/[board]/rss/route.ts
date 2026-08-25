import { NextResponse } from "next/server";
import { generateBoardRssXml } from "@/lib/rss";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ board: string }> }
) {
  const { board } = await params;
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${url.protocol}//${url.host}`;

  const xml = await generateBoardRssXml(board, origin);
  if (!xml) {
    return new NextResponse("Board not found", { status: 404 });
  }

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
