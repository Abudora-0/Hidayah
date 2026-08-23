"use client";

import { Select } from "@/components/ui/Select";
import { RECITERS, findReciter } from "@/data/editions";

type AudioPlayerProps = {
  visible: boolean;
  playing: boolean;
  ayahNumber: number;
  ayahCount: number;
  surahName: string;
  reciterId: string;
  progress: number;
  duration: number;
  repeat: boolean;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (fraction: number) => void;
  onReciter: (id: string) => void;
  onRepeat: (next: boolean) => void;
  onClose: () => void;
};

function formatSeconds(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function AudioPlayer({
  visible,
  playing,
  ayahNumber,
  ayahCount,
  surahName,
  reciterId,
  progress,
  duration,
  repeat,
  onToggle,
  onPrevious,
  onNext,
  onSeek,
  onReciter,
  onRepeat,
  onClose,
}: AudioPlayerProps) {
  if (!visible) return null;

  const fraction = duration > 0 ? progress / duration : 0;

  return (
    <div className="hd-fade-up fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-1/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrevious}
            disabled={ayahNumber <= 1}
            aria-label="Previous ayah"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold disabled:opacity-35"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M17 5.5v13L8 12zM7 5h2v14H7z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? "Pause recitation" : "Play recitation"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold bg-gold/15 text-gold transition-all duration-300 hover:bg-gold/25"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
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
            disabled={ayahNumber >= ayahCount}
            aria-label="Next ayah"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold disabled:opacity-35"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M7 5.5v13L16 12zM15 5h2v14h-2z" />
            </svg>
          </button>

          <div className="ml-1 min-w-0 flex-1">
            <p className="truncate font-kufi text-sm text-ink">
              {surahName}
              <span className="text-ink-faint"> ayah {ayahNumber}</span>
            </p>
            <p className="truncate text-[0.68rem] text-ink-faint">
              {findReciter(reciterId).name}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRepeat(!repeat)}
            aria-pressed={repeat}
            aria-label="Repeat this ayah"
            title="Repeat this ayah"
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
            label="Choose a reciter"
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
            aria-label="Close the player"
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
          <span className="w-10 shrink-0 text-right text-[0.66rem] tabular-nums text-ink-faint">
            {formatSeconds(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(fraction * 1000)}
            onChange={(event) => onSeek(Number(event.target.value) / 1000)}
            aria-label="Seek within this ayah"
            style={{ ["--range-progress" as string]: `${fraction * 100}%` }}
          />
          <span className="w-10 shrink-0 text-[0.66rem] tabular-nums text-ink-faint">
            {formatSeconds(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
