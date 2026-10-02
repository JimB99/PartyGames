import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickRandom } from "./game.js";

describe("pickRandom", () => {
  it("returns a member of the pool", () => {
    const pool = ["a", "b", "c"];
    for (let i = 0; i < 50; i++) {
      assert.ok(pool.includes(pickRandom(pool)));
    }
  });

  it("returns the only element of a single-item pool", () => {
    assert.equal(pickRandom(["solo"]), "solo");
  });

  it("throws instead of returning undefined for an empty pool", () => {
    assert.throws(() => pickRandom([]), /empty pool/);
  });
});
