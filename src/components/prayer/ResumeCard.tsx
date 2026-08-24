"use client";

import Link from "next/link";

import { useReading } from "@/lib/reading";

/**
 * Picks reading back up where it was left.
 *
 * The position is recorded as the reader scrolls, so this is the last ayah
 * that was actually on screen rather than the last one opened.
 */
export function ResumeCard({ className }: { className?: string }) {
  const { lastRead } = useReading();

  if (!lastRead) return null;

  const href =
    lastRead.kind === "juz"
      ? `/quran/juz/${lastRead.number}#ayah-${lastRead.ayah}`
      : `/quran/${lastRead.number}#ayah-${lastRead.ayah}`;

  return (
    <Link
      href={href}
      className={`hd-card hd-lift group flex items-center gap-4 p-5 ${className ?? ""}`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-gold transition-colors duration-300 group-hover:border-gold">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 15.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[0.62rem] uppercase tracking-[0.24em] text-ink-faint">
          Continue reading
        </span>
        <span className="mt-1 block truncate font-kufi text-base text-ink">
          {lastRead.label}
        </span>
      </span>

      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-1"
        fill="none"
        aria-hidden="true"
      >
        <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
