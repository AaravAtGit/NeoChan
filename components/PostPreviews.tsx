"use client";

import { Post } from "@/lib/types";
import { formatComment } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import FallbackImg from "./FallbackImg";

type PostWithContext = Post & { threadNo: number; board: string };

// post: undefined = still loading, null = doesn't exist
type Preview = { no: string; x: number; y: number; post?: PostWithContext | null };

const POPUP_W = 380;
const POPUP_H = 420;

async function fetchPost(cache: Map<string, PostWithContext>, no: string) {
  if (cache.has(no)) return cache.get(no)!;
  const res = await fetch(`/api/preview?no=${no}`).catch(() => null);
  if (!res?.ok) return null;
  const post: PostWithContext = await res.json();
  cache.set(no, post);
  return post;
}

// Hover a >>123 link to see the post, click it to jump there.
export default function PostPreviews({ posts, inThread }: { posts: PostWithContext[]; inThread?: boolean }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const cache = useRef(new Map<string, PostWithContext>());
  const hovered = useRef<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    for (const p of posts) cache.current.set(String(p.no), p);
  }, [posts]);

  // small delay so you can move the mouse from the link onto the popup
  const hideSoon = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      hovered.current = null;
      setPreview(null);
    }, 200);
  }, []);

  useEffect(() => {
    async function show(link: HTMLElement) {
      clearTimeout(hideTimer.current);
      const no = link.dataset.no!;
      hovered.current = no;

      const r = link.getBoundingClientRect();
      let x = r.right + 10;
      if (x + POPUP_W > window.innerWidth) x = Math.max(10, r.left - POPUP_W);
      const y = Math.max(10, Math.min(r.top, window.innerHeight - POPUP_H - 10));

      const cached = cache.current.get(no);
      setPreview({ no, x, y, post: cached });
      if (cached) return;

      const post = await fetchPost(cache.current, no);
      if (hovered.current === no) setPreview({ no, x, y, post });
    }

    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest<HTMLElement>("a.qlink");
      if (link && !target.closest(".quick-reply-modal")) show(link);
    }

    function onMouseOut(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("a.qlink")) return;
      if ((e.relatedTarget as HTMLElement | null)?.closest(".preview-popup")) return;
      hideSoon();
    }

    async function onClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest<HTMLElement>("a.qlink");
      if (!link) return;
      e.preventDefault();
      const no = link.dataset.no!;

      const el = inThread && document.getElementById(`p${no}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.animate(
          [
            { boxShadow: "0 0 0 0 var(--yellow)", transform: "scale(1)" },
            { boxShadow: "0 0 0 6px var(--yellow)", transform: "scale(1.01)" },
            { boxShadow: "0 0 0 0 transparent", transform: "scale(1)" },
          ],
          { duration: 1100, easing: "ease-out" },
        );
        history.pushState(null, "", `#p${no}`);
        return;
      }

      const post = await fetchPost(cache.current, no);
      if (post) router.push(`/${post.board}/${post.threadNo}#p${no}`);
    }

    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("click", onClick);
      clearTimeout(hideTimer.current);
    };
  }, [inThread, router, hideSoon]);

  if (!preview) return null;
  const { post } = preview;

  return (
    <div
      className="preview-popup"
      style={{ top: preview.y, left: preview.x }}
      onMouseEnter={() => clearTimeout(hideTimer.current)}
      onMouseLeave={hideSoon}
    >
      {post === undefined ? (
        <div className="pp-loading">
          <span>⚡</span>
          <span>Loading post No.{preview.no}…</span>
        </div>
      ) : post === null ? (
        <div className="pp-not-found">
          <span>Post No.{preview.no} not found or deleted</span>
        </div>
      ) : (
        <>
          <div className="pp-head">
            <span className="name">{post.name}</span>
            <span className="dateblk">{post.date}</span>
            <span className="no">No.{post.no}</span>
            {post.op && <span className="badge">OP</span>}
            {post.sage && <span className="badge sage">SAGE</span>}
          </div>
          {post.image && <FallbackImg src={post.image.url} className="pp-thumb" />}
          <div className="pp-comment" dangerouslySetInnerHTML={{ __html: formatComment(post.comment) }} />
        </>
      )}
    </div>
  );
}
