import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activePlayerIds, allRequiredSubmitted, pruneKeyed, shouldWaitOnJoin, submitProgress } from "./roster.js";

describe("submitProgress", () => {
  it("counts how many required players have submitted", () => {
    assert.deepEqual(submitProgress(["a", "b", "c"], ["a", "c"]), { current: 2, expected: 3 });
  });

  it("ignores submissions from players who are not required", () => {
    assert.deepEqual(submitProgress(["a", "b"], ["a", "ghost"]), { current: 1, expected: 2 });
  });

  it("excludes ids such as hot-seat targets from the expected count", () => {
    assert.deepEqual(submitProgress(["a", "b", "c"], ["b"], ["a"]), { current: 1, expected: 2 });
  });
});

describe("activePlayerIds", () => {
  it("excludes disconnected and mid-game waiting players", () => {
    const ids = activePlayerIds([
      { id: "a", connected: true },
      { id: "b", connected: false },
      { id: "c", connected: true, waiting: true },
      { id: "d", connected: true, waiting: false },
    ]);
    assert.deepEqual(ids, ["a", "d"]);
  });
});

describe("pruneKeyed", () => {
  it("drops keys that are not in the active set", () => {
    assert.deepEqual(pruneKeyed({ a: 1, b: 2, c: 3 }, ["a", "c"]), { a: 1, c: 3 });
  });
});

describe("allRequiredSubmitted", () => {
  it("is true only when every required id has submitted", () => {
    assert.equal(allRequiredSubmitted(["a", "b"], ["a", "b", "c"]), true);
    assert.equal(allRequiredSubmitted(["a", "b"], ["a"]), false);
    assert.equal(allRequiredSubmitted([], ["a"]), false);
  });
});

describe("shouldWaitOnJoin", () => {
  it("marks only new players waiting when a game is in progress", () => {
    assert.equal(shouldWaitOnJoin({ playing: true, alreadyInRoom: false }), true);
    assert.equal(shouldWaitOnJoin({ playing: true, alreadyInRoom: true }), false);
    assert.equal(shouldWaitOnJoin({ playing: false, alreadyInRoom: false }), false);
  });
});
