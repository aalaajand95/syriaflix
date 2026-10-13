/** "Continue watching" entries kept in this browser only. */
export type ProgressEntry = {
  slug: string;
  season: number;
  episode: number;
  /** Seconds watched into the episode. */
  time?: number;
  updatedAt: number;
};

const KEY = "syriaflix:progress";
const LIMIT = 20;

export function readProgress(): ProgressEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ProgressEntry[]) : [];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function saveProgress(entry: Omit<ProgressEntry, "updatedAt">): void {
  try {
    const rest = readProgress().filter((e) => e.slug !== entry.slug);
    const next = [{ ...entry, updatedAt: Date.now() }, ...rest].slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, blocked) — progress is a convenience only.
  }
}

/** Where to resume this exact episode, or 0 to start from the beginning. */
export function resumeTime(slug: string, season: number, episode: number): number {
  const e = readProgress().find((x) => x.slug === slug);
  return e && e.season === season && e.episode === episode ? (e.time ?? 0) : 0;
}
