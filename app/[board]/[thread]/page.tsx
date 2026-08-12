import PostForm from "@/components/PostForm";
import Thread from "@/components/Thread";
import ThreadClient from "@/components/ThreadClient";
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

    return (
        <ThreadClient board={board.slug} threadNo={threadNo}>
            <main className="wrap">
                <nav className="breadcrumb">
                    <Link href="/">← Home</Link>
                    &nbsp;/&nbsp;
                    <Link
                        href={`/${board.slug}`}
                        style={{
                            background: "var(--black)",
                            color: "var(--paper)",
                            padding: "4px 10px",
                            border: "2px solid var(--black)",
                            boxShadow: "3px 3px 0 var(--yellow)",
                        }}
                    >
                        /{board.slug}/
                    </Link>
                    &nbsp;→&nbsp;
                    <span style={{ color: "var(--yellow)", fontFamily: "var(--mono)", fontWeight: 700 }}>
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
        </ThreadClient>
    );
}
