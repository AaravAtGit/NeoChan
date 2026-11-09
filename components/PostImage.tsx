"use client";

import { useState } from "react";
import FallbackImg from "./FallbackImg";

interface PostImageProps {
  image: {
    url: string;
    name: string;
    size: string;
    w?: number;
    h?: number;
  };
  isReply?: boolean;
}

export default function PostImage({ image, isReply }: PostImageProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <figure className={`thumb ${isReply ? "reply-thumb" : ""} ${expanded ? "expanded" : ""}`}>
      <FallbackImg
        src={image.url}
        alt=""
        onClick={() => setExpanded((prev) => !prev)}
        className="thumb-img"
        loading="lazy"
      />
      <figcaption>
        File: {image.name} ({image.size})
      </figcaption>
    </figure>
  );
}
