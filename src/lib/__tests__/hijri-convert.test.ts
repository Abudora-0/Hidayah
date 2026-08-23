import { describe, expect, it } from "vitest";

import {
  addHijriMonths,
  hijriMonthLength,
  hijriMonthStart,
  toHijri,
} from "../hijri";

describe("hijriMonthStart", () => {
  it("round trips against toHijri for a long run of months", () => {
    // Every month across roughly a decade, which is the range a user could
    // plausibly page through.
    for (let year = 1444; year <= 1454; year++) {
      for (let month = 1; month <= 12; month++) {
        const start = hijriMonthStart(year, month);
        expect(start, `no start found for ${year}-${month}`).not.toBeNull();

        const back = toHijri(start as Date);
        expect(back, `mismatch for ${year}-${month}`).toEqual({
          year,
          month,
          day: 1,
        });
      }
    }
  });

  it("finds the start of Ramadan 1447 on the expected Gregorian date", () => {
    // Confirmed against the Aladhan gToH endpoint.
    const start = hijriMonthStart(1447, 9) as Date;
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(1); // February
    expect(start.getDate()).toBe(18);
  });

  it("finds the start of Shawwal 1447, which is Eid al Fitr", () => {
    const start = hijriMonthStart(1447, 10) as Date;
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(2); // March
    expect(start.getDate()).toBe(20);
  });

  it("returns a date at local midnight", () => {
    const start = hijriMonthStart(1448, 3) as Date;
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });
});

describe("hijriMonthLength", () => {
  it("only ever returns 29 or 30 days", () => {
    for (let year = 1445; year <= 1450; year++) {
      for (let month = 1; month <= 12; month++) {
        const length = hijriMonthLength(year, month);
        expect([29, 30], `${year}-${month} was ${length}`).toContain(length);
      }
    }
  });

  it("sums to a plausible year length", () => {
    let total = 0;
    for (let month = 1; month <= 12; month++) {
      total += hijriMonthLength(1447, month);
    }
    expect(total).toBeGreaterThanOrEqual(354);
    expect(total).toBeLessThanOrEqual(355);
  });
});

describe("addHijriMonths", () => {
  it("moves forward within a year", () => {
    expect(addHijriMonths(1448, 3, 2)).toEqual({ year: 1448, month: 5 });
  });

  it("rolls over into the next year", () => {
    expect(addHijriMonths(1448, 12, 1)).toEqual({ year: 1449, month: 1 });
  });

  it("rolls back into the previous year", () => {
    expect(addHijriMonths(1448, 1, -1)).toEqual({ year: 1447, month: 12 });
  });
});
