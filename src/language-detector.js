(() => {
  const rules = {
    python: [
      [/\bprint\s*\(/, 6],
      [/^\s*(def|from|import)\s+/m, 5],
      [/^\s*(if|elif|else|for|while|class|try|except|with)\b[^\n]*:\s*$/m, 4],
      [/\b(None|True|False|self)\b/, 3]
    ],
    javascript: [
      [/\bconsole\.(log|warn|error)\s*\(/, 6],
      [/\b(const|let|var)\s+[A-Za-z_$]/, 4],
      [/=>|===|!==/, 3],
      [/\b(function|document|window)\b/, 3]
    ],
    typescript: [
      [/^\s*(interface|type)\s+[A-Za-z_$]/m, 7],
      [/\b(enum|implements|keyof|unknown|never)\b/, 5],
      [/[A-Za-z_$][\w$]*\s*:\s*(string|number|boolean|unknown|any)(?:\[\])?\b/, 5],
      [/\bas\s+const\b/, 4]
    ],
    java: [
      [/\bpublic\s+static\s+void\s+main\s*\(/, 9],
      [/\bSystem\.out\.(print|println)\s*\(/, 7],
      [/^\s*import\s+java\./m, 6],
      [/\b(public|private|protected)\s+class\s+\w+/, 4]
    ],
    c: [
      [/#include\s*<stdio\.h>/, 8],
      [/\b(printf|scanf|malloc|free)\s*\(/, 5],
      [/\b(struct|typedef)\s+\w+/, 3]
    ],
    cpp: [
      [/#include\s*<(iostream|vector|string|algorithm)>/, 8],
      [/\bstd::|\b(cout|cin)\s*<</, 7],
      [/\b(template|namespace)\s*</, 4]
    ],
    csharp: [
      [/^\s*using\s+System\s*;/m, 8],
      [/\bConsole\.(Write|WriteLine|ReadLine)\s*\(/, 7],
      [/\bnamespace\s+[A-Za-z_]/, 5]
    ],
    go: [
      [/^\s*package\s+main\b/m, 8],
      [/^\s*func\s+\w+\s*\(/m, 6],
      [/\bfmt\.(Print|Printf|Println)\s*\(/, 6],
      [/:=/, 3]
    ],
    sql: [
      [/\bSELECT\b[\s\S]*\bFROM\b/i, 8],
      [/\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|CREATE\s+TABLE|ALTER\s+TABLE)\b/i, 7],
      [/\b(JOIN|GROUP\s+BY|ORDER\s+BY|WHERE)\b/i, 3]
    ],
    bash: [
      [/^#!.*\b(bash|sh|zsh)\b/m, 10],
      [/^\s*(echo|export|source)\s+/m, 4],
      [/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/, 3],
      [/^\s*(fi|done|esac)\s*$/m, 4]
    ],
    html: [
      [/<!DOCTYPE\s+html/i, 10],
      [/<(html|head|body|div|span|script|style|section|main)\b/i, 7],
      [/<\/[a-z][\w-]*>/i, 4]
    ],
    css: [
      [/(^|\n)\s*[.#]?[a-z][\w-]*(?:\s+[.#]?[a-z][\w-]*)*\s*\{[^}]*[\w-]+\s*:/i, 7],
      [/@(media|keyframes|import|font-face)\b/i, 6],
      [/\b(display|color|margin|padding|font-family)\s*:/i, 3]
    ],
    json: [
      [/^\s*[{[]\s*"[^"\n]+"\s*:/, 7],
      [/"[^"\n]+"\s*:\s*(?:"|\d|true|false|null|[{[])/, 5]
    ]
  };

  function detect(code) {
    if (!code || code.trim().length < 4) return null;
    const scores = Object.entries(rules).map(([language, patterns]) => ({
      language,
      score: patterns.reduce((total, [pattern, weight]) => total + (pattern.test(code) ? weight : 0), 0)
    })).sort((a, b) => b.score - a.score);

    const [best, second] = scores;
    if (!best || best.score < 4 || best.score === second?.score) return null;
    return { language: best.language, score: best.score };
  }

  window.DocodeLanguageDetector = { detect };
})();
