"use client";

import { addPostAction } from "@/lib/actions";
import { Post } from "@/lib/types";
import { formatFileSize, useUploadThing } from "@/lib/uploadthing";
import { usePastedImage } from "@/lib/usePastedImage";
import { formatComment } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react";
import FallbackImg from "./FallbackImg";

type PostWithContext = Post & {
    threadNo?: number;
    board?: string;
    formattedComment?: string;
};

type PreviewState = {
    post?: PostWithContext;
    loading?: boolean;
    notFound?: boolean;
    no: string;
    x: number;
    y: number;
} | null;

function getPostFromDOM(no: string, defaultBoard?: string, defaultThreadNo?: number): PostWithContext | null {
    const el = document.getElementById(`p${no}`);
    if (!el) return null;

    const isThreadCard = el.classList.contains("thread-card");
    const nameEl = el.querySelector(".name");
    const dateEl = el.querySelector(".dateblk");
    const commentEl = el.querySelector(".comment");
    const imgEl = el.querySelector(".thumb-img") as HTMLImageElement | null;
    const isOp = isThreadCard || !!el.querySelector(".badge:not(.sage)");
    const isSage = !!el.querySelector(".badge.sage");
    const cardThreadNo = el.closest("[data-thread-no]")?.getAttribute("data-thread-no");
    const cardBoard = el.closest("[data-board]")?.getAttribute("data-board");

    return {
        no: parseInt(no, 10),
        name: nameEl?.textContent?.trim() || "Anonymous",
        date: dateEl?.textContent?.trim() || "",
        comment: "",
        formattedComment: commentEl?.innerHTML || "",
        op: isOp,
        sage: isSage,
        image: imgEl ? { url: imgEl.src, name: imgEl.alt || "image", size: "" } : undefined,
        threadNo: cardThreadNo ? parseInt(cardThreadNo, 10) : defaultThreadNo,
        board: cardBoard || defaultBoard,
    };
}

