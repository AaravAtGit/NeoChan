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

function fallbackFor(src: string) {
  let hash = 0;
  for (let i = 0; i < src.length; i++) hash = (hash * 31 + src.charCodeAt(i)) | 0;
  return FALLBACKS[Math.abs(hash) % FALLBACKS.length];
}

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string };

export default function FallbackImg({ src, alt = "", ...props }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);
  const failed = failedSrc === src;

  
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) img.src = src;
  }, [src]);

  return (
    <img
      {...props}
      alt={alt}
      ref={ref}
      src={failed ? fallbackFor(src) : src}
      onError={() => setFailedSrc(src)}
    />
  );
}
