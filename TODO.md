# docode roadmap

## Core Features

### Code-block lifecycle

- [x] Detect triple-backtick fenced openers in Google Docs.
- [x] Initialize the editor language from tags such as `python`, `javascript`, `java`, and `cpp`.
- [x] Provide a true multiline editor with cursor movement, selection, paste, insertion, and deletion.
- [x] Insert code as ordinary formatted Google Docs content that remains readable without docode.
- [x] Preserve unsent drafts when automatic insertion fails and support manual-paste recovery.
- [ ] Replace or remove the fenced opener automatically through a safe document-range operation.
- [ ] Support closing triple backticks as a natural way to finish and insert a block.
- [ ] Assign blocks durable Docs-native identity without adding hidden characters to copied code.
- [x] Reopen a selected existing block with its code and language restored.
- [x] Replace the selected block in place when the user chooses **Update in Docs**.
- [x] Import selected legacy code and remember its language locally after formatting.
- [ ] Resolve and reopen a block from a collapsed caret without requiring a complete selection.
- [ ] Replace a stable document range on save without losing concurrent collaborator edits.
- [x] Add an opener-free Chrome toolbar action with `Option+Shift+C` on macOS and `Alt+Shift+C` on Windows/Linux while reliable fence replacement is unavailable.

### Editing ergonomics

- [x] Indent the current line or selected lines with Tab.
- [x] Dedent the current line or selected lines with Shift+Tab.
- [x] Preserve indentation when pressing Enter.
- [x] Add lightweight indentation after Python colons and opening braces.
- [x] Keep the editor draggable and resizable.
- [ ] Preserve the surrounding document font, size, color, and paragraph style after every code block.
- [ ] Validate arrow-key movement between code blocks and ordinary notes.
- [x] Rely on Google Docs' native single-backtick inline code when **Enable Markdown** is turned on.

### Syntax highlighting and languages

- [x] Highlight code as it changes without moving the editor caret.
- [x] Support Python, JavaScript, TypeScript, Java, C, C++, C#, Go, SQL, Bash, HTML, CSS, and JSON.
- [x] Allow the language to be changed from the code-block editor.
- [x] Infer the language while typing when the editor opens without an explicit language.
- [ ] Upgrade automatic detection to a hybrid Highlight.js implementation: keep high-confidence rules for short snippets, then use `highlightAuto` for longer or ambiguous code.
- [ ] Bundle only docode's supported Highlight.js grammars and restrict detection to that language subset.
- [ ] Add a confidence margin, detection debounce, and language-switch hysteresis so the selector does not jump while the user types.
- [ ] Preserve explicit fenced-language tags and manual selections as authoritative overrides of automatic detection.
- [x] Add search and keyboard navigation to the language selector.
- [x] Refresh highlighting immediately when reopening or changing an existing block.
- [ ] Replace the lightweight tokenizer with grammar-complete highlighting where needed.

### Smart paste

- [x] Preserve line breaks and indentation when inserting editor content.
- [x] Provide rich-text and plain-text clipboard formats.
- [x] Detect fenced code and likely multiline source code pasted directly into Google Docs.
- [x] Open likely code as a reviewable editor draft with **Insert** and **Paste normally** actions.
- [ ] Optionally create a code block automatically based on user settings.
- [x] Infer a likely language from pasted code and let the user correct it.
- [ ] Validate paste behavior from VS Code, GitHub, LeetCode, Stack Overflow, ChatGPT, and terminals.

### Persistence and compatibility

- [x] Keep Google Docs as the source of truth for inserted content.
- [ ] Validate formatting after document reload.
- [ ] Validate reading and editing from an account without docode installed.
- [ ] Validate live collaboration and concurrent edits with a second account.
- [ ] Validate automatic and manual insertion across Chrome and Google Docs updates.
- [ ] Confirm that disabling or uninstalling docode leaves document formatting unchanged.
- [ ] Avoid relying on undocumented canvas nodes beyond the isolated Docs adapter.

## Stretch Goals

### Slash commands and command palette

- [ ] Add a small searchable command palette.
- [ ] Add `/code` to insert a blank code block.
- [ ] Add `/python` to insert a Python code block.
- [ ] Add optional language-specific shortcuts.
- [ ] Consider future `/algorithm`, `/terminal`, `/sql`, and `/callout` commands.

### LeetCode notes

- [ ] Add `/leetcode` to insert a normal Google Docs interview-note template.
- [ ] Include Problem, Key Idea, Solution, Complexity, and Mistakes / Edge Cases sections.
- [ ] Insert an editable solution code block inside the template.
- [ ] Ensure the generated template remains useful without docode installed.

### Developer note theme

- [ ] Create one opinionated developer-note theme.
- [ ] Use Plus Jakarta Sans for the title and heading hierarchy.
- [ ] Select and validate a Docs-friendly body font.
- [ ] Use a suitable monospace font for block and inline code.
- [ ] Add **Developer Theme: On / Off**.
- [ ] Add **Apply to current document**.
- [ ] Add an option to apply the theme automatically to new documents.
- [ ] Treat theme formatting as defaults and preserve manual user overrides.

### Product polish

- [ ] Move from the popup-style editor toward an inline, caret-anchored Smart Canvas experience.
- [ ] Persist editor size and preferred placement.
- [ ] Add user settings for indentation width, automatic code detection, and insertion behavior.
- [ ] Add accessible keyboard navigation and screen-reader labels throughout the editor.
- [ ] Add a lightweight first-run guide and clear recovery messaging.
- [ ] Explain how to enable Google Docs' native Markdown option for inline code.

## Chrome Web Store release

- [ ] Create PNG extension icons at 16, 32, 48, and 128 pixels and reference them in the manifest.
- [ ] Prepare store-listing copy, screenshots, and a polished promotional image.
- [ ] Publish a privacy policy and support page.
- [ ] Review every permission and document why clipboard, storage, and Google Docs access are needed.
- [ ] Run a clean-install test on macOS and Windows, including keyboard shortcuts and manual-paste recovery.
- [ ] Validate document reload, collaboration, and readability/editability without docode installed.
- [ ] Build and inspect a clean submission ZIP containing only extension runtime files.
- [ ] Complete Chrome Web Store developer registration and submit the release for review.
