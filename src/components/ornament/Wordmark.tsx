import { GirihMark } from "./GirihMark";

type WordmarkProps = {
  /** Stacked centres the Arabic over the Latin. Inline is the header lockup. */
  layout?: "inline" | "stacked";
  size?: number;
  animated?: boolean;
  className?: string;
};

/**
 * The full lockup. The girih mark sits beside the Arabic name, with the Latin
 * name set in the same Kufi face and letterspaced so the two scripts read as
 * one piece rather than a translation bolted on.
 */
export function Wordmark({
  layout = "inline",
  size = 34,
  animated = false,
  className,
}: WordmarkProps) {
  if (layout === "stacked") {
    return (
      <div
        className={`flex flex-col items-center gap-3 ${className ?? ""}`}
        aria-label="Hidayah"
      >
        <GirihMark size={size * 1.9} animated={animated} className="text-gold" />
        <div className="flex flex-col items-center gap-1.5">
          <span
            dir="rtl"
            lang="ar"
            className="font-kufi text-gold-ink leading-none"
            style={{ fontSize: size * 0.95 }}
          >
            هداية
          </span>
          <span className="hd-rule w-full min-w-24" aria-hidden="true" />
          <span
            className="font-kufi text-gold-ink uppercase leading-none"
            style={{ fontSize: size * 0.36, letterSpacing: "0.34em" }}
          >
            Hidayah
          </span>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
      aria-label="Hidayah"
    >
      <GirihMark size={size} animated={animated} className="text-gold" />
      <span className="flex flex-col leading-none">
        <span
          className="font-kufi text-ink uppercase"
          style={{ fontSize: size * 0.42, letterSpacing: "0.26em" }}
        >
          Hidayah
        </span>
        <span
          dir="rtl"
          lang="ar"
          className="font-kufi text-gold-ink mt-1"
          style={{ fontSize: size * 0.4 }}
        >
          هداية
        </span>
      </span>
    </span>
  );
}
