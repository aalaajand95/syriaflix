import fs from "node:fs";
import path from "node:path";
import { episodeCount } from "./episodes";
import type { Genre, Show } from "./types";

export { episodeCount, firstEpisode } from "./episodes";

const DATA_DIR = path.join(process.cwd(), "src", "data", "shows");

let cache: Show[] | null = null;

/** Reads every show JSON file at build time, sorted newest first. */
export function getShows(): Show[] {
  if (cache) return cache;
  cache = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8")) as Show)
    .sort((a, b) => b.year - a.year);
  return cache;
}

export function getShow(slug: string): Show | undefined {
  return getShows().find((s) => s.slug === slug);
}

export function isWatchable(show: Show): boolean {
  return episodeCount(show) > 0;
}

export function byGenre(genre: Genre): Show[] {
  return getShows().filter((s) => s.genres.includes(genre));
}

export function decadeOf(show: Show): number {
  return Math.floor(show.year / 10) * 10;
}

export function decades(): number[] {
  return [...new Set(getShows().map(decadeOf))].sort((a, b) => b - a);
}

/** Poster image for a show, if one exists (explicit poster, else first episode thumbnail). */
export function posterUrl(show: Show): string | undefined {
  if (show.poster) return show.poster;
  const first = show.seasons.find((s) => s.episodes.length)?.episodes[0];
  return first ? `https://i.ytimg.com/vi/${first.youtubeId}/hqdefault.jpg` : undefined;
}

/** Slim, serialisable version of a show for client components (search / browse). */
export type ShowSummary = Pick<Show, "slug" | "title" | "year" | "endYear" | "genres" | "cast"> & {
  poster?: string;
  watchable: boolean;
};

export function toSummary(show: Show): ShowSummary {
  return {
    slug: show.slug,
    title: show.title,
    year: show.year,
    endYear: show.endYear,
    genres: show.genres,
    cast: show.cast,
    poster: posterUrl(show),
    watchable: isWatchable(show),
  };
}
