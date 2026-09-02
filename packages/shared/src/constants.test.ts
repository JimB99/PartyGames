import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PLAYER_COLOR_NAMES, PLAYER_COLORS } from "./constants.js";

describe("player color tables", () => {
  it("keeps hue hex values and spoken names in lockstep", () => {
    assert.equal(PLAYER_COLORS.length, PLAYER_COLOR_NAMES.length);
    assert.equal(PLAYER_COLOR_NAMES[0], "Red");
    assert.equal(PLAYER_COLOR_NAMES[10], "Blue");
  });
});
