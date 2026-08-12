"use client";

import { useState, useTransition, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addPostAction } from "@/lib/actions";

export default function PostForm({ board, threadNo }: { board: string; threadNo?: number }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("Anonymous");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [comment, setComment] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [isPending, startTransition] = useTransition();

    const mode = threadNo ? "Reply" : "New Thread";

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
                const form = document.querySelector<HTMLElement>(".postform");
                if (form) {
                    form.animate([{ outline: "4px solid var(--yellow)" }, { outline: "4px solid transparent" }], {
                        duration: 900,
                        easing: "ease-out",
                    });
                }
            }, 100);
        }
        window.addEventListener("neochan:quote", handleQuote);
        return () => window.removeEventListener("neochan:quote", handleQuote);
    }, [threadNo]);

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        const r = new FileReader();
        r.onload = () => setPreview(r.result as string);
        r.readAsDataURL(f);
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (!comment.trim() && !file) {
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
                image: file ? { url: preview, name: file.name, size: `${Math.round(file.size / 1024)} KB` } : undefined,
            });
            setComment("");
            setSubject("");
            setFile(null);
            setPreview("");
            setIsOpen(false);
            router.refresh();
        });
    }

    if (!isOpen) {
        return (
            <div className="pf-closed-bar">
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
        <form className="postform" onSubmit={submit}>
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
                            <input type="file" accept="image/*" onChange={onFileChange} />
                            {preview && <img src={preview} className="pf-preview" alt="" />}
                        </div>
                    </div>
                    <div className="field">
                        <label>Comment</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder=">implying greentext works\n>>102436"
                        />
                    </div>
                </div>
                <div className="pf-actions">
                    <button className="btn yellow" disabled={isPending}>
                        {isPending ? "Posting…" : "Post It"}
                    </button>
                    <button
                        type="button"
                        className="btn small pf-cancel-btn"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </button>
                    <span className="tiny">Step 2: image upload → Upstash, post → Redis</span>
                </div>
            </div>
        </form>
    );
}
