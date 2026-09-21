import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "./content.js";
import { buildScoringPreview } from "./scoring-preview.js";

const trailDashMeta = {
  id: "trail-dash" as const,
  name: "Trail Dash",
  description: "",
  scoringRules: "",
  minPlayers: 1,
  maxPlayers: 8,
  category: "arcade" as const,
  supportsTrailDashOptions: true,
};

describe("buildScoringPreview", () => {
  it("trail-dash shows placement rows for lobby size", () => {
    const preview = buildScoringPreview(
      trailDashMeta,
      {
        ...DEFAULT_GAME_OPTIONS,
        trailDash: { botCount: 1, maxRounds: 1, roundTimeSec: 30 },
      },
      1,
    );
    assert.equal(preview.kind, "placement");
    assert.equal(preview.rows?.length, 2);
    assert.equal(preview.rows?.[0]?.points, 1000);
  });

  it("trivia uses rules when speed scoring off", () => {
    const preview = buildScoringPreview(
      {
        id: "trivia",
        name: "Quiz",
        description: "",
        scoringRules: "Flat points",
        minPlayers: 1,
        maxPlayers: 16,
        category: "trivia",
        supportsSpeedScoring: true,
      },
      { ...DEFAULT_GAME_OPTIONS, speedScoring: "off" },
      4,
    );
    assert.equal(preview.kind, "rules");
    assert.equal(preview.summary, "Flat points");
  });
});
