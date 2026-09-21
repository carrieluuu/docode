# Chrome Web Store dashboard fields

Use these responses in the Store's Privacy practices and submission forms. Recheck them against the final uploaded build.

## Single purpose

docode improves technical writing in Google Docs by providing an editable code-block workflow with syntax highlighting, indentation, language selection, Smart Paste, and document-native insertion.

## Permission justifications

### `storage`

Stores unsent editor drafts and local mappings between code fingerprints and language choices so users can recover work and reopen selected blocks with the correct language. Data stays in Chrome local extension storage.

### `clipboardRead`

Reads text that the user has selected and explicitly asks docode to edit. This is necessary because Google Docs' canvas-based editor does not expose the selected document text through a supported DOM range.

### `clipboardWrite`

Writes the user's edited code to the clipboard as both formatted HTML and plain text so Google Docs can insert a syntax-highlighted block and provide manual-paste recovery when automatic insertion is unavailable.

### Host access: `https://docs.google.com/document/*`

Runs docode only on Google Docs document pages, where it detects explicit editor actions and likely code pastes, displays the code editor, and inserts or updates formatted code. No access is requested for other Google services or websites.

## Remote code

No. All JavaScript and CSS used by docode are included in the extension package. The extension does not download or execute remote code.

## Data-use disclosures

The extension handles website content and user-generated content locally, including selected Google Docs text, code entered in the editor, and clipboard content used by Smart Paste or insertion. It also handles the current document identifier locally to separate drafts and language memory by document.

The extension does not collect or transmit this data to the developer or third parties. It does not handle authentication, financial, health, location, or personal communications data as a product feature. It does not use data for advertising, analytics, personalization outside the visible feature, or creditworthiness.

## Limited Use certification

Certify only if the final uploaded build still matches the statements above. docode uses accessed data solely to provide its visible code-editing features, does not transfer it to third parties, does not use it for advertising, and does not permit humans to read it.

## Distribution recommendation

Start as **Unlisted** for a small real-world beta after review, then switch the same item to **Public** after macOS/Windows, collaboration, reload, and uninstall-portability tests pass.
