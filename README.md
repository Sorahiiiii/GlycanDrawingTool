# 🧩 Glycan Drawing Tool Document

## 📘 Introduction

**Glycan Drawing Tool** is a web-based tool for drawing and editing glycan structures.

Users can easily create monosaccharide nodes, linkage relationships, and text annotations through a visual interface. The tool automatically generates standard symbolic representations according to the **SNFG
(Symbol Nomenclature for Glycans)** standard.

The interaction logic is similar to **ChemDraw**, providing researchers with a more consistent user experience.

------------------------------------------------------------------------

## 🧱 Overview

The interface consists of four main parts:

-   **Left Panel**: Toolbar (Select, Add Sugar, Add Text, Ad Preset    Glycan, Eraser)
-   **Center Canvas**: Main drawing area (supports zooming and panning)
-   **Right Panel**: Detailed customization options for sugar shape, color, linkage style, and text style
-   **Top Panel**: Canvas operations (Undo/Redo, Clear Canvas, Export, Canvas Zoom)

------------------------------------------------------------------------

## 🧭 Toolbar Description

| Tool | Icon | Function |
|------|------|-----------|
| Select | ↖️ | Select existing elements to move, copy, or modify their styles |
| Add Sugar | 🍬 | Click on the canvas to place a new monosaccharide symbol |
| Add Text | 📝 | Add text annotations or labels on the canvas |
| Preset Glycans | 🧩 | Insert a complete glycan structure from built-in templates |
| Eraser | 🧽 | Delete selected elements |

------------------------------------------------------------------------

## 🎨 Add Sugar Mode

Available actions:
 - **Add Monosaccharide** --- In add-sugar mode, click on the canvas to add a sugar.
- **Directional Addition** --- Click or long-press an existing sugar and drag toward a blank area to add a new sugar at a fixed angle.
- **Add Linkage** --- Long-press an existing sugar and drag toward another sugar to create a linkage between them.
- **Free End** --- Allows users to represent optional free ends. The asterisk symbol will not be exported in the final image.
- **Preset Style** --- Sugar and linkage styles adjustable in select mode (described below) can also be preconfigured and directly added here.

------------------------------------------------------------------------

## 🔧 Select Mode

Available actions: 
- **Edit Element Style** --- Click or drag-select sugars, linkages, or texts to adjust or update size, shape, and other properties.
- **Move Elements** --- Drag selected sugars to change their positions.
- **Batch Selection** --- Drag to select multiple elements for batch adjustment, or use **Shift + click** for precise multi-selection.
- **Keyboard Shortcuts** ---
  - `Ctrl/Cmd + Z/Y`: Undo/Redo
  - `Ctrl/Cmd + B/I/U`: Bold/Italic/Underline for text
  - `Ctrl/Cmd + C/X/V/A`: Copy/Cut/Paste/Select All
  - `Delete / Backspace`: Delete selected elements
  - `Esc`: Exit the current mode (e.g., preset placement)

------------------------------------------------------------------------

## 🍬 Sugar Structure Styles

### 1. SNFG Sugar Presets

The right panel provides commonly used monosaccharide presets (Glc, Gal, Man, GlcNAc, GalNAc, Fuc, GlcA, Neu5Ac, Xyl), following the **SNFG 2.0** standard. These presets have default style settings in add sugar mode.

  - By default, for visual consistency, sugars with **diamond** symbols (GlcA, Neu5Ac) are **2 px larger**, and those with **square** symbols (GlcNAc, GalNAc) are **2 px smaller** than other sugars. However, applying preset styles in select mode will not alter sugar sizes and borders, only filling colors and shapes.
 - Other standard monosaccharides can be combined using the predefined shapes and colors. For details, please refer to the SNFG link provided in the left panel.

### 2. Custom Sugar Types

Users can customize: 
- **Shape** --- Circle, square, diamond, triangle, star, parenthesis, or free-end symbol.
   - The asterisk (`*`) in the last category will **not appear in exported images**, allowing display of unlinked free ends.
- **Fill Color and Transparency** --- Preset SNFG 2.0 standard colors are available, or users can specify custom RGB hex colors.
- **Size**
- **Outline** --- Width, style, color, transparency.

