import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "build", ".vercel"]);
const SKIP_FILES = new Set(["AGENTS.md", "package-lock.json"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".md", ".json", ".html", ".svg"]);

const BANNED = [
  { char: "\u2014", name: "em dash" },
  { char: "\u2015", name: "horizontal bar" },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || SKIP_FILES.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTS.has(extname(entry))) out.push(full);
  }
  return out;
}

const problems = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { char, name } of BANNED) {
      let col = line.indexOf(char);
      while (col !== -1) {
        problems.push({ file: relative(ROOT, file), line: i + 1, col: col + 1, name, text: line.trim() });
        col = line.indexOf(char, col + 1);
      }
    }
  });
}

if (problems.length > 0) {
  console.error("\nFound " + problems.length + " banned dash character(s):\n");
  for (const p of problems) {
    console.error("  " + p.file + ":" + p.line + ":" + p.col + "  " + p.name);
    console.error("    " + p.text.slice(0, 120));
  }
  console.error("\nReplace them with a comma, a colon, or a full stop.\n");
  process.exit(1);
}

console.log("No banned dash characters found.");
