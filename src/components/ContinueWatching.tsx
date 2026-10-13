"use client";

import { useEffect, useState } from "react";
import ShowCard from "./ShowCard";
import ShowRow, { RowItem } from "./ShowRow";
import type { ShowSummary } from "@/lib/catalog";
import { getMessages, watchHref } from "@/lib/i18n";
import { readProgress, type ProgressEntry } from "@/lib/progress";
import type { Locale } from "@/lib/types";

export default function ContinueWatching({ shows, locale }: { shows: ShowSummary[]; locale: Locale }) {
  const t = getMessages(locale);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  useEffect(() => setEntries(readProgress()), []);

  const items = entries.flatMap((e) => {
    const show = shows.find((s) => s.slug === e.slug);
    return show ? [{ show, e }] : [];
  });
  if (!items.length) return null;

  return (
    <ShowRow title={t.continueWatching} labels={{ start: t.scrollStart, end: t.scrollEnd }}>
      {items.map(({ show, e }) => (
        <RowItem key={show.slug}>
          <ShowCard
            show={show}
            locale={locale}
            subtitle={`${t.season} ${e.season} · ${t.episode} ${e.episode}`}
            watchHref={watchHref(locale, show.slug, e.season, e.episode)}
          />
        </RowItem>
      ))}
    </ShowRow>
  );
}
