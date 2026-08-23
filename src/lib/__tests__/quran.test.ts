import { describe, expect, it } from "vitest";

import {
  ayahAudioUrl,
  stripLeadingBismillah,
  withoutDiacritics,
} from "../quran";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

describe("withoutDiacritics", () => {
  it("removes vowel marks but keeps every letter", () => {
    expect(withoutDiacritics(BISMILLAH)).toBe("بسم الله الرحمن الرحيم");
  });

  it("does not collapse distinct verses to the same bare form", () => {
    const tawbah = withoutDiacritics("بَرَآءَةٌۭ مِّنَ ٱللَّهِ وَرَسُولِهِۦٓ");
    const ikhlas = withoutDiacritics("قُلْ هُوَ ٱللَّهُ أَحَدٌ");
    expect(tawbah).not.toBe(ikhlas);
    expect(tawbah).not.toBe(withoutDiacritics(BISMILLAH));
    expect(ikhlas).toBe("قل هو الله أحد");
  });
});

describe("stripLeadingBismillah", () => {
  it("removes the bismillah prefixed to the first ayah of a surah", () => {
    // This is the shape the Arabic edition actually returns for Al Ikhlas.
    const raw = `${BISMILLAH} قُلْ هُوَ ٱللَّهُ أَحَدٌ`;
    expect(stripLeadingBismillah(raw)).toBe("قُلْ هُوَ ٱللَّهُ أَحَدٌ");
  });

  it("consumes the trailing vowel mark rather than leaving it behind", () => {
    // Regression guard. An earlier version cut one character short and left a
    // stray kasra at the start of every first ayah.
    const raw = `${BISMILLAH} الٓمٓ`;
    const result = stripLeadingBismillah(raw);
    expect(result).toBe("الٓمٓ");
    expect(result.startsWith("ِ")).toBe(false);
  });

  it("leaves a verse alone when there is no bismillah, as in At Tawbah", () => {
    const raw = "بَرَآءَةٌۭ مِّنَ ٱللَّهِ وَرَسُولِهِۦٓ";
    expect(stripLeadingBismillah(raw)).toBe(raw);
  });

  it("returns nothing left over when the text is only the bismillah", () => {
    expect(stripLeadingBismillah(BISMILLAH)).toBe("");
  });

  it("strips a leading byte order mark", () => {
    expect(stripLeadingBismillah(`﻿${BISMILLAH} الٓمٓ`)).toBe("الٓمٓ");
  });
});

describe("ayahAudioUrl", () => {
  it("builds the per ayah url from the global ayah number", () => {
    expect(ayahAudioUrl("ar.alafasy", 6222)).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6222.mp3",
    );
  });
});
