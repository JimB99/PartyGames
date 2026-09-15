/**
 * Run smoke and/or full E2E for a single game.
 * Usage: node --import tsx scripts/e2e-one-game.mts <game-id> [smoke|full|both]
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_GAME_IDS } from "../packages/shared/src/constants.ts";
import { NEW_GAME_IDS } from "../e2e/helpers/game-config.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const gameId = process.argv[2];
const mode = process.argv[3] ?? "both";

if (!gameId || !ALL_GAME_IDS.includes(gameId as (typeof ALL_GAME_IDS)[number])) {
  console.error(`Usage: e2e-one-game.mts <game-id> [smoke|full|both]`);
  console.error(`Valid ids: ${ALL_GAME_IDS.join(", ")}`);
  process.exit(1);
}

function run(project: "smoke" | "full", grep: string): boolean {
  console.log(`\n> playwright --project=${project} --grep "${grep}"\n`);
  try {
    execSync(
      `pnpm exec playwright test --project=${project} --grep "${grep}" --workers=1 --retries=0`,
      { cwd: ROOT, stdio: "inherit", env: process.env },
    );
    return true;
  } catch {
    return false;
  }
}

let ok = true;
if (mode === "smoke" || mode === "both") {
  ok = run("smoke", `@smoke ${gameId} smoke`) && ok;
}
if (mode === "full" || mode === "both") {
  ok = run("full", `@full ${gameId} full playthrough @ min`) && ok;
  if ((NEW_GAME_IDS as readonly string[]).includes(gameId)) {
    ok = run("full", `@full @new ${gameId} full playthrough @ mid`) && ok;
  }
}

process.exit(ok ? 0 : 1);
