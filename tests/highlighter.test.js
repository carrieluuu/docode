const assert = require("node:assert/strict");
const test = require("node:test");

global.window = {};
require("../src/highlighter.js");
const { highlight } = window.DocodeHighlighter;

test("does not replace the first quoted string with a numeric placeholder", () => {
  const output = highlight('print("Hello world!")', "python");
  assert.match(output, /Hello world!/);
  assert.doesNotMatch(output, /print\([^<]*0[^<]*\)/);
});

test("keeps strings and numbers as separate highlighted tokens", () => {
  const output = highlight('message = "hello"\ncount = 42', "python");
  assert.match(output, /dc-string[^>]*>"hello"/);
  assert.match(output, /dc-number[^>]*>42/);
});

test("escapes markup inside strings", () => {
  const output = highlight('print("<script>")', "python");
  assert.match(output, /&lt;script&gt;/);
  assert.doesNotMatch(output, /<script>/);
});
