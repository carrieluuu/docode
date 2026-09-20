const assert = require("node:assert/strict");
const test = require("node:test");

global.window = {};
require("../src/languages.js");
require("../src/language-detector.js");
require("../src/smart-paste.js");
const { analyze } = window.DocodeSmartPaste;

test("captures multiline Python and infers its language", () => {
  const result = analyze("for item in items:\n    print(item)");
  assert.equal(result.language, "python");
  assert.equal(result.code, "for item in items:\n    print(item)");
  assert.equal(result.explicitLanguage, false);
});

test("unwraps fenced code and respects a supported language tag", () => {
  const result = analyze("```javascript\nconst value = 1;\nconsole.log(value);\n```");
  assert.deepEqual(result, {
    code: "const value = 1;\nconsole.log(value);",
    explicitLanguage: true,
    fenced: true,
    language: "javascript"
  });
});

test("captures structurally strong code without forcing a language", () => {
  const result = analyze("int first = 1;\nint second = 2;");
  assert.ok(result);
  assert.equal(result.language, "");
});

test("recognizes common terminal command sequences", () => {
  const result = analyze("git status\nnpm run test");
  assert.equal(result.language, "bash");
});

test("does not interrupt prose, complexity notes, or single lines", () => {
  assert.equal(analyze("This is an ordinary paragraph.\nIt continues on another line."), null);
  assert.equal(analyze("Time: O(n)\nSpace: O(1)"), null);
  assert.equal(analyze('print("one line")'), null);
});
