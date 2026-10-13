/** "Continue watching" entries kept in this browser only. */
export type ProgressEntry = { slug: string; season: number; episode: number; updatedAt: number };

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
