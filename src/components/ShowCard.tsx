import Link from "next/link";
import Poster from "./Poster";
import type { ShowSummary } from "@/lib/catalog";
import { getMessages, href, years } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export default function ShowCard({
  show,
  locale,
  subtitle,
  watchHref,
}: {
  show: ShowSummary;
  locale: Locale;
  subtitle?: string;
  /** Overrides the default link to the show page (e.g. resume an episode). */
  watchHref?: string;
}) {
  const t = getMessages(locale);
  return (
    <Link
      href={watchHref ?? href(locale, `shows/${show.slug}`)}
      className="group block w-full overflow-hidden rounded-md bg-surface transition duration-200 hover:z-10 hover:scale-105 hover:shadow-2xl hover:shadow-black/60"
    >
      <div className="relative">
        <Poster slug={show.slug} title={show.title} image={show.poster} />
        {!show.watchable && (
          <span className="absolute end-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-gold">
            {t.comingSoon}
          </span>
        )}
      </div>
      <div className="px-3 py-2">
        <p className="truncate font-bold">{show.title[locale]}</p>
        <p className="truncate text-xs text-muted">{subtitle ?? years(show)}</p>
      </div>
    </Link>
  );
}
