"use client";

import { useRouter, useSearchParams } from "next/navigation";
import ShowCard from "./ShowCard";
import type { ShowSummary } from "@/lib/catalog";
import { format, type Messages } from "@/lib/i18n";
import { GENRES, type Genre, type Locale } from "@/lib/types";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${active ? "bg-white text-black" : "bg-surface-2 hover:bg-white/20"}`}
    >
      {children}
    </button>
  );
}

/** Genre + decade filters, kept in the URL (?genre=&decade=) so results are shareable. */
export default function BrowseClient({
  shows,
  decades,
  locale,
  messages: t,
}: {
  shows: ShowSummary[];
  decades: number[];
  locale: Locale;
  messages: Messages;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const genreParam = params.get("genre");
  const genre = GENRES.includes(genreParam as Genre) ? (genreParam as Genre) : null;
  const decade = Number(params.get("decade")) || null;

  function update(next: { genre?: Genre | null; decade?: number | null }) {
    const q = new URLSearchParams();
    const g = next.genre === undefined ? genre : next.genre;
    const d = next.decade === undefined ? decade : next.decade;
    if (g) q.set("genre", g);
    if (d) q.set("decade", String(d));
    router.replace(q.size ? `?${q}` : "?", { scroll: false });
  }

  const results = shows.filter(
    (s) => (!genre || s.genres.includes(genre)) && (!decade || Math.floor(s.year / 10) * 10 === decade),
  );

  return (
    <>
      <div className="space-y-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto" aria-label={t.genre}>
          <Chip active={!genre} onClick={() => update({ genre: null })}>
            {t.all}
          </Chip>
          {GENRES.map((g) => (
            <Chip key={g} active={genre === g} onClick={() => update({ genre: g })}>
              {t.genres[g]}
            </Chip>
          ))}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto" aria-label={t.decade}>
          <Chip active={!decade} onClick={() => update({ decade: null })}>
            {t.all}
          </Chip>
          {decades.map((d) => (
            <Chip key={d} active={decade === d} onClick={() => update({ decade: d })}>
              {format(t.decadeLabel, { decade: d })}
            </Chip>
          ))}
        </div>
      </div>
      {results.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((s) => (
            <ShowCard key={s.slug} show={s} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-muted">{t.noResults}</p>
      )}
    </>
  );
}
