import type { Metadata } from "next";

import { GirihMark } from "@/components/ornament/GirihMark";
import { Lattice } from "@/components/ornament/Lattice";
import { SurahIndex } from "@/components/quran/SurahIndex";
import { fetchSurahList } from "@/lib/quran";

export const metadata: Metadata = {
  title: "Quran",
  description:
    "All 114 surahs of the Holy Quran in Arabic with English and Urdu translation, tafsir and recitation.",
};

export default async function QuranPage() {
  const surahs = await fetchSurahList();

  return (
    <div className="relative">
      <Lattice className="text-gold" scale={110} opacity={0.045} />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex flex-col items-center text-center">
          <GirihMark size={44} className="text-gold" animated />
          <h1 className="font-kufi mt-5 text-3xl text-ink">The Holy Quran</h1>
          <p
            dir="rtl"
            lang="ar"
            className="font-quran mt-2 text-2xl text-gold-soft"
          >
            القرآن الكريم
          </p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-dim">
            114 surahs in the Uthmani script, with translation in English and
            Urdu, tafsir, and recitation from seven reciters.
          </p>
        </header>

        <div className="mt-12">
          <SurahIndex surahs={surahs} />
        </div>
      </div>
    </div>
  );
}
