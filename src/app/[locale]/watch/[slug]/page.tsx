import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import WatchClient from "@/components/WatchClient";
import { getShow, getShows } from "@/lib/catalog";
import { getMessages } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/types";

type Params = { locale: Locale; slug: string };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => getShows().map((s) => ({ locale, slug: s.slug })));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const show = getShow(slug);
  return show ? { title: show.title[locale], robots: { index: false } } : {};
}

/** One static page per show; the season/episode come from ?s=&e= so the build stays small. */
export default async function WatchPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const show = getShow(slug);
  if (!show) notFound();
  return (
    <Suspense>
      <WatchClient show={show} locale={locale} messages={getMessages(locale)} />
    </Suspense>
  );
}
