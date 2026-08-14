import { Post } from "@/lib/types";
import { formatComment } from "@/lib/utils";
import PostImage from "./PostImage";

export default function Reply({
  post,
  backlinks = [],
}: {
  post: Post;
  backlinks?: number[];
}) {
  return (
    <article className="reply" id={`p${post.no}`}>
      <div className="rhead">
        <span className="name">{post.name}</span>
        <span className="dateblk">{post.date}</span>
        <span className="no">
          <a
            href={`#p${post.no}`}
            data-no={post.no}
            className="post-no"
            title="Quote this post"
          >
            No.{post.no}
          </a>
        </span>
        {post.sage && <span className="badge sage">SAGE</span>}
      </div>
      <div className="reply-body">
        {post.image && <PostImage image={post.image} isReply />}
        <div className="comment-col">
          <div
            className="comment"
            dangerouslySetInnerHTML={{ __html: formatComment(post.comment) }}
          />
          {backlinks.length > 0 && (
            <div className="backlinks">
              <span>Replies:</span>
              {backlinks.map((no) => (
                <a key={no} className="qlink" data-no={no} href={`#p${no}`}>
                  &gt;&gt;{no}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}