"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { GirihRule } from "@/components/ornament/GirihRule";
import { Lattice } from "@/components/ornament/Lattice";
import { Wordmark } from "@/components/ornament/Wordmark";
import { CountdownRing } from "./CountdownRing";
import { LocationBar } from "./LocationBar";
import { PrayerTimeline } from "./PrayerTimeline";
import { QiblaCompass } from "./QiblaCompass";
import { useNow } from "@/lib/hooks";
import { formatHijri, formatHijriArabic, toHijriObservingSunset } from "@/lib/hijri";
import { locationStore, writeStoredLocation, type StoredLocation } from "@/lib/location";
import {
  formatTime,
  getPrayerSchedule,
  windowProgress,
  type PrayerKey,
} from "@/lib/prayer";
import { setAlarmForPrayer, useSettings } from "@/lib/settings";

export function PrayerDashboard() {
  const settings = useSettings();
  const now = useNow();
  const location = useSyncExternalStore(
    locationStore.subscribe,
    locationStore.getSnapshot,
    locationStore.getServerSnapshot,
  );

  const handleLocationChange = useCallback((next: StoredLocation) => {
    writeStoredLocation(next);
  }, []);

  const schedule = useMemo(() => {
    if (!location || !now) return null;
    return getPrayerSchedule(
      location.latitude,
      location.longitude,
      { method: settings.prayer.method, madhab: settings.prayer.madhab },
      now,
    );
  }, [location, now, settings.prayer.method, settings.prayer.madhab]);

  const hijri = useMemo(() => {
    if (!now) return null;
    const maghrib = schedule?.entries.find((e) => e.key === "maghrib")?.time;
    return toHijriObservingSunset(now, maghrib);
  }, [now, schedule]);

  const onAlarmChange = useCallback((prayer: PrayerKey, enabled: boolean) => {
    setAlarmForPrayer(prayer, enabled);
  }, []);

  if (!location) {
    return <LocationOnboarding onChange={handleLocationChange} />;
  }

  if (!schedule || !now || !hijri) {
    return <DashboardSkeleton />;
  }

  const progress = windowProgress(schedule.previousTime, schedule.next.time, now);
  const remainingMs = schedule.next.time.getTime() - now.getTime();

  return (
    <div className="relative">
      <Lattice className="text-gold" scale={104} opacity={0.05} />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col items-center gap-5 text-center">
          <div>
            <p className="font-kufi text-lg text-gold-ink sm:text-xl">
              {formatHijri(hijri)}
            </p>
            <p
              dir="rtl"
              lang="ar"
              className="font-quran mt-1 text-sm text-ink-faint"
            >
              {formatHijriArabic(hijri)}
            </p>
            <p className="mt-2 text-xs text-ink-faint">
              {new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(now)}
            </p>
          </div>

          <LocationBar location={location} onChange={handleLocationChange} />
        </div>

        <GirihRule className="my-10" />

        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-14">
          <div className="hd-fade-up flex justify-center">
            <CountdownRing
              prayerKey={schedule.next.key}
              target={schedule.next.time}
              progress={progress}
              remainingMs={remainingMs}
              hour12={settings.display.hour12}
              isTomorrow={schedule.next.isTomorrow}
            />
          </div>

          <section aria-label="Prayer times for today">
            <PrayerTimeline
              entries={schedule.entries}
              currentKey={schedule.currentKey}
              nextKey={schedule.next.key}
              hour12={settings.display.hour12}
              alarms={settings.alarm.prayers}
              onAlarmChange={onAlarmChange}
            />
          </section>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="hd-card flex flex-col items-center gap-4 p-6">
            <h2 className="font-kufi text-sm uppercase tracking-[0.24em] text-ink-faint">
              Qibla
            </h2>
            <QiblaCompass bearing={schedule.qibla} />
          </div>

          <div className="hd-card p-6">
            <h2 className="font-kufi text-sm uppercase tracking-[0.24em] text-ink-faint">
              Night
            </h2>
            <dl className="mt-5 flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-ink-dim">Middle of the night</dt>
                <dd className="font-kufi tabular-nums text-gold-ink">
                  {formatTime(schedule.sunnah.middleOfTheNight, settings.display.hour12)}
                </dd>
              </div>
              <div className="hd-rule" />
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-ink-dim">Last third begins</dt>
                <dd className="font-kufi tabular-nums text-gold-ink">
                  {formatTime(schedule.sunnah.lastThirdOfTheNight, settings.display.hour12)}
                </dd>
              </div>
            </dl>
            <p className="mt-5 text-xs leading-relaxed text-ink-faint">
              The last third is the time of tahajjud, counted from Maghrib to
              the following Fajr.
            </p>
          </div>

          <div className="hd-card p-6 sm:col-span-2 lg:col-span-1">
            <h2 className="font-kufi text-sm uppercase tracking-[0.24em] text-ink-faint">
              Calculation
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-dim">
              Times are computed on your device from your coordinates, so they
              work offline and are never rate limited.
            </p>
            <div className="hd-rule my-4" />
            <p className="text-xs text-ink-faint">
              Method and madhab can be changed in settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="h-4 w-40 animate-pulse rounded-full bg-surface-2" />
        <div className="h-[260px] w-[260px] animate-pulse rounded-full bg-surface-2" />
        <div className="h-4 w-56 animate-pulse rounded-full bg-surface-2" />
      </div>
    </div>
  );
}

function LocationOnboarding({
  onChange,
}: {
  onChange: (location: StoredLocation) => void;
}) {
  return (
    <div className="relative overflow-hidden">
      <Lattice className="text-gold" scale={96} opacity={0.06} />

      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <Wordmark layout="stacked" size={38} animated />

        <GirihRule className="my-10 w-full max-w-xs" />

        <h1 className="font-kufi text-2xl text-ink">Where are you praying?</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-dim">
          Prayer times depend on your coordinates. Allow location access, or
          pick the nearest city. Your location stays on this device.
        </p>

        <div className="mt-8">
          <LocationBar location={null} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
