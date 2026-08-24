import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JuzReader } from "@/components/quran/JuzReader";
import { DEFAULT_ENGLISH, DEFAULT_URDU } from "@/data/editions";
import { fetchJuz } from "@/lib/quran";

const PRELOADED = [DEFAULT_ENGLISH, DEFAULT_URDU];

/** Rendered on first request then cached, as the surah pages are. */
export const revalidate = 31536000;

function parseJuz(value: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 30) return null;
  return number;
}

export async function generateMetadata({
  params,
}: PageProps<"/quran/juz/[juz]">): Promise<Metadata> {
  const { juz } = await params;
  const number = parseJuz(juz);
  if (!number) return { title: "Para not found" };

  return {
    title: `Para ${number}`,
    description: `Read juz ${number} of the Quran in Arabic with English and Urdu translation, tafsir and recitation.`,
  };
}

export default async function JuzPage({ params }: PageProps<"/quran/juz/[juz]">) {
  const { juz: raw } = await params;
  const number = parseJuz(raw);
  if (!number) notFound();

  const juz = await fetchJuz(number, PRELOADED);

  return (
    <JuzReader
      juz={juz}
      previous={number > 1 ? number - 1 : null}
      next={number < 30 ? number + 1 : null}
    />
  );
}
