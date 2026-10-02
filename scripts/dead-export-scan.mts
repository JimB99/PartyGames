/**
 * Report known-dead exports (manual list). Add symbols here when audit finds zero callers.
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

function countRefs(symbol: string, files: string[]): number {
  const re = new RegExp(`\\b${symbol}\\b`, "g");
  let refs = 0;
  for (const file of files) {
    if (file.replace(/\\/g, "/").endsWith("scripts/dead-export-scan.mts")) continue;
    const src = readFileSync(file, "utf8");
    refs += src.match(re)?.length ?? 0;
  }
  return refs;
}

function main() {
  const files = [
    ...walk(join(ROOT, "packages")),
    ...walk(join(ROOT, "scripts")),
    ...walk(join(ROOT, "e2e")),
  ];
  console.log("Dead / unused export scan");
  let dead = 0;
  for (const c of CANDIDATES) {
    const refs = countRefs(c.symbol, files);
    const unused = refs <= 1;
    if (unused) dead += 1;
    console.log(`  ${unused ? "UNUSED" : `refs=${refs}`}  ${c.symbol}  (${c.note})`);
  }
  if (dead > 0) {
    process.exitCode = 1;
  }
}

main();
