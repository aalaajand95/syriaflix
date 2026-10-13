"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { INITIAL_STATE, type MediaApi, type MediaOptions, type MediaState } from "./media";

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVolume(): number;
  setVolume(volume: number): void;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
  destroy(): void;
};

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onError?: () => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// https://developers.google.com/youtube/iframe_api_reference#onStateChange
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;

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
 * Drives an embedded YouTube player with its own controls turned off, so the
 * SyriaFlix control bar is the only UI. Position/volume are polled because the
 * IFrame API has no time-update event.
 */
export function useYouTubeMedia(
  mountRef: RefObject<HTMLDivElement | null>,
  videoId: string,
  lang: string,
  { startAt, onResumed }: MediaOptions,
): { state: MediaState; api: MediaApi } {
  const [state, setState] = useState<MediaState>(INITIAL_STATE);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    const patch = (p: Partial<MediaState>) => !cancelled && setState((s) => ({ ...s, ...p }));
    setState(INITIAL_STATE);

    loadApi().then((YT) => {
      if (cancelled || !mountRef.current) return;
      const el = document.createElement("div");
      mountRef.current.replaceChildren(el);
      const start = Math.floor(startAt);
      const player = new YT.Player(el, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          hl: lang,
          cc_lang_pref: lang,
          ...(start > 0 ? { start } : {}),
        },
        events: {
          onReady: () => {
            playerRef.current = player;
            if (start > 0) onResumed?.(start);
            const sync = () =>
              patch({
                time: player.getCurrentTime(),
                duration: player.getDuration(),
                volume: player.getVolume() / 100,
                muted: player.isMuted(),
              });
            sync();
            patch({ ready: true, waiting: false });
            poll = setInterval(sync, 250);
          },
          onStateChange: ({ data }) => {
            if (data === PLAYING) patch({ playing: true, waiting: false, ended: false });
            else if (data === PAUSED) patch({ playing: false, waiting: false });
            else if (data === BUFFERING) patch({ waiting: true });
            else if (data === ENDED) patch({ playing: false, waiting: false, ended: true });
          },
          onError: () => patch({ error: true, waiting: false }),
        },
      });
    });

    return () => {
      cancelled = true;
      clearInterval(poll);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // startAt/onResumed are only read when a new video loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountRef, videoId, lang]);

  const api = useMemo<MediaApi>(
    () => ({
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      seek: (t) => {
        playerRef.current?.seekTo(t, true);
        setState((s) => ({ ...s, time: t, ended: false }));
      },
      setVolume: (v) => {
        const p = playerRef.current;
        if (!p) return;
        p.setVolume(Math.round(v * 100));
        if (v === 0) p.mute();
        else p.unMute();
        setState((s) => ({ ...s, volume: v, muted: v === 0 }));
      },
      setMuted: (m) => {
        if (m) playerRef.current?.mute();
        else playerRef.current?.unMute();
        setState((s) => ({ ...s, muted: m }));
      },
    }),
    [],
  );

  return { state, api };
}
