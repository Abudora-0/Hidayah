"use client";

import { LANGUAGE_LABELS, useLanguage } from "@/lib/i18n";
import { updateSettings } from "@/lib/settings";

/**
 * The language control in the header, beside the theme.
 *
 * There are only two languages, so this flips between them rather than opening
 * a menu for a single alternative.
 */
export function LanguageToggle() {
  const { language, t } = useLanguage();
  const other = language === "en" ? "ur" : "en";

  return (
    <button
      type="button"
      onClick={() =>
        updateSettings((current) => ({
          ...current,
          display: { ...current.display, language: other },
        }))
      }
      aria-label={`${t("nav.language")}: ${LANGUAGE_LABELS[other].native}`}
      title={LANGUAGE_LABELS[other].native}
      className="flex h-9 items-center gap-2 rounded-full border border-line px-3 transition-colors duration-300 hover:border-gold"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className={`text-xs text-ink-dim ${language === "ur" ? "font-urdu" : ""}`}
      >
        {LANGUAGE_LABELS[language].native}
      </span>
    </button>
  );
}
