import { getPostWithContext } from "@/lib/store";

export const dynamic = "force-dynamic";

// used by the hover previews for >>links to posts that aren't on the page
export async function GET(req: Request) {
  const no = Number(new URL(req.url).searchParams.get("no"));
  if (!no) return Response.json({ error: "bad no" }, { status: 400 });

  const post = await getPostWithContext(no);
  if (!post) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(post);
}
