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

export type Episode = {
  number: number;
  youtubeId: string;
  title?: Localized;
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
  /** Used for the "Find on YouTube" link while a show has no imported episodes. */
  youtubeSearch: string;
  featured?: boolean;
  seasons: Season[];
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
