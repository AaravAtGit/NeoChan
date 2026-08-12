"use client";

import { useEffect, useState } from "react";
import type { Rule } from "@/lib/rules";

interface RulesAccordionProps {
  rules: Rule[];
}

export default function RulesAccordion({ rules }: RulesAccordionProps) {
  const [openNo, setOpenNo] = useState<number | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#rule-")) {
        const num = parseInt(hash.replace("#rule-", ""), 10);
        if (!isNaN(num)) {
          setOpenNo(num);
          const el = document.getElementById(`rule-${num}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleToggle = (ruleNo: number, e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = e.currentTarget.open;
    if (isOpen) {
      setOpenNo(ruleNo);
    } else if (openNo === ruleNo) {
      setOpenNo(null);
    }
  };

  return (
    <div className="rules-list">
      {rules.map((r) => {
        const isOpen = openNo === r.no;
        return (
          <details
            key={r.no}
            name="rules"
            className="rule-item"
            id={`rule-${r.no}`}
            open={isOpen}
            onToggle={(e) => handleToggle(r.no, e)}
          >
            <summary>
              <span className="rule-num">{String(r.no).padStart(2, "0")}</span>
              <span className="rule-title">{r.title}</span>
              <span className="rule-plus" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="square"
                >
                  <line x1="9" y1="2" x2="9" y2="16" />
                  <line x1="2" y1="9" x2="16" y2="9" />
                </svg>
              </span>
            </summary>
            <div className="rule-body">
              <p>{r.explanation}</p>
            </div>
          </details>
        );
      })}
    </div>
  );
}
