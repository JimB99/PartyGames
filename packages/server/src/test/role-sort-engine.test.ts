import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { onRoleSortAction, createRoleSortState } from "../engines/role-sort-engine.js";
import { makeRoomContext } from "./harness.js";

describe("role-sort-engine", () => {
  it("ignores self-assignment and invalid targets", () => {
    const ctx = makeRoomContext(3);
    let state = createRoleSortState("Movies", ["Hero", "Villain", "Sidekick"], ctx.playerIds);
    state.phase = "assign";
    state = onRoleSortAction(
      state,
      "p1",
      {
        kind: "assign_role",
        assignments: { p1: "Hero", p2: "Villain", p3: "Sidekick" },
      },
      ctx,
    );
    assert.deepEqual(state.assignments.p1, { p2: "Villain", p3: "Sidekick" });
  });
});
