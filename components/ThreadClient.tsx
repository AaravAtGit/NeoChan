"use client";

import { addPostAction } from "@/lib/actions";
import { Post } from "@/lib/types";
import { formatComment } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react";

type PreviewState = {
    post: Post & { threadNo?: number; board?: string };
    x: number;
    y: number;
} | null;

export default function ThreadClient({
    board,
    threadNo,
    children,
}: {
    board: string;
    threadNo?: number;
    children: React.ReactNode;
}) {
    const router = useRouter();

    const [preview, setPreview] = useState<PreviewState>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeNo = useRef<string | null>(null);
    const postCache = useRef<Map<string, Post & { threadNo?: number; board?: string }>>(new Map());

    const [qrOpen, setQrOpen] = useState(false);
    const [qrMinimized, setQrMinimized] = useState(false);
    const [qrPos, setQrPos] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const qrRef = useRef<HTMLDivElement>(null);
    const qrTextareaRef = useRef<HTMLTextAreaElement>(null);

    const [name, setName] = useState("Anonymous");
    const [email, setEmail] = useState("");
    const [comment, setComment] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState("");
    const [isPending, startTransition] = useTransition();

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

            if (postCache.current.has(no)) {
                const cachedPost = postCache.current.get(no)!;
                setPreview({ post: cachedPost, x, y });
                return;
            }

            try {
                const res = await fetch(`/api/preview?no=${no}`);
                if (!res.ok) return;
                const post: Post & { threadNo?: number; board?: string } = await res.json();
                postCache.current.set(no, post);

                if (activeNo.current === no) {
                    setPreview({ post, x, y });
                }
            } catch {
                console.log("Oops something went wrong");
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
                        const data: Post & { threadNo?: number; board?: string } = await res.json();
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
        if (!f) return;
        setFile(f);
        const r = new FileReader();
        r.onload = () => setFilePreview(r.result as string);
        r.readAsDataURL(f);
    }

    async function submitQr(e: FormEvent) {
        e.preventDefault();
        if (!threadNo) return;
        if (!comment.trim() && !file) {
            alert("COMMENT OR IMAGE REQUIRED, ANON.");
            return;
        }
        const sage = /sage/i.test(email);
        startTransition(async () => {
            await addPostAction(board, threadNo, {
                name: name.trim() || "Anonymous",
                email,
                subject: "",
                comment,
                sage,
                image: file
                    ? {
                          url: filePreview,
                          name: file.name,
                          size: `${Math.round(file.size / 1024)} KB`,
                      }
                    : undefined,
            });
            setComment("");
            setFile(null);
            setFilePreview("");
            setQrOpen(false);
            router.refresh();
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
                                <input
                                    className="qr-input"
                                    placeholder="Email / sage"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
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
                                {filePreview && (
                                    <div className="qr-preview-wrapper">
                                        <img src={filePreview} alt="" className="qr-thumb" />
                                        <button
                                            type="button"
                                            className="qr-thumb-remove"
                                            onClick={() => {
                                                setFile(null);
                                                setFilePreview("");
                                            }}
                                            title="Remove image"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="qr-actions">
                                <button type="submit" className="btn yellow small" disabled={isPending}>
                                    {isPending ? "Posting…" : "Post Reply"}
                                </button>
                                <button
                                    type="button"
                                    className="qr-link-scroll"
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent("neochan:quote", { detail: { no: "" } }));
                                        setTimeout(() => {
                                            const el = document.querySelector(".postform");
                                            if (el) {
                                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                                                el.querySelector("textarea")?.focus();
                                            }
                                        }, 50);
                                    }}
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
                    <div className="pp-head">
                        <span className="name">{preview.post.name}</span>
                        <span className="dateblk">{preview.post.date}</span>
                        <span className="no">No.{preview.post.no}</span>
                        {preview.post.op && <span className="badge">OP</span>}
                        {preview.post.sage && <span className="badge sage">SAGE</span>}
                    </div>
                    {preview.post.image && <img src={preview.post.image.url} alt="" className="pp-thumb" />}
                    <div
                        className="pp-comment"
                        dangerouslySetInnerHTML={{
                            __html: formatComment(preview.post.comment),
                        }}
                    />
                </div>
            )}
        </>
    );
}
