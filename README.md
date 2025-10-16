GlycanDrawingTool
==================

A small browser-based SVG editor for drawing glycan structures.

What it does
------------
- Add sugar nodes (several shapes and colors, including common SNFG presets).
- Connect sugars by long-press dragging from an existing sugar to another.
- Move sugars (single or multiple via box selection).
- Add and edit text labels.
- Delete sugars or text (single-click in delete mode or continuous eraser drag).
- Export the drawing as an SVG file.

How to run
----------
1. Open `index.html` in your browser (double-click or serve the folder using a simple static server).
2. The main UI lives in `index.html` and the interactive logic is in `js/script.js`.

Quick usage
-----------
- Tool buttons switch between Add, Select, Text and Delete modes.
- In Add mode: click empty canvas to place a sugar; click an existing sugar and long-press to start a connection drag to another sugar.
- In Select mode: click to select, drag to move; drag a box to select multiple sugars.
- In Text mode: click to add text, or click an existing text to edit.
- In Delete mode: click an element to remove it, or drag to erase multiple elements.
- Use the Download button to export as SVG, or Clear to reset the canvas.

Files
-----
- `index.html` — Main page and UI.
- `js/script.js` — Core application logic (sugar creation, selection, connections, text, export).
- `css/style.css` — Styles for the UI and SVG canvas.
- `assets/` — Images, presets and other assets.

Notes & small implementation details
-----------------------------------
- Sugars are represented as SVG groups (`<g class="sugar">`) containing a shape element with shape and color attributes stored as `data-*` on the group.
- Connections are SVG `<line>` elements inserted behind sugars.
- Long-press (about 500ms) on an existing sugar in Add mode starts a connection drag.
- The project is self-contained and requires no build step; just open `index.html` in a modern browser.
