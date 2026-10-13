import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import type { Locale, Localized } from "./types";

export type Messages = typeof ar;

const messages: Record<Locale, Messages> = { ar, en };

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

export function pick(value: Localized, locale: Locale): string {
  return value[locale];
}

export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export function years(show: { year: number; endYear?: number }): string {
  return show.endYear ? `${show.year}–${show.endYear}` : String(show.year);
}

/** Link helper so every internal href carries the locale prefix. */
export function href(locale: Locale, path = ""): string {
  return `/${locale}${path ? `/${path.replace(/^\//, "")}` : ""}/`;
}

export function watchHref(locale: Locale, slug: string, season: number, episode: number): string {
  return `${href(locale, `watch/${slug}`)}?s=${season}&e=${episode}`;
}
