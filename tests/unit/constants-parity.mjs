import assert from "node:assert/strict";
import { EXPORT_SIZES, SNFG_PRESETS } from "../../frontend/src/core/constants.js";
import { EXPORT_SIZES as SHARED_EXPORT_SIZES } from "../../shared/domain/export-sizes.js";
import { SNFG_PRESETS as SHARED_SNFG_PRESETS } from "../../shared/domain/snfg-presets.js";

assert.deepEqual(SNFG_PRESETS, SHARED_SNFG_PRESETS);
assert.deepEqual(EXPORT_SIZES, SHARED_EXPORT_SIZES);

console.log("constants-parity: frontend and shared domain data match");
