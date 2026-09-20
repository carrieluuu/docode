const assert = require("node:assert/strict");
const test = require("node:test");

global.window = {};
require("../src/block-registry.js");
const { fingerprint, normalizedCode } = window.DocodeBlockRegistry;

test("normalizes clipboard line endings and one document paragraph break", () => {
  assert.equal(normalizedCode("print('hello')\r\n"), "print('hello')");
});

test("uses stable fingerprints for equivalent selected code", () => {
  assert.equal(fingerprint("const value = 1;\n"), fingerprint("const value = 1;"));
  assert.notEqual(fingerprint("const value = 1;"), fingerprint("const value = 2;"));
});
