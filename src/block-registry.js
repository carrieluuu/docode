(() => {
  function normalizedCode(value) {
    return String(value || "").replaceAll("\r\n", "\n").replace(/\n$/, "");
  }

  function fingerprint(value) {
    const input = normalizedCode(value);
    let hash = 0x811c9dc5;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
  }

  function storageKey(documentId) {
    return `docode:${documentId}:blocks`;
  }

  async function remember(documentId, code, language) {
    const key = storageKey(documentId);
    const stored = await chrome.storage.local.get(key);
    const entries = Array.isArray(stored[key]) ? stored[key] : [];
    const signature = fingerprint(code);
    const next = [
      { signature, language, updatedAt: Date.now() },
      ...entries.filter((entry) => entry.signature !== signature)
    ].slice(0, 100);
    await chrome.storage.local.set({ [key]: next });
  }

  async function languageFor(documentId, code) {
    const key = storageKey(documentId);
    const stored = await chrome.storage.local.get(key);
    const signature = fingerprint(code);
    return stored[key]?.find((entry) => entry.signature === signature)?.language || null;
  }

  window.DocodeBlockRegistry = { fingerprint, languageFor, normalizedCode, remember };
})();
