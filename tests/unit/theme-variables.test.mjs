import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../../frontend/css/style.css", import.meta.url), "utf8");

for (const variable of [
  "--app-bg",
  "--panel-bg",
  "--border",
  "--text",
  "--heading",
  "--accent",
  "--accent-strong",
  "--canvas-bg",
  "--workspace-bg",
  "--control-bg",
]) {
  assert.match(css, new RegExp(variable));
}

assert.match(css, /body\[data-theme="night"\]/);
assert.match(css, /#fffa00/);
assert.match(css, /#c8c8c8/);
assert.match(
  css,
  /body\[data-theme="night"\] \.connection-style-btn\.active[\s\S]{0,200}?color:\s*var\(--on-accent\);/,
);

console.log("theme-variables: complete day and night palette present");
