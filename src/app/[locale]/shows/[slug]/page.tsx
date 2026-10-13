import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Poster from "@/components/Poster";
import SeasonEpisodes from "@/components/SeasonEpisodes";
import { episodeCount, firstEpisode, getShow, getShows, posterUrl } from "@/lib/catalog";
import { getMessages, href, watchHref, years } from "@/lib/i18n";
import { LOCALES, type Locale, type Localized } from "@/lib/types";

type Params = { locale: Locale; slug: string };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => getShows().map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const show = getShow(slug);
  if (!show) return {};
  return {
    title: show.title[locale],
    description: show.synopsis[locale],
    alternates: { languages: { ar: `/ar/shows/${slug}/`, en: `/en/shows/${slug}/` } },
  };
}

export default async function ShowPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const show = getShow(slug);
  if (!show) notFound();
  const t = getMessages(locale);
  const first = firstEpisode(show);
  const youtubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(show.youtubeSearch)}`;

  const credit = (label: string, people: Localized[]) =>
    people.length > 0 && (
      <p>
        <span className="text-muted">{label}: </span>
        {people.map((p) => p[locale]).join(locale === "ar" ? "، " : ", ")}
      </p>
    );

  return (
    <article className="px-4 pt-6 sm:px-10">
      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Poster slug={show.slug} title={show.title} image={posterUrl(show)} className="rounded-lg" />
        <div>
          <h1 className="text-3xl font-black sm:text-5xl">{show.title[locale]}</h1>
          <p className="mt-1 text-muted" lang={locale === "ar" ? "en" : "ar"}>
            {show.title[locale === "ar" ? "en" : "ar"]}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span>{years(show)}</span>
            {episodeCount(show) > 0 && (
              <span className="text-muted">
                · {episodeCount(show)} {t.episodes}
              </span>
            )}
            {show.genres.map((g) => (
              <Link
                key={g}
                href={`${href(locale, "browse")}?genre=${g}`}
                className="rounded-full bg-surface-2 px-3 py-0.5 hover:bg-white/20"
              >
                {t.genres[g]}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-lg leading-relaxed">{show.synopsis[locale]}</p>
          <div className="mt-4 space-y-1 text-sm">
            {credit(t.cast, show.cast)}
            {credit(t.director, show.director ? [show.director] : [])}
            {credit(t.writer, show.writer ? [show.writer] : [])}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {first ? (
              <Link
                href={watchHref(locale, show.slug, first.season.number, first.episode)}
                className="rounded bg-white px-6 py-2 font-bold text-black hover:bg-white/80"
              >
                ▶ {t.watchNow}
              </Link>
            ) : (
              <span className="rounded bg-surface-2 px-4 py-2 text-gold">{t.comingSoon}</span>
            )}
            <a
              href={youtubeSearch}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-white/15 px-6 py-2 font-bold hover:bg-white/25"
            >
              {t.findOnYouTube} ↗
            </a>
          </div>
          {!first && <p className="mt-3 text-sm text-muted">{t.comingSoonNote}</p>}
        </div>
      </div>

      {first && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">{t.episodes}</h2>
          <SeasonEpisodes
            show={show}
            locale={locale}
            labels={{ season: t.season, episode: t.episode }}
          />
        </section>
      )}
    </article>
  );
}
