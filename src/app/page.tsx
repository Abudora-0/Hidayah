import { GirihRule } from "@/components/ornament/GirihRule";
import { Lattice } from "@/components/ornament/Lattice";
import { Wordmark } from "@/components/ornament/Wordmark";
import { AyahMarker } from "@/components/ornament/AyahMarker";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <Lattice className="text-gold" scale={92} opacity={0.06} />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 sm:px-6">
        <Wordmark layout="stacked" size={40} animated />

        <GirihRule className="mt-12 w-full max-w-sm" />

        <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
          <div className="hd-card p-6">
            <AyahMarker number={1} active />
            <p className="mt-4 text-sm text-ink-dim">Design system check</p>
          </div>
          <div className="hd-card p-6">
            <input type="search" placeholder="Themed input" />
            <input type="range" className="mt-4" defaultValue={62} />
          </div>
          <div className="hd-card p-6">
            <p dir="rtl" lang="ar" className="font-quran text-2xl text-gold-soft">
              قُلْ هُوَ ٱللَّهُ أَحَدٌ
            </p>
            <p dir="rtl" lang="ur" className="font-urdu mt-3 text-sm text-ink-dim">
              آپ فرما دیجئے وہ اللہ ہے جو یکتا ہے
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
