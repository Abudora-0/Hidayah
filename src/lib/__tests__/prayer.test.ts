import { describe, expect, it } from "vitest";

import {
  getPrayerSchedule,
  splitDuration,
  windowProgress,
} from "../prayer";

// Lahore.
const LAT = 31.5204;
const LNG = 74.3587;

function at(iso: string) {
  return new Date(iso);
}

describe("getPrayerSchedule", () => {
  it("returns all six entries in order", () => {
    const schedule = getPrayerSchedule(LAT, LNG, undefined, at("2026-08-23T09:00:00"));
    expect(schedule.entries.map((e) => e.key)).toEqual([
      "fajr",
      "sunrise",
      "dhuhr",
      "asr",
      "maghrib",
      "isha",
    ]);
  });

  it("marks sunrise as not a prayer, so it never alarms", () => {
    const schedule = getPrayerSchedule(LAT, LNG, undefined, at("2026-08-23T09:00:00"));
    const sunrise = schedule.entries.find((e) => e.key === "sunrise");
    expect(sunrise?.isPrayer).toBe(false);
    expect(schedule.entries.filter((e) => e.isPrayer)).toHaveLength(5);
  });

  it("picks the next prayer later the same day", () => {
    // Mid afternoon, so Maghrib is still ahead.
    const schedule = getPrayerSchedule(LAT, LNG, undefined, at("2026-08-23T17:00:00"));
    expect(schedule.next.key).toBe("maghrib");
    expect(schedule.next.isTomorrow).toBe(false);
    expect(schedule.next.time.getTime()).toBeGreaterThan(
      at("2026-08-23T17:00:00").getTime(),
    );
  });

  it("rolls over to tomorrow's Fajr after Isha", () => {
    const now = at("2026-08-23T23:30:00");
    const schedule = getPrayerSchedule(LAT, LNG, undefined, now);
    expect(schedule.next.key).toBe("fajr");
    expect(schedule.next.isTomorrow).toBe(true);
    expect(schedule.next.time.getTime()).toBeGreaterThan(now.getTime());
  });

  it("uses yesterday's Isha as the window start in the small hours", () => {
    // Between midnight and Fajr there is no current prayer today, so the
    // progress ring has to reach back to the previous evening.
    const now = at("2026-08-23T02:00:00");
    const schedule = getPrayerSchedule(LAT, LNG, undefined, now);
    expect(schedule.next.key).toBe("fajr");
    expect(schedule.previousTime.getTime()).toBeLessThan(now.getTime());
    expect(windowProgress(schedule.previousTime, schedule.next.time, now)).
      toBeGreaterThan(0);
  });

  it("gives a qibla bearing that points west from Lahore", () => {
    const schedule = getPrayerSchedule(LAT, LNG, undefined, at("2026-08-23T09:00:00"));
    expect(schedule.qibla).toBeGreaterThan(255);
    expect(schedule.qibla).toBeLessThan(265);
  });

  it("keeps Fajr and Isha solvable at high latitude in midsummer", () => {
    // Tromso in June, where the sun never reaches the required depression.
    const schedule = getPrayerSchedule(69.65, 18.96, undefined, at("2026-06-21T12:00:00"));
    for (const entry of schedule.entries) {
      expect(Number.isNaN(entry.time.getTime())).toBe(false);
    }
  });

  it("gives a later Asr for Hanafi than for Shafi", () => {
    const when = at("2026-08-23T09:00:00");
    const hanafi = getPrayerSchedule(LAT, LNG, { method: "Karachi", madhab: "hanafi" }, when);
    const shafi = getPrayerSchedule(LAT, LNG, { method: "Karachi", madhab: "shafi" }, when);

    const asrOf = (s: typeof hanafi) =>
      s.entries.find((e) => e.key === "asr")!.time.getTime();

    expect(asrOf(hanafi)).toBeGreaterThan(asrOf(shafi));
  });
});

describe("windowProgress", () => {
  it("is zero at the start and one at the end", () => {
    const from = at("2026-08-23T12:00:00");
    const to = at("2026-08-23T16:00:00");
    expect(windowProgress(from, to, from)).toBe(0);
    expect(windowProgress(from, to, to)).toBe(1);
  });

  it("is a half at the midpoint", () => {
    const from = at("2026-08-23T12:00:00");
    const to = at("2026-08-23T16:00:00");
    expect(windowProgress(from, to, at("2026-08-23T14:00:00"))).toBeCloseTo(0.5);
  });

  it("clamps rather than running past either end", () => {
    const from = at("2026-08-23T12:00:00");
    const to = at("2026-08-23T16:00:00");
    expect(windowProgress(from, to, at("2026-08-23T11:00:00"))).toBe(0);
    expect(windowProgress(from, to, at("2026-08-23T18:00:00"))).toBe(1);
  });

  it("does not divide by zero on a collapsed window", () => {
    const same = at("2026-08-23T12:00:00");
    expect(windowProgress(same, same, same)).toBe(0);
  });
});

describe("splitDuration", () => {
  it("breaks milliseconds into hours, minutes and seconds", () => {
    expect(splitDuration((2 * 3600 + 14 * 60 + 9) * 1000)).toMatchObject({
      hours: 2,
      minutes: 14,
      seconds: 9,
    });
  });

  it("floors a negative remaining time to zero", () => {
    expect(splitDuration(-5000)).toMatchObject({
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });
});
