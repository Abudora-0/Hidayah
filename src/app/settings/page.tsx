import type { Metadata } from "next";

import { Wordmark } from "@/components/ornament/Wordmark";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Choose your calculation authority and madhab, set up the prayer alarm, and pick your translations and reciter.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 flex flex-col items-center text-center">
        <Wordmark layout="stacked" size={28} />
        <h1 className="font-kufi mt-5 text-3xl text-ink">Settings</h1>
        <p dir="rtl" lang="ar" className="font-quran mt-2 text-xl text-gold-ink">
          الإعدادات
        </p>
      </header>

      <SettingsPanel />
    </div>
  );
}
