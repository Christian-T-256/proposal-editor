const test = require("node:test");
const assert = require("node:assert/strict");
const fixture = require("../src/data/demo-proposal.json");
const { assertProposal, validateProposal } = require("../src/lib/schema.js");

test("the fictional demo fixture satisfies the proposal schema", () => {
  assert.equal(assertProposal(structuredClone(fixture)).slug, "northwind-dental-demo");
});

test("unknown themes and duplicate section IDs are rejected", () => {
  const candidate = structuredClone(fixture);
  candidate.meta.theme = "unregistered";
  candidate.sections[1].id = candidate.sections[0].id;
  const result = validateProposal(candidate);
  assert.equal(result.success, false);
  assert.match(result.errors.join("\n"), /theme is not registered/);
  assert.match(result.errors.join("\n"), /id must be unique/);
});

test("oversized content is rejected before it reaches storage", () => {
  const candidate = structuredClone(fixture);
  candidate.sections[0].body = "x".repeat(4001);
  assert.throws(() => assertProposal(candidate), /4000 characters or fewer/);
});
