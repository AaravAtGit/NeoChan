import PostForm from "@/components/PostForm";
import PostPreviews from "@/components/PostPreviews";
import QuickReply from "@/components/QuickReply";
import Thread from "@/components/Thread";
import { getBoardBySlug } from "@/lib/boards";
import { getThread } from "@/lib/store";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ThreadPage({ params }: { params: Promise<{ board: string; thread: string }> }) {
    const { board: boardSlug, thread: threadSlug } = await params;
    const board = getBoardBySlug(boardSlug);
    const threadNo = parseInt(threadSlug, 10);
    const thread = await getThread(boardSlug, threadNo);
    if (!board || !thread) notFound();

    const posts = [thread.op, ...thread.replies].map(p => ({ ...p, threadNo, board: board.slug }));

    return (
        <>
            <main className="wrap">
                <nav className="breadcrumb">
                    <Link href="/">← Home</Link>
                    &nbsp;/&nbsp;
                    <Link href={`/${board.slug}`}>/{board.slug}/</Link>
                    &nbsp;→&nbsp;
                    <span className="here">
                        No.{threadNo}
                    </span>
                </nav>

                <div style={{ marginBottom: 22 }}>
                    <Link href={`/${board.slug}`} className="btn">
                        ← Back to /{board.slug}/
                    </Link>
                    <span className="mono" style={{ marginLeft: 14, color: "var(--paper)" }}>
                        {thread.replies.length} repl{thread.replies.length === 1 ? "y" : "ies"}
                    </span>
                </div>

                <Thread thread={thread} />

                <div className="divider">
                    <i />
                </div>

                <div className="section-head">
                    <h2>Reply</h2>
                    <span>POSTING TO No.{threadNo}</span>
                </div>

                <PostForm board={board.slug} threadNo={threadNo} />
            </main>
            <PostPreviews posts={posts} inThread />
            <QuickReply board={board.slug} threadNo={threadNo} />
        </>
    );
}
