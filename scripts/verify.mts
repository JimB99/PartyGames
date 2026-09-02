#!/usr/bin/env node
/**
 * Run full verification suite: typecheck, unit, contract, content audit.
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd: string, label: string) {
  console.log(`\n=== ${label} ===`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

try {
  run("pnpm --filter @party-games/shared build", "Build shared");
  run("pnpm typecheck", "Typecheck");
  run("pnpm test:unit", "Unit tests");
  run("pnpm test:contract", "Contract tests");
  run("pnpm test:content", "Content audit");
  run("pnpm audit:dead-exports", "Dead export scan");
  console.log("\nAll verification passed.");
  console.log("Optional next: pnpm test:content:strict (200+ family pools) and pnpm test:e2e -- e2e/viewport-matrix.spec.ts");
} catch {
  process.exit(1);
}
