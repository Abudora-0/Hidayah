"use client";

import { Toggle } from "@/components/ui/Toggle";
import {
  PRAYER_LABELS,
  formatTime,
  type PrayerEntry,
  type PrayerKey,
} from "@/lib/prayer";
import { useLanguage } from "@/lib/i18n";

type PrayerTimelineProps = {
  /** Prayers already marked as prayed today. */
  prayed: PrayerKey[];
  onTogglePrayed: (prayer: PrayerKey) => void;
  entries: PrayerEntry[];
  currentKey: PrayerKey | null;
  nextKey: PrayerKey;
  hour12: boolean;
  alarms: Record<string, boolean>;
  onAlarmChange: (prayer: PrayerKey, enabled: boolean) => void;
};

export function PrayerTimeline({
  prayed,
  onTogglePrayed,
  entries,
  currentKey,
  nextKey,
  hour12,
  alarms,
  onAlarmChange,
}: PrayerTimelineProps) {
  const { t, language } = useLanguage();

  return (
    <ol className="flex flex-col">
      {entries.map((entry, index) => {
        const label = PRAYER_LABELS[entry.key];
        const isCurrent = entry.key === currentKey;
        const isNext = entry.key === nextKey;

        return (
          <li
            key={entry.key}
            className="hd-reveal"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <div
              className={`group relative flex items-center gap-4 rounded-[12px] border px-4 py-3.5 transition-all duration-300 ${
                isNext
                  ? "border-gold bg-surface-2"
                  : isCurrent
                    ? "border-line-strong bg-surface-2/60"
                    : "border-transparent hover:border-line hover:bg-surface-2/40"
              }`}
            >
              {/* The rail running down the left of the whole timeline */}
              <span
                aria-hidden="true"
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                  isNext
                    ? "border-gold text-gold"
                    : isCurrent
                      ? "border-line-strong text-gold-ink"
                      : "border-line text-ink-faint"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                  <rect
                    x="7"
                    y="7"
                    width="10"
                    height="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <rect
                    x="7"
                    y="7"
                    width="10"
                    height="10"
                    transform="rotate(45 12 12)"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2.5">
                  <span
                    className={`font-kufi text-base transition-colors duration-300 ${
                      isNext ? "text-gold-ink" : "text-ink"
                    }`}
                  >
                    {language === "ur" ? label.ur : label.en}
                  </span>
                  <span
                    dir="rtl"
                    lang="ar"
                    className="font-quran text-sm text-ink-faint"
                  >
                    {label.ar}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {isNext ? t("quran.next") : isCurrent ? t("prayer.now") : label.note}
                </p>
              </div>

              <span
                className={`font-kufi shrink-0 text-lg tabular-nums transition-colors duration-300 ${
                  isNext ? "text-gold-ink" : "text-ink-dim"
                }`}
              >
                {formatTime(entry.time, hour12)}
              </span>

              {entry.isPrayer ? (
                <>
                  <button
                    type="button"
                    onClick={() => onTogglePrayed(entry.key)}
                    aria-pressed={prayed.includes(entry.key)}
                    aria-label={t("prayer.markAsPrayed", { name: label.en })}
                    title={
                      prayed.includes(entry.key)
                        ? `${label.en} marked as prayed`
                        : `Mark ${label.en} as prayed`
                    }
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                      prayed.includes(entry.key)
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-line text-ink-faint hover:border-gold hover:text-gold-ink"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path
                        d="m5 13 4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <Toggle
                    size="sm"
                    checked={alarms[entry.key] ?? false}
                    onChange={(next) => onAlarmChange(entry.key, next)}
                    label={t("prayer.alarmFor", { name: label.en })}
                  />
                </>
              ) : (
                <span className="w-[70px]" aria-hidden="true" />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
