export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export type Localized = { ar: string; en: string };

export const GENRES = [
  "drama",
  "comedy",
  "shami",
  "historical",
  "bedouin",
  "social",
  "classic",
] as const;
export type Genre = (typeof GENRES)[number];

/** A video SyriaFlix serves itself (e.g. from Bunny Stream, Cloudflare Stream or any CDN). */
export type HostedVideo = {
  /** HLS playlist (.m3u8) or a progressive file (.mp4 / .webm). */
  src: string;
  /** Thumbnail / poster image shown before playback and in episode lists. */
  poster?: string;
  subtitles?: { lang: string; label: string; src: string }[];
};

/** Every episode has exactly one source: a self-hosted `video` or an official `youtubeId`. */
export type Episode = {
  number: number;
  title?: Localized;
  youtubeId?: string;
  video?: HostedVideo;
};

export type Season = {
  number: number;
  year?: number;
  youtubePlaylistId?: string;
  episodes: Episode[];
};

export type Show = {
  slug: string;
  title: Localized;
  synopsis: Localized;
  year: number;
  endYear?: number;
  genres: Genre[];
  director?: Localized;
  writer?: Localized;
  cast: Localized[];
  /** Optional poster URL; otherwise a YouTube thumbnail or a generated card is used. */
  poster?: string;
  featured?: boolean;
  seasons: Season[];
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
