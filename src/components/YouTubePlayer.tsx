"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { saveProgress } from "@/lib/progress";

type YTPlayer = { destroy(): void };
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: { onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return apiPromise;
}

/**
 * Embeds a YouTube video via the IFrame API, records "continue watching"
 * progress and jumps to the next episode when the video ends.
 */
export default function YouTubePlayer({
  videoId,
  lang,
  progress,
  nextHref,
}: {
  videoId: string;
  lang: string;
  progress: { slug: string; season: number; episode: number };
  nextHref?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { slug, season, episode } = progress;

  useEffect(() => saveProgress({ slug, season, episode }), [slug, season, episode]);

  useEffect(() => {
    let player: YTPlayer | undefined;
    let cancelled = false;
    loadApi().then((YT) => {
      if (cancelled || !ref.current) return;
      const mount = document.createElement("div");
      ref.current.replaceChildren(mount);
      player = new YT.Player(mount, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, hl: lang, cc_lang_pref: lang },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED && nextHref) router.push(nextHref);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [videoId, lang, nextHref, router]);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full">
      <div ref={ref} className="absolute inset-0" />
    </div>
  );
}
