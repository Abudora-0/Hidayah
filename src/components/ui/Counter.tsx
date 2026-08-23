"use client";

type CounterProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  suffix?: string;
};

/**
 * A stepper with themed detents. Used for the Arabic reading size and the
 * tasbih count, so both feel like the same instrument.
 */
export function Counter({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  suffix,
}: CounterProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        className="grid h-7 w-7 place-items-center rounded-full text-ink-dim transition-all duration-250 hover:bg-surface-1 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      <span
        className="min-w-11 text-center font-kufi text-sm tabular-nums text-ink"
        aria-live="polite"
      >
        {value}
        {suffix ? <span className="text-ink-faint">{suffix}</span> : null}
      </span>

      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className="grid h-7 w-7 place-items-center rounded-full text-ink-dim transition-all duration-250 hover:bg-surface-1 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
