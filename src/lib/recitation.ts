"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ayahAudioUrl } from "./quran";

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

type Options = {
  /** How many ayahs are in this reading. */
  count: number;
  /** The global ayah number at a position, which is what names the audio file. */
  globalNumberAt: (index: number) => number | undefined;
  reciterId: string;
  /** Called when playback moves, so the reader can turn the page with it. */
  onIndexChange?: (index: number) => void;
};

export function formatSeconds(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Continuous recitation.
 *
 * The whole surah or para plays straight through: when one ayah finishes the
 * next begins on its own, and the next file is warmed in advance so the gap
 * between them is as short as the network allows.
 *
 * Two things had been breaking that, both here rather than in the browser.
 * Calling load() after assigning src aborts the play() that follows it, and
 * the rejected promise was being treated as a genuine failure and used to stop
 * playback. Assigning src is enough on its own, so load() is gone, and an
 * abort is now distinguished from a real refusal.
 *
 * Progress is written straight to the DOM rather than held in state. The
 * timeupdate event only fires about four times a second, which is what made
 * the bar jump, and re-rendering the player sixty times a second to smooth it
 * would be worse than the problem.
 */
export function useRecitation({
  count,
  globalNumberAt,
  reciterId,
  onIndexChange,
}: Options) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekRef = useRef<HTMLInputElement>(null);
  const elapsedRef = useRef<HTMLSpanElement>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef(0);

  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [repeat, setRepeat] = useState(false);

  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const globalNumber = index === null ? undefined : globalNumberAt(index);
  const src = globalNumber ? ayahAudioUrl(reciterId, globalNumber) : undefined;

  /* ---------------------------------------------------------------- source */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // No load() here. It aborts the play() below, and the resulting rejection
    // was being read as a failure and used to stop the recitation.
    audio.src = src;
    audio.playbackRate = rate;

    if (!playingRef.current) return;

    audio.play().catch((error: DOMException) => {
      // An abort means something interrupted this attempt, usually the next
      // ayah arriving, and playback is continuing regardless. Only a refusal
      // by the browser genuinely means nothing is playing.
      if (error?.name === "AbortError") return;
      setPlaying(false);
    });
  }, [src, rate]);

  /* --------------------------------------------------------------- preload */

  useEffect(() => {
    if (index === null) return;
    const nextNumber = globalNumberAt(index + 1);
    if (!nextNumber) return;

    // Warms the next file while the current one plays, so the join is tight.
    const preload = new Audio(ayahAudioUrl(reciterId, nextNumber));
    preload.preload = "auto";
    preloadRef.current = preload;

    return () => {
      preload.src = "";
      preloadRef.current = null;
    };
  }, [index, globalNumberAt, reciterId]);

  /* ------------------------------------------------------------ play state */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch((error: DOMException) => {
        if (error?.name === "AbortError") return;
        setPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
  }, [rate]);

  /* -------------------------------------------------------------- progress */

  // Writes the current position to the bar and the elapsed label.
  const paint = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const total = Number.isFinite(audio.duration) ? audio.duration : 0;
    const fraction = total > 0 ? audio.currentTime / total : 0;

    const seek = seekRef.current;
    if (seek) {
      seek.value = String(Math.round(fraction * 1000));
      seek.style.setProperty("--range-progress", `${fraction * 100}%`);
    }

    const elapsed = elapsedRef.current;
    if (elapsed) elapsed.textContent = formatSeconds(audio.currentTime);
  }, []);

  // Sixty frames a second while the page is being drawn, which is what makes
  // the bar move smoothly rather than jumping four times a second.
  //
  // The element's own timeupdate is kept as a floor, since animation frames
  // stop entirely in a background tab and the bar would otherwise freeze.
  useEffect(() => {
    if (!playing) return;

    function tick() {
      paint();
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, paint]);

  /* --------------------------------------------------------------- actions */

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(0, next), count - 1);
      setIndex(clamped);
      onIndexChange?.(clamped);
      return clamped;
    },
    [count, onIndexChange],
  );

  const playAt = useCallback(
    (next: number) => {
      goTo(next);
      setVisible(true);
      setPlaying(true);
    },
    [goTo],
  );

  const toggle = useCallback(() => setPlaying((p) => !p), []);

  const onEnded = useCallback(() => {
    const audio = audioRef.current;

    if (repeat && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => undefined);
      return;
    }

    // Straight into the next ayah. This is what makes a whole surah play
    // through without anyone pressing next.
    if (index !== null && index < count - 1) {
      goTo(index + 1);
    } else {
      setPlaying(false);
    }
  }, [repeat, index, count, goTo]);

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = audio.duration * fraction;
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;

    // Stopped at the element rather than only in state. A play() from the
    // ayah that just ended can still be in flight when this runs, and asking
    // React to stop does not cancel it, so the recitation used to carry on
    // out of sight after the player was closed. Dropping the source ends both
    // the playback and the download.
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    setPlaying(false);
    setVisible(false);
    setIndex(null);
  }, []);

  return {
    audioRef,
    seekRef,
    elapsedRef,
    index,
    playing,
    visible,
    duration,
    rate,
    repeat,
    setRate,
    setRepeat,
    playAt,
    goTo,
    toggle,
    seek,
    close,
    onEnded,
    onDurationChange: (value: number) => setDuration(value),
    onTimeUpdate: paint,
    onPlay: () => {
      if (!visibleRef.current) return;
      setPlaying(true);
    },
  };
}
