import { readFileSync } from "node:fs";

/**
 * Checks every colour pairing the interface actually uses, in all three themes
 * and both modes, against the WCAG AA thresholds.
 *
 * Six palettes is too many to eyeball, and the failures found when this was
 * first run were not obvious ones: hint text sat between 3.1 and 4.5 in every
 * theme, and the one theme whose gold is dark needed light text on it while the
 * other five needed dark.
 */

const css = readFileSync("src/app/globals.css", "utf8");

// Pull each theme block out of the stylesheet source.
const blocks = [...css.matchAll(/\[data-theme="(\w+)"\]\[data-mode="(\w+)"\]\s*\{([^}]*)\}/g)];

function parseVars(body) {
  const vars = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

function toRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const chan = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const lum = (hex) => {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
};

const ratio = (a, b) => {
  const la = lum(a), lb = lum(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");

/** Nudges a colour lighter or darker until it clears the target ratio. */
function solve(colour, background, target, direction) {
  let rgb = toRgb(colour);
  for (let step = 0; step < 120; step++) {
    if (ratio(hex(rgb), background) >= target) return hex(rgb);
    rgb = rgb.map((c) => (direction === "lighter" ? c + 2 : c - 2));
  }
  return hex(rgb);
}

const AA = 4.5;
const AA_UI = 3.0;

console.log("Contrast audit, WCAG AA needs 4.5 for text and 3.0 for UI shapes\n");

const fixes = [];

for (const [, theme, mode, body] of blocks) {
  const v = parseVars(body);
  const name = `${theme}/${mode}`;
  const dark = mode === "dark";

  const rows = [
    ["ink on s1", v["--ink"], v["--s1"], AA, "text"],
    ["ink-dim on s1", v["--ink-dim"], v["--s1"], AA, "text"],
    ["ink-dim on s2", v["--ink-dim"], v["--s2"], AA, "text"],
    ["ink-faint on s1", v["--ink-faint"], v["--s1"], AA, "text"],
    ["ink-faint on s0", v["--ink-faint"], v["--s0"], AA, "text"],
    ["gold-ink on s1", v["--gold-ink"], v["--s1"], AA, "text"],
    ["gold on s1 (UI)", v["--gold"], v["--s1"], AA_UI, "ui"],
    ["on-gold text on gold", v["--on-gold"], v["--gold"], AA, "text"],
    ["gold-ink on s0", v["--gold-ink"], v["--s0"], AA, "text"],
    ["gold-ink on s2", v["--gold-ink"], v["--s2"], AA, "text"],
    ["line-strong on s1 (UI)", v["--line-strong"], v["--s1"], AA_UI, "ui"],
  ];

  console.log(name);
  for (const [label, fg, bg, target, kind] of rows) {
    const r = ratio(fg, bg);
    const ok = r >= target;
    console.log(
      `  ${ok ? "pass" : "FAIL"}  ${label.padEnd(22)} ${r.toFixed(2).padStart(5)}  (needs ${target}, ${kind})`,
    );
    if (!ok) fixes.push({ name, label, fg, bg, target, dark });
  }
  console.log("");
}

if (fixes.length === 0) {
  console.log("Everything passes.");
} else {
  process.exitCode = 1;
  console.log("\nSuggested replacements\n");
  for (const f of fixes) {
    // Text should move away from its background: lighter on dark, darker on light.
    const direction = lum(f.bg) < 0.5 ? "lighter" : "darker";
    const solved = solve(f.fg, f.bg, f.target + 0.15, direction);
    console.log(
      `  ${f.name.padEnd(15)} ${f.label.padEnd(22)} ${f.fg} -> ${solved}  (${ratio(solved, f.bg).toFixed(2)})`,
    );
  }
}
