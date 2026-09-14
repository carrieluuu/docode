# docode to-do

## Interaction decisions

- Reconsider using a keyboard shortcut or toolbar action instead of triple backticks to open the code formatter. A shortcut avoids leaving a visible fenced opener while the extension lacks a reliable authenticated Google Docs range anchor.

## Code-block persistence

- Prototype an authenticated Docs API marker/range bridge that can remove the fenced opener, style the inserted block atomically, and assign a stable named range.
- Validate automatic paste and the manual-paste recovery path across Chrome and Google Docs updates.
- Treat reopening as a named-range milestone: detect when the caret enters a registered code-block range, load the latest range text and language into the editor, and replace the same range on save without losing collaborator edits.
- Preserve a normal-note return paragraph after every block and verify that clicking or arrowing into it restores the surrounding font, size, and text color.
