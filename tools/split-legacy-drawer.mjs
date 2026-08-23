import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "legacy/js/script.js");
const outputRoot = resolve(projectRoot, "frontend/src/app/mixins");

const methodPattern = /^    (?:async )?[A-Za-z_$][A-Za-z0-9_$]*\([^)]*\) \{$/;
const inlineMethodPattern =
  /^    \}\s+(async\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\([^)]*\) \{$/;
const moduleRanges = [
  { name: "toolbar", from: 267, to: 277 },
  { name: "presets", from: 278, to: 649 },
  { name: "customization", from: 650, to: 729 },
  { name: "style-controls", from: 730, to: 2234 },
  { name: "tool", from: 2235, to: 2287 },
  { name: "preset-styles", from: 2288, to: 2399 },
  { name: "color-controls", from: 2400, to: 2623 },
  { name: "pointer-input", from: 2624, to: 3335 },
  { name: "sugar-creation", from: 3336, to: 3526 },
  { name: "shape-rendering", from: 3527, to: 4251 },
  { name: "sugar-selection", from: 4252, to: 4980 },
  { name: "selection-ui", from: 4981, to: 5298 },
  { name: "text", from: 5299, to: 5487 },
  { name: "connections", from: 5488, to: 6074 },
  { name: "sugar-deletion", from: 6075, to: 6136 },
  { name: "export", from: 6137, to: 6709 },
  { name: "canvas-state", from: 6710, to: 6784 },
  { name: "box-selection", from: 6785, to: 7116 },
  { name: "panels", from: 7117, to: 7861 },
  { name: "erasing", from: 7862, to: 7902 },
  { name: "style-application", from: 7903, to: 9377 },
  { name: "shape-selector", from: 9378, to: 10316 },
  { name: "text-styles", from: 10317, to: 10572 },
  { name: "workspace", from: 10573, to: 10913 },
  { name: "connection-selection", from: 10914, to: 11336 },
  { name: "selection-core", from: 11337, to: 11751 },
  { name: "dragging-clipboard", from: 11752, to: 12328 },
  { name: "text-formatting", from: 12329, to: 12475 },
  { name: "history", from: 12476, to: 13505 },
];

const source = (await readFile(sourcePath, "utf8")).replace(/\r\n/g, "\n");
const lines = source.split("\n");
const methodStarts = [];

lines.forEach((line, index) => {
  if (index >= 266 && index <= 13502) {
    if (methodPattern.test(line)) {
      methodStarts.push({ line: index + 1, splitPrefix: false });
    } else if (inlineMethodPattern.test(line)) {
      methodStarts.push({ line: index + 1, splitPrefix: true });
    }
  }
});

const findModule = (lineNumber) =>
  moduleRanges.find(({ from, to }) => lineNumber >= from && lineNumber <= to);

const groups = new Map();

methodStarts.forEach((methodStart, methodIndex) => {
  const nextMethod = methodStarts[methodIndex + 1];
  const end = (nextMethod?.line ?? 13503) - 1;
  const moduleName = findModule(methodStart.line)?.name;

  if (!moduleName) {
    throw new Error(`No module range covers method at line ${methodStart.line}`);
  }

  if (!groups.has(moduleName)) {
    groups.set(moduleName, []);
  }

  const methodLines = lines.slice(methodStart.line - 1, end);
  if (methodStart.splitPrefix) {
    methodLines[0] = methodLines[0].replace(/^    \}\s+/, "    ");
  }
  if (nextMethod?.splitPrefix) {
    methodLines.push("    }");
  }

  groups.get(moduleName).push({
    lines: methodLines,
    originalStart: methodStart.line,
  });
});

const coveredModules = [...groups.keys()];
const expectedModules = moduleRanges.map(({ name }) => name);
const missingModules = expectedModules.filter((name) => !coveredModules.includes(name));

if (missingModules.length > 0) {
  throw new Error(`No methods found for modules: ${missingModules.join(", ")}`);
}

await mkdir(outputRoot, { recursive: true });

for (const [moduleName, methods] of groups) {
  const chunks = methods.map(({ lines: methodLines, originalStart }) => {
    const outputLines = [...methodLines];
    const lastCodeLineIndex = findLastCodeLineIndex(outputLines);
    outputLines[lastCodeLineIndex] = addSeparator(outputLines[lastCodeLineIndex]);
    return outputLines.join("\n");
  });

  const fileBody = [
    `// Feature mixin extracted mechanically from legacy/js/script.js.`,
    `// Original line ranges: ${methods.map(({ originalStart }) => originalStart).join(", ")}.`,
    `export const ${toCamelCase(moduleName)}Mixin = {`,
    chunks.join("\n\n"),
    "};",
    "",
  ].join("\n");

  const filePath = resolve(outputRoot, `${moduleName}.mixin.js`);
  await writeFile(filePath, fileBody, "utf8");
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function findLastCodeLineIndex(lines) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index].trim();
    if (line.length > 0 && !line.startsWith("//")) {
      return index;
    }
  }

  throw new Error("Method block contains no code line");
}

function addSeparator(line) {
  if (/^\s*\};\s*$/.test(line)) {
    return line.replace(";", ",");
  }
  return `${line},`;
}

console.log(`Wrote ${groups.size} mixin modules to ${outputRoot}`);
