# GlycanDraw v4.2 Update Summary

This document summarizes user-visible and internal changes between the saved
v2.0 baseline and the current v4.2 working tree. The editor behavior from the
original application is preserved, but the implementation and the panel
workflow have been reorganized and stabilized.

## High-Level Changes

### Separated frontend and backend

- `frontend/` is the single canonical browser application.
- `backend/src/` is a dependency-free Node.js HTTP server.
- Browser code reaches backend APIs only through the API client.
- `legacy/` retains the pre-refactor snapshot for comparison and recovery.

### Split editor implementation

The original monolithic editor class was divided into feature mixins:

- Pointer input and tool handling
- Sugar creation, selection, shape rendering, and color
- Connections and linkage labels
- Text creation, formatting, and styles
- History and undo/redo
- Export
- Panels, workspace, view controls, and transforms
- Preferences and grid/snap

## Updated Functions Compared To v2.0

| Area | v2.0 | v4.2 |
| --- | --- | --- |
| Right panel | Static property groups | Responsive tabbed panel with Sugar, Text, Linkage, View, and Preset Glycans tabs |
| Sugar style | Shape, color, size, border | Same controls plus per-sugar render presets: Flat, Soft, Glossy |
| Render selection | No render state | Render syncs with selected sugar; mixed selections show no pressed render button |
| Add/select state | Shared controls could leak between modes | Add mode remembers its own new-sugar configuration; select mode edits selected elements without changing add mode |
| Custom color | Basic color picker | Custom color controls sync to actual rendered fill, including gradient and divided shapes |
| Shape selector | Simpler selector | Side-by-side main and dropdown shape controls with active-category styling |
| Divided shapes | Limited | Divided shapes preserve their white half and render only the colored side |
| Rotation | Not available | Compass dial, numeric input, preset angle buttons, live preview, single and multi-sugar rotation |
| Alignment and spacing | Not available | Align left/right/center, nudge branches, normalize bond lengths to selection mean |
| Linkage direction | Text only | Linkage direction arrows follow bonds and remain canvas-only |
| Theme | Basic | Complete day/night theme with consistent accent and selected-button text colors |
| Grid and snap | Not available | Snap-to-grid option; grid drawing removed from exported output |
| Preset glycans | Preset templates | Dedicated Preset Glycans tab, now labeled preset glycans |
| Export | Existing | SVG/PNG/JPG export with correct bounds and no internal linkage arrows |
| Clipboard copy | Internal copy/paste only | `Ctrl+Alt+C` copies selected elements as a PNG image for pasting into Word, PowerPoint, or other apps |
| Add-mode double click | Could add duplicate sugars | Double-clicking an existing sugar in Add mode switches to Select mode and selects that sugar |
| Tool shortcuts | Mouse only | `Alt+A`, `Alt+T`, `Alt+S`, `Alt+P`, and `Alt+D` switch tools |
| Tests | Limited | Dependency-free unit suite plus Playwright E2E workflow |

## Recent Stabilization Fixes

- Selected sugar properties now update all panel controls, including numeric
  labels and border width.
- Render effects apply to manually selected colors, not only SNFG preset colors.
- Night-mode selected buttons use the `--on-accent` text color.
- Angle preset buttons and numeric angle input synchronize the rotation dial.
- Render state remains active in add mode, so newly placed sugars can be
  created already rendered.
- Selecting a rendered sugar reads its actual color back into the custom color
  controls.
- Mixed render selections clear the render buttons instead of showing an
  orange question-mark state.
- Linkage controls now synchronize with selected bonds and with bonds attached
  to selected sugars.
- Add Sugar mode includes its own Linkage tab for setting the linkage used by
  the next connection.
- The linkage display-mode Standard/Compact buttons sync with the selected
  bond.

## Verification

```text
node tests/run-tests.mjs
node tests/e2e/app.e2e.mjs
```

Both suites pass on the v4.2 tree.
