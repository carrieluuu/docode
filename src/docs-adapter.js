(() => {
  const EDITOR_SELECTORS = [
    ".docs-texteventtarget-iframe",
    "iframe.docs-texteventtarget-iframe"
  ];

  function inputDocument() {
    for (const selector of EDITOR_SELECTORS) {
      const frame = document.querySelector(selector);
      if (frame?.contentDocument) return frame.contentDocument;
    }
    return document;
  }

  function eventTargets() {
    const doc = inputDocument();
    // Listen only at the actual Docs text-event document. Docs may forward or
    // clone events to the top document; observing both can duplicate input.
    return [doc];
  }

  function caretRect() {
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (rect.width || rect.height) return rect;
    }
    const caret = document.querySelector(".kix-cursor-caret");
    return caret?.getBoundingClientRect() || null;
  }

  function documentId() {
    return location.pathname.match(/\/document\/d\/([^/]+)/)?.[1] || "unknown";
  }

  function currentTextStyle() {
    const selectedText = (root) => root?.querySelector('[aria-selected="true"]')?.textContent?.trim()
      || root?.querySelector(".goog-toolbar-combo-button-input")?.textContent?.trim()
      || root?.textContent?.trim();
    const fontRoot = document.querySelector('[role="listbox"][aria-label^="Font"]')
      || document.querySelector(".docs-font-family");
    const sizeRoot = document.querySelector('[role="combobox"][aria-label^="Font size"]')
      || document.querySelector(".docs-font-size");
    const rawFont = selectedText(fontRoot) || "Arial";
    const rawSize = Number.parseFloat(selectedText(sizeRoot) || "11");
    return {
      fontFamily: /^[\w .,+-]{1,80}$/.test(rawFont) ? rawFont : "Arial",
      fontSize: Number.isFinite(rawSize) && rawSize >= 6 && rawSize <= 96 ? rawSize : 11
    };
  }

  async function writeClipboard(text, html) {
    if (window.ClipboardItem && navigator.clipboard.write) {
      const item = new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" })
      });
      await navigator.clipboard.write([item]);
      return;
    }
    await navigator.clipboard.writeText(text);
  }

  function pasteClipboard() {
    const doc = inputDocument();
    doc.defaultView?.focus();
    doc.body?.focus();
    try {
      return Boolean(doc.execCommand?.("paste"));
    } catch {
      return false;
    }
  }

  window.DocodeDocsAdapter = { currentTextStyle, eventTargets, caretRect, documentId, pasteClipboard, writeClipboard };
})();
