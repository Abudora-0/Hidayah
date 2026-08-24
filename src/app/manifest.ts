import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hidayah",
    short_name: "Hidayah",
    description:
      "Prayer times, the Hijri calendar and the full Quran with translation, tafsir and recitation.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#171614",
    theme_color: "#171614",
    categories: ["lifestyle", "education", "books"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/512?maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
