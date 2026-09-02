/**
 * Report known-dead and likely-unused exports from the prior remediation list.
 * Run: node --import tsx scripts/dead-export-scan.mts
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const CANDIDATES: Array<{ symbol: string; definedIn: string; note: string }> = [];

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walk(p, acc);
    } else if (/\.(ts|tsx|mts)$/.test(entry.name)) acc.push(p);
  }
  return acc;
}

function main() {
  const files = [
    ...walk(join(ROOT, "packages")),
    ...walk(join(ROOT, "scripts")),
    ...walk(join(ROOT, "e2e")),
  ];
  console.log("Dead / unused export scan");
  for (const c of CANDIDATES) {
    let refs = 0;
    for (const file of files) {
      if (file.replace(/\\/g, "/").endsWith("scripts/dead-export-scan.mts")) continue;
      const src = readFileSync(file, "utf8");
      const matches = src.split(c.symbol).length - 1;
      refs += matches;
    }
    const unused = refs <= 1;
    console.log(`  ${unused ? "UNUSED" : `refs=${refs}`}  ${c.symbol}  (${c.note})`);
  }
}

main();
