import Link from "next/link";
import { rules } from "@/lib/rules";
import RulesAccordion from "@/components/RulesAccordion";

export const metadata = {
  title: "Rules — NeoChan",
  description: "The 47 Rules of the Internet. Lurk more.",
};

export default function RulesPage() {
  return (
    <main className="wrap">
      <nav className="breadcrumb">
        <Link href="/">← Home</Link>
        &nbsp;/&nbsp;
        <span style={{ color: "var(--yellow)", fontFamily: "var(--mono)", fontWeight: 700 }}>
          Rules
        </span>
      </nav>

      <section className="hero">
        <span className="badge">MANDATORY READING</span>
        <h1>Rules<small>of the Internet — 47 of them</small></h1>
        <p className="lead">
          These aren't site policies. They're the laws of nature for anyone posting
          anonymously online. Codified in 2006, refined through memetic warfare,
          still in force. Read them before you lurk. Lurk before you post.
        </p>
        <div className="meta">
          <span>47 COMMANDMENTS</span>
          <span>0 ENFORCED</span>
          <span>∞ VIOLATIONS</span>
        </div>
      </section>

      <div className="divider"><i /></div>

      {/* the rules */}
      <RulesAccordion rules={rules} />

      <div className="divider"><i /></div>

      <section className="hero" style={{ background: "var(--black)", color: "var(--paper)" }}>
        <span className="badge red">FINAL NOTE</span>
        <h1 style={{ color: "var(--paper)" }}>Lurk<small style={{ color: "var(--yellow)" }}>More</small></h1>
        <p className="lead" style={{ color: "var(--paper)" }}>
          Rule 33 says it best. Before you post, read the thread. Before you start
          a thread, search the board. The internet is older than you think, and
          your question has probably been answered before. If it hasn't —
          then you might actually have something worth posting.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link href="/" className="btn yellow">← BACK TO BOARDS</Link>
        </div>
      </section>
    </main>
  );
}