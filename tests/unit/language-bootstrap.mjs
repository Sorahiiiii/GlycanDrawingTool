import assert from "node:assert/strict";

globalThis.window = {
  location: { search: "" },
  history: { replaceState() {} },
  languageManager: undefined,
};
globalThis.localStorage = {
  getItem() {
    return null;
  },
  setItem() {},
};
globalThis.document = {
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
};
globalThis.fetch = () => new Promise(() => {});

const { initializeLanguageManager, getLanguageManager } = await import(
  "../../frontend/src/services/language-manager.js"
);

assert.equal(
  window.languageManager,
  undefined,
  "LanguageManager must not initialize as an import side effect",
);

const first = initializeLanguageManager();
const second = initializeLanguageManager();

assert.equal(first, second, "initializeLanguageManager must reuse the same instance");
assert.equal(window.languageManager, first, "window.languageManager must be set once");
assert.equal(getLanguageManager(), first, "getLanguageManager must return the singleton");

console.log("language-bootstrap: singleton initialized exactly once");
