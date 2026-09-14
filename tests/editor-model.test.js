const assert = require("node:assert/strict");
const test = require("node:test");

global.window = {};
require("../src/editor-model.js");
const model = window.DocodeEditorModel;

test("indents selected lines", () => {
  assert.deepEqual(model.indent("one\ntwo", 0, 7), {
    value: "    one\n    two",
    start: 4,
    end: 15
  });
});

test("dedents up to four spaces from selected lines", () => {
  assert.deepEqual(model.indent("    one\n  two", 0, 13, true), {
    value: "one\ntwo",
    start: 0,
    end: 7
  });
});

test("preserves current indentation on enter", () => {
  assert.equal(model.indentationForEnter("    value", 9, "python"), "\n    ");
});

test("adds one level after a Python colon", () => {
  assert.equal(model.indentationForEnter("if value:", 9, "python"), "\n    ");
});

test("adds one level after an opening brace", () => {
  assert.equal(model.indentationForEnter("  if (ok) {", 11, "javascript"), "\n      ");
});

test("strips an accidentally pasted outer fence before insertion", () => {
  assert.equal(model.stripOuterFence("```python\nprint('hello')\n```"), "print('hello')");
});

test("leaves ordinary code unchanged", () => {
  assert.equal(model.stripOuterFence("print('hello')"), "print('hello')");
});
