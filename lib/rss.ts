import { getBoardBySlug } from "./boards";
import { getThreads } from "./store";

const cdata = (s: string) => `<![CDATA[${s.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function generateBoardRssXml(slug: string, origin: string) {
  const board = getBoardBySlug(slug);
  if (!board) return null;

  const threads = await getThreads(board.slug);
  const title = board.slug === "all" ? "NeoChan - All Boards" : `NeoChan - /${board.slug}/ - ${board.title}`;

  const items = threads.map((t) => {
    const url = `${origin}/${t.board}/${t.no}`;
    const img = t.op.image;

    let html = "";
    if (img) html += `<p><img src="${escape(img.url)}" alt="${escape(img.name)}" style="max-width:300px" /></p>`;
    html += `<p>${escape(t.op.comment)}</p>`;
    html += `<p><small>${t.replies.length} replies | /${t.board}/ | No.${t.no}</small></p>`;

    return `
    <item>
      <title>${cdata(t.subject || t.op.comment.replace(/\s+/g, " ").slice(0, 70))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(t.bumpedAt).toUTCString()}</pubDate>
      <author>${cdata(t.op.name)}</author>
      <description>${cdata(html)}</description>
      <comments>${url}</comments>${img ? `\n      <enclosure url="${escape(img.url)}" length="0" type="image/jpeg" />` : ""}
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${cdata(title)}</title>
    <link>${origin}/${board.slug}</link>
    <description>${cdata(board.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${origin}/${board.slug}/rss.xml" rel="self" type="application/rss+xml" />${items.join("")}
  </channel>
</rss>`;
}
