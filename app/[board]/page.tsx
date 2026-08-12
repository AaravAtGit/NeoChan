import PostForm from "@/components/PostForm";
import ThreadCard from "@/components/ThreadCard";
import ThreadClient from "@/components/ThreadClient";
import { getBoardBySlug } from "@/lib/boards";
import { getThreads } from "@/lib/store";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BoardPage({ params }: { params: Promise<{ board: string }> }) {
    const { board: boardSlug } = await params;
    const board = getBoardBySlug(boardSlug);
    if (!board) notFound();

    const threads = await getThreads(board.slug);

    return (
        <ThreadClient board={board.slug}>
            <main className="wrap">
                <nav className="breadcrumb">
                    <Link href="/">← Home</Link>
                    &nbsp;/&nbsp;
                    <span style={{ color: "var(--yellow)", fontFamily: "var(--mono)", fontWeight: 700 }}>
                        /{board.slug}/
                    </span>
                </nav>

                <section className="hero">
                    <span className="badge">Current Board</span>
                    <h1>
                        /{board.slug}/<small>{board.title}</small>
                    </h1>
                    <p className="lead">{board.description}</p>
                    <div className="meta">
                        <span>{threads.length} THREADS</span>
                        <span>POSTS: {threads.reduce((s, t) => s + 1 + t.replies.length, 0)}</span>
                        <span>ANONYMOUS</span>
                    </div>
                </section>

                <div className="divider">
                    <i />
                </div>

                <PostForm board={board.slug} />

                <div className="section-head">
                    <h2>Threads</h2>
                    <span>NEWEST BUMPS FIRST</span>
                </div>

                {threads.length === 0 && (
                    <p style={{ color: "var(--paper)", fontFamily: "var(--mono)", fontWeight: 700 }}>
                        NO THREADS YET. START THE FIRST ONE, ANON.
                    </p>
                )}

                {threads.map(t => (
                    <ThreadCard key={t.no} board={board.slug} thread={t} preview={3} />
                ))}
            </main>
        </ThreadClient>
    );
}
