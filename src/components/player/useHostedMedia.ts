"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { INITIAL_STATE, type MediaApi, type MediaOptions, type MediaState } from "./media";

const isHls = (src: string) => /\.m3u8($|\?)/i.test(src);

/** Drives a <video> element; HLS goes through hls.js except where the browser plays it natively (Safari/iOS). */
export function useHostedMedia(
  ref: RefObject<HTMLVideoElement | null>,
  src: string,
  { startAt, onResumed }: MediaOptions,
): { state: MediaState; api: MediaApi } {
  const [state, setState] = useState<MediaState>(INITIAL_STATE);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let cancelled = false;
    let destroyHls: (() => void) | undefined;
    const patch = (p: Partial<MediaState>) => !cancelled && setState((s) => ({ ...s, ...p }));
    setState(INITIAL_STATE);

    const sync = () =>
      patch({
        time: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        volume: video.volume,
        muted: video.muted,
      });
    const onLoaded = () => {
      if (startAt > 0 && startAt < video.duration - 5) {
        video.currentTime = startAt;
        onResumed?.(startAt);
      }
      patch({ ready: true });
      sync();
      // Autoplay may be blocked without a user gesture; the big play button covers that case.
      video.play().catch(() => patch({ playing: false, waiting: false }));
    };
    const handlers: Record<string, () => void> = {
      loadedmetadata: onLoaded,
      timeupdate: sync,
      durationchange: sync,
      volumechange: sync,
      play: () => patch({ playing: true, ended: false }),
      pause: () => patch({ playing: false, waiting: false }),
      playing: () => patch({ playing: true, waiting: false }),
      waiting: () => patch({ waiting: true }),
      canplay: () => patch({ waiting: false }),
      ended: () => patch({ playing: false, ended: true }),
      error: () => patch({ error: true, waiting: false }),
    };
    for (const [event, fn] of Object.entries(handlers)) video.addEventListener(event, fn);

    if (isHls(src) && !video.canPlayType("application/vnd.apple.mpegurl")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return patch({ error: true, waiting: false });
        const hls = new Hls({ capLevelToPlayerSize: true });
        hls.on(Hls.Events.ERROR, (_, data) => data.fatal && patch({ error: true, waiting: false }));
        hls.loadSource(src);
        hls.attachMedia(video);
        destroyHls = () => hls.destroy();
      });
    } else {
      video.src = src;
    }

    return () => {
      cancelled = true;
      for (const [event, fn] of Object.entries(handlers)) video.removeEventListener(event, fn);
      destroyHls?.();
      video.removeAttribute("src");
      video.load();
    };
    // startAt/onResumed are only read when a new source loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, src]);

  const api = useMemo<MediaApi>(
    () => ({
      play: () => void ref.current?.play().catch(() => {}),
      pause: () => ref.current?.pause(),
      seek: (t) => {
        if (ref.current) ref.current.currentTime = t;
      },
      setVolume: (v) => {
        if (!ref.current) return;
        ref.current.volume = v;
        ref.current.muted = v === 0;
      },
      setMuted: (m) => {
        if (ref.current) ref.current.muted = m;
      },
    }),
    [ref],
  );

  return { state, api };
}
