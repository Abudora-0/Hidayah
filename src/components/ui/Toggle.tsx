"use client";

type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
};

/**
 * A themed switch. The knob carries a small girih diamond so the control
 * belongs to the same family as everything around it.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
}: ToggleProps) {
  const width = size === "sm" ? 38 : 46;
  const height = size === "sm" ? 21 : 25;
  const knob = height - 6;
  const travel = width - knob - 6;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 rounded-full border transition-all duration-350 ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer hover:border-gold"
      } ${checked ? "border-gold bg-gold/18" : "border-line bg-surface-2"}`}
      style={{ width, height }}
    >
      <span
        className="absolute top-1/2 grid place-items-center rounded-full transition-all duration-350"
        style={{
          height: knob,
          width: knob,
          left: checked ? travel + 3 : 3,
          transform: "translateY(-50%)",
          backgroundColor: checked ? "var(--gold)" : "var(--line-strong)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-2.5 w-2.5"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="7"
            y="7"
            width="10"
            height="10"
            transform="rotate(45 12 12)"
            stroke={checked ? "var(--s0)" : "var(--s1)"}
            strokeWidth="2.5"
          />
        </svg>
      </span>
    </button>
  );
}
