# 🧩 Glycan Drawing Tool User Guide

(This English version is translated by ChatGPT and not revised yet)

## 📘 Introduction

**Glycan Drawing Tool** is a web-based application for drawing and editing glycan (carbohydrate) structures.  
It allows users to visually create monosaccharide nodes, linkage connections, and text annotations while automatically generating SNFG (Symbol Nomenclature for Glycans) compliant representations.  
The interface and logic are intuitive and streamlined, providing a better experience than most existing tools.

---

## 🧱 Overview

The interface consists of four main panels:

- **Left Panel**: Toolbar (Select, Add Sugar, Add Text, Insert Preset Glycan, Eraser)
- **Center Canvas**: Main drawing area (supports zooming and panning)
- **Right Panel**: Customization for sugar shape, color, linkage style, and text style
- **Top Panel**: Canvas operations (Undo/Redo, Clear Canvas, Export, Zoom)

---

## 🧭 Toolbar

| Tool | Icon | Function |
|------|------|-----------|
| Select (`select`) | ↖️ | Select existing elements for moving, copying, or modifying styles |
| Add Sugar (`add`) | 🍬 | Click on the canvas to add a new monosaccharide symbol |
| Add Text (`text`) | 📝 | Add text annotations or labels on the canvas |
| Preset Glycan (`preset`) | 🧩 | Insert predefined glycan templates |
| Eraser (`delete`) | 🧽 | Delete selected elements |

---

## 🎨 Add Sugar Mode

Available actions:

- **Add Monosaccharides** — Click on the canvas in Add mode to create sugars.  
- **Directional Addition** — Drag from an existing sugar toward an empty area to add a new sugar at fixed angles (30° / 45°).  
- **Create Linkages** — Drag from one sugar to another to form a glycosidic bond.  
- **Preset Styles** — You can preconfigure sugar and linkage styles (as described below) and add them directly.

---

## 🍬 Sugar Appearance

### 1. SNFG Presets
The right panel provides common monosaccharide presets (Glc, Gal, Man, GlcNAc, GalNAc, Fuc, GlcA, Sia, Xyl),  
following **SNFG 2.0 standards**. These include predefined colors and shapes but allow custom size adjustments.

### 2. Custom Sugar Design
Customizable options:
- **Shape** (circle, square, diamond, triangle, star, parenthesis, free-end, etc.)
- **Fill color and opacity** (SNFG-compliant colors or custom RGB hex codes)
- **Size**
- **Border** (width, style, color, opacity)

---

## 🔗 Linkages and Linkage Labels

Customizable options:
- **Linkage Text** — Input full notations like `α2-6` or shorthand forms like `b14`  
- **Linkage Display** — Enable linkage text on the right side of the bond; direction follows SNFG 2.0 (numbers near the non-reducing end). A swap button allows reversing the direction.  
- **Bond Line Style** — Control line width, style, color, and opacity.  
- **Linkage Text Style** — Adjust font size, font family, bold/italic style, color, and transparency.

---

## ✏️ Text Annotations

The “Add Text” tool lets you place labels anywhere on the canvas.  
Configurable properties include:
- Font size and family
- Bold / Italic / Underline
- Color and opacity

---

## 🧩 Preset Glycan Templates

You can insert complete glycan SVG templates (`presetGlycanToolbar`).  
Simply click a preset thumbnail, then click on the canvas to place it.

---

## 🧮 Undo & Redo

A complete undo/redo system is integrated:

- **Undo (Ctrl/Cmd + Z)** — Revert the previous step  
- **Redo (Ctrl/Cmd + Y)** — Restore the reverted action  
- Up to 50 history states are stored  

Supports all modifications including style, position, creation, and deletion.

---

## 🖼️ Export & Canvas Control

### Export Formats:
| Format | Description |
|------|------|
| **SVG** | Editable vector format preserving all graphics |
| **PNG** | High-resolution raster image with transparent background |
| **JPG** | Standard white-background raster image |

### Export Sizes:
- Small (800×600)
- Medium (1000×700)
- Large (1200×800)

### Canvas Controls:
- **Pan** — Drag the canvas with the mouse  
- **Zoom** — Adjust with slider (50%–300%)  
- **Reset** — Restore to 100%

---

## 🧰 Additional Features

- **Multi-selection** — Select multiple elements by box-selection or Shift+click  
- **Continuous Erasing** — Hold the eraser to quickly delete multiple elements  
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + Z/Y`: Undo / Redo  
  - `Ctrl/Cmd + B/I/U`: Bold / Italic / Underline for text  
  - `Ctrl/Cmd + C/X/V/A`: Copy / Cut / Paste / Select all  
  - `Delete`: Remove selected elements  
  - `Esc`: Exit current mode (e.g., preset placement)

---

## 🧑‍💻 Technical Details

- **Frontend**: Pure JavaScript + SVG  
- **Main Class**: `GlycanDrawer`  
  - Handles canvas management, event binding, element creation, and undo/redo logic  
- **Core Functions**:
  - `setupToolbar()` — Toolbar interactions  
  - `setupStyleControls()` — Style control bindings  
  - `initializeWorkspace()` — Canvas initialization  
  - `exportCanvas()` — Export logic  
  - `handleMouseDown/Move/Up()` — User interaction handling  

---

## 🚀 Future Plans

- **Text-to-Structure Conversion** — Convert standardized IUPAC glycan names to SNFG diagrams and vice versa  
- **Auto Layout** — Automatically arrange glycan structures neatly

---

## 📄 Contact & Support

- **Developer**: x-yguo@pku.edu.cn  
- **Reference**: [NCBI SNFG 2.0](https://www.ncbi.nlm.nih.gov/glycans/snfg2_0.html)  
