import Link from "next/link";
import { Thread } from "@/lib/types";
import { formatComment } from "@/lib/utils";

export default function ThreadCard({
  board,
  thread,
  preview = 3,
}: {
  board: string;
  thread: Thread;
  preview?: number;
}) {
  const shown = thread.replies.slice(-preview);
  const hidden = Math.max(0, thread.replies.length - preview);

  return (
    <article
      className="thread-card"
      id={`p${thread.no}`}
      data-thread-no={thread.no}
      data-board={board}
    >
      <header className="op-head">
        <span className="chk">✓</span>
        <span className="name">{thread.op.name}</span>
        <span className="dateblk">{thread.op.date}</span>
        <span className="no">
          <Link
            href={`/${board}/${thread.no}#p${thread.no}`}
            title="Open thread"
          >
            No.{thread.no}
          </Link>
        </span>
        <span className="badge">OP</span>
        <Link href={`/${board}/${thread.no}`} className="btn small">
          Reply →
        </Link>
        <div className="subj">{thread.subject}</div>
      </header>
      <div className="op-body">
        {thread.op.image && (
          <figure className="thumb">
            <img src={thread.op.image.url} alt="" />
            <figcaption>File: {thread.op.image.name} ({thread.op.image.size})</figcaption>
          </figure>
        )}
        <div
          className="comment"
          dangerouslySetInnerHTML={{ __html: formatComment(thread.op.comment) }}
        />
      </div>
      {hidden > 0 && (
        <p className="omitted">
          {hidden} post{hidden === 1 ? "" : "s"} omitted —{" "}
          <Link href={`/${board}/${thread.no}`}>click to view all</Link>
        </p>
      )}
      {shown.length > 0 && (
        <div
          className="replies"
          style={{
            padding: "6px 20px 22px 44px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {shown.map((r) => (
            <article key={r.no} className="reply">
              <div className="rhead">
                <span className="name">{r.name}</span>
                <span className="dateblk">{r.date}</span>
                <span className="no">
                  <Link href={`/${board}/${thread.no}#p${r.no}`}>
                    No.{r.no}
                  </Link>
                </span>
                {r.sage && <span className="badge sage">SAGE</span>}
              </div>
              {r.image && (
                <figure className="thumb">
                  <img src={r.image.url} alt="" />
                  <figcaption>File: {r.image.name} ({r.image.size})</figcaption>
                </figure>
              )}
              <div
                className="comment"
                dangerouslySetInnerHTML={{ __html: formatComment(r.comment) }}
              />
            </article>
          ))}
        </div>
      )}
    </article>
  );
}