/** What the custom controls need to know about whichever backend is playing. */
export type MediaState = {
  ready: boolean;
  playing: boolean;
  waiting: boolean;
  ended: boolean;
  error: boolean;
  time: number;
  duration: number;
  /** 0–1 */
  volume: number;
  muted: boolean;
};

export type MediaApi = {
  play(): void;
  pause(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
};

export const INITIAL_STATE: MediaState = {
  ready: false,
  playing: false,
  waiting: true,
  ended: false,
  error: false,
  time: 0,
  duration: 0,
  volume: 1,
  muted: false,
};

export type MediaOptions = {
  /** Seconds to start from (resume). */
  startAt: number;
  /** Called once when the start position was restored. */
  onResumed?: (time: number) => void;
};

export function formatTime(total: number): string {
  if (!Number.isFinite(total) || total < 0) total = 0;
  const s = Math.floor(total % 60);
  const m = Math.floor((total / 60) % 60);
  const h = Math.floor(total / 3600);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}
