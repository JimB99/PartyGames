import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { ALL_GAME_IDS } from "@party-games/shared";
import { getGame, listGames } from "../registry.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readClientGameIds(): string[] {
  const src = readFileSync(join(ROOT, "client/src/components/GameViews.tsx"), "utf8");
  const ids = new Set<string>();
  const patterns = [
    /case\s+"([^"]+)":/g,
    /gameId\s*===\s*"([^"]+)"/g,
    /playerView\.gameId\s*===\s*"([^"]+)"/g,
    /hostView\.gameId\s*===\s*"([^"]+)"/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) ids.add(m[1]);
  }
  return [...ids];
}

describe("registry inventory", () => {
  it("registry matches ALL_GAME_IDS", () => {
    const registryIds = listGames().map((g) => g.id).sort();
    const constantIds = [...ALL_GAME_IDS].sort();
    assert.deepEqual(registryIds, constantIds);
  });

  it("no duplicate game IDs in registry", () => {
    const ids = listGames().map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("every game has unique metadata id", () => {
    for (const meta of listGames()) {
      const game = getGame(meta.id);
      assert.ok(game, `missing module for ${meta.id}`);
      assert.equal(game.meta.id, meta.id);
      assert.ok(meta.minPlayers >= 1);
      assert.ok(meta.maxPlayers >= meta.minPlayers);
      assert.ok(meta.name.length > 0);
      assert.ok(meta.description.length > 0);
    }
  });

  it("e2e config covers every registered game", () => {
    let e2eConfig: string;
    try {
      e2eConfig = readFileSync(join(ROOT, "e2e/helpers/game-config.ts"), "utf8");
    } catch {
      return; // e2e optional in minimal CI
    }
    for (const id of ALL_GAME_IDS) {
      assert.ok(e2eConfig.includes(`"${id}"`), `e2e config missing ${id}`);
    }
  });

  it("README game count matches registry", () => {
    const readme = readFileSync(join(ROOT, "../README.md"), "utf8");
    const match = readme.match(/## Games \((\d+)\)/);
    assert.ok(match, "README missing ## Games (N) heading");
    assert.equal(Number(match[1]), ALL_GAME_IDS.length);
  });
});
