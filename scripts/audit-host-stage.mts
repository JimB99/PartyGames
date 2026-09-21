/**
 * Verifies every registered game is rendered inside HostTvStage on the host TV.
 * Run: node --import tsx scripts/audit-host-stage.mts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_GAME_IDS, type GameId } from "../packages/shared/src/constants.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "test-reports");

/** Games with dedicated host blocks (others use shared phase handlers inside HostTvStage). */
const EXPLICIT_HOST_BLOCKS = new Set<GameId>([
  "last-on-the-dike",
  "trail-dash",
  "paddle-clash",
  "tic-tac-toe",
  "role-sort",
  "word-rush",
  "block-stack",
  "fleet-duel",
  "four-in-a-row",
  "team-charades",
  "split-the-room",
  "spectrum",
  "crowd-call",
  "chain-sketch",
  "draw-vote",
  "draw-impostor",
  "impostor",
  "forbidden-clue",
  "agent-grid",
  "hangman-race",
  "grid-blast",
]);

function readHostSources(): string {
  const paths = [
    join(ROOT, "packages/client/src/components/game/HostGameContent.tsx"),
    join(ROOT, "packages/client/src/components/game/HostTvStage.tsx"),
    join(ROOT, "packages/client/src/components/game/views/DrawVotePanels.tsx"),
    join(ROOT, "packages/client/src/components/game/views/ChainSketchHostPanel.tsx"),
    join(ROOT, "packages/client/src/components/game/views/DrawImpostorPanels.tsx"),
  ];
  return paths.filter((p) => existsSync(p)).map((p) => readFileSync(p, "utf8")).join("\n");
}

function audit(): Array<{ gameId: GameId; covered: boolean; reason?: string }> {
  const sources = readHostSources();
  const hostContent = readFileSync(
    join(ROOT, "packages/client/src/components/game/HostGameContent.tsx"),
    "utf8",
  );

  const results: Array<{ gameId: GameId; covered: boolean; reason?: string }> = [];

  if (!hostContent.includes("HostTvStage") || !hostContent.includes("<HostTvStage")) {
    for (const gameId of ALL_GAME_IDS) {
      results.push({ gameId, covered: false, reason: "HostGameContent missing HostTvStage wrapper" });
    }
    return results;
  }

  if (!sources.includes('data-testid="host-stage"') && !sources.includes("testId = \"host-stage\"")) {
    for (const gameId of ALL_GAME_IDS) {
      results.push({ gameId, covered: false, reason: "host-stage test id missing from host TV components" });
    }
    return results;
  }

  for (const gameId of ALL_GAME_IDS) {
    if (EXPLICIT_HOST_BLOCKS.has(gameId)) {
      const covered = hostContent.includes(`"${gameId}"`);
      results.push({
        gameId,
        covered,
        reason: covered ? undefined : `No dedicated host block for ${gameId}`,
      });
    } else {
      results.push({ gameId, covered: true });
    }
  }

  return results;
}

function main() {
  const results = audit();
  const uncovered = results.filter((r) => !r.covered);
  const payload = {
    generatedAt: new Date().toISOString(),
    gameCount: ALL_GAME_IDS.length,
    coveredCount: results.filter((r) => r.covered).length,
    results,
  };

  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(join(REPORT_DIR, "host-stage-audit.json"), JSON.stringify(payload, null, 2));

  console.log(`Host stage audit: ${payload.coveredCount}/${ALL_GAME_IDS.length} games covered`);
  if (uncovered.length > 0) {
    for (const row of uncovered) {
      console.log(`  [${row.gameId}] ${row.reason}`);
    }
    process.exit(1);
  }
  console.log("All games render inside HostTvStage.");
}

main();
