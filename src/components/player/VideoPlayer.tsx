"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Controls from "./Controls";
import { Icon } from "./icons";
import { formatTime, type MediaApi, type MediaState } from "./media";
import { useHostedMedia } from "./useHostedMedia";
import { useYouTubeMedia } from "./useYouTubeMedia";
import { format, type Messages } from "@/lib/i18n";
import { resumeTime, saveProgress } from "@/lib/progress";
import type { Episode, HostedVideo, Locale } from "@/lib/types";

type Common = {
  locale: Locale;
  labels: Messages["player"] & { nextEpisode: string };
  progress: { slug: string; season: number; episode: number };
  nextHref?: string;
};

/** Plays an episode from whichever source it has, always behind the SyriaFlix controls. */
export default function VideoPlayer({ episode, ...common }: Common & { episode: Episode }) {
  if (episode.video) return <HostedPlayer key={episode.video.src} video={episode.video} {...common} />;
  if (episode.youtubeId) return <YouTubePlayer key={episode.youtubeId} videoId={episode.youtubeId} {...common} />;
  return null;
}

function useResume(progress: Common["progress"], labels: Common["labels"]) {
  const [startAt] = useState(() => resumeTime(progress.slug, progress.season, progress.episode));
  const [toast, setToast] = useState<string | null>(null);
  const onResumed = useCallback(
    (t: number) => {
      setToast(format(labels.resumedAt, { time: formatTime(t) }));
      setTimeout(() => setToast(null), 3500);
    },
    [labels.resumedAt],
  );
  return { startAt, onResumed, toast };
}

/** Behaviour shared by both backends: progress saving, auto-advance, fullscreen and keyboard shortcuts. */
function usePlayerShell(
  container: RefObject<HTMLDivElement | null>,
  state: MediaState,
  api: MediaApi,
  { progress, nextHref }: Common,
  fallbackFullscreen?: () => void,
) {
  const router = useRouter();
  const [fullscreen, setFullscreen] = useState(false);
  const lastSaved = useRef<number | null>(null);
  const { slug, season, episode } = progress;

  // Save the position every ~5s of playback and whenever playback pauses or ends.
  useEffect(() => {
    if (!state.ready) return;
    const t = state.ended ? 0 : state.time;
    if (lastSaved.current === null || !state.playing || Math.abs(t - lastSaved.current) >= 5) {
      saveProgress({ slug, season, episode, time: t });
      lastSaved.current = t;
    }
  }, [state.ready, state.time, state.playing, state.ended, slug, season, episode]);

  useEffect(() => {
    if (state.ended && nextHref) router.push(nextHref);
  }, [state.ended, nextHref, router]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [container]);

  const toggleFullscreen = useCallback(() => {
    const el = container.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el.requestFullscreen) void el.requestFullscreen().catch(() => fallbackFullscreen?.());
    else fallbackFullscreen?.();
  }, [container, fallbackFullscreen]);

  // Keyboard: space/k play-pause, ←/→ ±10s, f fullscreen, m mute.
  const live = useRef({ state, api, toggleFullscreen });
  live.current = { state, api, toggleFullscreen };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || target.closest("input, textarea, select, [contenteditable]")) return;
      const { state: s, api: a, toggleFullscreen: fs } = live.current;
      const key = e.key.toLowerCase();
      if (key === " " || key === "k") {
        if (key === " " && target.closest("button, a")) return;
        if (s.playing) a.pause();
        else a.play();
      } else if (key === "arrowright" || key === "arrowleft") {
        a.seek(Math.max(0, Math.min(s.duration, s.time + (key === "arrowright" ? 10 : -10))));
      } else if (key === "f") fs();
      else if (key === "m") a.setMuted(!s.muted);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { fullscreen, toggleFullscreen };
}

