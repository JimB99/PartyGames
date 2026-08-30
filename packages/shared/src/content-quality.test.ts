import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReverseFactsFromQuiz,
  diversifyNhieStatement,
  duplicateTruthRate,
  generateFactCheckFamilyPairs,
  isFactCheckTruthValid,
  isObviousBluffTruth,
  isPlaceholderTruth,
  isQuestionForm,
  isReverseFactTrivial,
  matureTruthToFactCheckPair,
  orderedSequenceRatio,
  rebalanceWitShowdownPrefixes,
} from "./content-quality.js";

describe("content-quality heuristics", () => {
  it("flags trivial reverse fact pairs", () => {
    assert.ok(
      isReverseFactTrivial(
        "Octopuses have three hearts and blue blood.",
        "What animal has three hearts?",
      ),
    );
    assert.ok(!isReverseFactTrivial("Paris", "What is the capital of France?"));
  });

  it("detects placeholder truths", () => {
    assert.ok(isPlaceholderTruth("That's what my therapist said!"));
    assert.ok(!isPlaceholderTruth("Tax Deduction"));
  });

  it("builds reverse facts from quiz when answer not in question", () => {
    const rows = buildReverseFactsFromQuiz([
      {
        question: "What is the capital of France?",
        choices: ["Paris", "London", "Berlin", "Madrid"],
        correct: 0,
      },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].fact, "Paris");
  });

  it("computes duplicate truth rate", () => {
    assert.equal(duplicateTruthRate(["a", "a", "b"]), 1 / 3);
  });

  it("detects ordered sequences", () => {
    const ordered = Array.from({ length: 25 }, (_, i) => String.fromCharCode(97 + (i % 26)));
    assert.ok(orderedSequenceRatio(ordered, 20) > 0);
    const shuffled = ["zebra", "apple", "mango", "banana"];
    assert.equal(orderedSequenceRatio(shuffled, 20), 0);
  });

  it("rejects question-form fact-check truths", () => {
    assert.ok(!isFactCheckTruthValid("Prompt", "What is your favorite color?"));
    assert.ok(isFactCheckTruthValid("Prompt", "Tax Deduction"));
  });

  it("generates enough family fact-check pairs", () => {
    const pairs = generateFactCheckFamilyPairs(200);
    assert.ok(pairs.length >= 200);
  });

  it("diversifies nhie statements", () => {
    const a = diversifyNhieStatement("Never have I ever danced on a table", 0);
    const b = diversifyNhieStatement("Never have I ever danced on a table", 1);
    assert.notEqual(a, b);
  });

  it("converts mature truths to fact-check pairs without questions", () => {
    const pair = matureTruthToFactCheckPair("Have you ever skinny-dipped?");
    assert.ok(pair);
    assert.ok(!isQuestionForm(pair!.truth));
  });
});
