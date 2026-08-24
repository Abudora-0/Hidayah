"use client";

import { useSyncExternalStore } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import { LocationBar } from "@/components/prayer/LocationBar";
import { Counter } from "@/components/ui/Counter";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { AladhanCheck } from "./AladhanCheck";
import { PushControl } from "./PushControl";
import {
  ENGLISH_EDITIONS,
  RECITERS,
  TAFSIRS,
  URDU_EDITIONS,
} from "@/data/editions";
import { locationStore, writeStoredLocation } from "@/lib/location";
import {
  MADHAB_LABELS,
  METHODS,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type MadhabKey,
  type MethodKey,
} from "@/lib/prayer";
import { setAlarmForPrayer, updateSettings, useSettings } from "@/lib/settings";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

function Section({
  title,
  arabic,
  children,
}: {
  title: string;
  arabic: string;
  children: React.ReactNode;
}) {
  return (
    <section className="hd-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-kufi text-sm uppercase tracking-[0.22em] text-ink-faint">
          {title}
        </h2>
        <span dir="rtl" lang="ar" className="font-quran text-sm text-ink-faint">
          {arabic}
        </span>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-ink">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsPanel() {
  const { t, language } = useLanguage();
  const settings = useSettings();
  const location = useSyncExternalStore(
    locationStore.subscribe,
    locationStore.getSnapshot,
    locationStore.getServerSnapshot,
  );

  return (
    <div className="flex flex-col gap-4">
      <Section title={t("settings.location")} arabic="الموقع">
        <div className="flex flex-col items-start gap-4">
          <LocationBar location={location} onChange={writeStoredLocation} />
          <p className="text-xs leading-relaxed text-ink-faint">
{t("settings.locationNote")}
          </p>
        </div>
      </Section>

      <Section title={t("settings.calculation")} arabic="الحساب">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm text-ink">{t("settings.authority")}</p>
            <Select
              value={settings.prayer.method}
              onChange={(value) =>
                updateSettings((current) => ({
                  ...current,
                  prayer: { ...current.prayer, method: value as MethodKey },
                }))
              }
              label="Prayer time calculation authority"
              options={Object.entries(METHODS).map(([key, method]) => ({
                value: key,
                label: method.label,
                note: method.region,
              }))}
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink">{t("settings.madhab")}</p>
            <Select
              value={settings.prayer.madhab}
              onChange={(value) =>
                updateSettings((current) => ({
                  ...current,
                  prayer: { ...current.prayer, madhab: value as MadhabKey },
                }))
              }
              label="Madhab for the Asr calculation"
              options={Object.entries(MADHAB_LABELS).map(([key, madhab]) => ({
                value: key,
                label: madhab.label,
                note: madhab.note,
              }))}
            />
          </div>

          <Row label={t("settings.twelveHour")} hint={t("settings.twelveHourNote")}>
            <Toggle
              checked={settings.display.hour12}
              onChange={(next) =>
                updateSettings((current) => ({
                  ...current,
                  display: { ...current.display, hour12: next },
                }))
              }
              label="Use a twelve hour clock"
            />
          </Row>

          {location ? (
            <>
              <GirihRule className="my-2" compact />
              <AladhanCheck
                location={location}
                method={settings.prayer.method}
                madhab={settings.prayer.madhab}
                hour12={settings.display.hour12}
              />
            </>
          ) : null}
        </div>
      </Section>

      <Section title={t("settings.alarm")} arabic="التنبيه">
        <div className="flex flex-col gap-1">
          <PushControl location={location} settings={settings} />

          <GirihRule className="my-4" compact />

          <p className="mb-1 text-sm text-ink">{t("settings.whichPrayers")}</p>
          {OBLIGATORY_PRAYERS.map((prayer) => (
            <Row
              key={prayer}
              label={
                language === "ur"
                  ? PRAYER_LABELS[prayer].ur
                  : PRAYER_LABELS[prayer].en
              }
              hint={
                language === "ur"
                  ? PRAYER_LABELS[prayer].noteUr
                  : PRAYER_LABELS[prayer].note
              }
            >
              <Toggle
                size="sm"
                checked={settings.alarm.prayers[prayer] ?? false}
                onChange={(next) => setAlarmForPrayer(prayer, next)}
                label={`Alarm for ${PRAYER_LABELS[prayer].en}`}
              />
            </Row>
          ))}

          <GirihRule className="my-4" compact />

          <Row
            label={t("settings.playSound")}
            hint={t("settings.playSoundNote")}
          >
            <Toggle
              checked={settings.alarm.playAdhan}
              onChange={(next) =>
                updateSettings((current) => ({
                  ...current,
                  alarm: { ...current.alarm, playAdhan: next },
                }))
              }
              label="Play a sound when a prayer begins"
            />
          </Row>
        </div>
      </Section>

      <Section title={t("settings.appearance")} arabic="المظهر">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm text-ink">{t("settings.language")}</p>
            <p className="mb-3 text-xs text-ink-faint">
              {t("settings.languageNote")}
            </p>
            <LanguageSwitcher compact />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink">{t("nav.changeTheme")}</p>
            <ThemeSwitcher />
          </div>
        </div>
      </Section>

      <Section title={t("settings.reading")} arabic="القراءة">
        <div className="flex flex-col gap-4">
          <Row label={t("settings.arabicSize")}>
            <Counter
              value={settings.quran.arabicSize}
              onChange={(next) =>
                updateSettings((current) => ({
                  ...current,
                  quran: { ...current.quran, arabicSize: next },
                }))
              }
              min={20}
              max={56}
              step={2}
              label="Arabic reading size"
              suffix="px"
            />
          </Row>

          <Row label={t("settings.showEnglish")}>
            <Toggle
              checked={settings.quran.showEnglish}
              onChange={(next) =>
                updateSettings((current) => ({
                  ...current,
                  quran: { ...current.quran, showEnglish: next },
                }))
              }
              label="Show the English translation"
            />
          </Row>

          <Select
            value={settings.quran.englishEdition}
            onChange={(value) =>
              updateSettings((current) => ({
                ...current,
                quran: { ...current.quran, englishEdition: value },
              }))
            }
            label="English translation"
            options={ENGLISH_EDITIONS.map((edition) => ({
              value: edition.id,
              label: edition.name,
              note: edition.note,
            }))}
          />

          <Row label={t("settings.showUrdu")}>
            <Toggle
              checked={settings.quran.showUrdu}
              onChange={(next) =>
                updateSettings((current) => ({
                  ...current,
                  quran: { ...current.quran, showUrdu: next },
                }))
              }
              label="Show the Urdu translation"
            />
          </Row>

          <Select
            value={settings.quran.urduEdition}
            onChange={(value) =>
              updateSettings((current) => ({
                ...current,
                quran: { ...current.quran, urduEdition: value },
              }))
            }
            label="Urdu translation"
            options={URDU_EDITIONS.map((edition) => ({
              value: edition.id,
              label: edition.name,
              note: edition.note,
              rtl: true,
            }))}
          />

          <div>
            <p className="mb-2 text-sm text-ink">{t("settings.reciter")}</p>
            <Select
              value={settings.quran.reciter}
              onChange={(value) =>
                updateSettings((current) => ({
                  ...current,
                  quran: { ...current.quran, reciter: value },
                }))
              }
              label="Reciter"
              options={RECITERS.map((reciter) => ({
                value: reciter.id,
                label: reciter.name,
                note: reciter.style,
                trailing: reciter.arabicName,
              }))}
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink">{t("settings.tafsir")}</p>
            <Select
              value={settings.quran.tafsirEdition}
              onChange={(value) =>
                updateSettings((current) => ({
                  ...current,
                  quran: { ...current.quran, tafsirEdition: value },
                }))
              }
              label="Tafsir edition"
              options={TAFSIRS.map((tafsir) => ({
                value: tafsir.id,
                label: tafsir.name,
                note: `${tafsir.author}, ${tafsir.language}`,
                rtl: tafsir.language === "urdu",
              }))}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
