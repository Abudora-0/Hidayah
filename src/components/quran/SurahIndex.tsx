"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import type { SurahSummary } from "@/lib/quran";

type Filter = "all" | "Meccan" | "Medinan";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Meccan", label: "Meccan" },
  { key: "Medinan", label: "Medinan" },
];

export function SurahIndex({ surahs }: { surahs: SurahSummary[] }) {
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

  return (
    <div>
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
                  ? "bg-gold text-surface-0"
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
              className="hd-fade-up"
              style={{ animationDelay: `${Math.min(index, 18) * 28}ms` }}
            >
              <Link
                href={`/quran/${surah.number}`}
                className="hd-card group flex h-full items-center gap-4 p-4"
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
                  className="font-quran shrink-0 text-lg text-gold-soft transition-transform duration-300 group-hover:scale-105"
                >
                  {surah.arabicName.replace(/^سُورَةُ\s*/, "")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
