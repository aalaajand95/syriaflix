import type { ShowSummary } from "./catalog";

/** Strips Arabic diacritics/tatweel and unifies alef, ya and ta-marbuta forms so searches match loosely. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`-]/g, "")
    .trim();
}

export function searchShows(shows: ShowSummary[], query: string): ShowSummary[] {
  const q = normalize(query);
  if (!q) return [];
  return shows.filter((s) =>
    [s.title.ar, s.title.en, ...s.cast.flatMap((c) => [c.ar, c.en])].some((field) => normalize(field).includes(q)),
  );
}
