import {
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
import { toolbarMixin } from "./mixins/toolbar.mixin.js";
import { presetsMixin } from "./mixins/presets.mixin.js";
import { customizationMixin } from "./mixins/customization.mixin.js";
import { styleControlsMixin } from "./mixins/style-controls.mixin.js";
import { toolMixin } from "./mixins/tool.mixin.js";
import { presetStylesMixin } from "./mixins/preset-styles.mixin.js";
import { colorControlsMixin } from "./mixins/color-controls.mixin.js";
import { pointerInputMixin } from "./mixins/pointer-input.mixin.js";
import { sugarCreationMixin } from "./mixins/sugar-creation.mixin.js";
import { shapeRenderingMixin } from "./mixins/shape-rendering.mixin.js";
import { sugarSelectionMixin } from "./mixins/sugar-selection.mixin.js";
import { selectionUiMixin } from "./mixins/selection-ui.mixin.js";
import { textMixin } from "./mixins/text.mixin.js";
import { connectionsMixin } from "./mixins/connections.mixin.js";
import { sugarDeletionMixin } from "./mixins/sugar-deletion.mixin.js";
import { exportMixin } from "./mixins/export.mixin.js";
import { canvasStateMixin } from "./mixins/canvas-state.mixin.js";
import { boxSelectionMixin } from "./mixins/box-selection.mixin.js";
import { panelsMixin } from "./mixins/panels.mixin.js";
import { erasingMixin } from "./mixins/erasing.mixin.js";
import { styleApplicationMixin } from "./mixins/style-application.mixin.js";
import { shapeSelectorMixin } from "./mixins/shape-selector.mixin.js";
import { textStylesMixin } from "./mixins/text-styles.mixin.js";
import { workspaceMixin } from "./mixins/workspace.mixin.js";
import { viewControlsMixin } from "./mixins/view-controls.mixin.js";
import { connectionSelectionMixin } from "./mixins/connection-selection.mixin.js";
import { selectionCoreMixin } from "./mixins/selection-core.mixin.js";
import { draggingClipboardMixin } from "./mixins/dragging-clipboard.mixin.js";
import { textFormattingMixin } from "./mixins/text-formatting.mixin.js";
import { historyMixin } from "./mixins/history.mixin.js";

const REQUIRED_ELEMENT_IDS = [
  "canvas",
  "exportBtn",
  "clearBtn",
  "workspace",
  "exportArea",
];

export class GlycanDrawer {
    constructor() {
        for (const id of REQUIRED_ELEMENT_IDS) {
            if (!document.getElementById(id)) {
                throw new Error(`GlycanDrawer: missing required DOM element "#${id}"`);
            }
        }

        this.canvas = document.getElementById('canvas');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        this.sugarCount = 0;
        this.textCount = 0;
        this.sugarRadius = 20;
        this.connectionDistance = 70;
        
        // Tool states
        this.currentTool = 'select';
            this.currentSugarConfig = createDefaultSugarConfig();
        
            this.currentTextConfig = createDefaultTextConfig();
        
        // Unified element system
        this.selectedElements = new Set(); // All selected elements (sugars, texts, connections)
        this.hoveredElement = null; // Element being hovered for preview highlight
        this.hoveredElements = new Set(); // Elements being hovered during box selection
        
        // Legacy selection states for backward compatibility (maintained by updateLegacySelectionStates)
        this.selectedSugar = null;
        this.selectedText = null;
        this.selectedTexts = new Set();
        this.selectedConnections = new Set();
        this.selectedSugars = new Set();
        
        // Drag states
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.lastClickTime = 0;
        this.doubleClickDelay = 300;
        this.pendingAddClick = null;
        
        // Connection drag states
        this.isConnectionDragging = false;
        this.connectionStartSugar = null;
        this.connectionTargetSugar = null;
        this.longPressTimer = null;
        this.longPressDelay = 250; // 250ms for long press (reduced from 500ms)
        this.preventNextClick = false;
        this.isEditingText = false;
        
        // Box selection states
        this.isBoxSelecting = false;
        this.boxSelectionStart = { x: 0, y: 0 };
        this.selectionBox = null;
        
        // Add preview dot for sugar placement
        this.addPreviewDot = null;
        
        // UI update flag to prevent style application during UI updates
        this.isUpdatingUI = false;
        
        // Eraser states for continuous deletion
        this.isErasing = false;
        this.eraserTimer = null;
        this.eraserDelay = 100; // 100ms delay between continuous deletions
        this.isDraggingMultiple = false;
        this.isDraggingMultipleTexts = false;
        
        // Linkage assign mode properties
            this.currentLinkageConfig = createDefaultLinkageConfig();
        
    // Keyboard state tracking
    this.isCtrlPressed = false; // kept for backward compatibility
    this.isShiftPressed = false;
    // Platform detection for primary modifier (Ctrl on Windows/Linux, Command on macOS)
    this.isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    // Use this flag to check the 'primary' modifier key in a cross-platform way
    this.isPrimaryModifierPressed = false;
        this.clipboard = {
            sugars: [],
            texts: [],
            connections: []
        };
        
        // Undo/Redo System
        this.objectList = new Map(); // Global object registry: id -> object data
        this.undoStack = [];         // Array of steps for undo
        this.redoStack = [];         // Array of steps for redo
        this.maxHistorySize = HISTORY_LIMIT;    // Maximum number of steps to keep
        
        // Step recording
        this.currentStep = null;     // Current step being recorded
        this.isRecordingStep = false; // Flag to track if we're recording a step
        
        // Workspace properties
        this.workspace = null;
        this.exportArea = null;
        this.zoomLevel = 1;

        this.minZoom = MIN_ZOOM;
        this.maxZoom = MAX_ZOOM;
            this.exportSizes = EXPORT_SIZES;
        this.currentExportSize = 'medium';
        
        // SNFG Presets Configuration
            this.snfgPresets = SNFG_PRESETS;
        
        // 16 directional positions around a sugar
            this.directions = DIRECTIONS;
        
        this.init();
    }
    

    init() {
        // Add event listeners for tools and UI elements
        this.setupToolbar();
        this.setupPresets();
        this.setupCustomization();
        this.setupStyleControls();
        
        // Add canvas event listeners
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        // Removed wheel zoom - now using zoom slider
        
        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Setup global drag event listeners (will be added/removed as needed)
        this.globalDragMouseMove = (e) => this.handleGlobalDragMove(e);
        this.globalDragMouseUp = (e) => this.handleGlobalDragUp(e);
        
        // Add action button listeners
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
    // Undo/Redo buttons
    this.undoBtn = document.getElementById('undoBtn');
    this.redoBtn = document.getElementById('redoBtn');
    if (this.undoBtn) this.undoBtn.addEventListener('click', () => this.undo());
    if (this.redoBtn) this.redoBtn.addEventListener('click', () => this.redo());
    // Initialize button disabled state
    try { this.updateUndoRedoButtons(); } catch (e) {}
        
        // Add export option listeners
        const exportOptions = document.querySelectorAll('.export-option');
        exportOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.target.getAttribute('data-format');
                this.exportCanvas(format);
                // Close dropdown after selection
                this.closeExportDropdown();
            });
        });
        
        // Add export button click handler for dropdown toggle
        const exportBtn = document.getElementById('exportBtn');
        const exportDropdown = document.querySelector('.export-dropdown');
        
        if (exportBtn && exportDropdown) {
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportDropdown.classList.toggle('open');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!exportDropdown.contains(e.target)) {
                    exportDropdown.classList.remove('open');
                }
            });
        }
        
        // Add canvas size control listeners
        const sizeButtons = document.querySelectorAll('.size-btn');
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setExportAreaSize(btn.dataset.size);
            });
        });
        
        // Initialize workspace first
        this.initializeWorkspace();
        
        // Create add preview dot
        this.addPreviewDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.addPreviewDot.setAttribute('r', '10');
        this.addPreviewDot.setAttribute('fill', 'blue');
        this.addPreviewDot.setAttribute('opacity', '0.3');
        this.addPreviewDot.style.display = 'none';
        this.canvas.appendChild(this.addPreviewDot);
        
        // Then setup zoom controls (needs workspace to be ready)
        this.setupZoomControl();
        
        // Set default tool to select
        this.setTool('select');
        
        // Initialize style panels (should be hidden by default)
        this.updateStylePanel();
        
        // Initialize left panel visibility
        this.updateLeftPanel();
        
        // Initialize object list for undo/redo system
        this.initializeObjectList();
        // Preset glycan setup (load templates)
        this.setupPresetGlycans();
        this.setupCollapsibleGroups();
        this.setupViewControls();
        this.setupGridAndSnapControls();
        this.setupPanelTabs();
    }
    
}

