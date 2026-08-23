<div align="center">

<img src="public/logo.svg" width="104" height="104" alt="Hidayah" />

# Hidayah

**هداية**

Prayer times for your location, the Hijri calendar with its occasions, and the
full Quran in Arabic, English and Urdu with tafsir and recitation.

[![License: MIT](https://img.shields.io/badge/License-MIT-D4AF37?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-087EA4?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/tests-41%20passing-1F6B53?style=flat-square&logo=vitest&logoColor=white)](#testing)
[![Contrast](https://img.shields.io/badge/WCAG%20AA-66%20checks-1F6B53?style=flat-square)](#contrast)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](#the-prayer-alarm)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/new)

`quran` &nbsp;·&nbsp; `prayer-times` &nbsp;·&nbsp; `salah` &nbsp;·&nbsp; `namaz` &nbsp;·&nbsp; `hijri-calendar` &nbsp;·&nbsp; `tafsir` &nbsp;·&nbsp; `adhan` &nbsp;·&nbsp; `qibla` &nbsp;·&nbsp; `nextjs` &nbsp;·&nbsp; `pwa` &nbsp;·&nbsp; `web-push` &nbsp;·&nbsp; `islamic-app`

</div>

---

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [The prayer alarm](#the-prayer-alarm)
- [Accuracy](#accuracy)
- [Design](#design)
- [Data sources](#data-sources)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Licence](#licence)

---

## Features

| | Feature | Detail |
| :--: | --- | --- |
| 🕌 | **Prayer times** | Computed on your device from your coordinates. Twelve calculation authorities, both Asr conventions, and correct behaviour at high latitude and inside the polar circle. |
| ⏳ | **Live countdown** | An engraved dial that fills as the window to the next prayer closes, with the full day timeline beside it. |
| 🔔 | **Prayer alarm** | Notifies you when a prayer begins, including when the site is closed. See [the prayer alarm](#the-prayer-alarm). |
| 🧭 | **Qibla compass** | The bearing to the Kaaba, following your device compass where the browser exposes one. |
| 🌙 | **Hijri calendar** | A month grid in Hijri and Gregorian together, marking Ramadan, both Eids, Ashura, Laylat al Qadr, Arafah, the white days and more. |
| 📖 | **The full Quran** | All 114 surahs in the Uthmani script, with ten English and eight Urdu translations. |
| 📜 | **Tafsir** | Per ayah commentary in English and Urdu, including Ibn Kathir and Bayan ul Quran. |
| 🎧 | **Recitation** | Seven reciters, per ayah playback, continuous recitation, repeat, and the ayah lighting up as it is recited. |
| 🎨 | **Three themes** | Emerald, Lapis and Ink, each with a real dark and light variant rather than one washed out copy of the other. |
| 📴 | **Works offline** | Prayer times need no network at all. Quran text is cached once and then served locally. |

---

## Getting started

Requires **Node 20 or newer**.

```bash
git clone https://github.com/Abudora-0/Hidayah.git
```

```bash
cd Hidayah && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Nothing needs configuring. Every environment variable is optional, and without
them the app runs in full except that the prayer alarm only fires while the
site is open in a tab.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in only what you need. All of
these are for background notifications, which is the one feature that cannot
work from the browser alone.

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push | Generate with `npm run generate-vapid`. Safe to expose. |
| `VAPID_PRIVATE_KEY` | Web Push | Keep secret. Never commit it. |
| `VAPID_SUBJECT` | Web Push | A `mailto:` address that push services can contact. |
| `UPSTASH_REDIS_REST_URL` | Storing subscriptions | From [Upstash](https://console.upstash.com). |
| `UPSTASH_REDIS_REST_TOKEN` | Storing subscriptions | From the same Upstash database. |
| `QSTASH_TOKEN` | Scheduling notifications | From the QStash tab in the Upstash console. |
| `QSTASH_CURRENT_SIGNING_KEY` | Verifying callbacks | Required, or the delivery route rejects everything. |
| `QSTASH_NEXT_SIGNING_KEY` | Verifying callbacks | Used during Upstash key rotation. |
| `NEXT_PUBLIC_SITE_URL` | Scheduling notifications | The public origin, used to build the callback URL. |
| `CRON_SECRET` | Guarding the cron route | Vercel sends this automatically on scheduled runs. |

Generate a VAPID key pair with:

```bash
npm run generate-vapid
```

---

## The prayer alarm

A browser can only notify you reliably in the background if the site is
installed and push is granted. Hidayah does that properly, and the design is
shaped by two hard limits worth knowing about.

**Vercel's Hobby plan allows one cron run per day**, with up to an hour of
drift. The usual "check every minute and notify whoever is due" pattern is not
available, and a cron expression that runs more often fails at deploy time.

**QStash accepts a delayed message up to seven days out** and delivers it at an
exact timestamp.

So the cron never delivers a notification. It only enqueues.

```
Daily cron  ->  /api/cron/schedule
                  for each subscriber:
                    work out their coming prayer times with adhan
                    hand each one to QStash, pinned to its exact instant
                             |
                QStash calls back at the exact minute
                             v
                /api/push/fire  ->  Web Push to that subscriber
                             v
                Service worker shows the notification
```

This is free, stays within the Hobby plan, and is more precise than a minute
cron would have been, because the hour of cron drift only affects when the work
is queued rather than when it lands.

A few details that matter:

- The cron covers a **rolling window slightly longer than a day**, so nothing
  can fall between two runs. Each prayer is claimed in Redis before being
  queued, so the overlap can never notify anyone twice.
- The delivery route **verifies the QStash signature**. It is a public URL, and
  without verification anyone could notify any subscriber at any time.
- Prayer times are computed against **each subscriber's own calendar day read
  through their time zone**, not the server's.
- **Your coordinates only leave your device if you turn this on.** The server
  needs them to work out prayer times when no browser is running. Turning the
  setting off deletes them.

Without the Upstash and VAPID variables set, all of this degrades cleanly to an
in tab alarm and the app tells you so plainly.

### The alarm sound

No adhan recording is bundled. Those recordings are someone's work with varying
licence terms, and the public endpoints that serve them proved rate limited and
unreliable. The default is a short chime synthesised in the browser, which
needs no network.

To use a real adhan, drop an audio file at `public/adhan.mp3`. It is picked up
automatically, with the chime as the fallback.

---

## Accuracy

Prayer times are calculated locally with [adhan](https://github.com/batoulapps/adhan-js)
rather than fetched, so they work offline and are never rate limited. Nothing
external is verifying them, so the settings screen has a **Check against
Aladhan** button that compares today's times against the Aladhan API for the
same authority and madhab, and reports the difference in minutes.

For Lahore with the Karachi authority and the Hanafi Asr, the two agree to
within one minute across all six times, which is rounding.

Hijri dates come from `Intl` with the Umm al Qura calendar, which ships with
the runtime. They were cross checked against Aladhan on the start of Ramadan,
both Eids and other dates, all matching.

> **A note on dates.** The Umm al Qura calendar is calculated rather than
> sighted. Your local announcement of Ramadan or Eid may fall a day either
> side, and the calendar says so on screen rather than implying a precision it
> does not have.

---

## Design

The mark is a **girih tile**, the outlined interlace star of Islamic
strapwork. It was chosen because it is line based, so the same geometry runs
through the whole interface rather than sitting in the corner as a logo: the
section rules, the ayah number rosettes, the quarter markers on the countdown
dial, the faint lattice behind the hero panels, and the illuminated `unwan`
panel that opens each surah.

Colours come from Quranic manuscript illumination rather than the usual palette
for this kind of app.

| Theme | Dark | Accent |
| --- | --- | --- |
| **Emerald** (default) | `#06231C` | `#D4AF37` |
| **Lapis** | `#0B1A2F` | `#C9A227` |
| **Ink** | `#121212` | `#B08D57` |

Typography pairs **Amiri Quran** for the Uthmani script, **Noto Nastaliq Urdu**
for Urdu with the line height Nastaliq needs, and **Reem Kufi** for headings
and the wordmark.

Every control is themed rather than left as a browser default: the scrollbar,
inputs, the range slider, checkboxes, radios, the focus ring, text selection,
and a custom listbox replacing the native `select`. All motion is behind
`prefers-reduced-motion`.

---

## Data sources

Hidayah is a client for work done by others, and it is worth naming them.

| Source | Used for |
| --- | --- |
| [Aladhan](https://aladhan.com) | Independent verification of prayer times and Hijri dates |
| [Al Quran Cloud](https://alquran.cloud) | Quran text and the English and Urdu translations |
| [spa5k/tafsir_api](https://github.com/spa5k/tafsir_api) | Tafsir editions, served over jsDelivr |
| [Islamic Network](https://islamic.network) | Per ayah recitation audio |
| [adhan](https://github.com/batoulapps/adhan-js) | The prayer time and Qibla calculations |

---

## Project structure

```
src/
  app/                    routes, API handlers, manifest and icons
    api/cron/schedule     the daily enqueue
    api/push/fire         QStash callback that sends one notification
  components/
    ornament/             the girih SVG library
    prayer/               countdown, timeline, Qibla, alarm
    quran/                surah index, reader, audio, tafsir
    calendar/             the Hijri month grid
    settings/             preferences and the Aladhan check
    ui/                   themed select, toggle, counter, theme switcher
  data/                   editions, reciters, occasions, cities
  lib/                    prayer, hijri, quran, push, theme, settings
scripts/
  check-no-emdash.mjs     lint rule described below
  generate-vapid.mjs      Web Push key generation
```

---

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint plus the em dash check |
| `npm run typecheck` | Route type generation and `tsc --noEmit` |
| `npm run test` | Vitest |
| `npm run check:contrast` | Audit colour contrast across all six palettes |
| `npm run check` | Lint, typecheck, test and contrast together |
| `npm run generate-vapid` | Print a fresh VAPID key pair |

`npm run lint` includes `scripts/check-no-emdash.mjs`, which fails the build if
an em dash appears anywhere in the source tree. The house style is a comma, a
colon or a full stop instead, and enforcing it mechanically means it cannot
quietly regress.

---

## Testing

```bash
npm run test
```

41 tests covering the parts most likely to break quietly:

- **Bismillah handling.** The Arabic edition prepends the bismillah to the
  first ayah of every surah except At Tawbah, which would print it twice given
  the surah opening already shows it. Stripping is done with diacritics removed,
  since the vowel marking differs between editions. Al Fatihah keeps it, because
  there it genuinely is ayah one.
- **Hijri conversion**, against dates confirmed with Aladhan, plus a round trip
  of every Hijri month across eleven years.
- **The prayer schedule**, including the rollover to tomorrow's Fajr after
  Isha, the window that reaches back to yesterday's Isha before dawn, and the
  later Hanafi Asr.

One of these tests found a real bug: inside the polar circle `adhan` returns
`NaN` for every prayer time unless `polarCircleResolution` is set.

### Contrast

```bash
npm run check:contrast
```

Three themes with a dark and light variant each is six palettes, which is more
than anyone can reliably eyeball. This checks every colour pairing the
interface actually uses against the WCAG AA thresholds, 4.5 for text and 3.0
for the boundaries of interactive controls, and fails if any pair falls short.

It was worth writing. The failures it found on its first run were not the
obvious ones: hint text sat between 3.1 and 4.5 against its background in
every single theme, and the one theme whose gold is dark needed light text on
gold fills while the other five needed dark. All 66 pairings pass now.

---

## Deployment

The app is built for Vercel.

1. Push the repository to GitHub and import it at
   [vercel.com/new](https://vercel.com/new). No build configuration is needed.
2. Add the environment variables above in **Settings, Environment Variables**,
   if you want background notifications. Set `NEXT_PUBLIC_SITE_URL` to the
   deployed origin.
3. The daily cron in `vercel.json` is picked up automatically. On the Hobby
   plan it runs once a day, which is all this design needs.

Surah pages are rendered on first request and then cached, rather than
prerendered at build time. Prerendering all 114 fires that many parallel
requests at a free API, which rate limits and fails the build.

---

## Contributing

Issues and pull requests are welcome. Before opening a pull request:

```bash
npm run check
```

Please keep to the two house rules: no em dashes anywhere, and every control
stays themed rather than falling back to a browser default.

---

## Licence

[MIT](LICENSE). Do what you like with it.

The Quran text, translations, tafsir and recitations belong to their
respective publishers and reciters and are served from the sources listed
above. The MIT licence covers this application, not that material.

---

<div align="center">

<sub>رَبِّ زِدْنِي عِلْمًا</sub>

</div>