function HostedPlayer({ video, ...common }: Common & { video: HostedVideo }) {
  const { locale, labels, nextHref } = common;
  const container = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { startAt, onResumed, toast } = useResume(common.progress, labels);
  const { state, api } = useHostedMedia(videoRef, video.src, { startAt, onResumed });
  // iPhone Safari only supports fullscreen on the <video> element itself.
  const iosFullscreen = useCallback(
    () => (videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen?.(),
    [],
  );
  const { fullscreen, toggleFullscreen } = usePlayerShell(container, state, api, common, iosFullscreen);

  // Controls fade out while playing and the pointer is idle.
  const [active, setActive] = useState(true);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wake = () => {
    setActive(true);
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setActive(false), 3000);
  };
  useEffect(() => () => clearTimeout(idle.current), []);
  const visible = !state.playing || active;

  const tracks = video.subtitles ?? [];
  const [track, setTrack] = useState(() => tracks.findIndex((t) => t.lang === locale));
  useEffect(() => {
    const list = videoRef.current?.textTracks;
    if (!list) return;
    for (let i = 0; i < list.length; i++) list[i].mode = i === track ? "showing" : "disabled";
  }, [track, state.ready]);

  return (
    <div
      ref={container}
      onPointerMove={wake}
      onPointerDown={wake}
      className={`relative w-full overflow-hidden bg-black ${fullscreen ? "h-full" : "aspect-video"} ${visible ? "" : "cursor-none"}`}
    >
      <video
        ref={videoRef}
        poster={video.poster}
        playsInline
        preload="metadata"
        crossOrigin={tracks.length ? "anonymous" : undefined}
        onClick={state.playing ? api.pause : api.play}
        onDoubleClick={toggleFullscreen}
        className="absolute inset-0 h-full w-full"
      >
        {tracks.map((t) => (
          <track key={t.src} kind="subtitles" srcLang={t.lang} label={t.label} src={t.src} />
        ))}
      </video>

      {state.error ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-lg">{labels.error}</p>
      ) : state.waiting && state.playing ? (
        <span className="pointer-events-none absolute inset-0 m-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      ) : (
        !state.playing && (
          <button
            type="button"
            onClick={api.play}
            aria-label={labels.play}
            className="absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-black/60 ring-2 ring-white/70 transition hover:scale-105 hover:bg-accent"
          >
            <Icon name="play" className="h-10 w-10" />
          </button>
        )
      )}

      {toast && <p className="absolute start-4 top-4 rounded bg-black/70 px-3 py-1.5 text-sm">{toast}</p>}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 transition-opacity duration-300 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Controls
          state={state}
          api={api}
          labels={labels}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
          nextHref={nextHref}
          subtitles={
            tracks.length
              ? {
                  label: track >= 0 ? tracks[track].label : labels.subtitlesOff,
                  active: track >= 0,
                  onCycle: () => setTrack((i) => (i + 1 >= tracks.length ? -1 : i + 1)),
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}

/**
 * YouTube's embed terms don't allow drawing over their player, so here the
 * SyriaFlix control bar sits directly below the video instead of on top of it.
 */
function YouTubePlayer({ videoId, ...common }: Common & { videoId: string }) {
  const { locale, labels, nextHref } = common;
  const container = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const { startAt, onResumed, toast } = useResume(common.progress, labels);
  const { state, api } = useYouTubeMedia(mount, videoId, locale, { startAt, onResumed });
  const { fullscreen, toggleFullscreen } = usePlayerShell(container, state, api, common);

  return (
    <div ref={container} className={`w-full bg-black ${fullscreen ? "flex h-full flex-col" : ""}`}>
      <div className={`relative w-full ${fullscreen ? "flex-1" : "aspect-video"}`}>
        <div ref={mount} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
      </div>
      {(toast || state.error) && (
        <p className="px-4 pt-2 text-sm text-white/80">{state.error ? labels.error : toast}</p>
      )}
      <Controls
        state={state}
        api={api}
        labels={labels}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
        nextHref={nextHref}
      />
    </div>
  );
}
