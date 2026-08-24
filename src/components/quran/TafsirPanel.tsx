"use client";

import { useEffect, useState } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import { Select } from "@/components/ui/Select";
import { TAFSIRS, findTafsir } from "@/data/editions";
import { useLanguage } from "@/lib/i18n";

type TafsirPanelProps = {
  open: boolean;
  surahNumber: number;
  surahName: string;
  ayahNumber: number | null;
  editionId: string;
  onEdition: (id: string) => void;
  onClose: () => void;
};

type TafsirShape =
  | { ayahs?: { ayah: number; text: string }[] }
  | { text: string }[];

// Surah level tafsir is a few hundred kilobytes, so it is kept in memory for
// the session rather than refetched every time the panel opens.
const memo = new Map<string, Map<number, string>>();

async function loadTafsir(editionId: string, surah: number) {
  const key = `${editionId}:${surah}`;
  const hit = memo.get(key);
  if (hit) return hit;

  const res = await fetch(
    `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${editionId}/${surah}.json`,
  );
  if (!res.ok) throw new Error(`Tafsir unavailable (${res.status})`);

  const body = (await res.json()) as TafsirShape;
  const map = new Map<number, string>();

  // The dataset ships two shapes depending on the edition.
  if (Array.isArray(body)) {
    body.forEach((entry, index) => map.set(index + 1, entry.text));
  } else if (body.ayahs) {
    for (const entry of body.ayahs) map.set(entry.ayah, entry.text);
  }

  memo.set(key, map);
  return map;
}

export function TafsirPanel({
  open,
  surahNumber,
  surahName,
  ayahNumber,
  editionId,
  onEdition,
  onClose,
}: TafsirPanelProps) {
  const { t } = useLanguage();
  const edition = findTafsir(editionId);
  const isUrdu = edition.language === "urdu";

  // What the panel should currently be showing. Deriving this during render
  // means the loading state never has to be assigned inside an effect.
  const wantedKey =
    ayahNumber === null ? null : `${editionId}:${surahNumber}:${ayahNumber}`;

  const [result, setResult] = useState<{
    key: string;
    text: string | null;
    failed: boolean;
  } | null>(null);

  const settled = result?.key === wantedKey ? result : null;
  const status: "idle" | "loading" | "error" =
    wantedKey === null ? "idle" : settled ? (settled.failed ? "error" : "idle") : "loading";
  const text = settled?.text ?? null;

  useEffect(() => {
    if (!open || wantedKey === null || result?.key === wantedKey) return;

    let cancelled = false;
    loadTafsir(editionId, surahNumber)
      .then((map) => {
        if (cancelled) return;
        setResult({
          key: wantedKey,
          text: map.get(ayahNumber as number) ?? null,
          failed: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResult({ key: wantedKey, text: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [open, wantedKey, result?.key, editionId, surahNumber, ayahNumber]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-scrim bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Tafsir for ${surahName} ayah ${ayahNumber}`}
        className="hd-fade-up fixed inset-y-0 right-0 z-drawer flex w-full max-w-lg flex-col border-l border-line bg-surface-1"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[0.62rem] uppercase tracking-[0.28em] text-ink-faint">
              {t("tafsir.title")}
            </p>
            <h2 className="font-kufi mt-1 truncate text-lg text-ink">
              {surahName} {surahNumber}:{ayahNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("ayah.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="border-b border-line px-5 py-3">
          <Select
            value={editionId}
            onChange={onEdition}
            label={t("tafsir.choose")}
            options={TAFSIRS.map((tafsir) => ({
              value: tafsir.id,
              label: tafsir.name,
              note: `${tafsir.author}, ${tafsir.language}`,
              rtl: tafsir.language === "urdu",
            }))}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {status === "loading" ? (
            <div className="flex flex-col gap-3" aria-label="Loading the tafsir">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-3.5 animate-pulse rounded-full bg-surface-2"
                  style={{ width: `${92 - i * 7}%` }}
                />
              ))}
            </div>
          ) : status === "error" ? (
            <p className="text-sm leading-relaxed text-ink-dim">
{t("tafsir.unavailable")}
            </p>
          ) : text ? (
            <>
              <p
                dir={isUrdu ? "rtl" : undefined}
                lang={isUrdu ? "ur" : "en"}
                className={
                  isUrdu
                    ? "font-urdu text-[1.05rem] text-ink"
                    : "whitespace-pre-line text-[0.95rem] leading-relaxed text-ink"
                }
              >
                {text}
              </p>
              <GirihRule className="mt-8" compact />
              <p className="mt-4 text-center text-[0.68rem] text-ink-faint">
                {edition.name}, {edition.author}
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-ink-dim">
{t("tafsir.noneForAyah")}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
