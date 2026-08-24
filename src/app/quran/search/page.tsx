import type { Metadata } from "next";
import Link from "next/link";

import { QuranSearch } from "@/components/quran/QuranSearch";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Quran translations and jump straight to the ayah.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <nav className="mb-8">
        <Link
          href="/quran"
          className="flex w-fit items-center gap-2 text-sm text-ink-dim transition-colors duration-300 hover:text-gold-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All surahs
        </Link>
      </nav>

      <header className="mb-10 text-center">
        <h1 className="font-kufi text-3xl text-ink">Search</h1>
        <p dir="rtl" lang="ar" className="font-quran mt-2 text-xl text-gold-ink">
          بحث
        </p>
      </header>

      <QuranSearch />
    </div>
  );
}
