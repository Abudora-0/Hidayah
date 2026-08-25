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
  fetchPushQueue,
  onTestPushReceived,
  sendTestPush,
} from "@/lib/push-client";
import type { StoredLocation } from "@/lib/location";
import { useMounted } from "@/lib/hooks";
import type { Settings } from "@/lib/settings";
import { useLanguage } from "@/lib/i18n";

type PushControlProps = {
  location: StoredLocation | null;
  settings: Settings;
};

type Status = "unknown" | "off" | "on" | "working";
/**
 * The sentence for a failure, chosen by its code.
 *
 * The code travels from wherever the failure happened, including the server,
 * so the reader is told what went wrong in their own language. Anything the
 * platform added is appended, since that part cannot be translated and is
 * often the only thing that identifies an unusual fault.
 */
function describePushError(
  t: (key: string) => string,
  caught: unknown,
): string {
  if (!(caught instanceof PushError)) return t("push.err.refused");

  const sentence = t(`push.err.${caught.code}`);
  return caught.detail ? `${sentence} (${caught.detail})` : sentence;
}

type TestState = "idle" | "sending" | "sent" | "arrived";

export function PushControl({ location, settings }: PushControlProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("unknown");
  const [error, setError] = useState<string | null>(null);
  const [testState, setTestState] = useState<TestState>("idle");
  const [queued, setQueued] = useState<number | null>(null);
  const [scheduling, setScheduling] = useState(true);
  const [nextAt, setNextAt] = useState<string | null>(null);
  const [failed, setFailed] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);

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
        try {
          await disablePush();
        } finally {
          // Whatever the browser did with the subscription, the control has
          // to come back. Leaving it working disables it for good.
          setStatus("off");
          setTestState("idle");
          setQueued(null);
          setNextAt(null);
        }
        return;
      }

      if (!location) {
        setError(t("push.needLocation"));
        return;
      }
      if (enabledPrayers.length === 0) {
        setError(t("push.needPrayer"));
        return;
      }

      setStatus("working");
      try {
        const {
          scheduled,
          failed: failedCount,
          failure: failureReason,
          scheduling: canSchedule,
        } = await enablePush({
          location,
          method: settings.prayer.method,
          madhab: settings.prayer.madhab,
          prayers: enabledPrayers as PrayerKey[],
        });
        setQueued(scheduled);
        setScheduling(canSchedule);
        setFailed(failedCount);
        setFailure(failureReason);
        setStatus("on");
      } catch (caught) {
        setError(describePushError(t, caught));
        setStatus("off");
      }
    },
    [location, enabledPrayers, settings.prayer.method, settings.prayer.madhab],
  );

  useEffect(() => onTestPushReceived(() => setTestState("arrived")), []);

  useEffect(() => {
    if (status !== "on") return;
    let cancelled = false;
    fetchPushQueue().then((queue) => {
      if (cancelled || !queue) return;
      setQueued(queue.queued);
      setScheduling(queue.scheduling);
      setNextAt(queue.nextAt);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const test = useCallback(async () => {
    setError(null);
    setTestState("sending");
    try {
      await sendTestPush();
      setTestState("sent");
    } catch (caught) {
      setTestState("idle");
      setError(describePushError(t, caught));
    }
  }, []);

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
        {t("push.unsupported")}
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-ink">{t("push.notify")}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            {t("push.installHint")}
          </p>
        </div>
        <Toggle
          checked={status === "on"}
          onChange={(next) => void toggle(next)}
          disabled={status === "working" || !configured}
          label={t("push.toggleAria")}
        />
      </div>

      {!configured ? (
        <p className="mt-4 rounded-[10px] border border-line bg-surface-2 px-3.5 py-3 text-xs leading-relaxed text-ink-dim">
          {t("push.notConfiguredPanel")}
        </p>
      ) : null}

      {status === "on" ? (
        <p className="mt-4 rounded-[10px] border border-line bg-surface-2 px-3.5 py-3 text-xs leading-relaxed text-ink-dim">
          {t("push.stored")}
        </p>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          {t("push.willStore")}
        </p>
      )}

      {status === "on" && queued !== null ? (
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          {!scheduling
            ? t("push.schedulingOff")
            : failed > 0 && queued === 0
              ? t("push.queueFailed") + (failure ? ` (${failure})` : "")
            : queued > 0
              ? t("push.queued").replace("{n}", String(queued)) +
                (nextAt
                  ? " " +
                    t("push.queuedNext").replace(
                      "{time}",
                      new Date(nextAt).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: settings.display.hour12,
                      }),
                    )
                  : "")
              : t("push.queuedNone")}
        </p>
      ) : null}

      {status === "on" ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void test()}
            disabled={testState === "sending"}
            className="rounded-full border border-line px-4 py-2 text-xs text-ink-dim transition-colors duration-300 hover:border-gold hover:text-gold-ink disabled:opacity-45"
          >
            {testState === "sending" ? t("push.testSending") : t("push.test")}
          </button>
          {testState === "sent" ? (
            <span className="text-xs text-ink-faint">
              {t("push.testSent")}
            </span>
          ) : null}
          {testState === "arrived" ? (
            <span className="text-xs text-gold-ink">
              {t("push.testArrived")}
            </span>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-[10px] border border-line px-3.5 py-3 text-xs leading-relaxed text-ink-dim">
          {error}
        </p>
      ) : null}
    </div>
  );
}
