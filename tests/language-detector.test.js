const assert = require("node:assert/strict");
const test = require("node:test");

global.window = {};
require("../src/language-detector.js");
const { detect } = window.DocodeLanguageDetector;

const languageFor = (code) => detect(code)?.language;

test("detects Python print calls", () => {
  assert.equal(languageFor('print("Hello world")'), "python");
});

test("detects common language signatures", () => {
  assert.equal(languageFor('console.log("hello");'), "javascript");
  assert.equal(languageFor('System.out.println("hello");'), "java");
  assert.equal(languageFor('SELECT name FROM users WHERE active = true;'), "sql");
  assert.equal(languageFor('package main\nfunc main() { fmt.Println("hello") }'), "go");
});

test("does not guess ambiguous prose", () => {
  assert.equal(detect("write something here"), null);
});

test("prefers TypeScript-specific syntax over JavaScript", () => {
  assert.equal(languageFor('interface User { name: string }'), "typescript");
});
