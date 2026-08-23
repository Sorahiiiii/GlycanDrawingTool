import {
  DEFAULT_LINKAGE_CONFIG,
  DEFAULT_SUGAR_CONFIG,
  DEFAULT_TEXT_CONFIG,
} from "./constants.js";

export function createDefaultSugarConfig() {
  return { ...DEFAULT_SUGAR_CONFIG };
}

export function createDefaultTextConfig() {
  return { ...DEFAULT_TEXT_CONFIG };
}

export function createDefaultLinkageConfig() {
  return { ...DEFAULT_LINKAGE_CONFIG };
}
