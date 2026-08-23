export function normalizeDisplayMode(mode) {
  return mode === "compact" ? "compact" : "standard";
}

export function formatLinkageLabel(config, position, mode = "standard") {
  if (normalizeDisplayMode(mode) === "compact") {
    return `${config}${position}`.trim();
  }
  return config;
}
