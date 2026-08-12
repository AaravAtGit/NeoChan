import BoardCard from "@/components/BoardCard";
import { getBoards } from "@/lib/store";
import { rules } from "@/lib/rules";
import Link from "next/link";

export default function HomePage() {
    const boards = getBoards();
    // Key iconic rules to showcase on the homepage
    const highlightRuleNos = [1, 2, 3, 8, 9, 14, 20, 32, 33, 34];
    const highlightedRules = rules.filter(r => highlightRuleNos.includes(r.no));

    return (
        <main className="wrap">
            <section className="hero">
                <span className="badge">WELCOME, ANON</span>
                <h1>
                    Neo<small>Chan</small>
                </h1>
                <p className="lead">
                    Anonymous imageboard built Reimagined. <br />
                    What time internet used to be. No Identity, No personality, Just wrong opinions<br /> Be Your True self.
                    
                </p>
                <div className="meta">
                    <span>NO ACCOUNTS</span>
                    <span>100% ANONYMOUS</span>
                    <span>BE UNFILTERED</span>
                </div>
            </section>

            <div className="divider">
                <i />
            </div>

            <div className="section-head" id="threads">
                <h2>Boards</h2>
                <span>{boards.length} ACTIVE BOARDS</span>
            </div>
            <div className="board-grid" id="boards">
                {boards.map(b => (
                    <BoardCard key={b.slug} board={b} />
                ))}
            </div>

            <div className="divider">
                <i />
            </div>

            <div className="section-head">
                <h2>Rules</h2>
                <span>THE 47 RULES OF THE INTERNET</span>
            </div>
            <section className="rules-section">
                <div className="rules-intro">
                    <span className="badge red">MANDATORY LURKING</span>
                    <h3>The Laws of Anonymity</h3>
                    <p className="rules-lead">
                        These aren&apos;t polite suggestions — they are the immutable laws of nature for anyone posting online.
                        Codified in the early 2000s, forged through memetic warfare, and still governing every thread.
                    </p>
                </div>

                <div className="home-rules-grid">
                    {highlightedRules.map((r) => (
                        <Link
                            key={r.no}
                            href={`/rules#rule-${r.no}`}
                            className="home-rule-card"
                        >
                            <div className="hr-head">
                                <span className="hr-num">#{String(r.no).padStart(2, "0")}</span>
                                <span className="hr-arrow">→</span>
                            </div>
                            <h4 className="hr-title">{r.title}</h4>
                            <p className="hr-desc">{r.explanation}</p>
                        </Link>
                    ))}
                </div>

                <div className="rules-footer-cta">
                    <div className="rules-cta-info">
                        <span className="rules-cta-tag">FULL ARCHIVE</span>
                        <h4>All 47 Commandments Codified</h4>
                        <p>From Rule 1 to Rule 47, read before you post. Lurk more.</p>
                    </div>
                    <Link href="/rules" className="btn yellow">
                        VIEW ALL 47 RULES →
                    </Link>
                </div>
            </section>

            <div className="divider">
                <i />
            </div>

            <div className="section-head">
                <h2>About</h2>
                <span>TECH STACK</span>
            </div>
            <section className="rules">
                <h3>Under the hood</h3>
                <p style={{ fontSize: 15, lineHeight: 1.7 }}>
                    NeoChan is built on <b>Next.js</b> with posts persisted in <b>Redis (Upstash)</b>. Image uploads go
                    straight to <b>Upstash Blob</b> so we never touch your files on our servers. Threads purge
                    oldest-first when a board hits capacity. The rest is up to the anons.
                </p>
            </section>
        </main>
    );
}
