/**
 * Cross-checks game registry vs test infrastructure.
 * Run: pnpm test:games:audit
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_GAME_IDS, type GameId } from "../packages/shared/src/constants.ts";
import { listGames } from "../packages/server/src/registry.ts";
import { NEW_GAME_IDS, GAME_E2E_CONFIGS } from "../e2e/helpers/game-config.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "test-reports");

type Dimension =
  | "registry"
  | "simulator"
  | "e2e_config"
  | "e2e_smoke"
  | "e2e_full"
  | "e2e_mid_players"
  | "unit_logic"
  | "settings_family_mature"
  | "settings_difficulty"
  | "settings_speed_scoring"
  | "settings_trail_dash"
  | "settings_question_display"
  | "settings_timeline_pts";

interface Gap {
  gameId: GameId;
  dimension: Dimension;
  suggestion: string;
}

const LOGIC_TEST_FILES: Partial<Record<GameId, string>> = {
  "trail-dash": "trail-dash-logic.test.ts",
  "block-stack": "block-stack-logic.test.ts",
  "fleet-duel": "fleet-duel-logic.test.ts",
  "four-in-a-row": "four-in-a-row-logic.test.ts",
  "tic-tac-toe": "tic-tac-toe-logic.test.ts",
  "last-on-the-dike": "dike-logic.test.ts",
  "hangman-race": "new-games-logic.test.ts",
  "agent-grid": "new-games-logic.test.ts",
  "paddle-clash": "new-games-logic.test.ts",
  "grid-blast": "new-games-logic.test.ts",
};

function readText(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function hasSimulator(gameId: GameId): boolean {
  const src = readText(join(ROOT, "packages/server/src/test/simulator-registry.ts"));
  return src.includes(`"${gameId}"`) || src.includes(`${gameId}:`);
}

function settingsTestCovers(flag: string): boolean {
  const settings = readText(join(ROOT, "packages/server/src/test/settings.test.ts"));
  const e2eSettings = readText(join(ROOT, "e2e/settings.spec.ts"));
  return settings.includes(flag) || e2eSettings.includes(flag);
}

function crossCuttingChecks(): Gap[] {
  const gaps: Gap[] = [];
  const checks: Array<{ file: string; dimension: Dimension; suggestion: string }> = [
    { file: "e2e/host-controls.spec.ts", dimension: "e2e_smoke", suggestion: "Add e2e/host-controls.spec.ts" },
    { file: "e2e/settings.spec.ts", dimension: "e2e_smoke", suggestion: "Add e2e/settings.spec.ts" },
    { file: "e2e/layout.spec.ts", dimension: "e2e_smoke", suggestion: "Add e2e/layout.spec.ts" },
    { file: "packages/server/src/test/room-ws.test.ts", dimension: "simulator", suggestion: "Add room WebSocket integration tests" },
    { file: "e2e/games/all-games.smoke.spec.ts", dimension: "e2e_smoke", suggestion: "Add parameterized e2e/games/all-games.smoke.spec.ts" },
    { file: "e2e/games/all-games.full.spec.ts", dimension: "e2e_full", suggestion: "Add parameterized e2e/games/all-games.full.spec.ts" },
  ];

  for (const check of checks) {
    if (!existsSync(join(ROOT, check.file))) {
      gaps.push({ gameId: "quick-quiz", dimension: check.dimension, suggestion: check.suggestion });
    }
  }

  const smokeSpec = readText(join(ROOT, "e2e/games/all-games.smoke.spec.ts"));
  const fullSpec = readText(join(ROOT, "e2e/games/all-games.full.spec.ts"));
  if (!smokeSpec.includes("ALL_GAME_IDS")) {
    gaps.push({ gameId: "quick-quiz", dimension: "e2e_smoke", suggestion: "all-games.smoke.spec.ts must iterate ALL_GAME_IDS" });
  }
  if (!fullSpec.includes("ALL_GAME_IDS") || !fullSpec.includes("NEW_GAME_IDS")) {
    gaps.push({ gameId: "quick-quiz", dimension: "e2e_full", suggestion: "all-games.full.spec.ts must iterate ALL_GAME_IDS and NEW_GAME_IDS" });
  }

  return gaps;
}

function auditGames(): Gap[] {
  const gaps: Gap[] = [];
  const registryIds = listGames().map((g) => g.id);
  const registrySet = new Set(registryIds);

  for (const id of ALL_GAME_IDS) {
    if (!registrySet.has(id)) {
      gaps.push({ gameId: id, dimension: "registry", suggestion: `Add ${id} to registry.ts` });
    }
  }
  for (const id of registryIds) {
    if (!(ALL_GAME_IDS as readonly string[]).includes(id)) {
      gaps.push({ gameId: id as GameId, dimension: "registry", suggestion: `Add ${id} to ALL_GAME_IDS in constants.ts` });
    }
  }

  for (const meta of listGames()) {
    const id = meta.id;

    if (!GAME_E2E_CONFIGS[id]) {
      gaps.push({ gameId: id, dimension: "e2e_config", suggestion: `Add ${id} to e2e/helpers/game-config.ts` });
    }

    if (!hasSimulator(id)) {
      gaps.push({ gameId: id, dimension: "simulator", suggestion: `Add simulator for ${id} in simulator-registry.ts` });
    }

    const logicFile = LOGIC_TEST_FILES[id];
    if (logicFile) {
      const logicPath = join(ROOT, "packages/shared/src", logicFile);
      if (!existsSync(logicPath)) {
        gaps.push({ gameId: id, dimension: "unit_logic", suggestion: `Add unit tests in packages/shared/src/${logicFile}` });
      }
    }
  }

  const settingsSrc = readText(join(ROOT, "packages/server/src/test/settings.test.ts"));
  if (!settingsSrc.includes("paddleMode")) {
    gaps.push({ gameId: "paddle-clash", dimension: "settings_difficulty", suggestion: "Test paddleMode hockey/pong in settings.test.ts" });
  }
  if (!settingsSrc.includes("hangman-race")) {
    gaps.push({ gameId: "hangman-race", dimension: "settings_speed_scoring", suggestion: "Test hangman-race speed scoring in settings.test.ts" });
  }

  return gaps;
}

function main() {
  const gameGaps = auditGames();
  const crossGaps = crossCuttingChecks();
  const gaps = [...gameGaps, ...crossGaps];

  const payload = {
    generatedAt: new Date().toISOString(),
    gameCount: ALL_GAME_IDS.length,
    gapCount: gaps.length,
    gaps,
  };

  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(join(REPORT_DIR, "coverage-audit.json"), JSON.stringify(payload, null, 2));

  console.log(`Coverage audit: ${gaps.length} gap(s) across ${ALL_GAME_IDS.length} games`);
  if (gaps.length > 0) {
    for (const gap of gaps) {
      console.log(`  [${gap.gameId}] ${gap.dimension}: ${gap.suggestion}`);
    }
    process.exit(1);
  }
  console.log("All coverage dimensions satisfied.");
}

main();
