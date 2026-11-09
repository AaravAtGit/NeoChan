import { Thread as ThreadType } from "@/lib/types";
import { formatComment, buildBacklinksMap } from "@/lib/utils";
import Reply, { Backlinks } from "./Reply";
import PostImage from "./PostImage";

export default function Thread({ thread }: { thread: ThreadType }) {
  const op = thread.op;
  const backlinksMap = buildBacklinksMap(thread);

  return (
    <article className="thread-card thread-page" id={`p${op.no}`}>
      <header className="op-head">
        <span className="chk">✓</span>
        <span className="name">{op.name}</span>
        <span className="dateblk">{op.date}</span>
        <span className="no">
          <a
            href={`#p${op.no}`}
            data-no={op.no}
            className="post-no"
            title="Quote this post"
          >
            No.{op.no}
          </a>
        </span>
        <span className="badge">OP</span>
        <div className="subj">{thread.subject}</div>
      </header>
      <div className="op-body">
        {op.image && <PostImage image={op.image} />}
        <div className="comment-col">
          <div
            className="comment"
            dangerouslySetInnerHTML={{ __html: formatComment(op.comment) }}
          />
          <Backlinks nos={backlinksMap.get(op.no) ?? []} />
        </div>
      </div>
      <div className="replies">
        {thread.replies.map((r) => (
          <Reply key={r.no} post={r} backlinks={backlinksMap.get(r.no) ?? []} />
        ))}
        {thread.replies.length === 0 && (
          <p style={{ color: "#6b6257", fontFamily: "var(--mono)", fontSize: 12 }}>
            No replies yet. Be the first anon.
          </p>
        )}
      </div>
    </article>
  );
}