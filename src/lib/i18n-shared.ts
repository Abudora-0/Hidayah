/**
 * The language constants, kept apart from the dictionary.
 *
 * settings.ts needs the type and the default, and i18n.ts needs settings to
 * read the chosen language. Splitting these breaks that cycle.
 */
export const LANGUAGES = ["en", "ur"] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export const LANGUAGE_LABELS: Record<Language, { name: string; native: string }> = {
  en: { name: "English", native: "English" },
  ur: { name: "Urdu", native: "اردو" },
};

/** Urdu is written right to left, so the whole document flips. */
export const LANGUAGE_DIRECTION: Record<Language, "ltr" | "rtl"> = {
  en: "ltr",
  ur: "rtl",
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}
