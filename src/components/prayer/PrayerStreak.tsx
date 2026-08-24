"use client";

type PrayerStreakProps = {
  streak: number;
  week: { key: string; date: Date; count: number }[];
  /** How many prayers make a complete day. */
  total: number;
  todayCount: number;
};

/**
 * The prayer tracker summary.
 *
 * A streak is counted in complete days, and today does not break it while it
 * is still in progress, or the number would read zero every morning.
 */
export function PrayerStreak({ streak, week, total, todayCount }: PrayerStreakProps) {
  return (
    <div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-kufi text-3xl tabular-nums text-gold-ink">
          {streak}
        </span>
        <span className="text-sm text-ink-dim">
          {streak === 1 ? "day streak" : "day streak"}
        </span>
      </div>

      <p className="mt-1 text-xs text-ink-faint">
        {todayCount} of {total} marked today
      </p>

      <div className="mt-5 flex items-end justify-between gap-1.5">
        {week.map((day) => {
          const fraction = Math.min(1, day.count / total);
          const complete = day.count >= total;
          return (
            <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="relative w-full overflow-hidden rounded-[4px] border border-line bg-surface-2"
                style={{ height: 44 }}
                title={`${day.count} of ${total}`}
              >
                <div
                  className={`absolute inset-x-0 bottom-0 transition-all duration-500 ${
                    complete ? "bg-gold" : "bg-gold/45"
                  }`}
                  style={{ height: `${fraction * 100}%` }}
                />
              </div>
              <span className="text-[0.58rem] uppercase text-ink-faint">
                {new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(
                  day.date,
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
