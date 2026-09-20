# docode

**Developer mode for Google Docs.**

docode is a Chrome extension for writing programming notes without leaving Google Docs. It adds a focused, Smart Canvas-inspired code editor with language-aware highlighting, multiline editing, indentation controls, and lightweight auto-indent—while keeping the finished content inside the Google Doc.

The long-term goal is simple:

> Google Docs convenience with Obsidian- and GitHub-style code editing.

## Current prototype

Select the docode extension button, press **Option+Shift+C** on macOS, or press **Alt+Shift+C** on Windows/Linux. With only a caret, docode opens a new movable, resizable editor without inserting trigger text. With text selected, it imports or reopens that code for an in-place update. Fenced openers such as `````python`` remain available when automatic language selection is more convenient.

The prototype currently supports:

- True multiline code editing
- Python, JavaScript, TypeScript, Java, C, C++, C#, Go, SQL, Bash, HTML, CSS, and JSON
- Live syntax highlighting without moving the editor caret
- Tab and Shift+Tab indentation for the current line or selection
- Indentation preservation when pressing Enter
- Lightweight extra indentation after Python colons and opening braces
- Automatic language selection from fenced openers
- Live language inference when the toolbar or keyboard shortcut opens a blank editor
- Opener-free launch from the Chrome toolbar, Option+Shift+C on macOS, or Alt+Shift+C on Windows/Linux
- A searchable, keyboard-accessible language selector
- Smart Canvas-inspired visual styling
- Draggable and resizable editor placement
- Per-document local draft recovery
- Rich-text insertion with a plain-text clipboard fallback
- A return paragraph that restores the surrounding note font and size
- Per-document language memory without adding hidden characters to copied code
- Reopening and updating a selected docode block in place
- Converting selected legacy code or ordinary text into an editable docode block
- Smart Paste detection for fenced code, multiline source, and common terminal commands

## Documents remain portable

After insertion, code is stored as ordinary Google Docs text with document-native formatting. The extension is not required to display the inserted code.

If docode is disabled or removed:

- Inserted code remains visible.
- Syntax colors and typography already written into the document remain.
- The document remains editable and shareable through Google Docs.
- Collaborators do not need docode to read the content.

Only a draft that has not yet been inserted remains extension-local.

## Install locally

1. Clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the cloned `docode` directory.
6. Open or reload a Google Doc.
7. Select the docode toolbar button, press **Option+Shift+C** on macOS, or press **Alt+Shift+C** on Windows/Linux.

When making local changes, use **Reload** on the extension card and reload the Google Doc.

Chrome shortcuts can be customized at `chrome://extensions/shortcuts` if the default conflicts with another extension or local setup.

## Using the editor

- Choose a language from the selector or include it in the opening fence. Type to filter by name or alias, then use the arrow keys and Enter to select it; Escape closes the menu.
- Open docode without leaving trigger text by using the toolbar button, **Option+Shift+C** on macOS, or **Alt+Shift+C** on Windows/Linux.
- Press **Tab** or **Shift+Tab** to indent or dedent.
- Drag the top toolbar to move the editor.
- Drag the lower-right corner to resize it.
- Select **Insert** to write the formatted code into the document.
- To edit an existing block, select the complete block in Google Docs and invoke docode again. When Chrome allows automatic selection capture, the editor opens it immediately. Otherwise, choose **Edit selection** in the console. The primary action then becomes **Update in Docs** and replaces the selection.
- Selecting unmarked code before invoking docode imports it into the editor and upgrades it to a reusable docode block.
- Pasting likely multiline code directly into Google Docs opens a prefilled review draft with language inference. Choose **Insert** to format it or **Paste normally** to keep the original clipboard behavior.
- If automatic insertion is unavailable, click the document and press Command+V or Ctrl+V. The draft stays recoverable until Docs receives the paste.

## Known limitations

Google Docs uses a canvas-based editor and does not expose a supported live-caret API to Chrome extensions. The current prototype therefore has several deliberate constraints:

- A typed fenced opener remains visible and must be removed manually; use the toolbar or keyboard shortcut to avoid it.
- Existing blocks must currently be selected before invoking docode; Docs does not expose a supported document index for a collapsed caret.
- Language memory is local to the current Chrome profile; another device falls back to automatic detection or manual selection.
- Smart Paste intentionally ignores single-line snippets and uncertain multiline content to avoid interrupting ordinary writing.
- The editor is an overlay during active editing; changes are written back when inserted.
- The Google Docs text-event bridge is undocumented and needs broader compatibility testing.
- Collaboration behavior still needs validation with a second account and without the extension installed.

These are persistence and anchoring problems rather than editor problems. Selection-based updates keep the Google Doc text clean and remember language choices locally. Collapsed-caret lookup, cross-device language metadata, and collaboration-safe replacement may eventually use an authenticated Google Docs API bridge or another supported range primitive.

See [TODO.md](TODO.md) for the current validation backlog.

## Development

The prototype intentionally has no runtime dependencies or build step.

```sh
npm test
```

The tests cover indentation, auto-indent, fence sanitization, block fingerprints, language detection, language-selector filtering and navigation, Smart Paste classification, safe HTML escaping, and syntax-token rendering.

### Project structure

```text
docode/
├── manifest.json
├── src/
│   ├── content.js         # Trigger detection, editor UI, drafts, insertion
│   ├── content.css        # Smart Canvas-inspired editor styling
│   ├── docs-adapter.js    # Google Docs event, caret, and clipboard bridge
│   ├── editor-model.js    # Pure indentation and fence behavior
│   ├── block-registry.js  # Local code fingerprints and language memory
│   ├── smart-paste.js     # Conservative clipboard code classification
│   ├── highlighter.js     # Dependency-free V1 syntax tokenizer
│   ├── language-selector-model.js # Search ranking and keyboard navigation
│   └── languages.js       # Supported languages and aliases
└── tests/
```

## Technical direction

The extension keeps Docs-specific integration isolated from the editor model. That boundary lets the interaction layer evolve without coupling indentation, highlighting, or draft behavior to Google Docs internals.

The current selection-based block lifecycle is:

1. Insert clean, ordinarily formatted Google Docs code.
2. Select that block in Google Docs and invoke docode.
3. Restore its source and use local language memory or automatic detection.
4. Replace and restyle the selected block on update.

The next anchoring milestone is resolving an existing block from a collapsed caret without relying on undocumented canvas internals.

The current Docs adapter selectors were validated against Google Docs on September 13, 2026. They are evidence for this prototype, not a long-term compatibility guarantee.
