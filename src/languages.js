(() => {
  const definitions = {
    plain: { label: "Plain text", aliases: ["text", "txt"] },
    python: { label: "Python", aliases: ["py"] },
    javascript: { label: "JavaScript", aliases: ["js", "jsx"] },
    typescript: { label: "TypeScript", aliases: ["ts", "tsx"] },
    java: { label: "Java", aliases: [] },
    c: { label: "C", aliases: [] },
    cpp: { label: "C++", aliases: ["c++", "cc", "cxx"] },
    csharp: { label: "C#", aliases: ["cs", "c#"] },
    go: { label: "Go", aliases: ["golang"] },
    sql: { label: "SQL", aliases: [] },
    bash: { label: "Bash", aliases: ["sh", "shell", "zsh"] },
    html: { label: "HTML", aliases: ["htm"] },
    css: { label: "CSS", aliases: [] },
    json: { label: "JSON", aliases: [] }
  };

  const aliases = new Map();
  Object.entries(definitions).forEach(([id, definition]) => {
    aliases.set(id, id);
    definition.aliases.forEach((alias) => aliases.set(alias, id));
  });

  window.DocodeLanguages = {
    all: definitions,
    normalize(value = "") {
      return aliases.get(value.trim().toLowerCase()) || "plain";
    }
  };
})();
