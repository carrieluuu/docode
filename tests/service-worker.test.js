const assert = require("node:assert/strict");
const test = require("node:test");

function loadServiceWorker({ failFirstMessage = false } = {}) {
  const listeners = {};
  const sentMessages = [];
  const queriedTabs = [];
  const insertedCSS = [];
  const executedScripts = [];
  let messageAttempts = 0;

  global.chrome = {
    action: {
      onClicked: {
        addListener(listener) {
          listeners.actionClicked = listener;
        }
      }
    },
    commands: {
      onCommand: {
        addListener(listener) {
          listeners.command = listener;
        }
      }
    },
    tabs: {
      async sendMessage(tabId, message) {
        messageAttempts += 1;
        if (failFirstMessage && messageAttempts === 1) {
          throw new Error("No receiving end");
        }
        sentMessages.push({ tabId, message });
      },
      async query(query) {
        queriedTabs.push(query);
        return [{ id: 42, url: "https://docs.google.com/document/d/example/edit" }];
      }
    },
    scripting: {
      async insertCSS(details) {
        insertedCSS.push(details);
      },
      async executeScript(details) {
        executedScripts.push(details);
      }
    }
  };

  delete require.cache[require.resolve("../src/service-worker.js")];
  require("../src/service-worker.js");
  return { listeners, sentMessages, queriedTabs, insertedCSS, executedScripts };
}

test("clicking the extension icon opens docode in the current Google Doc", async () => {
  const { listeners, sentMessages } = loadServiceWorker();

  await listeners.actionClicked({
    id: 17,
    url: "https://docs.google.com/document/d/example/edit"
  });

  assert.deepEqual(sentMessages, [{
    tabId: 17,
    message: { type: "docode:open-editor" }
  }]);
});

test("the keyboard command opens docode in the active Google Doc", async () => {
  const { listeners, sentMessages, queriedTabs } = loadServiceWorker();

  await listeners.command("open-code-editor");

  assert.deepEqual(queriedTabs, [{ active: true, currentWindow: true }]);
  assert.deepEqual(sentMessages, [{
    tabId: 42,
    message: { type: "docode:open-editor" }
  }]);
});

test("clicking activates docode in a Google Doc that was already open", async () => {
  const { listeners, sentMessages, insertedCSS, executedScripts } = loadServiceWorker({
    failFirstMessage: true
  });

  await listeners.actionClicked({
    id: 23,
    url: "https://docs.google.com/document/d/already-open/edit"
  });

  assert.deepEqual(insertedCSS, [{
    target: { tabId: 23 },
    files: ["src/content.css"]
  }]);
  assert.equal(executedScripts.length, 1);
  assert.equal(executedScripts[0].target.tabId, 23);
  assert.equal(executedScripts[0].files.at(-1), "src/content.js");
  assert.deepEqual(sentMessages, [{
    tabId: 23,
    message: { type: "docode:open-editor" }
  }]);
});

test("clicking the extension icon outside Google Docs does nothing", async () => {
  const { listeners, sentMessages } = loadServiceWorker();

  await listeners.actionClicked({ id: 9, url: "https://example.com" });

  assert.deepEqual(sentMessages, []);
});
