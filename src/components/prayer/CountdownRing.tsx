"use client";

import { PRAYER_LABELS, formatTime, splitDuration, type PrayerKey } from "@/lib/prayer";

type CountdownRingProps = {
  prayerKey: PrayerKey;
  target: Date;
  /** Fraction of the current window already elapsed, between 0 and 1. */
  progress: number;
  remainingMs: number;
  hour12: boolean;
  isTomorrow: boolean;
};

const SIZE = 260;
const STROKE = 6;
const RADIUS = (SIZE - STROKE * 2) / 2 - 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * The centrepiece of the prayer view. An engraved dial whose gold arc fills as
 * the window to the next prayer closes, with the girih star points marking the
 * quarters the way a compass rose would.
 */
export function CountdownRing({
  prayerKey,
  target,
  progress,
  remainingMs,
  hour12,
  isTomorrow,
}: CountdownRingProps) {
  const { hours, minutes, seconds } = splitDuration(remainingMs);
  const label = PRAYER_LABELS[prayerKey];

  return (
    <div
      className="relative mx-auto"
      style={{ width: SIZE, height: SIZE }}
      role="timer"
      aria-live="off"
      aria-label={`Time remaining until ${label.en}`}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-line"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          className="text-gold transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>

      {/* Quarter markers, the same interlace square as the logo */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0"
        aria-hidden="true"
      >
        {[0, 90, 180, 270].map((angle) => (
          <g key={angle} transform={`rotate(${angle} ${SIZE / 2} ${SIZE / 2})`}>
            <rect
              x={SIZE / 2 - 4}
              y={SIZE / 2 - RADIUS - 4}
              width="8"
              height="8"
              className="text-line-strong"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              transform={`rotate(45 ${SIZE / 2} ${SIZE / 2 - RADIUS})`}
            />
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[0.62rem] uppercase tracking-[0.32em] text-ink-faint">
          {isTomorrow ? "Tomorrow" : "Next prayer"}
        </p>

        <p
          dir="rtl"
          lang="ar"
          className="font-quran mt-2 text-3xl text-gold-ink"
        >
          {label.ar}
        </p>
        <p className="font-kufi text-xl text-ink">{label.en}</p>

        <p className="mt-2 font-kufi text-2xl tabular-nums text-gold-ink">
          {formatTime(target, hour12)}
        </p>

        <div className="mt-3 flex items-baseline gap-1 tabular-nums">
          <span className="font-kufi text-2xl text-ink">{pad(hours)}</span>
          <span className="text-ink-faint">:</span>
          <span className="font-kufi text-2xl text-ink">{pad(minutes)}</span>
          <span className="text-ink-faint">:</span>
          <span className="font-kufi text-2xl text-ink-dim">{pad(seconds)}</span>
        </div>
        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-ink-faint">
          remaining
        </p>
      </div>
    </div>
  );
}
