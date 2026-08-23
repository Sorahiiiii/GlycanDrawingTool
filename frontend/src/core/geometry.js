export function rotatePoint(point, pivot, degrees) {
  const radians = (degrees * Math.PI) / 180;
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

export function snapToGrid(value, gridSize) {
  if (!gridSize) {
    return value;
  }
  return Math.round(value / gridSize) * gridSize;
}

export function snapAngle(value, step) {
  if (!step) {
    return value;
  }
  return Math.round(value / step) * step;
}

export function boundingBoxCenter(points) {
  if (!points.length) {
    return { x: 0, y: 0 };
  }
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

export function alignPoints(points, axis, edge) {
  if (!points.length) return points;
  const values = points.map((point) => point[axis]);
  let target;
  if (edge === "min") target = Math.min(...values);
  if (edge === "max") target = Math.max(...values);
  if (edge === "center") target = (Math.min(...values) + Math.max(...values)) / 2;
  return points.map((point) => ({ ...point, [axis]: target }));
}
