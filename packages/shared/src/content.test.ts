import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_GAME_OPTIONS, filterContentPool, type ContentMeta } from "./content.js";

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
