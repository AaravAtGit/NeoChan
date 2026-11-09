"use client";

import { ImgHTMLAttributes, useEffect, useRef, useState } from "react";

const FALLBACKS = [
  "/404Images/404_1.jpg",
  "/404Images/404_2.png",
  "/404Images/404_3.png",
  "/404Images/404_4.png",
  "/404Images/404_5.gif",
  "/404Images/404-5.png",
];

// same broken url always gets the same 404 pic
function fallbackFor(src: string) {
  let hash = 0;
  for (let i = 0; i < src.length; i++) hash = (hash * 31 + src.charCodeAt(i)) | 0;
  return FALLBACKS[Math.abs(hash) % FALLBACKS.length];
}

export default function FallbackImg({ src, alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);

  // if the image already failed before hydration, onError never fired.
  // setting src again makes the browser retry and fire it this time
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) img.src = src;
  }, [src]);

  return (
    <img
      {...props}
      alt={alt}
      ref={ref}
      src={failedSrc === src ? fallbackFor(src) : src}
      onError={() => setFailedSrc(src)}
    />
  );
}
