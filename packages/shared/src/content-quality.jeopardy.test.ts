import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReverseFactsFromJeopardy,
  clueToQuestion,
  isValidReverseFactPair,
  normalizeJeopardyResponse,
} from "./content-quality.js";

describe("jeopardy reverse-fact helpers", () => {
  it("normalizeJeopardyResponse strips question form", () => {
    assert.equal(normalizeJeopardyResponse("What is Paris?"), "Paris");
    assert.equal(normalizeJeopardyResponse("Who is George Washington?"), "George Washington");
  });

  it("clueToQuestion converts This/He clues", () => {
    assert.equal(
      clueToQuestion("This European capital sits on the Seine"),
      "What European capital sits on the Seine?",
    );
    assert.equal(
      clueToQuestion("He wrote the novel Ulysses"),
      "Who wrote the novel Ulysses?",
    );
    const yearQ = clueToQuestion("In 1969, Apollo 11 landed on the Moon");
    assert.ok(yearQ?.startsWith("In what year"));
  });

  it("buildReverseFactsFromJeopardy produces valid pairs", () => {
    const rows = buildReverseFactsFromJeopardy([
      { clue: "This drink contains caffeine.", response: "Coffee" },
      { clue: "This man introduced the theory of relativity.", response: "Albert Einstein" },
    ]);
    assert.ok(rows.length >= 2);
    for (const row of rows) {
      assert.ok(isValidReverseFactPair(row.fact, row.truth), `${row.fact} -> ${row.truth}`);
    }
  });
});
