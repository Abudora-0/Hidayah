"use client";

import { useCallback, useEffect, useState } from "react";

type QiblaCompassProps = {
  /** Bearing to the Kaaba in degrees clockwise from true north. */
  bearing: number;
};

type OrientationEventWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type PermissionRequester = (() => Promise<PermissionState>) | undefined;

/**
 * iOS gates the compass behind an explicit user gesture. Everywhere else the
 * orientation events simply arrive. This is a fixed capability of the browser,
 * so it is read once during render rather than discovered in an effect.
 */
function compassPermissionRequester(): PermissionRequester {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return undefined;
  }
  const requester = (
    DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<PermissionState>;
    }
  ).requestPermission;
  return typeof requester === "function" ? requester : undefined;
}

const SIZE = 172;
const R = SIZE / 2;

export function QiblaCompass({ bearing }: QiblaCompassProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [granted, setGranted] = useState(false);
  const [requester] = useState<PermissionRequester>(compassPermissionRequester);
  const needsPermission = requester !== undefined && !granted;

  const onOrientation = useCallback((event: DeviceOrientationEvent) => {
    const withCompass = event as OrientationEventWithCompass;
    if (typeof withCompass.webkitCompassHeading === "number") {
      setHeading(withCompass.webkitCompassHeading);
    } else if (typeof event.alpha === "number") {
      setHeading(360 - event.alpha);
    }
  }, []);

  useEffect(() => {
    if (needsPermission) return;
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      return;
    }

    window.addEventListener("deviceorientation", onOrientation, true);
    return () =>
      window.removeEventListener("deviceorientation", onOrientation, true);
  }, [needsPermission, onOrientation]);

  const enableCompass = useCallback(async () => {
    if (!requester) return;
    try {
      const state = await requester();
      // The effect above attaches the listener once this flips.
      if (state === "granted") setGranted(true);
    } catch {
      // Declined. The static dial still gives the bearing.
    }
  }, [requester]);

  // With a live heading the whole dial counter rotates so the needle points at
  // the real world direction. Without one it simply shows the bearing.
  const dialRotation = heading === null ? 0 : -heading;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${dialRotation}deg)` }}
          role="img"
          aria-label={`Qibla is ${Math.round(bearing)} degrees from north`}
        >
          <circle
            cx={R}
            cy={R}
            r={R - 4}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-line"
          />
          <circle
            cx={R}
            cy={R}
            r={R - 22}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-line"
            strokeDasharray="2 6"
          />

          {Array.from({ length: 72 }).map((_, i) => {
            const major = i % 9 === 0;
            return (
              <line
                key={i}
                x1={R}
                y1={8}
                x2={R}
                y2={major ? 18 : 13}
                stroke="currentColor"
                strokeWidth={major ? 1.6 : 0.8}
                className={major ? "text-gold" : "text-line-strong"}
                transform={`rotate(${i * 5} ${R} ${R})`}
              />
            );
          })}

          {[
            { label: "N", angle: 0 },
            { label: "E", angle: 90 },
            { label: "S", angle: 180 },
            { label: "W", angle: 270 },
          ].map((point) => (
            <text
              key={point.label}
              x={R}
              y={30}
              textAnchor="middle"
              className="fill-ink-faint font-kufi"
              fontSize="11"
              transform={`rotate(${point.angle} ${R} ${R})`}
            >
              {point.label}
            </text>
          ))}

          {/* The qibla needle */}
          <g transform={`rotate(${bearing} ${R} ${R})`}>
            <line
              x1={R}
              y1={R}
              x2={R}
              y2={26}
              stroke="currentColor"
              strokeWidth="2"
              className="text-gold"
            />
            <rect
              x={R - 7}
              y={19}
              width="14"
              height="14"
              transform={`rotate(45 ${R} 26)`}
              fill="currentColor"
              className="text-gold"
            />
          </g>

          <circle cx={R} cy={R} r="4" fill="currentColor" className="text-gold-soft" />
        </svg>
      </div>

      <div className="text-center">
        <p className="font-kufi text-2xl tabular-nums text-gold-ink">
          {Math.round(bearing)}
          <span className="text-base text-ink-faint">&deg;</span>
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          {heading === null
            ? "Bearing from true north"
            : "Following your device compass"}
        </p>
      </div>

      {needsPermission ? (
        <button
          type="button"
          onClick={enableCompass}
          className="rounded-full border border-line px-4 py-1.5 text-xs text-ink-dim transition-colors duration-300 hover:border-gold hover:text-gold-ink"
        >
          Use live compass
        </button>
      ) : null}
    </div>
  );
}
