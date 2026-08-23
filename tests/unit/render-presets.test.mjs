import assert from "node:assert/strict";
import { getRenderPreset, getMixedRenderPreset } from "../../frontend/src/core/render-presets.js";

assert.equal(getRenderPreset("soft").id, "soft");
assert.equal(getRenderPreset("unknown").id, "flat");
assert.equal(getMixedRenderPreset(["flat", "flat"]), "flat");
assert.equal(getMixedRenderPreset(["flat", "soft"]), "mixed");
console.log("render-presets: per-sugar and mixed-state helpers verified");
