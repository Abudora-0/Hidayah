import { describe, expect, it } from "vitest";

import { formatHijri, toHijri, toHijriObservingSunset } from "../hijri";

/**
 * Each expectation below was checked against the Aladhan gToH endpoint, which
 * is an independent implementation of the same Umm al Qura calendar.
 */
describe("toHijri", () => {
  const cases: [string, { day: number; month: number; year: number }][] = [
    ["2026-08-23", { day: 10, month: 3, year: 1448 }],
    ["2026-02-18", { day: 1, month: 9, year: 1447 }], // start of Ramadan
    ["2026-03-20", { day: 1, month: 10, year: 1447 }], // Eid al Fitr
    ["2026-05-27", { day: 10, month: 12, year: 1447 }], // Eid al Adha
    ["2027-01-01", { day: 23, month: 7, year: 1448 }],
  ];

  for (const [gregorian, expected] of cases) {
    it(`converts ${gregorian}`, () => {
      expect(toHijri(new Date(`${gregorian}T00:00:00`))).toEqual(expected);
    });
  }

  it("does not roll the day over at either edge of a local day", () => {
    const early = toHijri(new Date("2026-08-23T00:05:00"));
    const late = toHijri(new Date("2026-08-23T23:55:00"));
    expect(early).toEqual(late);
  });
});

describe("toHijriObservingSunset", () => {
  it("keeps the current date before maghrib", () => {
    const now = new Date("2026-08-23T15:00:00");
    const maghrib = new Date("2026-08-23T18:37:00");
    expect(toHijriObservingSunset(now, maghrib)).toEqual({
      day: 10,
      month: 3,
      year: 1448,
    });
  });

  it("advances to the next day once maghrib has passed", () => {
    const now = new Date("2026-08-23T19:00:00");
    const maghrib = new Date("2026-08-23T18:37:00");
    expect(toHijriObservingSunset(now, maghrib)).toEqual({
      day: 11,
      month: 3,
      year: 1448,
    });
  });
});

describe("formatHijri", () => {
  it("names the month and marks the era", () => {
    expect(formatHijri({ day: 10, month: 3, year: 1448 })).toBe(
      "10 Rabi al Awwal 1448 AH",
    );
  });

  it("can omit the year", () => {
    expect(formatHijri({ day: 1, month: 9, year: 1447 }, false)).toBe(
      "1 Ramadan",
    );
  });
});
