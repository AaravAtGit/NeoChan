import { getBoards } from "@/lib/store";
import Link from "next/link";

export default function Header({ current }: { current?: string }) {
    const boards = getBoards().slice(0, 6);
    return (
        <>
            <header className="topbar">
                <Link href="/" className="logo">
                    <span className="bolt">⚡</span>
                    Neo<b>Chan</b>
                </Link>
                <nav className="boards">
                    {boards.map(b => (
                        <Link key={b.slug} href={`/${b.slug}`} className={current === b.slug ? "cur" : ""}>
                            [/{b.slug}/]
                        </Link>
                    ))}
                </nav>
            </header>
            <HazardStripe />
        </>
    );
}

function HazardStripe() {
    return <div className="hazard" />;
}
