"use client";

import { useCallback, useEffect, useState } from "react";

import { Toggle } from "@/components/ui/Toggle";
import { OBLIGATORY_PRAYERS, type PrayerKey } from "@/lib/prayer";
import {
  PushError,
  currentSubscription,
  disablePush,
  enablePush,
  pushPublicKey,
  pushSupported,
} from "@/lib/push-client";
import type { StoredLocation } from "@/lib/location";
import { useMounted } from "@/lib/hooks";
import type { Settings } from "@/lib/settings";

type PushControlProps = {
  location: StoredLocation | null;
  settings: Settings;
};

type Status = "unknown" | "off" | "on" | "working";

export function PushControl({ location, settings }: PushControlProps) {
  const [status, setStatus] = useState<Status>("unknown");
  const [error, setError] = useState<string | null>(null);

  // Support cannot be tested on the server, and rendering the unsupported
  // branch there and the supported one after hydration is a mismatch. So the
  // check waits for mount, and a placeholder holds the space until then.
  const mounted = useMounted();
  const supported = mounted && pushSupported();
  const configured = Boolean(pushPublicKey());

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    currentSubscription()
      .then((subscription) => {
        if (!cancelled) setStatus(subscription ? "on" : "off");
      })
      .catch(() => {
        if (!cancelled) setStatus("off");
      });
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const enabledPrayers = OBLIGATORY_PRAYERS.filter(
    (prayer) => settings.alarm.prayers[prayer],
  );

  const toggle = useCallback(
    async (next: boolean) => {
      setError(null);

      if (!next) {
        setStatus("working");
        await disablePush();
        setStatus("off");
        return;
      }

      if (!location) {
        setError("Set your location first, so prayer times can be computed.");
        return;
      }
      if (enabledPrayers.length === 0) {
        setError("Choose at least one prayer below.");
        return;
      }

      setStatus("working");
      try {
        await enablePush({
          location,
          method: settings.prayer.method,
          madhab: settings.prayer.madhab,
          prayers: enabledPrayers as PrayerKey[],
        });
        setStatus("on");
      } catch (caught) {
        setError(
          caught instanceof PushError
            ? caught.message
            : "Notifications could not be enabled.",
        );
        setStatus("off");
      }
    },
    [location, enabledPrayers, settings.prayer.method, settings.prayer.madhab],
  );

  if (!mounted) {
    return (
      <div
        className="h-10 animate-pulse rounded-[10px] bg-surface-2"
        aria-hidden="true"
      />
    );
  }

  if (!supported) {
    return (
      <p className="text-sm leading-relaxed text-ink-dim">
        This browser cannot deliver notifications in the background. The alarm
        still sounds while Hidayah is open in a tab.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-ink">Notify me when the site is closed</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            Install Hidayah to your home screen for the most reliable delivery.
          </p>
        </div>
        <Toggle
          checked={status === "on"}
          onChange={(next) => void toggle(next)}
          disabled={status === "working" || !configured}
          label="Background prayer notifications"
        />
      </div>

      {!configured ? (
        <p className="mt-4 rounded-[10px] border border-line bg-surface-2 px-3.5 py-3 text-xs leading-relaxed text-ink-dim">
          Background notifications are not configured on this deployment. The
          alarm below still works whenever Hidayah is open.
        </p>
      ) : null}

      {status === "on" ? (
        <p className="mt-4 rounded-[10px] border border-line bg-surface-2 px-3.5 py-3 text-xs leading-relaxed text-ink-dim">
          Your coordinates and time zone are stored on the server so prayer
          times can be worked out while no browser is running. Turning this off
          deletes them.
        </p>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Turning this on sends your coordinates and time zone to the server.
          They are needed to work out prayer times when no browser is running,
          and are deleted when you turn it off.
        </p>
      )}

      {error ? (
        <p className="mt-4 rounded-[10px] border border-line px-3.5 py-3 text-xs leading-relaxed text-ink-dim">
          {error}
        </p>
      ) : null}
    </div>
  );
}
