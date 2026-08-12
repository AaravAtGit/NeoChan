import BoardCard from "@/components/BoardCard";
import { getBoards } from "@/lib/store";

export default function HomePage() {
    const boards = getBoards();
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

            <div className="section-head">
                <h2>Boards</h2>
                <span>{boards.length} ACTIVE BOARDS</span>
            </div>
            <div className="board-grid">
                {boards.map(b => (
                    <BoardCard key={b.slug} board={b} />
                ))}
            </div>

            <div className="divider">
                <i />
            </div>

            <div className="section-head">
                <h2>Rules</h2>
                <span>READ BEFORE POSTING</span>
            </div>
            <section className="rules">
                <h3>The 5 Commandments</h3>
                <ol>
                    <li>Be anonymous. No names, no handles, no linking accounts.</li>
                    <li>
                        <code>sage</code> in the email field to not bump a thread.
                    </li>
                    <li>No personal info. Blurred faces, masked IPs, scrubbed EXIF.</li>
                    <li>Images required on OP. Text-only threads get sage'd into oblivion.</li>
                    <li>Check the catalog — er, the board — before posting a duplicate.</li>
                </ol>
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
