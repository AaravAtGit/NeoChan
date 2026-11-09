"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Footer() {
    const path = usePathname();
    const router = useRouter();

    function post() {
        // board/thread pages have a post form, everywhere else go pick a board
        if (document.getElementById("postform")) {
            window.dispatchEvent(new Event("neochan:open-post"));
        } else if (path === "/") {
            document.getElementById("boards")?.scrollIntoView({ behavior: "smooth" });
        } else {
            router.push("/#boards");
        }
    }

    return (
        <nav className="tabbar">
            <Link href="/" className={path === "/" ? "active" : ""}>Home</Link>
            <Link href="/rules" className={path === "/rules" ? "active" : ""}>Rules</Link>
            <button type="button" onClick={() => alert("Sorry, Archives are not available yet.")}>Archive</button>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Top</button>
            <button type="button" className="post" onClick={post}>Post</button>
        </nav>
    );
}
