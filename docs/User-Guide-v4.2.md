# GlycanDraw v4.2 User Guide

This is a new draft guide for the current v4.2 application. It does not replace
the existing guide files under `frontend/assets/docs/` or `legacy/assets/docs/`.

## What GlycanDraw Does

GlycanDraw is a browser-based editor for creating and editing glycan diagrams.
You place monosaccharide symbols on a canvas, connect them with bonds, add
linkage notation, and export the result as SVG, PNG, or JPG. The symbols follow
the SNFG 2.0 visual standard.

## Interface Areas

- Left panel: Select, Add Sugar, Add Text, Preset Glycans, Eraser
- Top panel: undo, redo, clear, export, canvas size, zoom, snap
- Center canvas: drawing and viewing area
- Right panel: current tool or selected-element settings

## Adding a Sugar

1. Select the Add Sugar tool.
2. Choose a preset from the SNFG preset grid, or choose a custom shape and
   color.
3. Set size, border, fill opacity, and render style if needed.
4. Click an empty area of the canvas to place a sugar.

To add a connected sugar, long-press an existing sugar and drag toward an empty
area. To connect two existing sugars, long-press one and drag onto the other.

While using Add Sugar mode, double-click an existing sugar to switch to Select
mode and adjust that sugar directly.

## Render Styles

Each sugar can use one of three render presets:

- Flat: solid fill
- Soft: radial shading
- Glossy: linear shading

The preset can be set before adding a sugar, or selected later in Select mode.
Selecting multiple sugars with different render styles shows no active render
button until they are unified.

## Selecting and Editing

Use the Select tool to click a sugar, text, or linkage. Drag a rectangle or use
Shift-click to select multiple items.

The right panel shows the selected item's current properties. Editing selected
items does not change the configuration used by Add Sugar mode. Switching back
to Add Sugar restores the last add-mode configuration.

In Add Sugar mode, the Linkage tab controls the linkage that will be used for
the next connected sugar.

## Rotation and Alignment

With one or more sugars selected, open the View tab:

- Use the dial or numeric input to rotate.
- Use preset buttons for common angles.
- Use alignment buttons for horizontal or vertical arrangement.
- Use Nudge Branches to preserve branch distances while moving subtrees.
- Use Normalize Linkage Length to normalize selected bond lengths to their
  average.

## Linkage Text

Select a bond to edit:

- Linkage notation, such as `a2-6` or `b14`
- Link line width, style, color, and opacity
- Linkage text size, font, style, color, and opacity
- Show or hide linkage text
- Swap direction

Direction arrows are visible on the canvas while editing but are excluded from
exports.

## Text

Select the Add Text tool and click the canvas. Select an existing text item to
change:

- Font size and family
- Bold, italic, and underline
- Color and opacity

## Preset Glycans

The Preset Glycans tab appears only in Preset Glycans mode. Select a template
and click the canvas to insert a complete glycan structure.

## Export

Use the Export menu to choose:

- SVG: editable vector
- PNG: transparent bitmap
- JPG: white-background bitmap

Choose small, medium, or large canvas dimensions before export.

You can also copy selected elements directly to the system clipboard as a PNG
with `Ctrl+Alt+C`, then paste them into Word, PowerPoint, or other apps.

## Undo and Redo

Use Ctrl/Cmd+Z and Ctrl/Cmd+Y, or the top-panel buttons. History includes
additions, deletions, movement, rotation, style changes, and linkage changes.

## Keyboard Shortcuts

- Ctrl/Cmd+Z: undo
- Ctrl/Cmd+Y: redo
- Ctrl/Cmd+C/X/V/A: copy, cut, paste, select all
- Ctrl/Cmd+B/I/U: text bold, italic, underline
- Ctrl+Alt+C: copy selected elements as PNG
- Alt+A: Add Sugar
- Alt+T: Add Text
- Alt+S: Select
- Alt+P: Preset Glycans
- Alt+D: Delete
- Delete or Backspace: delete selected items
- Esc: exit current mode or placement

## Running Locally

```text
npm run dev
```

Then open:

```text
http://127.0.0.1:4173
```

Run checks with:

```text
npm test
npm run test:e2e
```