export default function ThreadClient({
    board,
    threadNo,
    initialPosts,
    children,
}: {
    board: string;
    threadNo?: number;
    initialPosts?: PostWithContext[];
    children: React.ReactNode;
}) {
    const router = useRouter();

    const [preview, setPreview] = useState<PreviewState>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeNo = useRef<string | null>(null);
    const postCache = useRef(new Map<string, PostWithContext>());

    useEffect(() => {
        for (const p of initialPosts ?? []) postCache.current.set(String(p.no), p);
    }, [initialPosts]);

    const [qrOpen, setQrOpen] = useState(false);
    const [qrMinimized, setQrMinimized] = useState(false);
    const [qrPos, setQrPos] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const qrRef = useRef<HTMLDivElement>(null);
    const qrTextareaRef = useRef<HTMLTextAreaElement>(null);

    const [name, setName] = useState("Anonymous");
    const [sage, setSage] = useState(false);
    const [comment, setComment] = useState("");
    const [qrImage, setQrImage] = useState<NonNullable<Post["image"]> | null>(null);
    const [isPending, startTransition] = useTransition();

    const { startUpload, isUploading } = useUploadThing("imageUploader", {
        onClientUploadComplete: res => {
            const f = res?.[0];
            if (f) setQrImage({ url: f.ufsUrl, name: f.name, size: formatFileSize(f.size) });
        },
        onUploadError: err => alert(`Upload failed: ${err.message}`),
    });

    usePastedImage(
        qrOpen && !qrMinimized && !isUploading,
        target => !!target.closest(".quick-reply-modal") || !document.querySelector(".postform"),
        pasted => startUpload([pasted]),
    );

    const clearHideTimer = useCallback(() => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
    }, []);

    const scheduleHide = useCallback(() => {
        clearHideTimer();
        hideTimer.current = setTimeout(() => {
            activeNo.current = null;
            setPreview(null);
        }, 200);
    }, [clearHideTimer]);

    const addQuoteToQr = useCallback(
        (no: string) => {
            if (!threadNo) return;
            setQrOpen(true);
            setQrMinimized(false);
            setComment(prev => {
                const insertion = `>>${no}`;
                const base = prev.trim();
                if (base.split(/\s+/).includes(insertion)) return prev;
                return (base ? base + "\n" : "") + insertion + " ";
            });
            setTimeout(() => {
                if (qrTextareaRef.current) {
                    qrTextareaRef.current.focus();
                    qrTextareaRef.current.setSelectionRange(
                        qrTextareaRef.current.value.length,
                        qrTextareaRef.current.value.length,
                    );
                }
            }, 100);
        },
        [threadNo],
    );

    const handleDragStart = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        setIsDragging(true);
        const rect = qrRef.current?.getBoundingClientRect();
        if (rect) {
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }
    };

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e: MouseEvent) => {
            let x = e.clientX - dragOffset.current.x;
            let y = e.clientY - dragOffset.current.y;
            const width = qrRef.current?.offsetWidth || 340;
            const height = qrRef.current?.offsetHeight || 300;
            x = Math.max(10, Math.min(window.innerWidth - width - 10, x));
            y = Math.max(10, Math.min(window.innerHeight - height - 10, y));
            setQrPos({ x, y });
        };
        const handleMouseUp = () => setIsDragging(false);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        const missingNos = new Set<string>();
        document.querySelectorAll("a.qlink").forEach(el => {
            const no = el.getAttribute("data-no") || el.textContent?.replace(/\D/g, "");
            if (no && !postCache.current.has(no)) {
                missingNos.add(no);
            }
        });

        if (missingNos.size === 0) return;

        const controller = new AbortController();
        const fetchMissing = async () => {
            for (const no of Array.from(missingNos)) {
                if (controller.signal.aborted) break;
                if (postCache.current.has(no)) continue;
                try {
                    const res = await fetch(`/api/preview?no=${no}`, { signal: controller.signal });
                    if (res.ok) {
                        const data: PostWithContext = await res.json();
                        postCache.current.set(no, data);
                    }
                } catch {
                    console.log("errOwOrr");
                }
            }
        };

        if ("requestIdleCallback" in window) {
            const id = requestIdleCallback(fetchMissing);
            return () => {
                controller.abort();
                cancelIdleCallback(id);
            };
        }
        const timer = setTimeout(fetchMissing, 300);
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [board, threadNo, initialPosts]);

    useEffect(() => {
        async function showPreview(no: string, targetEl: HTMLElement) {
            clearHideTimer();
            activeNo.current = no;

            const rect = targetEl.getBoundingClientRect();
            let x = rect.right + 10;
            let y = rect.top;

            if (x + 380 > window.innerWidth) {
                x = Math.max(10, rect.left - 380);
            }
            if (y + 420 > window.innerHeight) {
                y = Math.max(10, window.innerHeight - 430);
            }
            if (y < 10) y = 10;

            const known = postCache.current.get(no) ?? getPostFromDOM(no, board, threadNo);
            if (known) {
                postCache.current.set(no, known);
                setPreview({ post: known, no, x, y, loading: false });
                return;
            }

            setPreview({ loading: true, no, x, y });

            try {
                const res = await fetch(`/api/preview?no=${no}`);
                if (!res.ok) {
                    if (activeNo.current === no) {
                        setPreview({ notFound: true, no, x, y, loading: false });
                    }
                    return;
                }
                const post: PostWithContext = await res.json();
                postCache.current.set(no, post);

                if (activeNo.current === no) {
                    setPreview({ post, no, x, y, loading: false });
                }
            } catch {
                if (activeNo.current === no) {
                    setPreview({ notFound: true, no, x, y, loading: false });
                }
            }
        }

        function handleMouseOver(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (target.closest(".quick-reply-modal")) return;

            const qlink = target.closest("a.qlink") as HTMLElement | null;
            if (!qlink) return;

            const no = qlink.dataset.no || qlink.textContent?.replace(/\D/g, "");
            if (!no) return;

            showPreview(no, qlink);
        }

        function handleMouseOut(e: MouseEvent) {
            const target = e.target as HTMLElement;
            const qlink = target.closest("a.qlink");
            if (!qlink) return;

            const related = e.relatedTarget as HTMLElement | null;
            if (related && related.closest(".preview-popup")) {
                return;
            }
            scheduleHide();
        }

        async function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement;

            const qlink = target.closest("a.qlink") as HTMLElement | null;
            if (qlink) {
                const no = qlink.dataset.no || qlink.textContent?.replace(/\D/g, "");
                if (!no) return;

                e.preventDefault();

                if (threadNo) {
                    const targetPost = document.getElementById(`p${no}`);
                    if (targetPost) {
                        targetPost.scrollIntoView({ behavior: "smooth", block: "center" });
                        targetPost.animate(
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
                }

                const cardThreadNo = qlink.closest("[data-thread-no]")?.getAttribute("data-thread-no");
                const cardBoard = qlink.closest("[data-board]")?.getAttribute("data-board") || board;

                if (cardThreadNo) {
                    router.push(`/${cardBoard}/${cardThreadNo}#p${no}`);
                    return;
                }

                if (postCache.current.has(no)) {
                    const p = postCache.current.get(no)!;
                    if (p.threadNo) {
                        router.push(`/${p.board || board}/${p.threadNo}#p${no}`);
                        return;
                    }
                }

                try {
                    const res = await fetch(`/api/preview?no=${no}`);
                    if (res.ok) {
                        const data: PostWithContext = await res.json();
                        postCache.current.set(no, data);
                        if (data.threadNo) {
                            router.push(`/${data.board || board}/${data.threadNo}#p${no}`);
                            return;
                        }
                    }
                } catch {
                    console.log("Oops something went wrong");
                }
                return;
            }

            if (threadNo) {
                const postNoEl = target.closest(".post-no") as HTMLElement | null;
                if (postNoEl) {
                    const no = postNoEl.dataset.no || postNoEl.textContent?.replace(/\D/g, "");
                    if (!no) return;

                    e.preventDefault();
                    addQuoteToQr(no);
                }
            }
        }

        document.addEventListener("mouseover", handleMouseOver);
        document.addEventListener("mouseout", handleMouseOut);
        document.addEventListener("click", handleClick);

        return () => {
            document.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mouseout", handleMouseOut);
            document.removeEventListener("click", handleClick);
            clearHideTimer();
        };
    }, [board, threadNo, clearHideTimer, scheduleHide, addQuoteToQr, router]);

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) startUpload([f]);
    }

    async function submitQr(e: FormEvent) {
        e.preventDefault();
        if (!threadNo) return;
        if (!comment.trim()) {
            alert("COMMENT REQUIRED, ANON.");
            return;
        }
        startTransition(async () => {
            try {
                await addPostAction(board, threadNo, {
                    name: name.trim() || "Anonymous",
                    subject: "",
                    comment,
                    sage,
                    image: qrImage ?? undefined,
                });
                setComment("");
                setSage(false);
                setQrImage(null);
                setQrOpen(false);
                router.refresh();
            } catch (err) {
                alert(err instanceof Error ? err.message : "Failed to post reply");
            }
        });
    }

    return (
        <>
            {children}

            {threadNo && !qrOpen && (
                <button
                    className="qr-fab"
                    onClick={() => {
                        setQrOpen(true);
                        setQrMinimized(false);
                        setTimeout(() => qrTextareaRef.current?.focus(), 100);
                    }}
                    title="Open Quick Reply"
                >
                    <span className="qr-fab-icon">⚡</span>
                    <span>Quick Reply</span>
                </button>
            )}

            {threadNo && qrOpen && (
                <div
                    ref={qrRef}
                    className={`quick-reply-modal ${qrMinimized ? "minimized" : ""}`}
                    style={qrPos ? { left: qrPos.x, top: qrPos.y, right: "auto", bottom: "auto" } : undefined}
                >
                    <div className="hazard" style={{ height: 6, borderBottom: "2px solid var(--black)" }} />
                    <div className="qr-header" onMouseDown={handleDragStart} title="Drag to move window">
                        <span className="qr-title">
                            ⚡ QUICK REPLY <small>No.{threadNo}</small>
                        </span>
                        <div className="qr-controls">
                            <button
                                type="button"
                                className="qr-btn-ctrl"
                                onClick={() => setQrMinimized(m => !m)}
                                title={qrMinimized ? "Expand" : "Minimize"}
                            >
                                {qrMinimized ? "▲" : "▼"}
                            </button>
                            <button
                                type="button"
                                className="qr-btn-ctrl close"
                                onClick={() => setQrOpen(false)}
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {!qrMinimized && (
                        <form className="qr-form" onSubmit={submitQr}>
                            <div className="qr-row">
                                <input
                                    className="qr-input"
                                    placeholder="Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                                <label className="qr-checkbox-label" title="Sage (Don't bump thread)">
                                    <input
                                        type="checkbox"
                                        checked={sage}
                                        onChange={e => setSage(e.target.checked)}
                                    />
                                    <span>Sage</span>
                                </label>
                            </div>

                            <textarea
                                ref={qrTextareaRef}
                                className="qr-textarea"
                                placeholder=">greentext\n>>post quote"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />

                            <div className="qr-file-row">
                                <input type="file" accept="image/*" onChange={onFileChange} className="qr-file-input" />
                                {qrImage && (
                                    <div className="qr-preview-wrapper">
                                        <img src={qrImage.url} alt="" className="qr-thumb" />
                                        <button
                                            type="button"
                                            className="qr-thumb-remove"
                                            onClick={() => setQrImage(null)}
                                            title="Remove image"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                            <span className="tiny qr-paste-hint">
                                {isUploading ? "Uploading image…" : "Or paste an image (Ctrl+V)"}
                            </span>

                            <div className="qr-actions">
                                <button type="submit" className="btn yellow small" disabled={isPending || isUploading}>
                                    {isPending ? "Posting…" : isUploading ? "Uploading…" : "Post Reply"}
                                </button>
                                <button
                                    type="button"
                                    className="qr-link-scroll"
                                    onClick={() => window.dispatchEvent(new Event("neochan:open-post"))}
                                >
                                    Go to bottom form ↓
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {preview && (
                <div
                    className="preview-popup"
                    style={{ top: preview.y, left: preview.x }}
                    onMouseEnter={clearHideTimer}
                    onMouseLeave={scheduleHide}
                >
                    {preview.loading ? (
                        <div className="pp-loading">
                            <span>⚡</span>
                            <span>Loading post No.{preview.no}…</span>
                        </div>
                    ) : preview.notFound || !preview.post ? (
                        <div className="pp-not-found">
                            <span>Post No.{preview.no} not found or deleted</span>
                        </div>
                    ) : (
                        <>
                            <div className="pp-head">
                                <span className="name">{preview.post.name}</span>
                                <span className="dateblk">{preview.post.date}</span>
                                <span className="no">No.{preview.post.no}</span>
                                {preview.post.op && <span className="badge">OP</span>}
                                {preview.post.sage && <span className="badge sage">SAGE</span>}
                            </div>
                            {preview.post.image && <FallbackImg src={preview.post.image.url} alt="" className="pp-thumb" />}
                            <div
                                className="pp-comment"
                                dangerouslySetInnerHTML={{
                                    __html: preview.post.formattedComment || formatComment(preview.post.comment),
                                }}
                            />
                        </>
                    )}
                </div>
            )}
        </>
    );
}
