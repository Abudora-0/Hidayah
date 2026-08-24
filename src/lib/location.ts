export type StoredLocation = {
  latitude: number;
  longitude: number;
  label: string;
  /** IANA zone, needed by the server when it schedules push notifications. */
  timeZone: string;
  source: "device" | "city";
};

export const LOCATION_STORAGE_KEY = "hidayah-location";

export function readStoredLocation(): StoredLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLocation;
    if (
      typeof parsed?.latitude !== "number" ||
      typeof parsed?.longitude !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/* ==========================================================================
   Store

   The stored location is external mutable state, so it is exposed through a
   subscription rather than copied into component state inside an effect. The
   snapshot is cached so its identity only changes when the value does, which
   is what useSyncExternalStore requires.
   ========================================================================== */

let cached: StoredLocation | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function getSnapshot(): StoredLocation | null {
  if (!loaded) {
    cached = readStoredLocation();
    loaded = true;
  }
  return cached;
}

// Null on the server, so the first client render agrees with the markup and
// the onboarding panel is what gets hydrated.
function getServerSnapshot(): StoredLocation | null {
  return null;
}

export function subscribeToLocation(listener: () => void) {
  listeners.add(listener);

  function onStorage(event: StorageEvent) {
    if (event.key === LOCATION_STORAGE_KEY) {
      loaded = false;
      for (const l of listeners) l();
    }
  }

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const locationStore = {
  subscribe: subscribeToLocation,
  getSnapshot,
  getServerSnapshot,
};

export function writeStoredLocation(location: StoredLocation) {
  cached = location;
  loaded = true;
  try {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Private browsing. The location still applies for this session.
  }
  for (const listener of listeners) listener();
}

export function currentTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

type ReverseGeocode = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

/**
 * Turns coordinates into something a person recognises. Purely cosmetic, so a
 * failure here degrades to showing the coordinates rather than blocking.
 */
export async function describeCoordinates(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string> {
  const fallback = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal },
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as ReverseGeocode;
    const place = data.city || data.locality || data.principalSubdivision;
    if (place && data.countryName) return `${place}, ${data.countryName}`;
    return place || data.countryName || fallback;
  } catch {
    return fallback;
  }
}

export class LocationError extends Error {
  constructor(
    message: string,
    readonly kind: "unsupported" | "denied" | "unavailable" | "timeout",
  ) {
    super(message);
    this.name = "LocationError";
  }
}

export function requestDeviceLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(
        new LocationError(
          "This browser cannot report your location.",
          "unsupported",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        reject(
          new LocationError(
            "Location access was declined. Search for your city instead.",
            "denied",
          ),
        );
      } else if (error.code === error.TIMEOUT) {
        reject(
          new LocationError("Locating you took too long. Try again.", "timeout"),
        );
      } else {
        reject(
          new LocationError(
            "Your device could not get a location fix. Check that location services are turned on for this browser, then try again, or search for your city instead.",
            "unavailable",
          ),
        );
      }
    }, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}
