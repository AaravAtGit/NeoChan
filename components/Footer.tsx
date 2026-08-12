"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Footer() {
  const path = usePathname();
  const router = useRouter();
  const active = (p: string) => (path === p ? "active" : "");

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Sorry, archive not available yet");
    if (path !== "/") {
      router.push("/");
    }
  };

  const handleTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePost = (e: React.MouseEvent) => {
    e.preventDefault();
    if (path === "/") {
      const target =
        document.getElementById("threads") ||
        document.getElementById("boards") ||
        document.querySelector(".board-grid");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      const postForm = document.querySelector(".postform, .pf-closed-bar");
      if (postForm) {
        window.dispatchEvent(new CustomEvent("neochan:open-post"));
      } else {
        router.push("/#threads");
      }
    }
  };

  return (
    <nav className="tabbar">
      <Link href="/" className={active("/")}>
        Home
      </Link>
      <Link href="/rules" className={active("/rules")}>
        Rules
      </Link>
      <button type="button" onClick={handleArchive}>
        Archive
      </button>
      <button type="button" onClick={handleTop}>
        Top
      </button>
      <button type="button" className="post" onClick={handlePost}>
        Post
      </button>
    </nav>
  );
}