"use client";

import Link from "next/link";
import { Icon } from "./icons";
import { formatTime, type MediaApi, type MediaState } from "./media";
import type { Messages } from "@/lib/i18n";

type Labels = Messages["player"] & { nextEpisode: string };

function Button({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-full p-2 text-white/90 transition hover:bg-white/15 hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}

/** The SyriaFlix control bar, shared by the self-hosted and YouTube backends. */
export default function Controls({
  state,
  api,
  labels,
  fullscreen,
  onToggleFullscreen,
  nextHref,
  subtitles,
}: {
  state: MediaState;
  api: MediaApi;
  labels: Labels;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  nextHref?: string;
  subtitles?: { label: string; onCycle: () => void; active: boolean };
}) {
  const progress = state.duration ? (state.time / state.duration) * 100 : 0;
  const silent = state.muted || state.volume === 0;

  // Playback controls stay left-to-right in every language, like a timeline.
  return (
    <div className="px-2 pb-1 pt-2 sm:px-4" dir="ltr">
      <input
        type="range"
        min={0}
        max={state.duration || 0}
        step={1}
        value={Math.min(state.time, state.duration || 0)}
        onChange={(e) => api.seek(Number(e.target.value))}
        aria-label={labels.seek}
        aria-valuetext={`${formatTime(state.time)} / ${formatTime(state.duration)}`}
        disabled={!state.ready}
        className="player-range h-1.5 w-full cursor-pointer"
        style={{ "--progress": `${progress}%` } as React.CSSProperties}
      />
      <div className="mt-1 flex items-center gap-0.5 sm:gap-1">
        <Button label={state.playing ? labels.pause : labels.play} onClick={state.playing ? api.pause : api.play}>
          <Icon name={state.playing ? "pause" : "play"} className="h-7 w-7" />
        </Button>
        <Button label={labels.rewind} onClick={() => api.seek(Math.max(0, state.time - 10))}>
          <Icon name="rewind" />
        </Button>
        <Button label={labels.forward} onClick={() => api.seek(Math.min(state.duration, state.time + 10))}>
          <Icon name="forward" />
        </Button>
        <div className="group/vol flex items-center">
          <Button label={silent ? labels.unmute : labels.mute} onClick={() => api.setMuted(!silent)}>
            <Icon name={silent ? "muted" : "volume"} />
          </Button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={silent ? 0 : state.volume}
            onChange={(e) => api.setVolume(Number(e.target.value))}
            aria-label={labels.volume}
            className="player-range hidden h-1 w-20 cursor-pointer sm:block"
            style={{ "--progress": `${(silent ? 0 : state.volume) * 100}%` } as React.CSSProperties}
          />
        </div>
        <span dir="ltr" className="ms-2 whitespace-nowrap text-xs tabular-nums text-white/80 sm:text-sm">
          {formatTime(state.time)} / {formatTime(state.duration)}
        </span>
        <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
          {subtitles && (
            <Button label={labels.subtitles} onClick={subtitles.onCycle} className="flex items-center gap-1">
              <Icon name="subtitles" />
              <span className={`hidden text-xs sm:inline ${subtitles.active ? "text-white" : "text-white/60"}`}>
                {subtitles.label}
              </span>
            </Button>
          )}
          {nextHref && (
            <Link
              href={nextHref}
              aria-label={labels.nextEpisode}
              title={labels.nextEpisode}
              className="flex items-center gap-1 rounded-full p-2 text-white/90 hover:bg-white/15 hover:text-white"
            >
              <Icon name="next" className="h-6 w-6" />
              <span className="hidden text-sm md:inline">{labels.nextEpisode}</span>
            </Link>
          )}
          <Button label={fullscreen ? labels.exitFullscreen : labels.fullscreen} onClick={onToggleFullscreen}>
            <Icon name={fullscreen ? "exitFullscreen" : "fullscreen"} />
          </Button>
        </div>
      </div>
    </div>
  );
}
