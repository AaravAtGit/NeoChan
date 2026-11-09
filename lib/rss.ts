import { getBoardBySlug } from "./boards";
import { getThreads } from "./store";

const XML_ESCAPES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => XML_ESCAPES[c]);
}

function cleanCdata(text: string): string {
  return text.replace(/]]>/g, "]]]]><![CDATA[>");
}

export async function generateBoardRssXml(boardSlug: string, origin: string): Promise<string | null> {
  const board = getBoardBySlug(boardSlug);
  if (!board) return null;

  const threads = await getThreads(board.slug);
  const siteUrl = origin.replace(/\/+$/, "");
  const boardUrl = `${siteUrl}/${board.slug}`;
  const feedUrl = `${siteUrl}/${board.slug}/rss.xml`;
  const channelTitle = board.slug === "all" ? "NeoChan - All Boards Stream" : `NeoChan - /${board.slug}/ - ${board.title}`;

  const itemsXml = threads
    .map((thread) => {
      const threadBoard = thread.board || board.slug;
      const threadUrl = `${siteUrl}/${threadBoard}/${thread.no}`;
      const title =
        thread.subject?.trim() ||
        (thread.op.comment ? thread.op.comment.replace(/\n+/g, " ").slice(0, 70).trim() : `Thread #${thread.no}`);
      const pubDate = thread.bumpedAt ? new Date(thread.bumpedAt).toUTCString() : new Date().toUTCString();
      const author = thread.op.name || "Anonymous";

      let descriptionHtml = `<p>${escapeXml(thread.op.comment)}</p>`;
      if (thread.op.image) {
        descriptionHtml = `<p><img src="${escapeXml(thread.op.image.url)}" alt="${escapeXml(thread.op.image.name || "image")}" style="max-width:300px;" /></p>` + descriptionHtml;
      }
      descriptionHtml += `<p><small>Replies: ${thread.replies.length} | Board: /${threadBoard}/ | No.${thread.no}</small></p>`;

      const enclosure = thread.op.image?.url
        ? `<enclosure url="${escapeXml(thread.op.image.url)}" length="0" type="image/jpeg" />`
        : "";

      return `    <item>
      <title><![CDATA[${cleanCdata(title)}]]></title>
      <link>${threadUrl}</link>
      <guid isPermaLink="true">${threadUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author><![CDATA[${cleanCdata(author)}]]></author>
      <description><![CDATA[${cleanCdata(descriptionHtml)}]]></description>
      <comments>${threadUrl}</comments>
      ${enclosure}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${cleanCdata(channelTitle)}]]></title>
    <link>${boardUrl}</link>
    <description><![CDATA[${cleanCdata(board.description)}]]></description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}
