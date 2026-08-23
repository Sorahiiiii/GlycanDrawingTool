export const SNFG_PRESETS = Object.freeze({
  glc: { shape: "circle-filled", color: "#0072BC", name: "Glucose" },
  gal: { shape: "circle-filled", color: "#FFD400", name: "Galactose" },
  man: { shape: "circle-filled", color: "#00A651", name: "Mannose" },
  glcnac: { shape: "square", color: "#0072BC", name: "GlcNAc" },
  galnac: { shape: "square", color: "#FFD400", name: "GalNAc" },
  fuc: { shape: "triangle", color: "#ED1C24", name: "Fucose" },
  glca: { shape: "diamond-divided-top", color: "#0072BC", name: "GlcA" },
  neu5ac: { shape: "diamond", color: "#A54399", name: "Neu5Ac" },
  xyl: { shape: "star-5", color: "#F47920", name: "Xyl" },
});

export const DIRECTIONS = Object.freeze([
  { name: "N", dx: 0.0, dy: -1.0 },
  { name: "NNE", dx: 0.5, dy: -0.866 },
  { name: "NE", dx: 0.7071, dy: -0.7071 },
  { name: "ENE", dx: 0.866, dy: -0.5 },
  { name: "E", dx: 1.0, dy: 0.0 },
  { name: "ESE", dx: 0.866, dy: 0.5 },
  { name: "SE", dx: 0.7071, dy: 0.7071 },
  { name: "SSE", dx: 0.5, dy: 0.866 },
  { name: "S", dx: 0.0, dy: 1.0 },
  { name: "SSW", dx: -0.5, dy: 0.866 },
  { name: "SW", dx: -0.7071, dy: 0.7071 },
  { name: "WSW", dx: -0.866, dy: 0.5 },
  { name: "W", dx: -1.0, dy: 0.0 },
  { name: "WNW", dx: -0.866, dy: -0.5 },
  { name: "NW", dx: -0.7071, dy: -0.7071 },
  { name: "NNW", dx: -0.5, dy: -0.866 },
]);

export const EXPORT_SIZES = Object.freeze({
  small: { width: 800, height: 600 },
  medium: { width: 1000, height: 700 },
  large: { width: 1200, height: 800 },
});

export const DEFAULT_SUGAR_CONFIG = Object.freeze({
  type: "custom",
  shape: "circle",
  color: "#0072BC",
  size: 20,
  borderWidth: 3,
  borderColor: "#000000",
  borderOpacity: 1,
  fillOpacity: 1,
  preset: null,
});

export const DEFAULT_TEXT_CONFIG = Object.freeze({
  fontSize: 15,
  fontFamily: "SimHei, Arial, sans-serif",
  color: "#000000",
  opacity: 1,
  bold: false,
  italic: false,
  underline: false,
});

export const DEFAULT_LINKAGE_CONFIG = Object.freeze({
  strokeWidth: 3,
  strokeColor: "#000000",
  strokeStyle: "solid",
  strokeOpacity: 1,
  textSize: 14,
  textColor: "#000000",
  showText: false,
  displayMode: "standard",
  linkage: null,
  reversed: false,
});

export const HISTORY_LIMIT = 50;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3.0;
