import type { Metadata } from "next";

import { HijriCalendar } from "@/components/calendar/HijriCalendar";
import { Wordmark } from "@/components/ornament/Wordmark";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "The Hijri calendar with Ramadan, both Eids, Ashura, Laylat al Qadr and the other occasions of the Islamic year.",
};

export default function CalendarPage() {
  return (
    <div className="relative">

      <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex flex-col items-center text-center">
          <Wordmark layout="stacked" size={30} />
          <h1 className="font-kufi mt-5 text-3xl text-ink">Islamic calendar</h1>
          <p dir="rtl" lang="ar" className="font-quran mt-2 text-2xl text-gold-ink">
            التقويم الهجري
          </p>
        </header>

        <div className="mt-12">
          <HijriCalendar />
        </div>
      </div>
    </div>
  );
}
