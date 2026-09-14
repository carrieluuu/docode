(() => {
  if (window.top !== window || window.__docodeLoaded) return;
  window.__docodeLoaded = true;

  const { normalize, all: languages } = window.DocodeLanguages;
  const { highlight } = window.DocodeHighlighter;
  const model = window.DocodeEditorModel;
  const docs = window.DocodeDocsAdapter;
  const fence = { buffer: "", timer: 0 };
  const handledKeyEvents = new WeakSet();
  let active = null;
  let awaitingDocsPaste = false;
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
      <div class="dc-actions">
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

  function clipboardHtml(value, language, returnStyle) {
    const styled = highlight(value, language)
      .replaceAll('class="dc-token dc-keyword"', 'style="color:#b80672;font-weight:600"')
      .replaceAll('class="dc-token dc-string"', 'style="color:#188038"')
      .replaceAll('class="dc-token dc-comment"', 'style="color:#5f6368;font-style:italic"')
      .replaceAll('class="dc-token dc-number"', 'style="color:#1a73e8"');
    const returnFont = returnStyle.fontFamily.replaceAll("'", "");
    // Google Docs drops a completely empty styled paragraph. A zero-width
    // space preserves the return paragraph and its original note typography
    // while remaining visually empty.
    return `<pre data-docode-language="${language}" style="font-family:'Roboto Mono',Menlo,Consolas,monospace;font-size:10.5pt;line-height:1.5;background:#f8f9fa;color:#202124;white-space:pre-wrap;margin:0;padding:10px 12px">${styled}</pre><div data-docode-return="true" style="font-family:'${returnFont}',Arial,sans-serif;font-size:${returnStyle.fontSize}pt;line-height:1.4;color:#202124"><span style="font-family:'${returnFont}',Arial,sans-serif;font-size:${returnStyle.fontSize}pt;color:#202124">&#8203;</span></div>`;
  }

  function render() {
    code.innerHTML = highlight(textarea.value, languageSelect.value) + "\n";
    code.parentElement.scrollTop = textarea.scrollTop;
    code.parentElement.scrollLeft = textarea.scrollLeft;
  }

  let saveTimer;
  function saveDraft() {
    clearTimeout(saveTimer);
    status.textContent = "Saving…";
    saveTimer = setTimeout(() => {
      chrome.storage.local.set({
        [storageKey()]: {
          code: textarea.value,
          language: languageSelect.value,
          pending: true,
          updatedAt: Date.now()
        }
      });
      status.textContent = "Draft saved";
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

  async function openEditor(language = "plain", options = {}) {
    if (active) return;
    const requestedLanguage = normalize(language);
    active = {
      language: requestedLanguage,
      openerRemoved: options.openerRemoved !== false,
      returnStyle: docs.currentTextStyle()
    };
    languageSelect.value = active.language;
    textarea.value = "";
    shell.hidden = false;
    manualPlacement = false;
    positionShell();

    const saved = await chrome.storage.local.get(storageKey());
    const storedDraft = saved[storageKey()];
    const draft = options.restoreDraft || storedDraft?.pending ? storedDraft : null;
    if (active && draft) {
      textarea.value = draft.code || "";
      languageSelect.value = language.trim() ? requestedLanguage : (draft.language || requestedLanguage);
      status.textContent = "Draft restored";
    } else {
      status.textContent = "Draft saved locally";
    }
    render();
    requestAnimationFrame(() => textarea.focus());
  }

  function closeEditor() {
    shell.hidden = true;
    active = null;
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

  textarea.addEventListener("input", () => { render(); saveDraft(); });
  textarea.addEventListener("scroll", render);
  languageSelect.addEventListener("change", () => { render(); saveDraft(); textarea.focus(); });

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

  function completeInsertion(message = "Code inserted into Google Docs") {
    awaitingDocsPaste = false;
    chrome.storage.local.remove(storageKey());
    closeEditor();
    showToast(message);
  }

  function onDocsPaste() {
    if (!awaitingDocsPaste) return;
    // Let Docs consume the paste before hiding the editor and clearing recovery.
    setTimeout(() => {
      if (awaitingDocsPaste) completeInsertion();
    }, 0);
  }

  shell.querySelector(".dc-insert").addEventListener("click", async () => {
    const value = model.stripOuterFence(textarea.value);
    const language = languageSelect.value;
    const openerRemoved = active?.openerRemoved !== false;
    const returnStyle = active?.returnStyle || docs.currentTextStyle();
    status.textContent = "Inserting…";
    try {
      await docs.writeClipboard(`${value}\n`, clipboardHtml(value, language, returnStyle));
      awaitingDocsPaste = true;
      shell.hidden = true;
      const inserted = docs.pasteClipboard();
      if (inserted) {
        // Some Docs builds do not expose the paste event back to the isolated
        // extension world even when insertion succeeds.
        if (awaitingDocsPaste) completeInsertion(openerRemoved
          ? "Code inserted into Google Docs"
          : "Code inserted — remove the original fenced opener if it remains"
        );
      } else {
        shell.hidden = false;
        status.textContent = "Copied — click the document and press ⌘V";
        showToast("Code copied — press ⌘V to paste it in Docs");
      }
    } catch {
      awaitingDocsPaste = false;
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
  window.Docode = {
    open: openEditor,
    restore: (language = "plain") => openEditor(language, { restoreDraft: true }),
    close: closeEditor
  };
})();
