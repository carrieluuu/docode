# Chrome Web Store reviewer notes

## What the extension does

docode adds a local code editor overlay to Google Docs. It formats code as ordinary rich text in the document. It has no account, server, analytics, advertising, or paid functionality.

## Test instructions

1. Install the extension and open a document at `https://docs.google.com/document/`.
2. Click the docode toolbar icon, or press Option+Shift+C on macOS / Alt+Shift+C on Windows or Linux.
3. Type a multiline code sample. Confirm syntax highlighting, Tab indentation, Enter auto-indent, and searchable language selection.
4. Choose **Insert**. If Chrome blocks programmatic paste, click the document and press Command+V or Ctrl+V; this manual recovery path is expected and preserves the draft.
5. Select the inserted code in Google Docs and invoke docode again. Choose **Edit selection** if selection capture is not automatic, change the code, and choose **Update in Docs**.
6. Copy and paste a multiline code sample directly into Google Docs. Confirm that Smart Paste opens a reviewable draft with **Insert** and **Paste normally** actions.

No credentials, paid account, or external service is required beyond access to Google Docs.

## Why clipboard access is required

Google Docs uses a canvas-based editor and does not expose selected document text or rich-text insertion through a conventional contenteditable DOM range. docode uses the clipboard only in response to the user's edit, insert, update, or paste action.
