"use client";

import Link from "next/link";

import { Wordmark } from "@/components/ornament/Wordmark";
import { useLanguage } from "@/lib/i18n";

const BROWSE = [
  { label: "Prayer times", href: "/" },
  { label: "Quran", href: "/quran" },
  { label: "Search", href: "/quran/search" },
  { label: "Calendar", href: "/calendar" },
  { label: "Tasbih", href: "/tasbih" },
  { label: "Settings", href: "/settings" },
];

const SOURCES = [
  { label: "Aladhan", note: "Prayer times", href: "https://aladhan.com" },
  { label: "Al Quran Cloud", note: "Quran text", href: "https://alquran.cloud" },
  { label: "Quran.com", note: "Tafsir", href: "https://quran.com" },
  { label: "Islamic Network", note: "Recitation", href: "https://islamic.network" },
];

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="mt-16 border-t border-line bg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {/* Three columns rather than one centred stack. The stack left most of
            the width empty and pushed the footer far taller than its content
            warranted. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Wordmark size={17} animated={false} />
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-ink-faint">
              {t('footer.note')}
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-[0.6rem] uppercase tracking-[0.26em] text-ink-faint">
              {t('footer.browse')}
            </h2>
            <ul className="mt-3.5 flex flex-col gap-2">
              {BROWSE.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-ink-dim transition-colors duration-300 hover:text-gold-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.6rem] uppercase tracking-[0.26em] text-ink-faint">
              {t('footer.builtOn')}
            </h2>
            <ul className="mt-3.5 flex flex-col gap-2">
              {SOURCES.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-baseline gap-2 text-sm text-ink-dim transition-colors duration-300 hover:text-gold-ink"
                  >
                    {source.label}
                    <span className="text-[0.66rem] text-ink-faint">
                      {source.note}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hd-rule mt-8" />

        <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-ink-faint">
            {t('footer.licence')}
          </p>
          <p
            dir="rtl"
            lang="ar"
            className="font-quran text-sm text-ink-faint"
          >
            رَبِّ زِدْنِي عِلْمًا
          </p>
        </div>
      </div>
    </footer>
  );
}
