"use client";

import { addPostAction } from "@/lib/actions";
import { Post } from "@/lib/types";
import { formatFileSize, useUploadThing } from "@/lib/uploadthing";
import { usePastedImage } from "@/lib/usePastedImage";
import { appendQuote } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react";

function focusTextarea() {
  setTimeout(() => {
    const ta = document.querySelector<HTMLTextAreaElement>(".qr-textarea");
    ta?.focus();
    ta?.setSelectionRange(ta.value.length, ta.value.length);
  }, 100);
}

// Floating reply box on thread pages. Clicking a post's No. opens it with a >>quote.
export default function QuickReply({ board, threadNo }: { board: string; threadNo: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("Anonymous");
  const [sage, setSage] = useState(false);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<Post["image"]>();
  const [isPending, startTransition] = useTransition();

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      const f = res?.[0];
      if (f) setImage({ url: f.ufsUrl, name: f.name, size: formatFileSize(f.size) });
    },
    onUploadError: (err) => alert(`Upload failed: ${err.message}`),
  });

  // if the big form at the bottom is open too, only take pastes aimed at this box
  usePastedImage(
    open && !minimized && !isUploading,
    (target) => !!target.closest(".quick-reply-modal") || !document.querySelector(".postform"),
    (file) => startUpload([file]),
  );

  const openWith = useCallback((quote?: string) => {
    setOpen(true);
    setMinimized(false);
    if (quote) setComment((c) => appendQuote(c, quote));
    focusTextarea();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const postNo = (e.target as HTMLElement).closest<HTMLElement>(".post-no");
      if (!postNo?.dataset.no) return;
      e.preventDefault();
      openWith(postNo.dataset.no);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openWith]);

  function startDrag(e: React.MouseEvent) {
    const box = boxRef.current;
    if (!box || (e.target as HTMLElement).closest("button")) return;
    const rect = box.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;

    function move(e: MouseEvent) {
      setPos({
        x: Math.max(10, Math.min(e.clientX - dx, window.innerWidth - box!.offsetWidth - 10)),
        y: Math.max(10, Math.min(e.clientY - dy, window.innerHeight - box!.offsetHeight - 10)),
      });
    }
    function stop() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return alert("COMMENT REQUIRED, ANON.");

    startTransition(async () => {
      try {
        await addPostAction(board, threadNo, { name: name.trim() || "Anonymous", subject: "", comment, sage, image });
        setComment("");
        setSage(false);
        setImage(undefined);
        setOpen(false);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to post reply");
      }
    });
  }

  if (!open) {
    return (
      <button className="qr-fab" onClick={() => openWith()} title="Open Quick Reply">
        <span className="qr-fab-icon">⚡</span>
        <span>Quick Reply</span>
      </button>
    );
  }

  return (
    <div
      ref={boxRef}
      className={`quick-reply-modal ${minimized ? "minimized" : ""}`}
      style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined}
    >
      <div className="hazard" style={{ height: 6, borderBottom: "2px solid var(--black)" }} />
      <div className="qr-header" onMouseDown={startDrag} title="Drag to move window">
        <span className="qr-title">
          ⚡ QUICK REPLY <small>No.{threadNo}</small>
        </span>
        <div className="qr-controls">
          <button type="button" className="qr-btn-ctrl" onClick={() => setMinimized(!minimized)} title={minimized ? "Expand" : "Minimize"}>
            {minimized ? "▲" : "▼"}
          </button>
          <button type="button" className="qr-btn-ctrl close" onClick={() => setOpen(false)} title="Close">
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <form className="qr-form" onSubmit={submit}>
          <div className="qr-row">
            <input className="qr-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <label className="qr-checkbox-label" title="Sage (Don't bump thread)">
              <input type="checkbox" checked={sage} onChange={(e) => setSage(e.target.checked)} />
              <span>Sage</span>
            </label>
          </div>

          <textarea
            className="qr-textarea"
            placeholder={">greentext\n>>post quote"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="qr-file-row">
            <input
              type="file"
              accept="image/*"
              className="qr-file-input"
              onChange={(e) => e.target.files?.[0] && startUpload([e.target.files[0]])}
            />
            {image && (
              <div className="qr-preview-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="qr-thumb" />
                <button type="button" className="qr-thumb-remove" onClick={() => setImage(undefined)} title="Remove image">
                  ✕
                </button>
              </div>
            )}
          </div>
          <span className="tiny qr-paste-hint">{isUploading ? "Uploading image…" : "Or paste an image (Ctrl+V)"}</span>

          <div className="qr-actions">
            <button type="submit" className="btn yellow small" disabled={isPending || isUploading}>
              {isPending ? "Posting…" : isUploading ? "Uploading…" : "Post Reply"}
            </button>
            <button type="button" className="qr-link-scroll" onClick={() => window.dispatchEvent(new Event("neochan:open-post"))}>
              Go to bottom form ↓
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
