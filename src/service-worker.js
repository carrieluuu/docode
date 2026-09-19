async function openEditorInTab(tab) {
  if (!tab?.id || !tab.url?.startsWith("https://docs.google.com/document/")) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "docode:open-editor" });
  } catch {
    // The document may still be loading. Reloading the Google Doc activates
    // the declared content script; no broad scripting permission is needed.
  }
}

chrome.action.onClicked.addListener(openEditorInTab);

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-code-editor") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await openEditorInTab(tab);
});
