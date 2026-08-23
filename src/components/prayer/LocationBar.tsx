"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { searchCities, type City } from "@/data/cities";
import {
  LocationError,
  currentTimeZone,
  describeCoordinates,
  requestDeviceLocation,
  type StoredLocation,
} from "@/lib/location";

type LocationBarProps = {
  location: StoredLocation | null;
  onChange: (location: StoredLocation) => void;
};

export function LocationBar({ location, onChange }: LocationBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Derived from the query, so it is computed during render rather than
  // mirrored into state by an effect.
  const results = useMemo(() => searchCities(query), [query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function useDeviceLocation() {
    setLocating(true);
    setError(null);
    try {
      const position = await requestDeviceLocation();
      const { latitude, longitude } = position.coords;
      const label = await describeCoordinates(latitude, longitude);
      onChange({
        latitude,
        longitude,
        label,
        timeZone: currentTimeZone(),
        source: "device",
      });
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof LocationError
          ? caught.message
          : "Your location could not be determined.",
      );
    } finally {
      setLocating(false);
    }
  }

  function pickCity(city: City) {
    onChange({
      latitude: city.lat,
      longitude: city.lng,
      label: `${city.name}, ${city.country}`,
      timeZone: currentTimeZone(),
      source: "city",
    });
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex items-center gap-2.5 rounded-full border border-line px-4 py-2 transition-all duration-300 hover:border-gold"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-hover:scale-110"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="max-w-[16rem] truncate text-sm text-ink">
          {location ? location.label : "Set your location"}
        </span>
      </button>

      {open ? (
        <div className="hd-fade-up absolute left-1/2 top-12 z-40 w-[19rem] -translate-x-1/2 rounded-[14px] border border-line bg-surface-1 p-3">
          <button
            type="button"
            onClick={useDeviceLocation}
            disabled={locating}
            className="flex w-full items-center gap-3 rounded-[10px] border border-line px-3 py-2.5 text-left transition-all duration-300 hover:border-gold hover:bg-surface-2 disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 shrink-0 text-gold ${locating ? "hd-spin-slow" : ""}`}
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span className="text-sm text-ink">
              {locating ? "Locating you" : "Use my location"}
            </span>
          </button>

          {error ? (
            <p className="mt-2 rounded-[10px] border border-line px-3 py-2 text-xs leading-relaxed text-ink-dim">
              {error}
            </p>
          ) : null}

          <div className="hd-rule my-3" />

          <label className="sr-only" htmlFor="city-search">
            Search for a city
          </label>
          <input
            id="city-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a city"
            autoComplete="off"
          />

          {results.length > 0 ? (
            <ul className="mt-2 flex max-h-56 flex-col gap-0.5 overflow-y-auto">
              {results.map((city) => (
                <li key={`${city.name}-${city.country}-${city.lat}`}>
                  <button
                    type="button"
                    onClick={() => pickCity(city)}
                    className="flex w-full items-baseline justify-between gap-3 rounded-[10px] px-3 py-2 text-left transition-colors duration-250 hover:bg-surface-2"
                  >
                    <span className="text-sm text-ink">{city.name}</span>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {city.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <p className="mt-2 px-1 text-xs text-ink-faint">
              No match. Try the nearest large city, or allow location access.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
