import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "legacy/js/script.js");
const outputPath = resolve(projectRoot, "frontend/src/app/GlycanDrawer.js");

const moduleNames = [
  "toolbar",
  "presets",
  "customization",
  "style-controls",
  "tool",
  "preset-styles",
  "color-controls",
  "pointer-input",
  "sugar-creation",
  "shape-rendering",
  "sugar-selection",
  "selection-ui",
  "text",
  "connections",
  "sugar-deletion",
  "export",
  "canvas-state",
  "box-selection",
  "panels",
  "erasing",
  "style-application",
  "shape-selector",
  "text-styles",
  "workspace",
  "connection-selection",
  "selection-core",
  "dragging-clipboard",
  "text-formatting",
  "history",
];

const original = (await readFile(sourcePath, "utf8")).replace(/\r\n/g, "\n");
const lines = original.split("\n");

const constructorBlock = lines.slice(1, 166).join("\n");
const initBlock = lines.slice(166, 266).join("\n");

const constructorBlockWithConstants = constructorBlock
  .replace(
    /    this\.currentSugarConfig = \{[\s\S]*?    \};/,
    "        this.currentSugarConfig = createDefaultSugarConfig();",
  )
  .replace(
    /    this\.currentTextConfig = \{[\s\S]*?    \};/,
    "        this.currentTextConfig = createDefaultTextConfig();",
  )
  .replace(
    /    this\.currentLinkageConfig = \{[\s\S]*?    \};/,
    "        this.currentLinkageConfig = createDefaultLinkageConfig();",
  )
  .replace(
    /    this\.exportSizes = \{\s*small: \{ width: 800, height: 600 \},\s*medium: \{ width: 1000, height: 700 \},\s*large: \{ width: 1200, height: 800 \}\s*\};/,
    "        this.exportSizes = EXPORT_SIZES;",
  )
  .replace(
    /    this\.snfgPresets = \{[\s\S]*?    \};/,
    "        this.snfgPresets = SNFG_PRESETS;",
  )
  .replace(
    /    this\.directions = \[[\s\S]*?    \];/,
    "        this.directions = DIRECTIONS;",
  )
  .replace(
    "        this.maxHistorySize = 50;",
    "        this.maxHistorySize = HISTORY_LIMIT;",
  )
  .replace(
    "        this.minZoom = 0.1;",
    "        this.minZoom = MIN_ZOOM;",
  )
  .replace(
    "        this.maxZoom = 5;",
    "        this.maxZoom = MAX_ZOOM;",
  );

const imports = moduleNames
  .map(
    (name) =>
      `import { ${toCamelCase(name)}Mixin } from "./mixins/${name}.mixin.js";`,
  )
  .join("\n");

const mixinArray = moduleNames
  .map((name) => `  ${toCamelCase(name)}Mixin,`)
  .join("\n");

const constructorBody = `        for (const id of REQUIRED_ELEMENT_IDS) {
            if (!document.getElementById(id)) {
                throw new Error(\`GlycanDrawer: missing required DOM element "#\${id}"\`);
            }
        }

${constructorBlockWithConstants}`;

const fileBody = `import {
  DIRECTIONS,
  EXPORT_SIZES,
  HISTORY_LIMIT,
  MAX_ZOOM,
  MIN_ZOOM,
  SNFG_PRESETS,
} from "../core/constants.js";
import {
  createDefaultLinkageConfig,
  createDefaultSugarConfig,
  createDefaultTextConfig,
} from "../core/defaults.js";
${imports}

const REQUIRED_ELEMENT_IDS = [
  "canvas",
  "exportBtn",
  "clearBtn",
  "workspace",
  "exportArea",
];

export class GlycanDrawer {
${constructorBody}

${initBlock}
}

const mixins = [
${mixinArray}
];

const seenMixinMethods = new Map();
for (const [mixinIndex, mixin] of mixins.entries()) {
  for (const methodName of Object.keys(mixin)) {
    if (seenMixinMethods.has(methodName)) {
      throw new Error(
        \`GlycanDrawer mixin collision: "\${methodName}" is defined by both \` +
        \`mixin \${seenMixinMethods.get(methodName)} and mixin \${mixinIndex}\`,
      );
    }
    seenMixinMethods.set(methodName, mixinIndex);
  }
}

for (const mixin of mixins) {
  Object.assign(GlycanDrawer.prototype, mixin);
}

export default GlycanDrawer;
`;

await writeFile(outputPath, fileBody, "utf8");
console.log(`Wrote ${outputPath}`);

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
