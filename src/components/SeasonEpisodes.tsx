"use client";

import Link from "next/link";
import Poster from "./Poster";
import { useState } from "react";
import { episodeThumbnail } from "@/lib/episodes";
import { watchHref } from "@/lib/i18n";
import type { Locale, Show } from "@/lib/types";

/** Season tabs with the selected season's episode list. */
export default function SeasonEpisodes({
  show,
  locale,
  labels,
  current,
}: {
  show: Show;
  locale: Locale;
  labels: { season: string; episode: string };
  current?: { season: number; episode: number };
}) {
  const seasons = show.seasons.filter((s) => s.episodes.length);
  const [selected, setSelected] = useState(current?.season ?? seasons[0]?.number);
  const season = seasons.find((s) => s.number === selected) ?? seasons[0];
  if (!season) return null;

  return (
    <div>
      {seasons.length > 1 && (
        <div role="tablist" className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {seasons.map((s) => (
            <button
              key={s.number}
              type="button"
              role="tab"
              aria-selected={s.number === season.number}
              onClick={() => setSelected(s.number)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${
                s.number === season.number ? "bg-white text-black" : "bg-surface-2 hover:bg-white/20"
              }`}
            >
              {labels.season} {s.number}
            </button>
          ))}
        </div>
      )}
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {season.episodes.map((e) => {
          const active = current?.season === season.number && current.episode === e.number;
          return (
            <li key={e.number}>
              <Link
                href={watchHref(locale, show.slug, season.number, e.number)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md p-2 ${
                  active ? "bg-accent/30 ring-1 ring-accent" : "bg-surface hover:bg-surface-2"
                }`}
              >
                <div className="w-28 shrink-0 overflow-hidden rounded">
                  <Poster
                    slug={`${show.slug}-${season.number}-${e.number}`}
                    title={show.title}
                    image={episodeThumbnail(e)}
                    compact
                  />
                </div>
                <span className="min-w-0 text-sm">
                  <span className="block font-bold">
                    {labels.episode} {e.number}
                  </span>
                  {e.title && <span className="line-clamp-2 text-muted">{e.title[locale]}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
