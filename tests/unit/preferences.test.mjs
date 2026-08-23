import assert from "node:assert/strict";
import { loadPreferences, savePreference } from "../../frontend/src/core/preferences.js";

const store = new Map();
const storage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
};

assert.equal(loadPreferences(storage).theme, "day");
savePreference("theme", "night", storage);
assert.equal(loadPreferences(storage).theme, "night");
savePreference("linkageDisplayMode", "compact", storage);
assert.equal(loadPreferences(storage).linkageDisplayMode, "compact");
console.log("preferences: defaults and persistence verified");
