(() => {
  const { detect } = window.DocodeLanguageDetector;
  const { normalize } = window.DocodeLanguages;

  function normalizeText(value) {
    return String(value || "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  }

  function fencedBlock(value) {
    const match = value.match(/^\s*```([^\n`]*)\n([\s\S]*?)\n```\s*$/);
    if (!match) return null;
    const tag = match[1].trim();
    const normalized = normalize(tag);
    const supportedTag = tag && (normalized !== "plain" || ["plain", "text", "txt"].includes(tag.toLowerCase()));
    return {
      code: match[2],
      explicitLanguage: Boolean(supportedTag),
      language: supportedTag ? normalized : ""
    };
  }

  function structuralScore(value, lines) {
    let score = 0;
    const nonEmpty = lines.filter((line) => line.trim());
    const count = (pattern) => nonEmpty.filter((line) => pattern.test(line)).length;

    if (count(/[;{}]\s*$/) >= 2) score += 3;
    if (count(/^\s*(?:[A-Za-z_$][\w$<>[\]]*\s+)?[A-Za-z_$][\w$.[\]]*\s*=\s*[^=]/) >= 2) score += 2;
    if (count(/^\s{2,}\S/) >= 1) score += 1;
    if (count(/\b[A-Za-z_$][\w$]*\s*\([^)]*\)/) >= 1) score += 1;
    if (/=>|===|!==|:=|::|#include|<\/?[a-z][^>]*>/i.test(value)) score += 2;
    if (count(/^\s*(\/\/|#|--|\/\*)/) >= 1) score += 1;
    return score;
  }

  function analyze(value) {
    const text = normalizeText(value);
    if (!text.trim() || text.length > 100_000) return null;

    const fenced = fencedBlock(text);
    if (fenced?.code.trim()) return { ...fenced, fenced: true };

    const lines = text.split("\n");
    const nonEmptyLines = lines.filter((line) => line.trim());
    if (nonEmptyLines.length < 2) return null;

    const detection = detect(text);
    const structure = structuralScore(text, lines);
    const confidentlyDetected = detection && detection.score >= 5;
    const detectedWithStructure = detection && detection.score >= 4 && structure >= 1;
    if (!confidentlyDetected && !detectedWithStructure && structure < 4) return null;

    return {
      code: text.replace(/\n$/, ""),
      explicitLanguage: false,
      fenced: false,
      language: detection?.language || ""
    };
  }

  window.DocodeSmartPaste = { analyze, normalizeText };
})();
