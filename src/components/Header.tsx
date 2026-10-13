import Link from "next/link";
import { Suspense } from "react";
import LocaleSwitcher from "./LocaleSwitcher";
import { getMessages, href } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export default function Header({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 bg-gradient-to-b from-black/90 to-black/40 px-4 py-3 backdrop-blur-sm sm:gap-8 sm:px-10">
      <Link href={href(locale)} className="text-xl font-black tracking-tight text-accent sm:text-2xl">
        {t.siteName}
      </Link>
      <nav className="flex gap-4 text-sm text-fg/80 sm:gap-6 sm:text-base">
        <Link href={href(locale)} className="hover:text-fg">
          {t.home}
        </Link>
        <Link href={href(locale, "browse")} className="hover:text-fg">
          {t.browse}
        </Link>
      </nav>
      <div className="ms-auto flex items-center gap-3">
        <Link
          href={href(locale, "search")}
          aria-label={t.search}
          className="rounded-full p-2 text-fg/80 hover:bg-white/10 hover:text-fg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>
        <Suspense>
          <LocaleSwitcher locale={locale} label={t.switchLanguage} />
        </Suspense>
      </div>
    </header>
  );
}
