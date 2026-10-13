import type { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";
import { getShows, toSummary } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getMessages(locale).search, robots: { index: false } };
}

export default async function SearchPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  return (
    <div className="px-4 pt-6 sm:px-10">
      <h1 className="mb-6 text-3xl font-black">{t.search}</h1>
      <Suspense>
        <SearchClient shows={getShows().map(toSummary)} locale={locale} messages={t} />
      </Suspense>
    </div>
  );
}
