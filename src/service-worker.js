const CONTENT_SCRIPT_FILES = [
  "src/languages.js",
  "src/language-selector-model.js",
  "src/language-detector.js",
  "src/smart-paste.js",
  "src/highlighter.js",
  "src/editor-model.js",
  "src/block-registry.js",
  "src/docs-adapter.js",
  "src/content.js"
];

async function injectDocode(tabId) {
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["src/content.css"]
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: CONTENT_SCRIPT_FILES
  });
}

async function openEditorInTab(tab) {
  if (!tab?.id || !tab.url?.startsWith("https://docs.google.com/document/")) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "docode:open-editor" });
  } catch {
    // Chrome does not add declared content scripts to Docs tabs that were open
    // before docode was installed or updated. Activate that tab on demand so a
    // toolbar click works without requiring a manual reload.
    try {
      await injectDocode(tab.id);
      await chrome.tabs.sendMessage(tab.id, { type: "docode:open-editor" });
    } catch {
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#d93025" });
      await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
      await chrome.action.setTitle({
        tabId: tab.id,
        title: "docode could not open. Reload this Google Doc and try again."
      });
    }
  }
}

chrome.action.onClicked.addListener(openEditorInTab);

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-code-editor") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await openEditorInTab(tab);
});
