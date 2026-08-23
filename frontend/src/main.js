import GlycanDrawer from "./app/GlycanDrawer.js";
import { initializeLanguageManager } from "./services/language-manager.js";
import { createApiClient } from "./services/api-client.js";
import { loadPreferences, savePreference } from "./core/preferences.js";

function bootGlycanDrawer() {
  if (!document.getElementById("canvas")) {
    console.error("GlycanDraw: #canvas was not found");
    return;
  }

  const api = createApiClient();
  window.glycanApi = api;
  initializeLanguageManager();

  const preferences = loadPreferences();
  document.body.dataset.theme = preferences.theme;
  const themeSwitch = document.getElementById("themeSwitch");
  if (themeSwitch) {
    themeSwitch.checked = preferences.theme === "night";
    themeSwitch.addEventListener("change", () => {
      const next = themeSwitch.checked ? "night" : "day";
      document.body.dataset.theme = next;
      savePreference("theme", next);
    });
  }

  window.glycanApp = new GlycanDrawer();
  window.glycanApp.api = api;

  api.get("health").then(() => {
    console.info("GlycanDraw: backend API connected");
  }).catch((error) => {
    console.warn("GlycanDraw: backend API unavailable", error.message);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootGlycanDrawer, { once: true });
} else {
  bootGlycanDrawer();
}
