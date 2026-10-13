"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import ShowCard from "./ShowCard";
import type { ShowSummary } from "@/lib/catalog";
import type { Messages } from "@/lib/i18n";
import { searchShows } from "@/lib/search";
import type { Locale } from "@/lib/types";

export default function SearchClient({
  shows,
  locale,
  messages: t,
}: {
  shows: ShowSummary[];
  locale: Locale;
  messages: Messages;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const results = searchShows(shows, query);

  return (
    <>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          router.replace(e.target.value ? `?q=${encodeURIComponent(e.target.value)}` : "?", { scroll: false });
        }}
        placeholder={t.searchPlaceholder}
        aria-label={t.search}
        className="w-full rounded-md border border-white/20 bg-surface px-4 py-3 text-lg outline-none placeholder:text-muted focus:border-white"
      />
      {query.trim() &&
        (results.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((s) => (
              <ShowCard key={s.slug} show={s} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-muted">{t.noResults}</p>
        ))}
    </>
  );
}
