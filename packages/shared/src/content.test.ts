import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_GAME_OPTIONS, filterContentPool, timelineAccuracyPoints, type ContentMeta } from "./content.js";

describe("filterContentPool", () => {
  const items: ContentMeta[] = [
    { rating: "family", difficulty: "easy" },
    { rating: "family", difficulty: "hard" },
    { rating: "mature", difficulty: "easy" },
    { rating: "mature", difficulty: "hard" },
  ];

  it("family mode excludes mature", () => {
    const pool = filterContentPool(items, { ...DEFAULT_GAME_OPTIONS, contentRating: "family" });
    assert.equal(pool.length, 2);
    assert.ok(pool.every((i) => (i.rating ?? "family") === "family"));
  });

  it("mature mode includes family and mature", () => {
    const pool = filterContentPool(items, { ...DEFAULT_GAME_OPTIONS, contentRating: "mature" });
    assert.equal(pool.length, 4);
  });

  it("difficulty filter narrows when matches exist", () => {
    const pool = filterContentPool(items, {
      contentRating: "mature",
      difficulty: "easy",
    });
    assert.equal(pool.length, 2);
    assert.ok(pool.every((i) => !i.difficulty || i.difficulty === "easy"));
  });

  it("falls back to full input when filter would empty pool", () => {
    const onlyHard = [{ rating: "family" as const, difficulty: "hard" as const }];
    const pool = filterContentPool(onlyHard, {
      contentRating: "family",
      difficulty: "easy",
    });
    assert.equal(pool.length, 1);
  });
});

describe("timelineAccuracyPoints", () => {
  it("uses default 20 pts per year off", () => {
    assert.equal(timelineAccuracyPoints(0, 20), 1000);
    assert.equal(timelineAccuracyPoints(5, 20), 900);
    assert.equal(timelineAccuracyPoints(50, 20), 0);
  });

  it("all pts per year off requires exact year", () => {
    assert.equal(timelineAccuracyPoints(0, 1000), 1000);
    assert.equal(timelineAccuracyPoints(1, 1000), 0);
  });
});
