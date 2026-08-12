export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatComment(raw: string): string {
  return escapeHtml(raw)
    .split("\n")
    .map((line) => {
      line = line.replace(/&gt;&gt;(\d+)/g, '<a class="qlink" data-no="$1" href="#p$1">&gt;&gt;$1</a>');
      return line.startsWith("&gt;") ? `<span class="quote">${line}</span>` : line;
    })
    .join("<br>");
}

export function extractQuotes(raw: string): number[] {
  const matches = raw.match(/>>(\d+)/g);
  if (!matches) return [];
  const numbers = matches.map((m) => parseInt(m.slice(2), 10)).filter((n) => !Number.isNaN(n));
  return Array.from(new Set(numbers));
}

export function buildBacklinksMap(thread: { replies: { no: number; comment: string }[] }): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const reply of thread.replies) {
    const quotes = extractQuotes(reply.comment);
    for (const q of quotes) {
      const existing = map.get(q) ?? [];
      if (!existing.includes(reply.no)) {
        existing.push(reply.no);
        map.set(q, existing);
      }
    }
  }
  return map;
}

export function nowStamp(): string {
  const d = new Date();
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${String(d.getFullYear()).slice(2)}(${wd})${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function relativeTime(ms: number): string {
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}