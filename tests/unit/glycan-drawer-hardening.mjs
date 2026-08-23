import assert from "node:assert/strict";

globalThis.document = {
  getElementById() {
    return null;
  },
};

const { MIN_ZOOM, MAX_ZOOM } = await import("../../frontend/src/core/constants.js");
const { GlycanDrawer } = await import("../../frontend/src/app/GlycanDrawer.js");

assert.equal(MIN_ZOOM, 0.5);
assert.equal(MAX_ZOOM, 3.0);

assert.throws(
  () => new GlycanDrawer(),
  /missing required DOM element "#canvas"/,
  "Missing required elements should fail before init runs",
);

const zoomState = {
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  zoomLevel: 1,
  updateGridBackground() {},
};

const originalConsoleError = console.error;
console.error = () => {};

GlycanDrawer.prototype.setZoomLevel.call(zoomState, 99);
assert.equal(zoomState.zoomLevel, MAX_ZOOM);

GlycanDrawer.prototype.setZoomLevel.call(zoomState, -1);
assert.equal(zoomState.zoomLevel, MIN_ZOOM);

console.error = originalConsoleError;

console.log("glycan-drawer-hardening: startup guards and zoom limits verified");
