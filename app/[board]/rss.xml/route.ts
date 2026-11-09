import { generateBoardRssXml } from "@/lib/rss";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ board: string }> }) {
  const { board } = await params;
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/+$/, "");

  const xml = await generateBoardRssXml(board, origin);
  if (!xml) return new Response("Board not found", { status: 404 });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
