import Link from "next/link";
import { rules } from "@/lib/rules";

export default function Ticker() {
  return (
    <div className="ticker" aria-label="Rules of the Internet Ticker">
      <div className="ticker-inner">
        <div className="ticker-track">
          {rules.map((r) => (
            <Link
              key={`t1-${r.no}`}
              href={`/rules#rule-${r.no}`}
              className="ticker-item"
            >
              <span className="ticker-text">
                RULE #{r.no}: {r.title.toUpperCase()}
              </span>
              <span className="ticker-star">★</span>
            </Link>
          ))}
        </div>
        <div className="ticker-track" aria-hidden="true">
          {rules.map((r) => (
            <Link
              key={`t2-${r.no}`}
              href={`/rules#rule-${r.no}`}
              className="ticker-item"
              tabIndex={-1}
            >
              <span className="ticker-text">
                RULE #{r.no}: {r.title.toUpperCase()}
              </span>
              <span className="ticker-star">★</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}