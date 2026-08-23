"use client";

import { useMemo, useState } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import {
  OCCASIONS,
  OCCASION_STYLES,
  isWhiteDay,
  occasionsOn,
  type Occasion,
} from "@/data/occasions";
import { useNow } from "@/lib/hooks";
import {
  addDays,
  addHijriMonths,
  formatHijri,
  hijriMonthLength,
  hijriMonthName,
  hijriMonthStart,
  toHijri,
  type HijriDate,
} from "@/lib/hijri";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Cell = {
  hijri: HijriDate;
  gregorian: Date;
  occasions: Occasion[];
  isToday: boolean;
  isFriday: boolean;
  isWhite: boolean;
};

export function HijriCalendar() {
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const today = useMemo(() => (now ? toHijri(now) : null), [now]);

  const view = useMemo(() => {
    if (!today) return null;
    return addHijriMonths(today.year, today.month, offset);
  }, [today, offset]);

  const cells = useMemo<Cell[] | null>(() => {
    if (!view || !now) return null;

    const start = hijriMonthStart(view.year, view.month);
    if (!start) return null;

    const length = hijriMonthLength(view.year, view.month);
    const todayKey = new Date(now).setHours(0, 0, 0, 0);

    return Array.from({ length }, (_, index) => {
      const gregorian = addDays(start, index);
      const hijri = { year: view.year, month: view.month, day: index + 1 };
      return {
        hijri,
        gregorian,
        occasions: occasionsOn(hijri),
        isToday: gregorian.setHours(0, 0, 0, 0) === todayKey,
        isFriday: gregorian.getDay() === 5,
        isWhite: isWhiteDay(hijri),
      };
    });
  }, [view, now]);

  const upcoming = useMemo(() => {
    if (!today) return [];
    // Occasions still ahead this Hijri year, then wrapping into the next.
    const ordered = [...OCCASIONS].sort(
      (a, b) => a.month * 100 + a.from - (b.month * 100 + b.from),
    );
    const key = today.month * 100 + today.day;
    const ahead = ordered.filter((o) => o.month * 100 + o.to >= key);
    const behind = ordered.filter((o) => o.month * 100 + o.to < key);
    return [...ahead, ...behind].slice(0, 6).map((occasion) => {
      const year =
        occasion.month * 100 + occasion.to >= key ? today.year : today.year + 1;
      const monthStart = hijriMonthStart(year, occasion.month);
      return {
        occasion,
        year,
        date: monthStart ? addDays(monthStart, occasion.from - 1) : null,
      };
    });
  }, [today]);

  if (!today || !view || !cells) {
    return (
      <div className="mx-auto grid max-w-3xl gap-3 py-16" aria-label="Loading the calendar">
        <div className="h-8 w-56 animate-pulse rounded-full bg-surface-2" />
        <div className="h-72 animate-pulse rounded-[14px] bg-surface-2" />
      </div>
    );
  }

  const monthName = hijriMonthName(view.month);
  const leadingBlanks = cells[0].gregorian.getDay();
  const selectedCell = selected !== null ? cells[selected] : null;

  const gregorianSpan = () => {
    const first = cells[0].gregorian;
    const last = cells[cells.length - 1].gregorian;
    const fmt = (d: Date, withYear: boolean) =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        ...(withYear ? { year: "numeric" } : {}),
      }).format(d);
    return `${fmt(first, first.getFullYear() !== last.getFullYear())} to ${fmt(last, true)}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            setOffset((v) => v - 1);
            setSelected(null);
          }}
          aria-label="Previous month"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="min-w-0 text-center">
          <h2 className="font-kufi truncate text-xl text-ink sm:text-2xl">
            {monthName.en} {view.year}
            <span className="ml-2 text-sm text-ink-faint">AH</span>
          </h2>
          <p dir="rtl" lang="ar" className="font-quran mt-1 text-lg text-gold-soft">
            {monthName.ar}
          </p>
          <p className="mt-1 text-xs text-ink-faint">{gregorianSpan()}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setOffset((v) => v + 1);
            setSelected(null);
          }}
          aria-label="Next month"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {offset !== 0 ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setOffset(0);
              setSelected(null);
            }}
            className="rounded-full border border-line px-4 py-1.5 text-xs text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold-ink"
          >
            Back to this month
          </button>
        </div>
      ) : null}

      <GirihRule className="my-7" />

      <div className="grid grid-cols-7 gap-1.5" role="grid">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={`pb-2 text-center text-[0.62rem] uppercase tracking-[0.16em] ${
              day === "Fri" ? "text-gold-ink" : "text-ink-faint"
            }`}
          >
            {day}
          </div>
        ))}

        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden="true" />
        ))}

        {cells.map((cell, index) => {
          const marked = cell.occasions.length > 0;
          const isSelected = selected === index;

          return (
            <button
              key={cell.hijri.day}
              type="button"
              onClick={() => setSelected(isSelected ? null : index)}
              aria-pressed={isSelected}
              aria-label={`${formatHijri(cell.hijri)}, ${new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(cell.gregorian)}${marked ? `, ${cell.occasions.map((o) => o.name).join(", ")}` : ""}`}
              className={`hd-fade-up relative flex aspect-square flex-col items-center justify-center rounded-[10px] border transition-all duration-300 ${
                cell.isToday
                  ? "border-gold bg-gold/12"
                  : isSelected
                    ? "border-gold-soft bg-surface-2"
                    : marked
                      ? "border-line-strong bg-surface-1 hover:border-gold"
                      : "border-transparent hover:border-line hover:bg-surface-1"
              }`}
              style={{ animationDelay: `${Math.min(index, 20) * 16}ms` }}
            >
              <span
                className={`font-kufi text-sm tabular-nums ${
                  cell.isToday
                    ? "text-gold"
                    : cell.isFriday
                      ? "text-gold-ink"
                      : "text-ink"
                }`}
              >
                {cell.hijri.day}
              </span>
              <span className="mt-0.5 text-[0.58rem] tabular-nums text-ink-faint">
                {cell.gregorian.getDate()}
              </span>

              {marked ? (
                <span className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
                  {cell.occasions.slice(0, 3).map((occasion) => (
                    <span
                      key={occasion.id}
                      className={`h-1 w-1 rounded-full ${OCCASION_STYLES[occasion.kind].dot}`}
                    />
                  ))}
                </span>
              ) : cell.isWhite ? (
                <span
                  className="absolute inset-x-0 bottom-1 flex justify-center"
                  title="White day"
                >
                  <span className="h-1 w-1 rounded-full border border-line-strong" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedCell ? (
        <div className="hd-fade-up mt-6 rounded-[14px] border border-line bg-surface-1 p-5">
          <p className="font-kufi text-base text-ink">
            {formatHijri(selectedCell.hijri)}
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(
              selectedCell.gregorian,
            )}
          </p>

          {selectedCell.occasions.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {selectedCell.occasions.map((occasion) => (
                <li key={occasion.id} className="flex gap-3">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${OCCASION_STYLES[occasion.kind].dot}`}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="font-kufi text-sm text-gold-ink">
                        {occasion.name}
                      </span>
                      <span dir="rtl" lang="ar" className="font-quran text-sm text-ink-faint">
                        {occasion.arabicName}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-dim">
                      {occasion.note}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : selectedCell.isWhite ? (
            <p className="mt-4 text-xs leading-relaxed text-ink-dim">
              One of the white days, the thirteenth to fifteenth of every month,
              kept as a fast.
            </p>
          ) : (
            <p className="mt-4 text-xs text-ink-faint">
              Nothing particular is marked on this day.
            </p>
          )}
        </div>
      ) : null}

      <GirihRule className="my-10" />

      <section>
        <h3 className="font-kufi text-sm uppercase tracking-[0.24em] text-ink-faint">
          Coming up
        </h3>
        <ul className="mt-5 flex flex-col gap-2">
          {upcoming.map(({ occasion, date, year }) => (
            <li
              key={`${occasion.id}-${year}`}
              className="hd-card flex items-center gap-4 p-4"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${OCCASION_STYLES[occasion.kind].dot}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-kufi text-sm text-ink">
                  {occasion.name}
                </span>
                <span className="block text-xs text-ink-faint">
                  {occasion.from} {hijriMonthName(occasion.month).en} {year}
                </span>
              </span>
              {date ? (
                <span className="shrink-0 text-right text-xs text-ink-dim">
                  {new Intl.DateTimeFormat(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(date)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
        Dates follow the Umm al Qura calendar, which is calculated rather than
        sighted. Your local announcement may fall a day either side.
      </p>
    </div>
  );
}
