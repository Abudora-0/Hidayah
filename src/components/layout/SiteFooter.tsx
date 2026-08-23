import Link from "next/link";

import { GirihRule } from "@/components/ornament/GirihRule";
import { GirihMark } from "@/components/ornament/GirihMark";

const SOURCES = [
  { label: "Prayer times", href: "https://aladhan.com" },
  { label: "Quran text", href: "https://alquran.cloud" },
  { label: "Tafsir", href: "https://quran.com" },
  { label: "Recitation", href: "https://islamic.network" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <GirihRule className="mb-10" />

        <div className="flex flex-col items-center gap-8 text-center">
          <GirihMark size={38} className="text-gold hd-spin-slow" />

          <p className="max-w-md text-sm leading-relaxed text-ink-dim">
            Prayer times are calculated locally on your device. Occasion dates
            follow the Umm al Qura calendar and may differ from your local moon
            sighting by a day.
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {SOURCES.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-ink-faint underline-offset-4 transition-colors duration-300 hover:text-gold-ink hover:underline"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-faint">
            <Link
              href="/settings"
              className="transition-colors duration-300 hover:text-gold-ink"
            >
              Settings
            </Link>
            <span aria-hidden="true">&middot;</span>
            <span>Released under the MIT licence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
