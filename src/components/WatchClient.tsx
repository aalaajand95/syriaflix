"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SeasonEpisodes from "./SeasonEpisodes";
import VideoPlayer from "./player/VideoPlayer";
import { firstEpisode, getEpisode, nextEpisode, previousEpisode } from "@/lib/episodes";
import { href, watchHref, type Messages } from "@/lib/i18n";
import type { Locale, Show } from "@/lib/types";

export default function WatchClient({ show, locale, messages: t }: { show: Show; locale: Locale; messages: Messages }) {
  const params = useSearchParams();
  const fallback = firstEpisode(show);
  const requested = getEpisode(show, Number(params.get("s")), Number(params.get("e")));
  const current = requested ?? (fallback && getEpisode(show, fallback.season.number, fallback.episode));

  if (!current) {
    return (
      <div className="px-4 py-24 text-center sm:px-10">
        <h1 className="text-3xl font-black">{show.title[locale]}</h1>
        <p className="mt-3 text-muted">{t.comingSoonNote}</p>
        <Link href={href(locale, `shows/${show.slug}`)} className="mt-6 inline-block rounded bg-white/15 px-6 py-2">
          {t.backToShow}
        </Link>
      </div>
    );
  }

  const { season, episode } = current;
  const next = nextEpisode(show, season.number, episode.number);
  const prev = previousEpisode(show, season.number, episode.number);
  const link = (x: { season: number; episode: number }) => watchHref(locale, show.slug, x.season, x.episode);

  return (
    <div className="px-4 pt-4 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <VideoPlayer
          episode={episode}
          locale={locale}
          labels={{ ...t.player, nextEpisode: t.nextEpisode }}
          progress={{ slug: show.slug, season: season.number, episode: episode.number }}
          nextHref={next && link(next)}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="me-auto">
            <Link href={href(locale, `shows/${show.slug}`)} className="text-2xl font-black hover:underline">
              {show.title[locale]}
            </Link>
            <p className="text-muted">
              {t.season} {season.number} · {t.episode} {episode.number}
              {episode.title && ` — ${episode.title[locale]}`}
            </p>
          </div>
          {prev && (
            <Link href={link(prev)} className="rounded bg-white/15 px-4 py-2 hover:bg-white/25">
              {t.previousEpisode}
            </Link>
          )}
          {next && (
            <Link href={link(next)} className="rounded bg-white px-4 py-2 font-bold text-black hover:bg-white/80">
              {t.nextEpisode}
            </Link>
          )}
        </div>
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">{t.episodes}</h2>
          <SeasonEpisodes
            key={`${season.number}-${episode.number}`}
            show={show}
            locale={locale}
            labels={{ season: t.season, episode: t.episode }}
            current={{ season: season.number, episode: episode.number }}
          />
        </section>
      </div>
    </div>
  );
}
