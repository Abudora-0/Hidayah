"use client";

import { Select } from "@/components/ui/Select";
import { RECITERS, findReciter } from "@/data/editions";
import { useLanguage } from "@/lib/i18n";
import {
  PLAYBACK_RATES,
  formatSeconds,
  type PlaybackRate,
} from "@/lib/recitation";

type AudioPlayerProps = {
  visible: boolean;
  playing: boolean;
  ayahLabel: string;
  surahName: string;
  reciterId: string;
  duration: number;
  repeat: boolean;
  rate: PlaybackRate;
  atStart: boolean;
  atEnd: boolean;
  /** Written to directly each frame, so the bar moves without re-rendering. */
  seekRef: React.RefObject<HTMLInputElement | null>;
  elapsedRef: React.RefObject<HTMLSpanElement | null>;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (fraction: number) => void;
  onReciter: (id: string) => void;
  onRepeat: (next: boolean) => void;
  onRate: (rate: PlaybackRate) => void;
  onClose: () => void;
};

export function AudioPlayer({
  visible,
  playing,
  ayahLabel,
  surahName,
  reciterId,
  duration,
  repeat,
  rate,
  atStart,
  atEnd,
  seekRef,
  elapsedRef,
  onToggle,
  onPrevious,
  onNext,
  onSeek,
  onReciter,
  onRepeat,
  onRate,
  onClose,
}: AudioPlayerProps) {
  const { t } = useLanguage();

  if (!visible) return null;

  function cycleRate() {
    const at = PLAYBACK_RATES.indexOf(rate);
    onRate(PLAYBACK_RATES[(at + 1) % PLAYBACK_RATES.length]);
  }

  return (
    <div className="hd-fade-up fixed inset-x-0 bottom-0 z-player border-t border-line bg-surface-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrevious}
            disabled={atStart}
            aria-label={t("quran.previous")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold disabled:opacity-35"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M17 5.5v13L8 12zM7 5h2v14H7z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? t("ayah.pause") : t("ayah.play")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold bg-gold/15 text-gold transition-all duration-300 hover:bg-gold/25"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              {playing ? (
                <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
              ) : (
                <path d="M8 5.5v13l11-6.5z" />
              )}
            </svg>
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={atEnd}
            aria-label={t("quran.next")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold disabled:opacity-35"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M7 5.5v13L16 12zM15 5h2v14h-2z" />
            </svg>
          </button>

          <div className="ml-1 min-w-0 flex-1">
            <p className="truncate font-kufi text-sm text-ink">
              {surahName}
              <span className="text-ink-faint"> {ayahLabel}</span>
            </p>
            <p className="truncate text-[0.68rem] text-ink-faint">
              {findReciter(reciterId).name}
            </p>
          </div>

          {/* Speed. Cycling through the rates keeps this to one control in a
              bar that is already crowded on a phone. */}
          <button
            type="button"
            onClick={cycleRate}
            aria-label={t("reader.speed")}
            title={t("reader.speed")}
            className={`h-9 shrink-0 rounded-full border px-3 text-xs tabular-nums transition-all duration-300 ${
              rate === 1
                ? "border-line text-ink-dim hover:border-gold hover:text-gold-ink"
                : "border-gold text-gold-ink"
            }`}
          >
            {rate}x
          </button>

          <button
            type="button"
            onClick={() => onRepeat(!repeat)}
            aria-pressed={repeat}
            aria-label={t("reader.repeat")}
            title={t("reader.repeat")}
            className={`hidden h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 sm:grid ${
              repeat
                ? "border-gold text-gold"
                : "border-line text-ink-faint hover:border-gold hover:text-gold-ink"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M17 2v4H7a4 4 0 0 0-4 4v2M7 22v-4h10a4 4 0 0 0 4-4v-2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <Select
            value={reciterId}
            onChange={onReciter}
            label={t("settings.reciter")}
            className="hidden w-56 shrink-0 lg:block"
            options={RECITERS.map((reciter) => ({
              value: reciter.id,
              label: reciter.name,
              note: reciter.style,
              trailing: reciter.arabicName,
            }))}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label={t("ayah.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-transparent text-ink-faint transition-all duration-300 hover:border-line hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span
            ref={elapsedRef}
            className="w-10 shrink-0 text-right text-[0.66rem] tabular-nums text-ink-faint"
          >
            0:00
          </span>
          <input
            ref={seekRef}
            type="range"
            min={0}
            max={1000}
            defaultValue={0}
            onChange={(event) => onSeek(Number(event.target.value) / 1000)}
            aria-label={t("reader.seek")}
          />
          <span className="w-10 shrink-0 text-[0.66rem] tabular-nums text-ink-faint">
            {formatSeconds(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
