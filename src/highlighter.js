(() => {
  const keywordGroups = {
    python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield",
    javascript: "async await break case catch class const continue debugger default delete do else export extends false finally for from function get if import in instanceof let new null of return set static super switch this throw true try typeof undefined var void while with yield",
    typescript: "abstract any as async await boolean break case catch class const constructor continue declare default delete do else enum export extends false finally for from function if implements import in infer instanceof interface keyof let namespace never new null number object of private protected public readonly return static string super switch symbol this throw true try type typeof undefined unknown var void while yield",
    java: "abstract assert boolean break byte case catch char class const continue default do double else enum extends false final finally float for goto if implements import instanceof int interface long native new null package private protected public return short static strictfp super switch synchronized this throw throws transient true try void volatile while",
    c: "auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while",
    cpp: "alignas alignof and asm auto bitand bitor bool break case catch char class compl concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not nullptr operator or private protected public register reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while xor",
    csharp: "abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while",
    go: "break default func interface select case defer go map struct chan else goto package switch const fallthrough if range type continue for import return var",
    sql: "add all alter and any as asc backup between by case check column constraint create database default delete desc distinct drop exec exists foreign from full group having in index inner insert into is join key left like limit not null on or order outer primary procedure right rownum select set table top truncate union unique update values view where",
    bash: "case do done elif else esac fi for function if in select then time until while",
    css: "important inherit initial revert unset",
    json: "true false null"
  };

  const escape = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  function highlight(code, language) {
    const escaped = escape(code);
    if (language === "plain") return escaped;

    const stash = [];
    const store = (className) => (match) => {
      // One private-use character keeps later token passes from matching a
      // numeric placeholder index (which previously turned strings into `0`).
      const token = String.fromCodePoint(0xE000 + stash.length);
      stash.push(`<span class="dc-token dc-${className}">${match}</span>`);
      return token;
    };

    let output = escaped;
    output = output.replace(/(&quot;|&apos;|&grave;)/g, "$1");
    output = output.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, store("string"));
    output = output.replace(/(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|&lt;!--[\s\S]*?--&gt;)/g, store("comment"));
    output = output.replace(/\b(0x[\da-f]+|\d+(?:\.\d+)?)\b/gi, store("number"));

    const keywords = keywordGroups[language] || keywordGroups[language === "html" ? "json" : "javascript"];
    if (keywords) {
      const expression = new RegExp(`\\b(${keywords.split(" ").join("|")})\\b`, language === "sql" ? "gi" : "g");
      output = output.replace(expression, store("keyword"));
    }

    if (language === "html") {
      output = output.replace(/(&lt;\/?)([a-z][\w-]*)/gi, "$1<span class=\"dc-token dc-keyword\">$2</span>");
    }

    return output.replace(/[\uE000-\uF8FF]/gu, (token) => stash[token.codePointAt(0) - 0xE000]);
  }

  window.DocodeHighlighter = { highlight, escape };
})();
