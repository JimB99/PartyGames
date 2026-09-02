import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateClientMessage } from "./protocol-schema.js";

describe("protocol-schema", () => {
  it("accepts select_game, start_game, and set_session_playlist", () => {
    const select = validateClientMessage({ type: "select_game", gameId: "quick-quiz" });
    assert.equal(select.ok, true);
    const start = validateClientMessage({ type: "start_game" });
    assert.equal(start.ok, true);
    const playlist = validateClientMessage({
      type: "set_session_playlist",
      gameIds: ["quick-quiz", "caption-this"],
    });
    assert.equal(playlist.ok, true);
  });

  it("accepts set_game_options with family defaults", () => {
    const result = validateClientMessage({
      type: "set_game_options",
      gameId: "would-you-rather",
      options: { contentRating: "mature", difficulty: "mixed" },
    });
    assert.equal(result.ok, true);
    if (result.ok && result.value.type === "set_game_options") {
      assert.equal(result.value.options.contentRating, "mature");
    }
  });
});
