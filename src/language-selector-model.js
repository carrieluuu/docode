(() => {
  function options(definitions) {
    return Object.entries(definitions).map(([id, definition], order) => ({
      id,
      label: definition.label,
      aliases: definition.aliases || [],
      order
    }));
  }

  function filter(definitions, query = "") {
    const needle = query.trim().toLowerCase();
    const available = options(definitions);
    if (!needle) return available;

    return available
      .map((option) => {
        const terms = [option.id, option.label, ...option.aliases].map((term) => term.toLowerCase());
        let rank = 3;
        if (terms.some((term) => term === needle)) rank = 0;
        else if (terms.some((term) => term.startsWith(needle))) rank = 1;
        else if (terms.some((term) => term.includes(needle))) rank = 2;
        return { ...option, rank };
      })
      .filter((option) => option.rank < 3)
      .sort((left, right) => left.rank - right.rank || left.order - right.order);
  }

  function moveIndex(index, delta, length) {
    if (length <= 0) return -1;
    const startingIndex = index < 0 ? (delta > 0 ? -1 : 0) : index;
    return (startingIndex + delta + length) % length;
  }

  const api = { filter, moveIndex };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.DocodeLanguageSelectorModel = api;
})();
