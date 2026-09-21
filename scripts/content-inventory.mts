/**
 * Generate docs/content-inventory.md with per-game family/mature counts and examples.
 * Run: pnpm content-inventory
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GameId } from "../packages/shared/src/constants.ts";
import { DEFAULT_GAME_OPTIONS } from "../packages/shared/src/content.ts";
import type { GameOptions } from "../packages/shared/src/game-options.ts";
import { listGames } from "../packages/server/src/registry.ts";
import {
  agentGridWordPool,
  bracketCategoryPool,
  charadesWordPool,
  crowdCallPool,
  drawWordPool,
  factCheckPool,
  forbiddenCluePool,
  hangmanWordPool,
  hotSeatPool,
  impostorPool,
  punchlineBattlePool,
  quizPool,
  reverseFactPool,
  spectrumPool,
  splitRoomPool,
  timelinePool,
  wouldYouRatherPool,
} from "../packages/server/src/content-pool.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs/content-inventory.md");

const PROCEDURAL_GAMES = new Set<GameId>([
  "trail-dash",
  "word-rush",
  "last-on-the-dike",
  "block-stack",
  "fleet-duel",
  "four-in-a-row",
  "tic-tac-toe",
  "paddle-clash",
  "grid-blast",
]);

type PoolSample = { family: string[]; mature: string[] };

function opts(rating: "family" | "mature"): GameOptions {
  return { ...DEFAULT_GAME_OPTIONS, contentRating: rating };
}

function sample<T>(items: T[], format: (item: T) => string, n = 5): string[] {
  const out: string[] = [];
  const step = items.length <= n ? 1 : Math.max(1, Math.floor(items.length / n));
  for (let i = 0; i < items.length && out.length < n; i += step) {
    out.push(format(items[i]!));
  }
  while (out.length < n && items.length > 0) {
    out.push(format(items[out.length % items.length]!));
  }
  return out.slice(0, n);
}

function poolForGame(id: GameId): { familyCount: number; matureCount: number; samples: PoolSample } | null {
  const familyOpts = opts("family");
  const matureOpts = opts("mature");

  switch (id) {
    case "bluff": {
      const family = [...factCheckPool(familyOpts), ...reverseFactPool(familyOpts)];
      const mature = [...factCheckPool(matureOpts), ...reverseFactPool(matureOpts)];
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: {
          family: sample(family, (r) => `"${(r as { prompt?: string; fact?: string }).prompt ?? (r as { fact?: string }).fact ?? ""}" → ${(r as { truth: string }).truth}`),
          mature: sample(mature, (r) => `"${(r as { prompt?: string; fact?: string }).prompt ?? (r as { fact?: string }).fact ?? ""}" → ${(r as { truth: string }).truth}`),
        },
      };
    }
    case "prompt-vote": {
      const family = [...punchlineBattlePool(familyOpts), ...hotSeatPool(familyOpts)];
      const mature = [...punchlineBattlePool(matureOpts), ...hotSeatPool(matureOpts)];
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: {
          family: sample(family, (t) => String(t)),
          mature: sample(mature, (t) => String(t)),
        },
      };
    }
    case "trivia": {
      const family = [...quizPool(familyOpts), ...timelinePool(familyOpts)];
      const mature = [...quizPool(matureOpts), ...timelinePool(matureOpts)];
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: {
          family: sample(family, (q) => (q as { question?: string; event?: string; year?: number }).question ?? `${(q as { event: string }).event} (${(q as { year: number }).year})`),
          mature: sample(mature, (q) => (q as { question?: string; event?: string; year?: number }).question ?? `${(q as { event: string }).event} (${(q as { year: number }).year})`),
        },
      };
    }
    case "opinions": {
      const family = [
        ...wouldYouRatherPool(familyOpts),
        ...splitRoomPool(familyOpts),
        ...crowdCallPool(familyOpts),
      ];
      const mature = [
        ...wouldYouRatherPool(matureOpts),
        ...splitRoomPool(matureOpts),
        ...crowdCallPool(matureOpts),
      ];
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: {
          family: sample(family, (r) => JSON.stringify(r).slice(0, 80)),
          mature: sample(mature, (r) => JSON.stringify(r).slice(0, 80)),
        },
      };
    }
    case "drawing": {
      const family = drawWordPool(familyOpts);
      const mature = drawWordPool(matureOpts);
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: { family: sample(family, (w) => w), mature: sample(mature, (w) => w) },
      };
    }
    case "team-charades": {
      const family = charadesWordPool(familyOpts);
      const mature = charadesWordPool(matureOpts);
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: { family: sample(family, (w) => w), mature: sample(mature, (w) => w) },
      };
    }
    case "hangman-race": {
      const family = hangmanWordPool(familyOpts);
      const mature = hangmanWordPool(matureOpts);
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: { family: sample(family, (w) => w), mature: sample(mature, (w) => w) },
      };
    }
    case "bracket-battle": {
      const family = bracketCategoryPool(familyOpts);
      const mature = bracketCategoryPool(matureOpts);
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: { family: sample(family, (c) => c), mature: sample(mature, (c) => c) },
      };
    }
    case "spectrum": {
      const family = spectrumPool(familyOpts);
      const mature = spectrumPool(matureOpts);
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: {
          family: sample(family, (s) => `${s.left} ↔ ${s.right}`),
          mature: sample(mature, (s) => `${s.left} ↔ ${s.right}`),
        },
      };
    }
    case "impostor": {
      const family = impostorPool(familyOpts);
      const mature = impostorPool(matureOpts);
      const familyItems = family.flatMap((c) => c.items).length;
      const matureItems = mature.flatMap((c) => c.items).length;
      return {
        familyCount: familyItems,
        matureCount: matureItems,
        samples: {
          family: sample(
            family.flatMap((c) => c.items.map((i) => ({ cat: c.label, item: i }))),
            (x) => `${x.cat}: ${x.item}`,
          ),
          mature: sample(
            mature.flatMap((c) => c.items.map((i) => ({ cat: c.label, item: i }))),
            (x) => `${x.cat}: ${x.item}`,
          ),
        },
      };
    }
    case "forbidden-clue": {
      const family = forbiddenCluePool(familyOpts);
      const mature = forbiddenCluePool(matureOpts);
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: {
          family: sample(family, (c) => (c as { word: string }).word),
          mature: sample(mature, (c) => (c as { word: string }).word),
        },
      };
    }
    case "agent-grid": {
      const family = agentGridWordPool(familyOpts);
      const mature = agentGridWordPool(matureOpts);
      return {
        familyCount: family.length,
        matureCount: mature.length,
        samples: {
          family: sample(family, (w) => w),
          mature: sample(mature, (w) => w),
        },
      };
    }
    default:
      return null;
  }
}

function main() {
  const games = listGames();
  const lines: string[] = [
    "# Content inventory",
    "",
    `Generated for **${games.length}** registered games. Counts use \`content-pool\` with \`DEFAULT_GAME_OPTIONS\`.`,
    "",
  ];

  for (const meta of games) {
    if (PROCEDURAL_GAMES.has(meta.id)) {
      lines.push(`### ${meta.name} (\`${meta.id}\`)`);
      lines.push("- Family: N/A | Mature: N/A — procedural / no prompt pool");
      lines.push("- Family examples: N/A");
      lines.push("- Mature examples: N/A");
      lines.push("");
      continue;
    }

    const stats = poolForGame(meta.id);
    if (!stats) {
      lines.push(`### ${meta.name} (\`${meta.id}\`)`);
      lines.push("- Family: N/A | Mature: N/A — no content pool wired in inventory script");
      lines.push("- Family examples: N/A");
      lines.push("- Mature examples: N/A");
      lines.push("");
      continue;
    }

    lines.push(`### ${meta.name} (\`${meta.id}\`)`);
    lines.push(`- Family: ${stats.familyCount.toLocaleString()} | Mature: ${stats.matureCount.toLocaleString()}`);
    lines.push("- Family examples:");
    for (const ex of stats.samples.family) lines.push(`  - ${ex}`);
    lines.push("- Mature examples:");
    for (const ex of stats.samples.mature) lines.push(`  - ${ex}`);
    lines.push("");
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join("\n"));
  console.log(`Wrote ${OUT}`);
}

main();
