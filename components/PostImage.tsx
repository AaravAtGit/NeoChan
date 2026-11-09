"use client";

import { useState } from "react";
import { Post } from "@/lib/types";
import FallbackImg from "./FallbackImg";

// click to toggle full size
export default function PostImage({ image, isReply }: { image: NonNullable<Post["image"]>; isReply?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <figure className={`thumb ${isReply ? "reply-thumb" : ""} ${expanded ? "expanded" : ""}`}>
      <FallbackImg src={image.url} className="thumb-img" loading="lazy" onClick={() => setExpanded(!expanded)} />
      <figcaption>
        File: {image.name} ({image.size})
      </figcaption>
    </figure>
  );
}
