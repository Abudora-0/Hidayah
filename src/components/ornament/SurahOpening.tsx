import { GirihRule } from "./GirihRule";
import { Lattice } from "./Lattice";

type SurahOpeningProps = {
  number: number;
  arabicName: string;
  englishName: string;
  translatedName: string;
  ayahCount: number;
  revelation: string;
  /** At Tawbah is the one surah that does not open with the bismillah. */
  showBismillah?: boolean;
};

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/**
 * The unwan, the illuminated panel that opens a surah in a manuscript. The
 * frame, the lattice ground and the rules are all the same girih geometry as
 * the logo, so the reader meets one visual language throughout.
 */
export function SurahOpening({
  number,
  arabicName,
  englishName,
  translatedName,
  ayahCount,
  revelation,
  showBismillah = true,
}: SurahOpeningProps) {
  return (
    <header className="relative overflow-hidden rounded-[14px] border border-line bg-surface-1 px-6 py-9 text-center sm:px-10 sm:py-11">
      <Lattice className="text-gold" scale={78} opacity={0.07} />

      <div className="relative">
        <p className="font-kufi text-[0.68rem] uppercase tracking-[0.34em] text-ink-faint">
          Surah {number}
        </p>

        <h1
          dir="rtl"
          lang="ar"
          className="font-quran mt-4 text-4xl text-gold-soft sm:text-5xl"
        >
          {arabicName}
        </h1>

        <p className="font-kufi mt-3 text-xl text-ink sm:text-2xl">
          {englishName}
        </p>
        <p className="mt-1 text-sm text-ink-dim">{translatedName}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-dim">
            {ayahCount} ayahs
          </span>
          <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-dim">
            {revelation}
          </span>
        </div>

        {showBismillah ? (
          <>
            <GirihRule className="mx-auto mt-8 max-w-md" compact />
            <p
              dir="rtl"
              lang="ar"
              className="font-quran mt-6 text-2xl text-ink sm:text-3xl"
            >
              {BISMILLAH}
            </p>
          </>
        ) : null}
      </div>
    </header>
  );
}
