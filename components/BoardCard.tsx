import { getThreads } from "@/lib/store";
import { Board } from "@/lib/types";
import Link from "next/link";

export default function BoardCard({ board }: { board: Board }) {
    const threads = getThreads(board.slug);
    const posts = threads.reduce((sum, t) => sum + 1 + t.replies.length, 0);
    return (
        <Link href={`/${board.slug}`} className={`board-card ${board.accent}`}>
            <div className="bc-top">
                <span>/{board.slug}/</span>
                <span className="tag">{posts} POSTS</span>
            </div>
            <div className="bc-body">
                <h3>{board.title}</h3>
                <p>{board.description}</p>
            </div>
            <div className="bc-foot">
                <span>{threads.length} THREADS</span>
                <span>ENTER →</span>
            </div>
        </Link>
    );
}
