import BoardCard from "@/components/BoardCard";
import { boards } from "@/lib/boards";
import { rules } from "@/lib/rules";
import Link from "next/link";

export default function HomePage() {
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
                        These aren&apos;t polite suggestions - they are the immutable laws of nature for anyone posting online.
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
                <span>THE MANIFESTO</span>
            </div>
            <section className="rules">
                <div className="rules-intro" style={{ marginBottom: 16 }}>
                    <span className="badge">WHY NEOCHAN</span>
                    <h3 style={{ marginTop: 8 }}>Bringing Back The Anonymity The Internet Once Promised</h3>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 14, color: "#3a332a" }}>
                    The internet has changed. Platforms that once championed anonymity have turned into identity engines where persistent profiles, usernames, and reputations constrain how you think and act. You end up curating a persona instead of speaking your mind.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 14, color: "#3a332a" }}>
                    <b>NeoChan is different:</b> you are an Anon... just an anon. No shape, no identity, no personality, and <b>no digital footprint</b>. It provides true freedom of thought, freedom of speech, and the freedom to be unfiltered and be yourself without consequences.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "#3a332a" }}>
                    Everything here is ephemeral. Threads live and die by community bumps. Once a board hits capacity, dead threads are purged and vanish forever into the void. Welcome back to the glory days of the web.
                </p>
            </section>
        </main>
    );
}
