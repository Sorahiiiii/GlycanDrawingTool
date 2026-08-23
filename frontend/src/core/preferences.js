const STORAGE_KEY = "glycan-draw-preferences";

export const DEFAULT_PREFERENCES = Object.freeze({
  linkageDisplayMode: "standard",
  theme: "day",
  renderPreset: "flat",
  gridVisible: true,
  snapEnabled: false,
  snapGridSize: 20,
  snapRotationStep: 45,
});

export function loadPreferences(storage = localStorage) {
  const result = { ...DEFAULT_PREFERENCES };
  if (!storage) {
    return result;
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return result;
    }
    return { ...result, ...JSON.parse(raw) };
  } catch {
    return result;
  }
}

export function savePreference(key, value, storage = localStorage) {
  const current = loadPreferences(storage);
  const next = { ...current, [key]: value };
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