------------------------------------------------------------------------

## 🔗 Linkage and Linkage Text

Customizable features: 
- **Linkage Information** --- Enter full (e.g., α2-6) or simplified (e.g., b14) linkage notation for each bond.
- **Linkage Display** --- Check the option to show linkage information on the right side of the bond. Orientation follows **SNFG 2.0** convention, with numbers closer to the free end. The "swap" button can reverse the linkage direction.
- **Link Line Style** --- Width, style, color, transparency.
- **Linkage Text Style** --- Font size, typeface, style, color, transparency.

------------------------------------------------------------------------

## ✏️ Text Addition and Style

Using the "Add Text" tool, you can insert text labels anywhere on the canvas.
Adjustable options include: 
- Font size and typeface
- Bold / Italic / Underline
- Color and transparency

------------------------------------------------------------------------

## 🧩 Preset Oligosaccharide Templates

Supports inserting complete glycan structure SVG templates. 
Click a preset thumbnail, then click on the canvas to place the template.

------------------------------------------------------------------------

## 🧽 Eraser

Click or long-press to select and delete elements, or perform continuous deletion.
**Delete / Backspace** shortcuts are supported.

------------------------------------------------------------------------

## 🧮 Undo and Redo

Built-in full undo/redo system:

-   **Undo** --- Revert the previous action
-   **Redo** --- Reapply an undone action
-   Saves up to **50 history steps**

Includes changes to style, position, addition, and deletion of elements.

------------------------------------------------------------------------

## 🖼️ Export and Canvas Control

### Export Options
| Format | Description |
|------|------|
| **SVG** | Editable vector format preserving all graphical information |
| **PNG** | High-resolution bitmap with transparent background |
| **JPG** | White-background bitmap suitable for presentation|

### Export Sizes

- Small (800×600)
- Medium (1000×700)
- Large (1200×800)

### Canvas Operations

- **Pan**: Drag the canvas with the mouse
- **Zoom**: Adjust zoom level (50%-300%) using the slider
- **Reset**: Restore to 100% view
- **Shortcut**: Alt + Scroll

------------------------------------------------------------------------

## 🧑‍💻 Technical Implementation

-   **Frontend Framework**: Pure Vanilla JavaScript + SVG operations
-   **Main Application Class**: `frontend/src/app/GlycanDrawer.js`
-   **Feature Modules**: `frontend/src/app/mixins/*.mixin.js`
-   **Service Layer**: language loading and API access under `frontend/src/services`
-   **Backend Boundary**: dependency-free Node HTTP server under `backend/src`

The editor behavior is preserved from the previous `GlycanDrawer`
implementation, but the 13,500-line class is now split into feature-specific
mixins. UI listeners, drawing, connections, text, export, history, selection,
and canvas controls each live in their own module. The pre-refactor source is
retained under `legacy/` for comparison and recovery.

## 🛠️ Development

```bash
npm run dev
```

Then open <http://127.0.0.1:4173>.

```bash
npm test          # unit + server smoke checks
npm run test:e2e  # browser workflow regression checks
```

`test:e2e` uses Playwright, which is already listed under `devDependencies`.
Run `npm install` to install it, then install its Chromium browser if needed.
The `frontend/` tree is the single canonical frontend; the pre-refactor copy is
kept only under `legacy/`.

The browser entry is `frontend/src/main.js`. Backend endpoints are routed by
`backend/src/api/router.js`; the current endpoint is `GET /api/health`.

------------------------------------------------------------------------

## 🚀 Future Plans

- **Structure Conversion** --- Mutual conversion between standardized     IUPAC glycan names and SNFG graphical representations
- **Auto-Arrangement** --- One-click cleanup and alignment of glycan     structures
- **Position Adjustment** --- Horizontal/vertical movement / fixed bond-length movement
------------------------------------------------------------------------

## 📄 Contact & Help

-   **Developer**: x-yguo@pku.edu.cn
-   **Reference Standard**: [NCBI SNFG 2.0](https://www.ncbi.nlm.nih.gov/glycans/snfg2_0.html)
