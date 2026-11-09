import PostForm from "@/components/PostForm";
import PostPreviews from "@/components/PostPreviews";
import ThreadCard from "@/components/ThreadCard";
import { getBoardBySlug } from "@/lib/boards";
import { getThreads } from "@/lib/store";
import { Metadata } from "next";
import { Rss } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ board: string }> }): Promise<Metadata> {
    const { board: boardSlug } = await params;
    const board = getBoardBySlug(boardSlug);
    if (!board) return {};

    return {
        title: `/${board.slug}/ - ${board.title} — NeoChan`,
        description: board.description,
        alternates: {
            types: {
                "application/rss+xml": `/${board.slug}/rss.xml`,
            },
        },
    };
}

export default async function BoardPage({ params }: { params: Promise<{ board: string }> }) {
    const { board: boardSlug } = await params;
    const board = getBoardBySlug(boardSlug);
    if (!board) notFound();

    const threads = await getThreads(board.slug);

    const posts = threads.flatMap(t =>
        [t.op, ...t.replies].map(p => ({ ...p, threadNo: t.no, board: t.board }))
    );
    const postCount = threads.reduce((n, t) => n + 1 + t.replies.length, 0);

    return (
        <>
            <main className="wrap">
                <nav className="breadcrumb">
                    <Link href="/">← Home</Link>
                    &nbsp;/&nbsp;
                    <span className="here">
                        /{board.slug}/
                    </span>
                </nav>

                <section className="hero">
                    <Link
                        href={`/${board.slug}/rss.xml`}
                        target="_blank"
                        rel="alternate"
                        type="application/rss+xml"
                        className="board-rss-btn"
                        title={`RSS Feed for /${board.slug}/`}
                        aria-label={`RSS Feed for /${board.slug}/`}
                    >
                        <Rss size={18} strokeWidth={2.4} />
                    </Link>
                    <span className="badge">{board.slug === "all" ? "ALL BOARDS STREAM" : "Current Board"}</span>
                    <h1>
                        /{board.slug}/<small>{board.title}</small>
                    </h1>
                    <p className="lead">{board.description}</p>
                    <div className="meta">
                        <span>{threads.length} THREADS</span>
                        <span>POSTS: {postCount}</span>
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
            <PostPreviews posts={posts} />
        </>
    );
}
