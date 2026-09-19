# docode

**Developer mode for Google Docs.**

docode is a Chrome extension for writing programming notes without leaving Google Docs. It adds a focused, Smart Canvas-inspired code editor with language-aware highlighting, multiline editing, indentation controls, and lightweight auto-indent—while keeping the finished content inside the Google Doc.

The long-term goal is simple:

> Google Docs convenience with Obsidian- and GitHub-style code editing.

## Current prototype

Select the docode extension button, press **Option+Shift+C** on macOS, or press **Alt+Shift+C** on Windows/Linux. docode opens a movable, resizable editor near the document caret without inserting trigger text. Fenced openers such as `````python`` remain available when automatic language selection is more convenient.

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
- A compact language selector
- Smart Canvas-inspired visual styling
- Draggable and resizable editor placement
- Per-document local draft recovery
- Rich-text insertion with a plain-text clipboard fallback
- A return paragraph that restores the surrounding note font and size

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

- Choose a language from the selector or include it in the opening fence.
- Open docode without leaving trigger text by using the toolbar button, **Option+Shift+C** on macOS, or **Alt+Shift+C** on Windows/Linux.
- Press **Tab** or **Shift+Tab** to indent or dedent.
- Drag the top toolbar to move the editor.
- Drag the lower-right corner to resize it.
- Select **Insert** to write the formatted code into the document.
- If automatic insertion is unavailable, click the document and press Command+V. The draft stays recoverable until Docs receives the paste.

## Known limitations

Google Docs uses a canvas-based editor and does not expose a supported live-caret API to Chrome extensions. The current prototype therefore has several deliberate constraints:

- A typed fenced opener remains visible and must be removed manually; use the toolbar or keyboard shortcut to avoid it.
- Clicking previously inserted code does not reopen it in docode yet.
- The editor is an overlay during active editing; changes are written back when inserted.
- The Google Docs text-event bridge is undocumented and needs broader compatibility testing.
- Collaboration behavior still needs validation with a second account and without the extension installed.

These are persistence and anchoring problems rather than editor problems. The planned solution is an authenticated Google Docs API bridge using stable markers or named ranges. A shortcut-based trigger is also being considered so users can open the editor without leaving fence text behind.

See [TODO.md](TODO.md) for the current validation backlog.

## Development

The prototype intentionally has no runtime dependencies or build step.

```sh
npm test
```

The tests cover indentation, auto-indent, fence sanitization, safe HTML escaping, and syntax-token rendering.

### Project structure

```text
docode/
├── manifest.json
├── src/
│   ├── content.js         # Trigger detection, editor UI, drafts, insertion
│   ├── content.css        # Smart Canvas-inspired editor styling
│   ├── docs-adapter.js    # Google Docs event, caret, and clipboard bridge
│   ├── editor-model.js    # Pure indentation and fence behavior
│   ├── highlighter.js     # Dependency-free V1 syntax tokenizer
│   └── languages.js       # Supported languages and aliases
└── tests/
```

## Technical direction

The extension keeps Docs-specific integration isolated from the editor model. That boundary lets the interaction layer evolve without coupling indentation, highlighting, or draft behavior to Google Docs internals.

The next major milestone is durable block identity:

1. Insert a uniquely identifiable code block.
2. Resolve it to a Google Docs range.
3. Remove the typed opener automatically.
4. Reopen the current range in the editor.
5. Replace and restyle the same range without losing collaborator edits.

The current Docs adapter selectors were validated against Google Docs on September 13, 2026. They are evidence for this prototype, not a long-term compatibility guarantee.
