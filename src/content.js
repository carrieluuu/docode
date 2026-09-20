(() => {
  if (window.top !== window || window.__docodeLoaded) return;
  window.__docodeLoaded = true;

  const { normalize, all: languages } = window.DocodeLanguages;
  const { detect: detectLanguage } = window.DocodeLanguageDetector;
  const smartPaste = window.DocodeSmartPaste;
  const { highlight } = window.DocodeHighlighter;
  const model = window.DocodeEditorModel;
  const blockRegistry = window.DocodeBlockRegistry;
  const docs = window.DocodeDocsAdapter;
  const fence = { buffer: "", timer: 0 };
  const handledKeyEvents = new WeakSet();
  let active = null;
  let openingFromDocument = false;
  let awaitingDocsPaste = false;
  let bypassNextSmartPaste = false;
  let completionMessage = "Code inserted into Google Docs";
  let pendingBlock = null;
  let manualPlacement = false;

  const shell = document.createElement("section");
  shell.className = "dc-shell";
  shell.hidden = true;
  shell.innerHTML = `
    <header class="dc-toolbar">
      <span class="dc-grip" aria-hidden="true">⠿</span>
      <label class="dc-language-label"><span class="dc-visually-hidden">Language</span>
        <select class="dc-language"></select>
      </label>
      <span class="dc-auto-language" hidden>Auto</span>
      <div class="dc-actions">
        <button class="dc-secondary-button dc-load-selection" type="button" hidden>Edit selection</button>
        <button class="dc-secondary-button dc-paste-normal" type="button" hidden>Paste normally</button>
        <button class="dc-button dc-insert" type="button">Insert</button>
      </div>
      <button class="dc-icon-button dc-close" type="button" aria-label="Close">×</button>
    </header>
    <div class="dc-editor-wrap">
      <pre class="dc-highlight" aria-hidden="true"><code></code></pre>
      <textarea class="dc-editor" aria-label="Code editor" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
    </div>
    <footer class="dc-footer"><span>Tab indents · Shift+Tab dedents</span><span class="dc-status">Draft saved</span></footer>`;
  document.body.append(shell);

  const toast = document.createElement("div");
  toast.className = "dc-toast";
  toast.hidden = true;
  document.body.append(toast);

  const textarea = shell.querySelector(".dc-editor");
  const code = shell.querySelector(".dc-highlight code");
  const languageSelect = shell.querySelector(".dc-language");
  const autoLanguage = shell.querySelector(".dc-auto-language");
  const loadSelectionButton = shell.querySelector(".dc-load-selection");
  const pasteNormallyButton = shell.querySelector(".dc-paste-normal");
  const commitButton = shell.querySelector(".dc-insert");
  const status = shell.querySelector(".dc-status");
  Object.entries(languages).forEach(([value, definition]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = definition.label;
    languageSelect.append(option);
  });

  function storageKey() {
    return `docode:${docs.documentId()}:draft`;
  }

  let toastTimer;
  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
  }

  function clipboardPayload(value, language, returnStyle, includeReturn) {
    const styled = highlight(value, language)
      .replaceAll('class="dc-token dc-keyword"', 'style="color:#b80672;font-weight:600"')
      .replaceAll('class="dc-token dc-string"', 'style="color:#188038"')
      .replaceAll('class="dc-token dc-comment"', 'style="color:#5f6368;font-style:italic"')
      .replaceAll('class="dc-token dc-number"', 'style="color:#1a73e8"');
    const returnFont = returnStyle.fontFamily.replaceAll("'", "");
    // Google Docs drops a completely empty styled paragraph. A zero-width
    // space preserves the return paragraph and its original note typography
    // while remaining visually empty.
    const returnParagraph = includeReturn
      ? `<div data-docode-return="true" style="font-family:'${returnFont}',Arial,sans-serif;font-size:${returnStyle.fontSize}pt;line-height:1.4;color:#202124"><span style="font-family:'${returnFont}',Arial,sans-serif;font-size:${returnStyle.fontSize}pt;color:#202124">&#8203;</span></div>`
      : "";
    return {
      text: value + (includeReturn ? "\n" : ""),
      html: `<pre data-docode-language="${language}" style="font-family:'Roboto Mono',Menlo,Consolas,monospace;font-size:10.5pt;line-height:1.5;background:#f8f9fa;color:#202124;white-space:pre-wrap;margin:0;padding:10px 12px">${styled}</pre>${returnParagraph}`
    };
  }

  function render() {
    code.innerHTML = highlight(textarea.value, languageSelect.value) + "\n";
    code.parentElement.scrollTop = textarea.scrollTop;
    code.parentElement.scrollLeft = textarea.scrollLeft;
  }

  function updateDetectedLanguage() {
    if (!active?.autoDetect) return;
    const result = detectLanguage(textarea.value);
    autoLanguage.hidden = false;
    if (!result) {
      autoLanguage.textContent = languageSelect.value === "plain"
        ? "Auto"
        : `Auto · ${languages[languageSelect.value]?.label || ""}`;
      return;
    }
    if (languageSelect.value !== result.language) {
      languageSelect.value = result.language;
      render();
    }
    autoLanguage.textContent = `Auto · ${languages[result.language].label}`;
  }

  let saveTimer;
  function clearStoredDraft() {
    clearTimeout(saveTimer);
    chrome.storage.local.remove(storageKey());
  }

  function saveDraft(savedMessage = "Draft saved") {
    clearTimeout(saveTimer);
    status.textContent = "Saving…";
    saveTimer = setTimeout(() => {
      chrome.storage.local.set({
        [storageKey()]: {
          code: textarea.value,
          language: languageSelect.value,
          autoDetect: active?.autoDetect === true,
          blockId: active?.blockId,
          mode: active?.mode || "insert",
          pending: true,
          updatedAt: Date.now()
        }
      });
      status.textContent = savedMessage;
    }, 180);
  }

  function positionShell() {
    const rect = docs.caretRect();
    const width = Math.min(760, window.innerWidth - 32);
    const left = rect ? Math.min(Math.max(16, rect.left), window.innerWidth - width - 16) : (window.innerWidth - width) / 2;
    const shellHeight = shell.offsetHeight || 408;
    const top = rect ? Math.min(Math.max(72, rect.bottom + 10), window.innerHeight - shellHeight - 16) : 120;
    if (!shell.style.width) shell.style.width = `${width}px`;
    shell.style.left = `${left}px`;
    shell.style.top = `${top}px`;
  }

  function clampShell() {
    const rect = shell.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - rect.width - 8));
    const top = Math.min(Math.max(56, rect.top), Math.max(56, window.innerHeight - rect.height - 8));
    shell.style.left = `${left}px`;
    shell.style.top = `${top}px`;
  }

  async function openEditor(language = "", options = {}) {
    if (active) {
      textarea.focus();
      return;
    }
    const requestedLanguage = normalize(language);
    const selectedBlock = options.block || null;
    const session = {
      language: requestedLanguage,
      openerRemoved: options.openerRemoved !== false,
      returnStyle: docs.currentTextStyle(),
      autoDetect: options.autoDetect === true || (!selectedBlock && !language.trim()),
      blockId: selectedBlock?.id || null,
      mode: selectedBlock ? "edit" : "insert",
      originalPaste: options.originalPaste || null
    };
    active = session;
    languageSelect.value = active.language;
    textarea.value = options.initialCode ?? selectedBlock?.code ?? "";
    commitButton.textContent = selectedBlock ? "Update in Docs" : "Insert";
    loadSelectionButton.hidden = selectedBlock || !options.allowSelectionLoad;
    pasteNormallyButton.hidden = !options.smartPaste;
    shell.hidden = false;
    manualPlacement = false;
    positionShell();

    const saved = await chrome.storage.local.get(storageKey());
    if (active !== session) return;
    const storedDraft = saved[storageKey()];
    const matchingEditDraft = selectedBlock
      && storedDraft?.pending
      && storedDraft.mode === "edit"
      && storedDraft.blockId === selectedBlock.id;
    const insertDraft = !options.skipDraft
      && !selectedBlock
      && storedDraft?.pending
      && storedDraft.mode !== "edit";
    const draft = options.restoreDraft || matchingEditDraft || insertDraft ? storedDraft : null;
    if (active && draft) {
      textarea.value = draft.code || "";
      languageSelect.value = draft.language || requestedLanguage;
      if (typeof draft.autoDetect === "boolean") active.autoDetect = draft.autoDetect;
      status.textContent = selectedBlock ? "Edit draft restored" : "Draft restored";
    } else if (selectedBlock) {
      status.textContent = "Editing selected code";
    } else if (options.smartPaste) {
      status.textContent = "Smart Paste captured — review before inserting";
    } else {
      status.textContent = "Draft saved locally";
    }
    autoLanguage.hidden = !active.autoDetect;
    updateDetectedLanguage();
    render();
    if (options.smartPaste) saveDraft("Smart Paste captured · Draft saved");
    requestAnimationFrame(() => textarea.focus());
  }

  function closeEditor() {
    shell.hidden = true;
    active = null;
    awaitingDocsPaste = false;
    bypassNextSmartPaste = false;
    pendingBlock = null;
  }

  async function selectedCodeFromDocument(options = {}) {
    const selectedText = await docs.readSelectedText(options);
    if (!selectedText?.trim()) return null;
    const code = blockRegistry.normalizedCode(selectedText);
    const rememberedLanguage = await blockRegistry.languageFor(docs.documentId(), code);
    return {
      language: rememberedLanguage || "",
      block: { id: blockRegistry.fingerprint(code), language: rememberedLanguage || "plain", code },
      autoDetect: !rememberedLanguage
    };
  }

  async function openFromDocument() {
    if (active || openingFromDocument) {
      textarea.focus();
      return;
    }
    openingFromDocument = true;
    try {
      const selection = await selectedCodeFromDocument();
      if (selection) {
        await openEditor(selection.language, {
          autoDetect: selection.autoDetect,
          block: selection.block,
          importSelection: true,
          openerRemoved: true
        });
        return;
      }
      await openEditor("", { allowSelectionLoad: true, openerRemoved: true });
    } finally {
      openingFromDocument = false;
    }
  }

  function onDocsKeydown(event) {
    if (handledKeyEvents.has(event)) return;
    handledKeyEvents.add(event);
    if (active || event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "Backspace") {
      fence.buffer = fence.buffer.slice(0, -1);
      return;
    }

    if (event.key.length === 1) {
      fence.buffer = (fence.buffer + event.key).slice(-32);
      clearTimeout(fence.timer);
      fence.timer = setTimeout(() => { fence.buffer = ""; }, 2500);
      return;
    }

    if (event.key === "Enter") {
      const match = fence.buffer.match(/```([a-zA-Z+#]*)$/);
      fence.buffer = "";
      if (match) {
        // Let Google Docs handle Enter first so the opener is never swallowed
        // and inserted code starts on its own real document line.
        setTimeout(() => openEditor(match[1], { openerRemoved: false }), 0);
      }
    }
  }

  function bindDocsTargets() {
    docs.eventTargets().forEach((target) => {
      target.addEventListener("keydown", onDocsKeydown, true);
      target.addEventListener("paste", onDocsPaste, true);
    });
  }
  bindDocsTargets();
  let bindTimer;
  new MutationObserver(() => {
    clearTimeout(bindTimer);
    bindTimer = setTimeout(bindDocsTargets, 100);
  }).observe(document.documentElement, { childList: true, subtree: true });

  textarea.addEventListener("input", () => { render(); updateDetectedLanguage(); saveDraft(); });
  textarea.addEventListener("scroll", render);
  languageSelect.addEventListener("change", () => {
    if (active) active.autoDetect = false;
    autoLanguage.hidden = true;
    render();
    saveDraft();
    textarea.focus();
  });

  textarea.addEventListener("keydown", (event) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (event.key === "Tab") {
      event.preventDefault();
      const update = model.indent(textarea.value, start, end, event.shiftKey);
      textarea.value = update.value;
      textarea.setSelectionRange(update.start, update.end);
      render();
      saveDraft();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const insertion = model.indentationForEnter(textarea.value, start, languageSelect.value);
      textarea.setRangeText(insertion, start, end, "end");
      render();
      saveDraft();
    } else if (event.key === "Escape") {
      closeEditor();
    }
  });

  shell.querySelector(".dc-close").addEventListener("click", closeEditor);

  loadSelectionButton.addEventListener("click", async () => {
    status.textContent = "Loading selection…";
    const selection = await selectedCodeFromDocument({ skipSelectionCheck: true });
    if (!selection) {
      status.textContent = "Select the complete code block, then try again";
      showToast("Select the complete code block in Docs, then choose Edit selection");
      return;
    }
    closeEditor();
    await openEditor(selection.language, {
      autoDetect: selection.autoDetect,
      block: selection.block,
      importSelection: true,
      openerRemoved: true
    });
  });

  function completeNormalPaste() {
    bypassNextSmartPaste = false;
    clearStoredDraft();
    closeEditor();
    showToast("Pasted without docode formatting");
  }

  pasteNormallyButton.addEventListener("click", async () => {
    const original = active?.originalPaste;
    if (!original?.text) return;
    status.textContent = "Pasting normally…";
    try {
      if (original.html) await docs.writeClipboard(original.text, original.html);
      else await docs.writePlainText(original.text);
      bypassNextSmartPaste = true;
      shell.hidden = true;
      const pasted = docs.pasteClipboard();
      if (pasted) {
        if (bypassNextSmartPaste) completeNormalPaste();
      } else {
        shell.hidden = false;
        status.textContent = "Copied — click the document and paste";
        showToast("Original content copied — press ⌘V or Ctrl+V to paste normally");
      }
    } catch {
      bypassNextSmartPaste = false;
      shell.hidden = false;
      status.textContent = "Could not access the clipboard";
    }
  });

  function completeInsertion(message = completionMessage) {
    awaitingDocsPaste = false;
    if (pendingBlock) {
      void blockRegistry.remember(docs.documentId(), pendingBlock.code, pendingBlock.language).catch(() => {});
      pendingBlock = null;
    }
    clearStoredDraft();
    closeEditor();
    showToast(message);
  }

  function onDocsPaste(event) {
    if (bypassNextSmartPaste) {
      setTimeout(() => {
        if (bypassNextSmartPaste) completeNormalPaste();
      }, 0);
      return;
    }
    if (awaitingDocsPaste) {
      // Let Docs consume docode's own paste before hiding the editor and
      // clearing recovery. This path must never be recaptured as Smart Paste.
      setTimeout(() => {
        if (awaitingDocsPaste) completeInsertion();
      }, 0);
      return;
    }
    if (active) return;

    const pastedText = event.clipboardData?.getData("text/plain");
    const analysis = smartPaste.analyze(pastedText);
    if (!analysis) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    void openEditor(analysis.language, {
      autoDetect: !analysis.explicitLanguage,
      initialCode: analysis.code,
      openerRemoved: true,
      originalPaste: {
        html: event.clipboardData?.getData("text/html") || "",
        text: pastedText
      },
      skipDraft: true,
      smartPaste: true
    });
  }

  commitButton.addEventListener("click", async () => {
    bypassNextSmartPaste = false;
    const value = model.stripOuterFence(textarea.value);
    const language = languageSelect.value;
    const openerRemoved = active?.openerRemoved !== false;
    const returnStyle = active?.returnStyle || docs.currentTextStyle();
    const editing = active?.mode === "edit";
    const payload = clipboardPayload(value, language, returnStyle, !editing);
    pendingBlock = { code: value, language };
    completionMessage = editing
      ? "Code block updated in Google Docs"
      : (openerRemoved
        ? "Code inserted into Google Docs"
        : "Code inserted — remove the original fenced opener if it remains");
    status.textContent = editing ? "Updating…" : "Inserting…";
    try {
      await docs.writeClipboard(payload.text, payload.html);
      awaitingDocsPaste = true;
      shell.hidden = true;
      const inserted = docs.pasteClipboard();
      if (inserted) {
        // Some Docs builds do not expose the paste event back to the isolated
        // extension world even when insertion succeeds.
        if (awaitingDocsPaste) completeInsertion();
      } else {
        shell.hidden = false;
        status.textContent = editing
          ? "Copied — reselect the code block and paste"
          : "Copied — click the document and paste";
        showToast(editing
          ? "Update copied — reselect the original code block and paste"
          : "Code copied — press ⌘V or Ctrl+V to paste it in Docs");
      }
    } catch {
      awaitingDocsPaste = false;
      pendingBlock = null;
      shell.hidden = false;
      status.textContent = "Could not access the clipboard";
      textarea.focus();
    }
  });

  const toolbar = shell.querySelector(".dc-toolbar");
  let drag = null;
  toolbar.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button, select, label")) return;
    const rect = shell.getBoundingClientRect();
    drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    manualPlacement = true;
    toolbar.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  toolbar.addEventListener("pointermove", (event) => {
    if (!drag) return;
    shell.style.left = `${drag.left + event.clientX - drag.x}px`;
    shell.style.top = `${drag.top + event.clientY - drag.y}px`;
    clampShell();
  });
  const stopDragging = () => { drag = null; };
  toolbar.addEventListener("pointerup", stopDragging);
  toolbar.addEventListener("pointercancel", stopDragging);

  document.addEventListener("scroll", () => {
    if (active && !manualPlacement) positionShell();
  }, true);
  window.addEventListener("resize", () => active && clampShell());
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "docode:open-editor") return;
    void openFromDocument();
  });
  window.Docode = {
    open: openEditor,
    openFromDocument,
    restore: (language = "") => openEditor(language, { restoreDraft: true }),
    close: closeEditor
  };
})();
