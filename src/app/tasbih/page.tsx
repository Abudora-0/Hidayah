import type { Metadata } from "next";

import { TasbihCounter } from "@/components/tasbih/TasbihCounter";

export const metadata: Metadata = {
  title: "Tasbih",
  description:
    "A dhikr counter with the tasbih of Fatimah, istighfar and salawat, counted and kept on your device.",
};

export default function TasbihPage() {
  return (
    <div className="relative">

      <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 text-center">
          <h1 className="font-kufi text-3xl text-ink">Tasbih</h1>
          <p dir="rtl" lang="ar" className="font-quran mt-2 text-2xl text-gold-ink">
            تسبيح
          </p>
        </header>

        <TasbihCounter />
      </div>
    </div>
  );
}
