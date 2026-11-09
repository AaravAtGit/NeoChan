import { boards } from "@/lib/boards";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
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
                        <Link key={b.slug} href={`/${b.slug}`}>
                            [/{b.slug}/]
                        </Link>
                    ))}
                </nav>
            </header>
            <div className="hazard" />
        </>
    );
}
