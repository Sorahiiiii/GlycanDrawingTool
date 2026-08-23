import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "legacy/js/script.js");
const outputPath = resolve(projectRoot, "frontend/src/app/mixins/style-controls.mixin.js");

const source = (await readFile(sourcePath, "utf8")).replace(/\r\n/g, "\n");
const lines = source.split("\n");

const sections = [
  {
    method: "setupSugarStyleControls",
    from: 731,
    to: 912,
  },
  {
    method: "setupConnectionStyleControls",
    from: 913,
    to: 1101,
  },
  {
    method: "setupTextStyleControls",
    from: 1102,
    to: 1286,
  },
  {
    method: "setupSelectionColorAndLinkageControls",
    from: 1287,
    to: 1774,
  },
  {
    method: "setupLinkageSelectionControls",
    from: 1775,
    to: 1892,
  },
  {
    method: "setupAddModeLinkageControls",
    from: 1894,
    to: 2113,
    prefix: "        const linkageInputAdd = document.getElementById('linkageInputAdd');",
  },
  {
    method: "setupLegacyShapeAndColorControls",
    from: 2115,
    to: 2232,
    prefix: "        const linkageConnectionColor = document.getElementById('connectionColor');",
  },
];

const methodChunks = sections.map((section) => {
  const body = lines.slice(section.from - 1, section.to);
  if (section.prefix) {
    body.unshift(section.prefix);
  }

  return [
    `    ${section.method}() {`,
    ...body,
    "    },",
  ].join("\n");
});

const fileBody = `// Feature mixin extracted mechanically from legacy/js/script.js.
// setupStyleControls() was split into focused setup helpers while preserving
// the original handler code and event ordering.
export const styleControlsMixin = {
    setupStyleControls() {
        this.setupSugarStyleControls();
        this.setupConnectionStyleControls();
        this.setupTextStyleControls();
        this.setupSelectionColorAndLinkageControls();
        this.setupLinkageSelectionControls();
        this.setupAddModeLinkageControls();
        this.setupLegacyShapeAndColorControls();
    },

${methodChunks.join("\n\n")}
};
`;

await writeFile(outputPath, fileBody, "utf8");
console.log(`Wrote ${outputPath}`);
