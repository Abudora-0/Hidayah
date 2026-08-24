import type { Metadata, Viewport } from "next";
import {
  Amiri_Quran,
  Manrope,
  Marcellus,
  Noto_Nastaliq_Urdu,
  Reem_Kufi,
} from "next/font/google";

import { LanguageEffect } from "@/components/ui/LanguageSwitcher";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  THEME_BOOTSTRAP_SCRIPT,
} from "@/lib/theme";

import "./globals.css";

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const wordmark = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const display = Reem_Kufi({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const uthmani = Amiri_Quran({
  variable: "--font-uthmani",
  subsets: ["arabic"],
  weight: "400",
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hidayah",
    template: "%s | Hidayah",
  },
  description:
    "Prayer times for your location, the Hijri calendar with its occasions, and the full Quran in Arabic, English and Urdu with tafsir and recitation.",
  applicationName: "Hidayah",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Hidayah",
    statusBarStyle: "black-translucent",
  },
  keywords: [
    "quran",
    "prayer times",
    "salah",
    "namaz",
    "hijri calendar",
    "tafsir",
    "recitation",
    "islamic app",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#171614" },
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      data-mode={DEFAULT_MODE}
      className={`${body.variable} ${wordmark.variable} ${display.variable} ${uthmani.variable} ${nastaliq.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="hd-ground flex min-h-full flex-col">
        <LanguageEffect />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
