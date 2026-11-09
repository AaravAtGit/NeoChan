export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// greentext + >>123 links. escape first, so the regexes match on &gt;
export function formatComment(raw: string) {
  return escapeHtml(raw)
    .split("\n")
    .map((line) => {
      line = line.replace(/&gt;&gt;(\d+)/g, '<a class="qlink" data-no="$1" href="#p$1">&gt;&gt;$1</a>');
      return line.startsWith("&gt;") ? `<span class="quote">${line}</span>` : line;
    })
    .join("<br>");
}

// post no -> nos of the replies that quote it
export function buildBacklinksMap(thread: { replies: { no: number; comment: string }[] }) {
  const map = new Map<number, number[]>();
  for (const reply of thread.replies) {
    const quoted = new Set([...reply.comment.matchAll(/>>(\d+)/g)].map((m) => Number(m[1])));
    for (const no of quoted) map.set(no, [...(map.get(no) ?? []), reply.no]);
  }
  return map;
}

// adds ">>no" on a new line, unless it's already in there
export function appendQuote(comment: string, no: number | string) {
  const quote = `>>${no}`;
  const text = comment.trim();
  if (text.split(/\s+/).includes(quote)) return comment;
  return (text ? text + "\n" : "") + quote + " ";
}

// 4chan style date: 08/12/26(Wed)14:02:11
export function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${pad(d.getFullYear() % 100)}(${day})${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
