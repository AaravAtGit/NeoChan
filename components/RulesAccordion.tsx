"use client";

import { useEffect } from "react";
import type { Rule } from "@/lib/rules";

export default function RulesAccordion({ rules }: { rules: Rule[] }) {
  // open the rule from links like /rules#rule-34
  useEffect(() => {
    function openFromHash() {
      const el = location.hash && document.getElementById(location.hash.slice(1));
      if (!(el instanceof HTMLDetailsElement)) return;
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <div className="rules-list">
      {rules.map((r) => (
        // same name = only one open at a time, the browser handles it
        <details key={r.no} name="rules" className="rule-item" id={`rule-${r.no}`}>
          <summary>
            <span className="rule-num">{String(r.no).padStart(2, "0")}</span>
            <span className="rule-title">{r.title}</span>
            <span className="rule-plus" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square">
                <line x1="9" y1="2" x2="9" y2="16" />
                <line x1="2" y1="9" x2="16" y2="9" />
              </svg>
            </span>
          </summary>
          <div className="rule-body">
            <p>{r.explanation}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
