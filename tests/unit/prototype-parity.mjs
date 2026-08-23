import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GlycanDrawer } from "../../frontend/src/app/GlycanDrawer.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const legacySource = (await readFile(resolve(projectRoot, "legacy/js/script.js"), "utf8"))
  .replace(/\r\n/g, "\n");

const legacyMethodPattern =
  /^    (?:\}\s+)?(?:async\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\([^)]*\) \{$/gm;
const legacyNames = [...legacySource.matchAll(legacyMethodPattern)]
  .map((match) => match[1])
  .filter((name) => name !== "constructor");

const refactoredNames = Object.getOwnPropertyNames(GlycanDrawer.prototype)
  .filter((name) => name !== "constructor");
const allowedAdditions = new Set([
  "setupSugarStyleControls",
  "setupConnectionStyleControls",
  "setupTextStyleControls",
  "setupSelectionColorAndLinkageControls",
  "setupLinkageSelectionControls",
  "setupAddModeLinkageControls",
  "setupLegacyShapeAndColorControls",
  "rotateSelectedSugars",
  "applyRenderPreset",
  "activatePanelTab",
  "setupCollapsibleGroups",
  "applyRenderPresetToSelection",
  "syncRenderButtonsForSelection",
  "syncAddModeSugarUI",
  "computeSelectionBBox",
  "loadSvgImage",
  "copySelectedAsSvg",
  "normalizeSelectedLinkageLengths",
  "setupViewControls",
  "setupRotationDial",
  "setupTransformButtons",
  "updateTransformAvailability",
  "updateAddModeLinkageControls",
  "alignSelectedSugars",
  "applySelectedPositions",
  "nudgeBranches",
  "collectSugarSubtree",
  "moveSugarSubtree",
  "refreshLinkageArrows",
  "clearLinkageArrows",
  "setupGridAndSnapControls",
  "setupPanelTabs",
  "getEffectiveSelectedConnections",
  "captureRotationSnapshot",
  "snapshotConnections",
  "snapshotConnectionsForSugars",
  "commitConnections",
  "commitConnectionMap",
  "commitRotationPreview",
  "applyShapeRotation",
  "applyTextRotation",
  "lightenHex",
  "applyDividedRenderOverlay",
  "applyDividedRenderInPlace",
  "getDividedColoredPoints",
  "formatPoints",
  "insetPoints",
  "reapplySugarRender",
]);

const missing = legacyNames.filter((name) => !refactoredNames.includes(name));
const unexpected = refactoredNames.filter(
  (name) => !legacyNames.includes(name) && !allowedAdditions.has(name),
);

assert.deepEqual(missing, [], "Refactor lost one or more legacy public methods");
assert.deepEqual(unexpected, [], "Refactor introduced unexpected prototype methods");

console.log(
  `prototype-parity: ${refactoredNames.length} methods checked, all legacy methods preserved`,
);
