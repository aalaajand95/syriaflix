import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Header from "@/components/Header";
import { dir, getMessages } from "@/lib/i18n";
import { isLocale, LOCALES } from "@/lib/types";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return {
    title: { default: `${t.siteName} — ${t.tagline}`, template: `%s · ${t.siteName}` },
    description: t.tagline,
    alternates: { languages: { ar: "/ar/", en: "/en/" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);

  return (
    <html lang={locale} dir={dir(locale)} className={cairo.variable}>
      <body className="min-h-screen">
        <Header locale={locale} />
        <main>{children}</main>
        <footer className="mt-16 border-t border-white/10 px-4 py-8 text-center text-sm text-muted sm:px-10">
          <p className="mb-2 font-bold text-fg">{t.siteName}</p>
          <p className="mx-auto max-w-2xl">{t.disclaimer}</p>
        </footer>
      </body>
    </html>
  );
}
