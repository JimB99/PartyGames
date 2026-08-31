import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { personalizeHotSeatPrompt } from "./hot-seat-prompt.js";

describe("personalizeHotSeatPrompt", () => {
  it("replaces leading Their with possessive name", () => {
    assert.equal(
      personalizeHotSeatPrompt("Their guilty pleasure TV show", "Alex"),
      "Alex's guilty pleasure TV show",
    );
  });

  it("replaces What they'd with What would name", () => {
    assert.equal(
      personalizeHotSeatPrompt("What they'd order at a restaurant every time", "Sam"),
      "What would Sam order at a restaurant every time",
    );
  });
});
