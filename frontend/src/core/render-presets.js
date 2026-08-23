export const RENDER_PRESETS = Object.freeze({
  flat: { id: "flat", gradient: false },
  soft: { id: "soft", gradient: "radial" },
  glossy: { id: "glossy", gradient: "linear" },
});

export function getRenderPreset(id) {
  return RENDER_PRESETS[id] || RENDER_PRESETS.flat;
}

export function getMixedRenderPreset(values) {
  const unique = new Set(values);
  return unique.size === 1 ? values[0] : "mixed";
}
