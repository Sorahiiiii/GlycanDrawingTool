import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const mixinDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../frontend/src/app/mixins",
);
const mixinFiles = (await readdir(mixinDirectory))
  .filter((fileName) => fileName.endsWith(".mixin.js"))
  .sort();

const seen = new Map();

for (const fileName of mixinFiles) {
  const module = await import(pathToFileURL(resolve(mixinDirectory, fileName)));
  for (const [methodName, value] of Object.entries(module)) {
    if (typeof value !== "object" || value === null) {
      continue;
    }

    for (const key of Object.keys(value)) {
      if (seen.has(key)) {
        assert.fail(
          `Mixin method collision: "${key}" in ${fileName} was already defined by ${seen.get(key)}`,
        );
      }
      seen.set(key, fileName);
    }
  }
}

assert.ok(seen.size > 0, "Expected mixin files to export at least one method");
console.log(`mixin-collisions: ${mixinFiles.length} mixins, no method collisions`);
