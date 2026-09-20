const test = require("node:test");
const assert = require("node:assert/strict");
const selector = require("../src/language-selector-model.js");

const languages = {
  plain: { label: "Plain text", aliases: ["text", "txt"] },
  python: { label: "Python", aliases: ["py"] },
  javascript: { label: "JavaScript", aliases: ["js", "jsx"] },
  cpp: { label: "C++", aliases: ["c++", "cc", "cxx"] },
  csharp: { label: "C#", aliases: ["cs", "c#"] }
};

test("an empty search keeps the configured language order", () => {
  assert.deepEqual(selector.filter(languages, "").map(({ id }) => id), [
    "plain", "python", "javascript", "cpp", "csharp"
  ]);
});

test("search matches labels, identifiers, and aliases without case sensitivity", () => {
  assert.equal(selector.filter(languages, "PY")[0].id, "python");
  assert.equal(selector.filter(languages, "js")[0].id, "javascript");
  assert.equal(selector.filter(languages, "c++")[0].id, "cpp");
  assert.equal(selector.filter(languages, "script")[0].id, "javascript");
});

test("exact matches rank ahead of partial matches", () => {
  assert.deepEqual(selector.filter(languages, "c#").map(({ id }) => id), ["csharp"]);
});

test("keyboard movement wraps in both directions", () => {
  assert.equal(selector.moveIndex(0, -1, 4), 3);
  assert.equal(selector.moveIndex(3, 1, 4), 0);
  assert.equal(selector.moveIndex(-1, 1, 4), 0);
  assert.equal(selector.moveIndex(-1, -1, 4), 3);
  assert.equal(selector.moveIndex(0, 1, 0), -1);
});
