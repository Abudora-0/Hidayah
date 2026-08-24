"use client";

import { useEffect } from "react";

import {
  LANGUAGES,
  LANGUAGE_DIRECTION,
  LANGUAGE_LABELS,
  useLanguage,
} from "@/lib/i18n";
import { updateSettings } from "@/lib/settings";

/**
 * Applies the chosen language to the document.
 *
 * lang and dir live on the html element, which React does not own here, so
 * they are set from an effect. Urdu is written right to left, so dir has to
 * change with it or the whole layout stays the wrong way round.
 */
export function LanguageEffect() {
  const { language, dir } = useLanguage();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", language);
    root.setAttribute("dir", dir);
  }, [language, dir]);

  return null;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, t } = useLanguage();

  return (
    <div
      className={compact ? "grid grid-cols-2 gap-1.5" : "flex flex-col gap-2"}
      role="group"
      aria-label={t("nav.language")}
    >
      {LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() =>
            updateSettings((current) => ({
              ...current,
              display: { ...current.display, language: option },
            }))
          }
          aria-pressed={language === option}
          dir={LANGUAGE_DIRECTION[option]}
          className={`rounded-[10px] border px-3 py-2 text-center transition-all duration-250 ${
            language === option
              ? "border-gold bg-surface-2 text-gold-ink"
              : "border-line text-ink-dim hover:border-line-strong hover:text-ink"
          }`}
        >
          <span className={option === "ur" ? "font-urdu text-base" : "text-sm"}>
            {LANGUAGE_LABELS[option].native}
          </span>
        </button>
      ))}
    </div>
  );
}
