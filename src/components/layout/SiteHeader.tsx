"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/ornament/Wordmark";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

const NAV = [
  { href: "/", label: "Prayer", arabic: "الصلاة" },
  { href: "/quran", label: "Quran", arabic: "القرآن" },
  { href: "/calendar", label: "Calendar", arabic: "التقويم" },
  { href: "/settings", label: "Settings", arabic: "الإعدادات" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  // No backdrop blur on this bar. Blurring the backdrop of a sticky element
  // forces a full re-blur every scroll frame, which smears the page while
  // scrolling. A near opaque fill reads the same and costs nothing, and
  // transition-colors keeps the browser from trying to transition filters.
  return (
    <header
      className={`sticky top-0 z-header border-b transition-colors duration-300 ${
        scrolled
          ? "border-line bg-surface-0/95"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 transition-opacity duration-300 hover:opacity-80"
        >
          <Wordmark size={19} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
                  active ? "text-gold-ink" : "text-ink-dim hover:text-ink"
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-3 -bottom-px h-px origin-center bg-gold transition-transform duration-400 ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line transition-colors duration-300 hover:border-gold md:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 h-px w-full bg-ink transition-all duration-300 ${
                  menuOpen ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-px w-full bg-ink transition-opacity duration-300 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-full bg-ink transition-all duration-300 ${
                  menuOpen ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="hd-fade-up border-t border-line bg-surface-1 md:hidden">
          <ul className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between border-b border-line/60 py-3.5 text-sm transition-colors duration-300 last:border-b-0 ${
                    isActive(item.href) ? "text-gold-ink" : "text-ink-dim"
                  }`}
                >
                  {item.label}
                  <span dir="rtl" lang="ar" className="font-kufi text-ink-faint">
                    {item.arabic}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