const mixins = [
  toolbarMixin,
  presetsMixin,
  customizationMixin,
  styleControlsMixin,
  toolMixin,
  presetStylesMixin,
  colorControlsMixin,
  pointerInputMixin,
  sugarCreationMixin,
  shapeRenderingMixin,
  sugarSelectionMixin,
  selectionUiMixin,
  textMixin,
  connectionsMixin,
  sugarDeletionMixin,
  exportMixin,
  canvasStateMixin,
  boxSelectionMixin,
  panelsMixin,
  erasingMixin,
  styleApplicationMixin,
  shapeSelectorMixin,
  textStylesMixin,
  workspaceMixin,
  viewControlsMixin,
  connectionSelectionMixin,
  selectionCoreMixin,
  draggingClipboardMixin,
  textFormattingMixin,
  historyMixin,
];

const seenMixinMethods = new Map();
for (const [mixinIndex, mixin] of mixins.entries()) {
  for (const methodName of Object.keys(mixin)) {
    if (seenMixinMethods.has(methodName)) {
      throw new Error(
        `GlycanDrawer mixin collision: "${methodName}" is defined by both ` +
        `mixin ${seenMixinMethods.get(methodName)} and mixin ${mixinIndex}`,
      );
    }
    seenMixinMethods.set(methodName, mixinIndex);
  }
}

for (const mixin of mixins) {
  Object.assign(GlycanDrawer.prototype, mixin);
}

export default GlycanDrawer;
