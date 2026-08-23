import assert from "node:assert/strict";
import { formatLinkageLabel, normalizeDisplayMode } from "../../frontend/src/core/formatting.js";

assert.equal(normalizeDisplayMode("compact"), "compact");
assert.equal(normalizeDisplayMode("anything"), "standard");
assert.equal(formatLinkageLabel("beta", "3", "compact"), "beta3");
assert.equal(formatLinkageLabel("alpha", "6", "standard"), "alpha");
console.log("formatting: linkage display modes verified");
