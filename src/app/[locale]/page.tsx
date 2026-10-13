import Link from "next/link";
import ContinueWatching from "@/components/ContinueWatching";
import Poster from "@/components/Poster";
import ShowCard from "@/components/ShowCard";
import ShowRow, { RowItem } from "@/components/ShowRow";
import { byGenre, firstEpisode, getShows, posterUrl, toSummary } from "@/lib/catalog";
import { getMessages, href, watchHref, years } from "@/lib/i18n";
import { GENRES, type Locale } from "@/lib/types";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const shows = getShows();
  const summaries = shows.map(toSummary);
  const hero = shows.find((s) => s.featured) ?? shows[0];
  const heroFirst = firstEpisode(hero);
  const labels = { start: t.scrollStart, end: t.scrollEnd };

  const row = (title: string, list: typeof shows) =>
    list.length > 0 && (
      <ShowRow key={title} title={title} labels={labels}>
        {list.map((s) => (
          <RowItem key={s.slug}>
            <ShowCard show={toSummary(s)} locale={locale} />
          </RowItem>
        ))}
      </ShowRow>
    );

  return (
    <>
      <section className="relative -mt-16 overflow-hidden">
        <div className="absolute inset-0 opacity-60">
          <Poster slug={hero.slug} title={hero.title} image={posterUrl(hero)} className="h-full blur-[2px]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="absolute inset-0 from-bg/90 to-transparent ltr:bg-gradient-to-r rtl:bg-gradient-to-l" />
        <div className="relative flex min-h-[70vh] max-w-2xl flex-col justify-end px-4 pb-12 pt-32 sm:px-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-gold">{t.featured}</p>
          <h1 className="text-4xl font-black sm:text-6xl">{hero.title[locale]}</h1>
          <p className="mt-2 text-sm text-muted">
            {years(hero)} · {hero.genres.map((g) => t.genres[g]).join(" · ")}
          </p>
          <p className="mt-4 line-clamp-3 text-base text-fg/90 sm:text-lg">{hero.synopsis[locale]}</p>
          <div className="mt-6 flex gap-3">
            {heroFirst && (
              <Link
                href={watchHref(locale, hero.slug, heroFirst.season.number, heroFirst.episode)}
                className="rounded bg-white px-6 py-2 font-bold text-black hover:bg-white/80"
              >
                ▶ {t.watchNow}
              </Link>
            )}
            <Link
              href={href(locale, `shows/${hero.slug}`)}
              className="rounded bg-white/20 px-6 py-2 font-bold hover:bg-white/30"
            >
              {t.moreInfo}
            </Link>
          </div>
        </div>
      </section>

      <ContinueWatching shows={summaries} locale={locale} />
      {row(t.featured, shows.filter((s) => s.featured))}
      {GENRES.map((g) => row(t.genres[g], byGenre(g)))}
      {row(t.allShows, shows)}
    </>
  );
}
