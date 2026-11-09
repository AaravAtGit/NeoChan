"use client";

import { useEffect } from "react";

// Listens on document so a paste works without focusing the form. `accepts` picks a form when both are open.
export function usePastedImage(
  enabled: boolean,
  accepts: (target: Element) => boolean,
  onImage: (file: File) => void,
) {
  useEffect(() => {
    if (!enabled) return;

    function onPaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.files ?? []).find(f => f.type.startsWith("image/"));
      if (!file || !accepts(e.target as Element)) return;
      e.preventDefault();
      onImage(file);
    }

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });
}
