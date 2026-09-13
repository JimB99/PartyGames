import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canActivateHeldPowerUp,
  powerUpInfo,
  TRAIL_DASH_POWERUPS,
} from "./trail-dash-powerups.js";

describe("trail-dash-powerups", () => {
  it("ghost uses ghost icon", () => {
    assert.equal(powerUpInfo("gap").icon, "👻");
  });

  it("canActivateHeldPowerUp is true for weapons and boosts but not kangaroo", () => {
    assert.equal(canActivateHeldPowerUp("missile"), true);
    assert.equal(canActivateHeldPowerUp("speed"), true);
    assert.equal(canActivateHeldPowerUp("gap"), true);
    assert.equal(canActivateHeldPowerUp("double_jump"), false);
    assert.equal(canActivateHeldPowerUp(null), false);
  });

  it("lists six power-ups in normal mode", () => {
    assert.equal(TRAIL_DASH_POWERUPS.length, 6);
  });
});
