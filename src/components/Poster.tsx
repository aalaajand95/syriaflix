"use client";

import { useState } from "react";
import type { Localized } from "@/lib/types";

function hue(seed: string): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

/**
 * A 16:9 poster: the show's image when one exists, otherwise a generated
 * card with the Arabic title (also used if the image fails to load).
 */
export default function Poster({
  slug,
  title,
  image,
  className = "",
  compact = false,
}: {
  slug: string;
  title: Localized;
  image?: string;
  className?: string;
  /** Small thumbnails: title only, smaller type. */
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`aspect-video w-full object-cover ${className}`}
      />
    );
  }
  const h = hue(slug);
  return (
    <div
      aria-hidden
      className={`flex aspect-video w-full flex-col items-center justify-center p-3 text-center ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, hsl(${h} 55% 32%), hsl(${(h + 40) % 360} 45% 12%) 70%)`,
      }}
    >
      <span
        lang="ar"
        className={`font-black leading-tight text-white drop-shadow ${compact ? "text-sm" : "text-2xl sm:text-3xl"}`}
      >
        {title.ar}
      </span>
      {!compact && (
        <span lang="en" className="mt-1 text-xs uppercase tracking-widest text-white/70">
          {title.en}
        </span>
      )}
    </div>
  );
}
