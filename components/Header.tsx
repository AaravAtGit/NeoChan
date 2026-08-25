import { boards as allBoards } from "@/lib/boards";
import Link from "next/link";
import Image from "next/image";

export default function Header({ current }: { current?: string }) {
    const boards = allBoards.slice(0, 10);
    return (
        <>
            <header className="topbar">
                <Link href="/" className="logo">
                    <Image
                        src="/logo.png"
                        alt="NeoChan Logo"
                        width={28}
                        height={28}
                        className="logo-img"
                        priority
                    />
                    <span>
                        Neo<b>Chan</b>
                    </span>
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
