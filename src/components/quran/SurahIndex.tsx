"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import { JUZ_NAMES, JUZ_STARTS } from "@/data/juz";
import type { SurahSummary } from "@/lib/quran";

type Filter = "all" | "Meccan" | "Medinan";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Meccan", label: "Meccan" },
  { key: "Medinan", label: "Medinan" },
];

type View = "surah" | "juz";

export function SurahIndex({
  surahs,
  initialView = "surah",
}: {
  surahs: SurahSummary[];
  initialView?: View;
}) {
  const [view, setView] = useState<View>(initialView);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return surahs.filter((surah) => {
      if (filter !== "all" && surah.revelation !== filter) return false;
      if (!q) return true;
      return (
        surah.englishName.toLowerCase().includes(q) ||
        surah.translatedName.toLowerCase().includes(q) ||
        surah.arabicName.includes(query.trim()) ||
        String(surah.number) === q
      );
    });
  }, [surahs, query, filter]);

  const byNumber = useMemo(() => {
    const map = new Map<number, SurahSummary>();
    for (const surah of surahs) map.set(surah.number, surah);
    return map;
  }, [surahs]);

  return (
    <div>
      <div
        className="mb-6 flex justify-center gap-1 rounded-full border border-line p-1"
        role="group"
        aria-label="Browse by"
      >
        {(
          [
            { key: "surah", label: "By surah" },
            { key: "juz", label: "By para" },
          ] as { key: View; label: string }[]
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setView(option.key)}
            aria-pressed={view === option.key}
            className={`flex-1 rounded-full px-5 py-2 text-sm transition-all duration-300 ${
              view === option.key
                ? "bg-gold text-on-gold"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === "juz" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {JUZ_STARTS.map((entry, index) => {
            const surah = byNumber.get(entry.surah);
            return (
              <li
                key={entry.juz}
                className="hd-reveal"
                style={{ animationDelay: `${Math.min(index, 18) * 26}ms` }}
              >
                <Link
                  href={`/quran/juz/${entry.juz}`}
                  className="hd-card hd-lift group flex h-full items-center gap-4 p-4"
                >
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center">
                    <svg
                      viewBox="0 0 48 48"
                      className="absolute inset-0 text-line-strong transition-colors duration-300 group-hover:text-gold"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect x="11" y="11" width="26" height="26" stroke="currentColor" strokeWidth="1.4" />
                      <rect x="11" y="11" width="26" height="26" transform="rotate(45 24 24)" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    <span className="relative font-kufi text-sm tabular-nums text-ink-dim transition-colors duration-300 group-hover:text-gold-ink">
                      {entry.juz}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-kufi text-base text-ink">
                      Para {entry.juz}
                    </span>
                    <span className="block truncate text-xs text-ink-faint">
                      Begins at {surah?.englishName ?? `Surah ${entry.surah}`}{" "}
                      {entry.surah}:{entry.ayah}
                    </span>
                  </span>

                  <span
                    dir="rtl"
                    lang="ar"
                    className="font-quran shrink-0 text-base text-gold-ink transition-transform duration-300 group-hover:scale-105"
                  >
                    {JUZ_NAMES[index]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
      <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label className="sr-only" htmlFor="surah-search">
            Search the surahs
          </label>
          <input
            id="surah-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, meaning or number"
            autoComplete="off"
          />
        </div>

        <div
          className="flex shrink-0 gap-1 rounded-full border border-line p-1"
          role="group"
          aria-label="Filter by place of revelation"
        >
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              aria-pressed={filter === option.key}
              className={`rounded-full px-4 py-1.5 text-xs transition-all duration-300 ${
                filter === option.key
                  ? "bg-gold text-on-gold"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <GirihRule className="my-8" />

      <p className="mb-5 text-xs uppercase tracking-[0.22em] text-ink-faint">
        {results.length} {results.length === 1 ? "surah" : "surahs"}
      </p>

      {results.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-dim">
          Nothing matches that search.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((surah, index) => (
            <li
              key={surah.number}
              className="hd-reveal"
              style={{ animationDelay: `${Math.min(index, 18) * 28}ms` }}
            >
              <Link
                href={`/quran/${surah.number}`}
                className="hd-card hd-lift group flex h-full items-center gap-4 p-4"
              >
                <span className="relative grid h-11 w-11 shrink-0 place-items-center">
                  <svg
                    viewBox="0 0 48 48"
                    className="absolute inset-0 text-line-strong transition-colors duration-300 group-hover:text-gold"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="11"
                      y="11"
                      width="26"
                      height="26"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <rect
                      x="11"
                      y="11"
                      width="26"
                      height="26"
                      transform="rotate(45 24 24)"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                  <span className="relative font-kufi text-sm tabular-nums text-ink-dim transition-colors duration-300 group-hover:text-gold-ink">
                    {surah.number}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-kufi text-base text-ink">
                    {surah.englishName}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    {surah.translatedName}
                  </span>
                  <span className="mt-1 block text-[0.68rem] text-ink-faint">
                    {surah.ayahCount} ayahs, {surah.revelation}
                  </span>
                </span>

                <span
                  dir="rtl"
                  lang="ar"
                  className="font-quran shrink-0 text-lg text-gold-ink transition-transform duration-300 group-hover:scale-105"
                >
                  {surah.arabicName.replace(/^سُورَةُ\s*/, "")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      </>
      )}
    </div>
  );
}
