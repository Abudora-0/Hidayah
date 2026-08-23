"use client";

import { useState } from "react";

import {
  METHODS,
  PRAYER_LABELS,
  formatTime,
  getPrayerSchedule,
  type MadhabKey,
  type MethodKey,
  type PrayerKey,
} from "@/lib/prayer";
import type { StoredLocation } from "@/lib/location";

type Row = { key: PrayerKey; local: Date; remote: string; diff: number };

const CHECKED: PrayerKey[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

/**
 * An independent check of the times this app computes.
 *
 * Prayer times are calculated on the device, which is fast and works offline
 * but means nothing external is verifying them. This compares today against
 * the Aladhan API for the same authority and madhab, and shows the difference
 * in plain minutes rather than asking anyone to take it on trust.
 */
export function AladhanCheck({
  location,
  method,
  madhab,
  hour12,
}: {
  location: StoredLocation;
  method: MethodKey;
  madhab: MadhabKey;
  hour12: boolean;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");

  async function run() {
    setStatus("checking");
    try {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const url =
        `https://api.aladhan.com/v1/timings/${dd}-${mm}-${now.getFullYear()}` +
        `?latitude=${location.latitude}&longitude=${location.longitude}` +
        `&method=${METHODS[method].aladhanId}&school=${madhab === "hanafi" ? 1 : 0}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));

      const body = (await response.json()) as {
        data: { timings: Record<string, string> };
      };

      const schedule = getPrayerSchedule(
        location.latitude,
        location.longitude,
        { method, madhab },
        now,
      );

      const next: Row[] = CHECKED.map((key) => {
        const local = schedule.entries.find((e) => e.key === key)!.time;
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        const remote = (body.data.timings[label] ?? "").split(" ")[0];
        const [rh, rm] = remote.split(":").map(Number);
        const diff =
          local.getHours() * 60 + local.getMinutes() - (rh * 60 + rm);
        return { key, local, remote, diff };
      });

      setRows(next);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const worst = rows
    ? Math.max(...rows.map((row) => Math.abs(row.diff)))
    : null;

  return (
    <div>
      <p className="text-sm leading-relaxed text-ink-dim">
        Times are computed on your device. This compares today against the
        Aladhan API using the same authority and madhab.
      </p>

      <button
        type="button"
        onClick={() => void run()}
        disabled={status === "checking"}
        className="mt-4 rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-all duration-300 hover:border-gold hover:text-gold-ink disabled:opacity-50"
      >
        {status === "checking" ? "Checking" : "Check against Aladhan"}
      </button>

      {status === "error" ? (
        <p className="mt-4 text-xs leading-relaxed text-ink-dim">
          The check could not be run. Aladhan may be unreachable right now.
          Your prayer times are unaffected, since they are computed locally.
        </p>
      ) : null}

      {rows ? (
        <div className="mt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[0.62rem] uppercase tracking-[0.18em] text-ink-faint">
                <th className="pb-2 font-normal">Prayer</th>
                <th className="pb-2 text-right font-normal">Hidayah</th>
                <th className="pb-2 text-right font-normal">Aladhan</th>
                <th className="pb-2 text-right font-normal">Diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-line">
                  <td className="py-2 text-ink">{PRAYER_LABELS[row.key].en}</td>
                  <td className="py-2 text-right tabular-nums text-ink-dim">
                    {formatTime(row.local, hour12)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-ink-dim">
                    {row.remote}
                  </td>
                  <td
                    className={`py-2 text-right tabular-nums ${
                      Math.abs(row.diff) <= 1 ? "text-ink-faint" : "text-gold-ink"
                    }`}
                  >
                    {row.diff > 0 ? "+" : ""}
                    {row.diff}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            {worst !== null && worst <= 1
              ? "The two agree to within a minute, which is rounding."
              : `Largest difference is ${worst} minutes. Differences of more than a minute usually mean a different madhab or a local adjustment.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
