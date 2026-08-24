"use client";

import { useLanguage } from "@/lib/i18n";

type ReaderPagerProps = {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  /** Described in the label, for example "ayahs 26 to 50". */
  rangeLabel: string;
};

/**
 * Page controls for a long surah or para.
 *
 * Pages are numbered from one for the reader even though they are held from
 * zero, so nothing here leaks the index.
 */
export function ReaderPager({
  page,
  pageCount,
  onPage,
  rangeLabel,
}: ReaderPagerProps) {
  const { t } = useLanguage();

  if (pageCount <= 1) return null;

  const current = page + 1;

  // Show a window around the current page rather than thirty numbers.
  const numbers: (number | "gap")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - current) <= 1) {
      numbers.push(i);
    } else if (numbers[numbers.length - 1] !== "gap") {
      numbers.push("gap");
    }
  }

  function change(next: number) {
    onPage(next);
    // A new page starts at its beginning, not wherever the last one ended.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav
      className="flex flex-col items-center gap-3"
      aria-label={t("reader.pages")}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => change(page - 1)}
          disabled={page === 0}
          aria-label={t("reader.previousPage")}
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold disabled:opacity-35 disabled:hover:border-line disabled:hover:text-ink-dim"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {numbers.map((entry, index) =>
          entry === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-ink-faint">
              &middot;&middot;&middot;
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => change(entry - 1)}
              aria-current={entry === current ? "page" : undefined}
              className={`h-9 min-w-9 rounded-full border px-3 text-sm tabular-nums transition-all duration-300 ${
                entry === current
                  ? "border-gold bg-gold/12 text-gold-ink"
                  : "border-line text-ink-dim hover:border-gold hover:text-gold-ink"
              }`}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => change(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label={t("reader.nextPage")}
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold disabled:opacity-35 disabled:hover:border-line disabled:hover:text-ink-dim"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-ink-faint">{rangeLabel}</p>
    </nav>
  );
}
