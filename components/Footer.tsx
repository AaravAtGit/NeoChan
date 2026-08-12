"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const path = usePathname();
  const active = (p: string) => (path === p ? "active" : "");
  return (
    <nav className="tabbar">
      <Link href="/" className={active("/")}>Home</Link>
      <Link href="/" className="">Rules</Link>
      <Link href="/" className="">Archive</Link>
      <Link href="/" className="">Top</Link>
      <button className="post" onClick={() => alert("Step 2: post from any page")}>Post</button>
    </nav>
  );
}