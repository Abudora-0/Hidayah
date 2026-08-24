"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import { Select } from "@/components/ui/Select";
import { ENGLISH_EDITIONS, URDU_EDITIONS } from "@/data/editions";
import { updateSettings, useSettings } from "@/lib/settings";

type Match = {
  number: number;
  text: string;
  numberInSurah: number;
  surah: { number: number; englishName: string; name: string };
};

type Result = {
  query: string;
  edition: string;
  count: number;
  matches: Match[];
  failed: boolean;
};

/**
 * Searching the Quran.
 *
 * This defers to the API's own search rather than building an index in the
 * browser. A full translation is about 1.6 MB, which is a lot to ship to
 * someone who wants to look up one word.
 */
export function QuranSearch() {
  const settings = useSettings();
  const [query, setQuery] = useState("");
  const [edition, setEdition] = useState(settings.quran.englishEdition);
  const [result, setResult] = useState<Result | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;

    // Debounced, so typing does not fire a request per keystroke.
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/search/${encodeURIComponent(trimmed)}/all/${edition}`,
        );

        // The API answers 404 when a search simply has no matches, which is
        // an empty result rather than a failure.
        if (res.status === 404) {
          setResult({ query: trimmed, edition, count: 0, matches: [], failed: false });
          return;
        }
        if (!res.ok) throw new Error(String(res.status));

        const body = (await res.json()) as {
          data: { count: number; matches: Match[] };
        };
        setResult({
          query: trimmed,
          edition,
          count: body.data.count,
          matches: body.data.matches ?? [],
          failed: false,
        });
      } catch {
        setResult({ query: trimmed, edition, count: 0, matches: [], failed: true });
      } finally {
        setSearching(false);
      }
    }, 420);

    return () => window.clearTimeout(timer);
  }, [trimmed, edition]);

  const stale = result?.query !== trimmed || result?.edition !== edition;
  const showing = result && !stale ? result : null;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="sr-only" htmlFor="quran-search">
            Search the Quran
          </label>
          <input
            id="quran-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the translation, for example mercy"
            autoComplete="off"
            autoFocus
          />
        </div>

        <Select
          className="sm:w-64"
          value={edition}
          onChange={(id) => {
            setEdition(id);
            updateSettings((current) => ({
              ...current,
              quran: { ...current.quran, englishEdition: id },
            }));
          }}
          label="Translation to search"
          options={[...ENGLISH_EDITIONS, ...URDU_EDITIONS].map((e) => ({
            value: e.id,
            label: e.name,
            note: e.note,
            rtl: e.id.startsWith("ur."),
          }))}
        />
      </div>

      <GirihRule className="my-8" />

      {trimmed.length < 2 ? (
        <p className="py-12 text-center text-sm text-ink-dim">
          Type at least two letters to search.
        </p>
      ) : searching || stale ? (
        <div className="flex flex-col gap-3" aria-label="Searching">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="hd-card p-5">
              <div className="h-3 w-24 animate-pulse rounded-full bg-surface-2" />
              <div className="mt-3 h-3.5 animate-pulse rounded-full bg-surface-2" />
              <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded-full bg-surface-2" />
            </div>
          ))}
        </div>
      ) : showing?.failed ? (
        <p className="py-12 text-center text-sm text-ink-dim">
          The search could not be run. Check your connection and try again.
        </p>
      ) : showing && showing.count === 0 ? (
        <p className="py-12 text-center text-sm text-ink-dim">
          Nothing found for {trimmed}. Try a different word or another
          translation, since wording differs between them.
        </p>
      ) : showing ? (
        <>
          <p className="mb-5 text-xs uppercase tracking-[0.22em] text-ink-faint">
            {showing.count} {showing.count === 1 ? "result" : "results"}
            {showing.matches.length < showing.count
              ? `, showing the first ${showing.matches.length}`
              : ""}
          </p>

          <ul className="flex flex-col gap-3">
            {showing.matches.map((match) => (
              <li key={match.number} className="hd-reveal">
                <Link
                  href={`/quran/${match.surah.number}#ayah-${match.numberInSurah}`}
                  className="hd-card hd-lift block p-5"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-kufi text-sm text-gold-ink">
                      {match.surah.englishName} {match.surah.number}:
                      {match.numberInSurah}
                    </span>
                    <span
                      dir="rtl"
                      lang="ar"
                      className="font-quran shrink-0 text-sm text-ink-faint"
                    >
                      {match.surah.name.replace(/^سُورَةُ\s*/, "")}
                    </span>
                  </span>
                  <span
                    dir={edition.startsWith("ur.") ? "rtl" : undefined}
                    className={`mt-2 block text-[0.95rem] leading-relaxed text-ink-dim ${
                      edition.startsWith("ur.") ? "font-urdu" : ""
                    }`}
                  >
                    {match.text}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
