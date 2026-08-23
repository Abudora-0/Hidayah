"use client";

/**
 * The alarm sound.
 *
 * No recording is bundled. Adhan recordings are someone's work and their
 * licensing varies, and the public endpoints that serve them turned out to be
 * rate limited and unreliable. So the default is a short chime synthesised in
 * the browser, which needs no network and works offline.
 *
 * If a file exists at /public/adhan.mp3 it is used instead, so anyone running
 * this can drop in the muadhdhin they prefer.
 */

const CUSTOM_ADHAN = "/adhan.mp3";

let customAvailable: boolean | null = null;

async function hasCustomAdhan() {
  if (customAvailable !== null) return customAvailable;
  try {
    const res = await fetch(CUSTOM_ADHAN, { method: "HEAD" });
    customAvailable =
      res.ok && (res.headers.get("content-type") ?? "").includes("audio");
  } catch {
    customAvailable = false;
  }
  return customAvailable;
}

/**
 * A rising figure on a few soft sine tones. Deliberately plain: it marks the
 * time without imitating a call to prayer.
 */
function playChime() {
  type AudioContextCtor = typeof AudioContext;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext;

  if (!Ctor) return;

  const context = new Ctor();
  const now = context.currentTime;

  // A perfect fifth then an octave, three times, softening each pass.
  const notes = [
    { at: 0.0, hz: 523.25, gain: 0.16 },
    { at: 0.45, hz: 783.99, gain: 0.14 },
    { at: 0.9, hz: 1046.5, gain: 0.12 },
    { at: 1.6, hz: 523.25, gain: 0.11 },
    { at: 2.05, hz: 783.99, gain: 0.09 },
  ];

  for (const note of notes) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = note.hz;

    // Shaped envelope, so it rings rather than clicks.
    gain.gain.setValueAtTime(0, now + note.at);
    gain.gain.linearRampToValueAtTime(note.gain, now + note.at + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + 1.1);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + note.at);
    oscillator.stop(now + note.at + 1.2);
  }

  window.setTimeout(() => void context.close(), 4200);
}

export async function playAlarm() {
  if (await hasCustomAdhan()) {
    try {
      const audio = new Audio(CUSTOM_ADHAN);
      audio.volume = 0.9;
      await audio.play();
      return;
    } catch {
      // Autoplay can be blocked, or the file can be unplayable. Fall through.
    }
  }

  try {
    playChime();
  } catch {
    // Audio is unavailable. The notification still appears.
  }
}
