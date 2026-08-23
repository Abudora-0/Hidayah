"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  note?: string;
  /** Rendered right aligned, used for Arabic and Urdu names. */
  trailing?: string;
  rtl?: boolean;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
};

/**
 * A themed listbox replacing the native select, which cannot be styled to
 * match the rest of the interface. Keyboard behaviour follows the listbox
 * pattern: arrows move, Home and End jump, Enter commits, Escape closes.
 */
export function Select({
  value,
  options,
  onChange,
  label,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value)),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value) ?? options[0];

  const close = useCallback(() => setOpen(false), []);

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      setActiveIndex(index);
      setOpen(false);
    },
    [onChange, options],
  );

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    // Keep the highlighted row in view when moving with the keyboard.
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex);
        break;
    }
  }

  return (
    <div className={`relative ${className ?? ""}`} ref={rootRef}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-line bg-surface-2 px-3.5 py-2.5 text-left transition-all duration-300 hover:border-gold"
      >
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm text-ink ${selected?.rtl ? "font-urdu" : ""}`}
            dir={selected?.rtl ? "rtl" : undefined}
          >
            {selected?.label}
          </span>
          {selected?.note ? (
            <span className="mt-0.5 block truncate text-[0.68rem] text-ink-faint">
              {selected.note}
            </span>
          ) : null}
        </span>

        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          ref={listRef}
          tabIndex={-1}
          className="hd-fade-up absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-72 overflow-y-auto rounded-[12px] border border-line bg-surface-1 p-1.5"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                className={`flex cursor-pointer items-center gap-3 rounded-[9px] px-3 py-2 transition-colors duration-200 ${
                  index === activeIndex ? "bg-surface-2" : ""
                } ${isSelected ? "text-gold-ink" : "text-ink"}`}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${option.rtl ? "font-urdu" : ""}`}
                    dir={option.rtl ? "rtl" : undefined}
                  >
                    {option.label}
                  </span>
                  {option.note ? (
                    <span className="mt-0.5 block truncate text-[0.68rem] text-ink-faint">
                      {option.note}
                    </span>
                  ) : null}
                </span>

                {option.trailing ? (
                  <span
                    dir="rtl"
                    lang="ar"
                    className="font-quran shrink-0 text-sm text-ink-faint"
                  >
                    {option.trailing}
                  </span>
                ) : null}

                {isSelected ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0 text-gold"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 13 4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
