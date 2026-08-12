"use client";

import { useState, useTransition, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addPostAction } from "@/lib/actions";
import { UploadButton } from "@/lib/uploadthing";

type UploadedImage = {
    url: string;
    name: string;
    size: string;
};

export default function PostForm({ board, threadNo }: { board: string; threadNo?: number }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("Anonymous");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [comment, setComment] = useState("");
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
    const [originalFileName, setOriginalFileName] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const mode = threadNo ? "Reply" : "New Thread";

    useEffect(() => {
        function handleOpenPost() {
            setIsOpen(true);
            setTimeout(() => {
                const form = document.getElementById("postform") || document.querySelector<HTMLElement>(".postform, .pf-closed-bar");
                if (form) {
                    form.scrollIntoView({ behavior: "smooth", block: "center" });
                    form.animate(
                        [
                            { outline: "4px solid var(--yellow)" },
                            { outline: "4px solid transparent" },
                        ],
                        {
                            duration: 900,
                            easing: "ease-out",
                        }
                    );
                }
                const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                    ".postform textarea, .postform input[type='text'], .postform input:not([type='file'])"
                );
                input?.focus();
            }, 80);
        }

        window.addEventListener("neochan:open-post", handleOpenPost);
        return () => window.removeEventListener("neochan:open-post", handleOpenPost);
    }, []);

    useEffect(() => {
        if (!threadNo) return;

        function handleQuote(e: Event) {
            const { no } = (e as CustomEvent<{ no: string }>).detail;
            setIsOpen(true);
            setComment(c => {
                const insertion = `>>${no}`;
                const base = c.trim();
                if (base.split(/\s+/).includes(insertion)) return c;
                return (base ? base + "\n" : "") + insertion + " ";
            });
            setTimeout(() => {
                const form = document.getElementById("postform") || document.querySelector<HTMLElement>(".postform");
                if (form) {
                    form.scrollIntoView({ behavior: "smooth", block: "center" });
                    form.animate([{ outline: "4px solid var(--yellow)" }, { outline: "4px solid transparent" }], {
                        duration: 900,
                        easing: "ease-out",
                    });
                }
                const textarea = document.querySelector<HTMLTextAreaElement>(".postform textarea");
                textarea?.focus();
            }, 80);
        }
        window.addEventListener("neochan:quote", handleQuote);
        return () => window.removeEventListener("neochan:quote", handleQuote);
    }, [threadNo]);

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (!comment.trim() && !uploadedImage) {
            alert("COMMENT OR IMAGE REQUIRED, ANON.");
            return;
        }
        const sage = /sage/i.test(email);
        startTransition(async () => {
            await addPostAction(board, threadNo ?? null, {
                name: name.trim() || "Anonymous",
                email,
                subject,
                comment,
                sage,
                image: uploadedImage ? { url: uploadedImage.url, name: uploadedImage.name, size: uploadedImage.size } : undefined,
            });
            setComment("");
            setSubject("");
            setUploadedImage(null);
            setOriginalFileName("");
            setIsOpen(false);
            router.refresh();
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
                        setTimeout(() => {
                            const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                                ".postform textarea, .postform input"
                            );
                            el?.focus();
                        }, 100);
                    }}
                >
                    <span className="pf-plus">+</span>
                    <span>{threadNo ? `Post a Reply to No.${threadNo}` : `Start a New Thread on /${board}/`}</span>
                </button>
                <span className="pf-closed-hint">
                    {threadNo ? "Anonymous & Sage supported" : "Anonymous only — Image or comment required"}
                </span>
            </div>
        );
    }

    return (
        <form className="postform" id="postform" onSubmit={submit}>
            <div className="hazard" style={{ borderBottom: "var(--bd)" }} />
            <div className="pf-body">
                <div className="pf-title">
                    <span className="badge">{mode}</span>
                    <span className="mono">{threadNo ? `No.${threadNo}` : `/${board}/`}</span>
                    <button
                        type="button"
                        className="btn small pf-close-btn"
                        onClick={() => setIsOpen(false)}
                    >
                        ✕ Close Form
                    </button>
                </div>
                <div className="pf-grid">
                    <div>
                        <div className="field">
                            <label>Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Email</label>
                            <input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="sage = don't bump"
                            />
                        </div>
                        {!threadNo && (
                            <div className="field">
                                <label>Subject</label>
                                <input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="THREAD SUBJECT"
                                />
                            </div>
                        )}
                        <div className="field filebox">
                            <label>Image</label>
                            {uploadedImage ? (
                                <div className="pf-uploaded">
                                    <img src={uploadedImage.url} className="pf-preview" alt="" />
                                    <div className="pf-upload-info">
                                        <span className="mono" title={uploadedImage.name}>{uploadedImage.name}</span>
                                        <span className="tiny">{uploadedImage.size}</span>
                                        <button
                                            type="button"
                                            className="btn small"
                                            onClick={() => {
                                                setUploadedImage(null);
                                                setOriginalFileName("");
                                            }}
                                        >
                                            ✕ Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <UploadButton
                                    endpoint="imageUploader"
                                    onBeforeUploadBegin={(files) => {
                                        if (files && files[0]) {
                                            setOriginalFileName(files[0].name);
                                        }
                                        return files;
                                    }}
                                    onUploadBegin={() => setIsUploading(true)}
                                    onClientUploadComplete={(res) => {
                                        setIsUploading(false);
                                        if (res && res[0]) {
                                            const f = res[0];
                                            const sizeStr = f.size < 1024 * 1024
                                                ? `${Math.round(f.size / 1024)} KB`
                                                : `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
                                            setUploadedImage({
                                                url: f.ufsUrl,
                                                name: originalFileName || f.name,
                                                size: sizeStr,
                                            });
                                        }
                                    }}
                                    onUploadError={(err) => {
                                        setIsUploading(false);
                                        alert(`Upload failed: ${err.message}`);
                                    }}
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
                                            color: "var(--paper)",
                                            fontFamily: "var(--mono)",
                                            fontSize: "10px",
                                            opacity: 0.6,
                                        },
                                    }}
                                    content={{
                                        button({ isUploading: uploading }) {
                                            return uploading ? "Uploading…" : "Choose Image";
                                        },
                                        allowedContent() {
                                            return "Images up to 4MB";
                                        },
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
                        <label>Comment</label>
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
                    <button
                        type="button"
                        className="btn small pf-cancel-btn"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
}
