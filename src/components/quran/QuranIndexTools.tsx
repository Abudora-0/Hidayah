"use client";

import Link from "next/link";

import { ResumeCard } from "@/components/prayer/ResumeCard";
import { GirihRule } from "@/components/ornament/GirihRule";
import { useReading } from "@/lib/reading";
import { useLanguage } from "@/lib/i18n";

/**
 * The bar above the surah list: search, where you left off, and anything
 * bookmarked. All client side, since it reads from local storage.
 */
export function QuranIndexTools({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { bookmarks } = useReading();

  return (
    <div className={className}>
      <Link
        href="/quran/search"
        className="hd-card hd-lift group flex items-center gap-3 p-4"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-sm text-ink-dim transition-colors duration-300 group-hover:text-ink">
          {t('quran.searchTranslations')}
        </span>
        <span className="text-xs text-ink-faint">for example mercy</span>
      </Link>

      <ResumeCard className="mt-3" />

      {bookmarks.length > 0 ? (
        <>
          <GirihRule className="my-8" compact />
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-ink-faint">
            {t('quran.bookmarks')}
          </p>
          <ul className="flex flex-wrap gap-2">
            {bookmarks.slice(0, 12).map((bookmark) => (
              <li key={`${bookmark.surah}-${bookmark.ayah}`}>
                <Link
                  href={`/quran/${bookmark.surah}#ayah-${bookmark.ayah}`}
                  className="block rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold-ink"
                >
                  {bookmark.label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
