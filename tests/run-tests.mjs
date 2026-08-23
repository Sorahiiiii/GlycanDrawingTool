import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const suites = [
  ["unit", "tests/unit/prototype-parity.mjs"],
  ["unit", "tests/unit/constants-parity.mjs"],
  ["unit", "tests/unit/mixin-collisions.mjs"],
  ["unit", "tests/unit/language-bootstrap.mjs"],
  ["unit", "tests/unit/glycan-drawer-hardening.mjs"],
  ["unit", "tests/unit/preferences.test.mjs"],
  ["unit", "tests/unit/formatting.test.mjs"],
  ["unit", "tests/unit/theme-variables.test.mjs"],
  ["unit", "tests/unit/render-presets.test.mjs"],
  ["unit", "tests/unit/geometry.test.mjs"],
  ["server smoke", "tests/smoke/server.smoke.mjs"],
];

for (const [label, relativePath] of suites) {
  const result = spawnSync(process.execPath, [resolve(projectRoot, relativePath)], {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(`${label} failed`);
    process.exitCode = result.status || 1;
    break;
  }
}

if (!process.exitCode) {
  console.log("all dependency-free test suites passed");
}
