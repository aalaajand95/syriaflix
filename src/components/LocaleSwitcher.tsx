"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { otherLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** Links to the same page (and query) in the other language by swapping the locale prefix. */
export default function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}/`;
  const query = useSearchParams()?.toString();
  const target = otherLocale(locale);
  const swapped = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), `/${target}`);
  return (
    <Link
      href={query ? `${swapped}?${query}` : swapped}
      hrefLang={target}
      lang={target}
      className="rounded border border-white/30 px-3 py-1 text-sm hover:border-white hover:bg-white/10"
    >
      {label}
    </Link>
  );
}
