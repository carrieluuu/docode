(() => {
  const INDENT = "    ";

  function lineStart(value, position) {
    return value.lastIndexOf("\n", Math.max(0, position - 1)) + 1;
  }

  function lineEnd(value, position) {
    const next = value.indexOf("\n", position);
    return next === -1 ? value.length : next;
  }

  function indent(value, start, end, dedent = false) {
    const first = lineStart(value, start);
    const last = lineEnd(value, end);
    const selection = value.slice(first, last);
    const lines = selection.split("\n");
    const transformed = lines.map((line) => dedent
      ? line.replace(/^( {1,4}|\t)/, "")
      : INDENT + line
    );
    const replacement = transformed.join("\n");
    const removedFromFirst = dedent ? lines[0].length - transformed[0].length : -INDENT.length;
    const removedTotal = selection.length - replacement.length;

    return {
      value: value.slice(0, first) + replacement + value.slice(last),
      start: Math.max(first, start - removedFromFirst),
      end: Math.max(first, end - removedTotal)
    };
  }

  function indentationForEnter(value, position, language) {
    const start = lineStart(value, position);
    const before = value.slice(start, position);
    const base = before.match(/^\s*/)?.[0] || "";
    const trimmed = before.trimEnd();
    const pythonBlock = language === "python" && trimmed.endsWith(":");
    const braceBlock = /[{[(]$/.test(trimmed);
    return "\n" + base + (pythonBlock || braceBlock ? INDENT : "");
  }

  function stripOuterFence(value) {
    const normalized = value.replaceAll("\r\n", "\n");
    const match = normalized.match(/^\s*```[^\n`]*\n([\s\S]*?)\n```\s*$/);
    return match ? match[1] : value;
  }

  window.DocodeEditorModel = { INDENT, indent, indentationForEnter, stripOuterFence };
})();
