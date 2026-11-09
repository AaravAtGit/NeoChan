"use client";

import { useState, useTransition, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addPostAction } from "@/lib/actions";
import { UploadButton, formatFileSize, useUploadThing } from "@/lib/uploadthing";
import { usePastedImage } from "@/lib/usePastedImage";
import { boards } from "@/lib/boards";
import { Post } from "@/lib/types";

type UploadedImage = NonNullable<Post["image"]>;

function focusForm() {
    setTimeout(() => {
        const form = document.getElementById("postform");
        form?.scrollIntoView({ behavior: "smooth", block: "center" });
        form?.animate([{ outline: "4px solid var(--yellow)" }, { outline: "4px solid transparent" }], {
            duration: 900,
            easing: "ease-out",
        });
        document.querySelector<HTMLElement>(".postform textarea")?.focus();
    }, 80);
}

export default function PostForm({ board, threadNo }: { board: string; threadNo?: number }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [targetBoard, setTargetBoard] = useState(board === "all" ? "b" : board);
    const [name, setName] = useState("Anonymous");
    const [sage, setSage] = useState(false);
    const [subject, setSubject] = useState("");
    const [comment, setComment] = useState("");
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [honeypot, setHoneypot] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleUploaded(res?: { ufsUrl: string; name: string; size: number }[]) {
        setIsUploading(false);
        const f = res?.[0];
        if (f) setUploadedImage({ url: f.ufsUrl, name: f.name, size: formatFileSize(f.size) });
    }

    function handleUploadError(err: { message: string }) {
        setIsUploading(false);
        alert(`Upload failed: ${err.message}`);
    }

    const { startUpload } = useUploadThing("imageUploader", {
        onClientUploadComplete: handleUploaded,
        onUploadError: handleUploadError,
    });

    usePastedImage(
        isOpen && !isUploading,
        target => !target.closest(".quick-reply-modal"),
        file => {
            setIsUploading(true);
            startUpload([file]);
        },
    );

    useEffect(() => {
        function handleOpenPost() {
            setIsOpen(true);
            focusForm();
        }
        window.addEventListener("neochan:open-post", handleOpenPost);
        return () => window.removeEventListener("neochan:open-post", handleOpenPost);
    }, []);

    useEffect(() => {
        if (!threadNo) return;
        function handleQuote(e: Event) {
            const insertion = `>>${(e as CustomEvent<{ no: string }>).detail.no}`;
            setIsOpen(true);
            setComment(c => {
                const base = c.trim();
                if (base.split(/\s+/).includes(insertion)) return c;
                return (base ? base + "\n" : "") + insertion + " ";
            });
            focusForm();
        }
        window.addEventListener("neochan:quote", handleQuote);
        return () => window.removeEventListener("neochan:quote", handleQuote);
    }, [threadNo]);

    function submit(e: FormEvent) {
        e.preventDefault();
        if (isUploading) return alert("PLEASE WAIT FOR IMAGE TO FINISH UPLOADING, ANON.");
        if (!threadNo && !uploadedImage) return alert("AN IMAGE IS REQUIRED TO START A THREAD, ANON.");
        if (!comment.trim()) return alert("COMMENT REQUIRED, ANON.");

        startTransition(async () => {
            try {
                await addPostAction(board === "all" ? targetBoard : board, threadNo ?? null, {
                    name: name.trim() || "Anonymous",
                    subject,
                    comment,
                    sage: threadNo ? sage : false,
                    image: uploadedImage ?? undefined,
                }, honeypot);
                setComment("");
                setSubject("");
                setSage(false);
                setUploadedImage(null);
                setHoneypot("");
                setIsOpen(false);
                router.refresh();
            } catch (err) {
                alert(err instanceof Error ? err.message : "Failed to post");
            }
        });
    }

    if (!isOpen) {
        return (
            <div className="pf-closed-bar" id="postform">
                <button
                    type="button"
                    className="btn yellow pf-toggle-btn"
                    onClick={() => {
                        setIsOpen(true);
                        focusForm();
                    }}
                >
                    <span className="pf-plus">+</span>
                    <span>{threadNo ? `Post a Reply to No.${threadNo}` : board === "all" ? "Start a New Thread" : `Start a New Thread on /${board}/`}</span>
                </button>
                <span className="pf-closed-hint">
                    {threadNo ? "Anonymous & Sage supported" : "Anonymous only (Image & comment required)"}
                </span>
            </div>
        );
    }

    return (
        <form className="postform" id="postform" onSubmit={submit}>
            <div className="hazard" style={{ borderBottom: "var(--bd)" }} />
            <div className="pf-body">
                <div className="pf-title">
                    <span className="badge">{threadNo ? "Reply" : "New Thread"}</span>
                    <span className="mono">{threadNo ? `No.${threadNo}` : board === "all" ? `/${targetBoard}/ (All Boards)` : `/${board}/`}</span>
                    <button type="button" className="btn small pf-close-btn" onClick={() => setIsOpen(false)}>
                        ✕ Close Form
                    </button>
                </div>
                <div className="pf-grid">
                    <input
                        type="text"
                        name="website"
                        value={honeypot}
                        onChange={e => setHoneypot(e.target.value)}
                        style={{ display: "none" }}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                    />
                    <div>
                        {board === "all" && !threadNo && (
                            <div className="field">
                                <label>Board (Required)</label>
                                <select className="pf-select" value={targetBoard} onChange={e => setTargetBoard(e.target.value)}>
                                    {boards
                                        .filter(b => b.slug !== "all")
                                        .map(b => (
                                            <option key={b.slug} value={b.slug}>
                                                /{b.slug}/ — {b.title}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}
                        <div className="field">
                            <label>Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        {threadNo ? (
                            <div className="field">
                                <label className="checkbox-label" htmlFor="postform-sage">
                                    <input
                                        id="postform-sage"
                                        type="checkbox"
                                        checked={sage}
                                        onChange={e => setSage(e.target.checked)}
                                    />
                                    <span>Sage <span className="tiny">(Don&apos;t bump)</span></span>
                                </label>
                            </div>
                        ) : (
                            <div className="field">
                                <label>Subject</label>
                                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="THREAD SUBJECT" />
                            </div>
                        )}
                        <div className="field filebox">
                            <label>Image {threadNo ? "(Optional)" : "(Required)"}</label>
                            {uploadedImage ? (
                                <div className="pf-uploaded">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={uploadedImage.url} className="pf-preview" alt="" />
                                    <div className="pf-upload-info">
                                        <span className="mono" title={uploadedImage.name}>{uploadedImage.name}</span>
                                        <span className="tiny">{uploadedImage.size}</span>
                                        <button type="button" className="btn small" onClick={() => setUploadedImage(null)}>
                                            ✕ Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <UploadButton
                                    endpoint="imageUploader"
                                    onUploadBegin={() => setIsUploading(true)}
                                    onClientUploadComplete={handleUploaded}
                                    onUploadError={handleUploadError}
                                    appearance={{
                                        button: {
                                            background: "var(--black)",
                                            color: "var(--paper)",
                                            border: "2px solid var(--black)",
                                            boxShadow: "3px 3px 0 var(--yellow)",
                                            fontFamily: "var(--mono)",
                                            fontWeight: 700,
                                            fontSize: "12px",
                                            textTransform: "uppercase",
                                            padding: "8px 18px",
                                            cursor: "pointer",
                                        },
                                        allowedContent: {
                                            color: "var(--black)",
                                            fontFamily: "var(--mono)",
                                            fontSize: "10px",
                                        },
                                    }}
                                    content={{
                                        button: ({ isUploading }) => (isUploading ? "Uploading…" : "Choose Image"),
                                        allowedContent: () => "Images up to 4MB, or paste one (Ctrl+V)",
                                    }}
                                />
                            )}
                            {isUploading && (
                                <div className="pf-uploading-indicator">
                                    <span className="mono tiny">UPLOADING...</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="field">
                        <label>Comment (Required)</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder={">implying greentext works\n>>102436"}
                        />
                    </div>
                </div>
                <div className="pf-actions">
                    <button className="btn yellow" disabled={isPending || isUploading}>
                        {isPending ? "Posting…" : isUploading ? "Wait for upload…" : "Post It"}
                    </button>
                    <button type="button" className="btn small pf-cancel-btn" onClick={() => setIsOpen(false)}>
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
}
