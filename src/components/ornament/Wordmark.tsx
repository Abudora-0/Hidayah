type WordmarkProps = {
  /** Stacked centres the Arabic under the Latin, for heroes. Inline is the header. */
  layout?: "inline" | "stacked";
  /** Cap height of the Latin line in pixels. Everything else scales from it. */
  size?: number;
  animated?: boolean;
  className?: string;
};

/**
 * The logo.
 *
 * The girih star used to sit beside this and now appears only as the favicon,
 * so the wordmark carries the identity on its own and is set larger to do it.
 * Marcellus for the Latin against Reem Kufi for the Arabic: a classical serif
 * with enough weight to hold at header size, over the geometric Kufi already
 * used for headings.
 */
export function Wordmark({
  layout = "inline",
  size = 26,
  animated = true,
  className,
}: WordmarkProps) {
  const stacked = layout === "stacked";

  const latin = (
    <span
      className={`font-wordmark block uppercase leading-none ${
        animated ? "hd-sheen" : "text-gold-ink"
      }`}
      style={{
        fontSize: size,
        letterSpacing: stacked ? "0.22em" : "0.15em",
        // Letterspacing adds a trailing gap that visually decentres the word.
        textIndent: stacked ? "0.22em" : "0.15em",
      }}
    >
      Hidayah
    </span>
  );

  const rule = (
    <span
      aria-hidden="true"
      className={`hd-rule block ${animated ? "hd-open" : ""}`}
      style={{
        width: stacked ? size * 6.4 : size * 4.6,
        marginTop: stacked ? size * 0.36 : size * 0.22,
        marginBottom: stacked ? size * 0.34 : size * 0.2,
      }}
    />
  );

  const arabic = (
    <span
      dir="rtl"
      lang="ar"
      className="font-kufi block leading-none text-gold-ink"
      style={{ fontSize: stacked ? size * 1.15 : size * 0.86 }}
    >
      هداية
    </span>
  );

  return (
    <span
      className={`inline-flex flex-col ${stacked ? "items-center" : "items-start"} ${className ?? ""}`}
      aria-label="Hidayah"
      role="img"
    >
      {latin}
      {rule}
      {arabic}
    </span>
  );
}
