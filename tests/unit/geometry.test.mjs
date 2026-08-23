import assert from "node:assert/strict";
import {
  rotatePoint,
  snapAngle,
  snapToGrid,
  boundingBoxCenter,
  alignPoints,
} from "../../frontend/src/core/geometry.js";

const rotated = rotatePoint({ x: 2, y: 0 }, { x: 0, y: 0 }, 90);
assert.ok(Math.abs(rotated.x - 0) < 1e-9);
assert.ok(Math.abs(rotated.y - 2) < 1e-9);
assert.equal(snapToGrid(23, 20), 20);
assert.equal(snapAngle(47, 45), 45);
assert.deepEqual(boundingBoxCenter([{ x: 0, y: 0 }, { x: 20, y: 20 }]), { x: 10, y: 10 });
assert.deepEqual(
  alignPoints([{ x: 0 }, { x: 20 }], "x", "min"),
  [{ x: 0 }, { x: 0 }],
);
console.log("geometry: rotation and snapping verified");
