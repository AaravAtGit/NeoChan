import Link from "next/link";
import { rules } from "@/lib/rules";

function Track({ hidden }: { hidden?: boolean }) {
  return (
    <div className="ticker-track" aria-hidden={hidden || undefined}>
      {rules.map((r) => (
        <Link key={r.no} href={`/rules#rule-${r.no}`} className="ticker-item" tabIndex={hidden ? -1 : undefined}>
          <span className="ticker-text">
            RULE #{r.no}: {r.title.toUpperCase()}
          </span>
          <span className="ticker-star">★</span>
        </Link>
      ))}
    </div>
  );
}

export default function Ticker() {
  return (
    <div className="ticker" aria-label="Rules of the Internet Ticker">
      <div className="ticker-inner">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
