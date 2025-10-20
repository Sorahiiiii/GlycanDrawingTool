class GlycanDrawer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        this.sugarCount = 0;
        this.textCount = 0;
        this.sugarRadius = 20;
        this.connectionDistance = 70;
        
        // Tool states
        this.currentTool = 'select';
        this.currentSugarConfig = {
            type: 'custom',
            shape: 'circle',
            color: '#0072BC',
            size: 20,
            borderWidth: 3,
            borderColor: '#000000',
            borderOpacity: 1,
            fillOpacity: 1,
            preset: null
        };
        
        this.currentTextConfig = {
            fontSize: 15,
            fontFamily: 'Arial, sans-serif',
            color: '#000000',
            opacity: 1,
            bold: false,
            italic: false,
            underline: false
        };
        
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
        this.currentLinkageConfig = {
            strokeWidth: 3,
            strokeColor: '#000000',  // Match linkage mode default
            strokeStyle: 'solid',
            strokeOpacity: 1,
            textSize: 14,
            textColor: '#000000',
            showText: false,  // Default: don't show linkage text for new connections
            linkage: null,  // Default linkage (will show as ??-? if not set)
            reversed: false  // Track if linkage direction is reversed
        };
        
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
        this.maxHistorySize = 50;    // Maximum number of steps to keep
        
        // Step recording
        this.currentStep = null;     // Current step being recorded
        this.isRecordingStep = false; // Flag to track if we're recording a step
        
        // Workspace properties
        this.workspace = null;
        this.exportArea = null;
        this.zoomLevel = 1;

        this.minZoom = 0.1;
        this.maxZoom = 5;
        this.exportSizes = {
            small: { width: 800, height: 600 },
            medium: { width: 1000, height: 700 },
            large: { width: 1200, height: 800 }
        };
        this.currentExportSize = 'medium';
        
        // SNFG Presets Configuration
        this.snfgPresets = {
            'glc': { shape: 'circle-filled', color: '#0072BC', name: 'Glucose' },
            'gal': { shape: 'circle-filled', color: '#FFD400', name: 'Galactose' },
            'man': { shape: 'circle-filled', color: '#00A651', name: 'Mannose' },
            'glcnac': { shape: 'square', color: '#0072BC', name: 'GlcNAc' },
            'galnac': { shape: 'square', color: '#FFD400', name: 'GalNAc' },
            'fuc': { shape: 'triangle', color: '#ED1C24', name: 'Fucose' },
            'glca': { shape: 'diamond-divided-top', color: '#0072BC', name: 'GlcA' },
            'neu5ac': { shape: 'diamond', color: '#A54399', name: 'Neu5Ac' },
            'xyl': { shape: 'star-5', color: '#F47920', name: 'Xyl' }
        };
        
        // 16 directional positions around a sugar
        this.directions = [
        { name: 'N',  dx: 0.0000,  dy: -1.0000 },
        { name: 'NNE', dx: 0.5000,  dy: -0.8660 },
        { name: 'NE',  dx: 0.7071,  dy: -0.7071 },
        { name: 'ENE', dx: 0.8660,  dy: -0.5000 },
        { name: 'E',   dx: 1.0000,  dy:  0.0000 },
        { name: 'ESE', dx: 0.8660,  dy:  0.5000 },
        { name: 'SE',  dx: 0.7071,  dy:  0.7071 },
        { name: 'SSE', dx: 0.5000,  dy:  0.8660 },
        { name: 'S',   dx: 0.0000,  dy:  1.0000 },
        { name: 'SSW',  dx: -0.5000, dy:  0.8660 },
        { name: 'SW',    dx: -0.7071, dy:  0.7071 },
        { name: 'WSW',  dx: -0.8660, dy:  0.5000 },
        { name: 'W',     dx: -1.0000, dy:  0.0000 },
        { name: 'WNW',  dx: -0.8660, dy: -0.5000 },
        { name: 'NW',    dx: -0.7071, dy: -0.7071 },
        { name: 'NNW',  dx: -0.5000, dy: -0.8660 }
        ];
        
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
                console.log('Size button clicked:', btn.dataset.size);
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
    }
    
    setupToolbar() {
        // Tool buttons
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.setTool(tool);
            });
        });
    }
    
    setupPresets() {
        // SNFG preset buttons
        const presetItems = document.querySelectorAll('.preset-item');
        presetItems.forEach(item => {
            item.addEventListener('click', () => {
                // Skip disabled items
                if (item.classList.contains('disabled') || !item.dataset.preset) {
                    return;
                }
                
                const preset = item.dataset.preset;
                this.selectPreset(preset);
            });
        });
    }

    // New: preset glycan toolbar setup
    setupPresetGlycans() {
        this.presetTemplates = {}; // key -> DocumentFragment of SVG
        this.activePreset = null; // {src, name}

        const toolbar = document.getElementById('presetGlycanToolbar');
        if (!toolbar) return;

        // Bind clicks on thumbnails
        toolbar.querySelectorAll('.preset-thumb').forEach(thumb => {
            const src = thumb.dataset.presetSrc;
            if (src) {
                thumb.addEventListener('click', (e) => {
                    // Toggle selection
                    if (thumb.classList.contains('active')) {
                        thumb.classList.remove('active');
                        this.exitPresetMode();
                    } else {
                        toolbar.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                        this.enterPresetMode(src);
                    }
                });
                // Preload template
                this.loadPresetSVG(src).catch(err => {
                    console.warn('Failed to load preset SVG:', src, err);
                });
            }
        });

        // Esc key to cancel preset mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activePreset) {
                this.exitPresetMode();
                document.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('active'));
            }
        });
    }

    async loadPresetSVG(src) {
        if (this.presetTemplates[src]) return this.presetTemplates[src];

        // Check for embedded template in DOM to avoid fetch/CORS issues when opened via file://
        try {
            const base = src.split('/').pop().split('?')[0].replace(/\.[^.]+$/, ''); // e.g. 'test-glycan'
            const embeddedId = `embedded-${base}`;
            const embedded = document.getElementById(embeddedId);
            if (embedded) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(embedded.textContent || embedded.innerHTML, 'image/svg+xml');
                const svg = doc.querySelector('svg');
                if (svg) {
                    // Store the original template but return a clone to avoid mutations
                    this.presetTemplates[src] = svg;
                    return document.importNode(svg, true);
                }
            }
        } catch (e) {
            // fall through to fetch
            console.warn('Embedded preset parse failed, will try fetch:', e);
        }

        // Fallback to fetch (for HTTP/HTTPS serving)
        try {
            const resp = await fetch(src);
            const text = await resp.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'image/svg+xml');
            const svg = doc.querySelector('svg');
            if (!svg) throw new Error('No svg root found');
            // Store original and return a clone so caller can modify without affecting cache
            this.presetTemplates[src] = svg;
            return document.importNode(svg, true);
        } catch (err) {
            console.error('Error loading preset SVG', src, err);
            throw err;
        }
    }

    // Compute the minimum x/y coordinates used by the template's graphical elements
    computeTemplateOrigin(svgRoot) {
        let minX = Infinity;
        let minY = Infinity;

        function consider(x, y) {
            if (typeof x === 'number' && typeof y === 'number') {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
            }
        }

        function scan(node) {
            if (!node || node.nodeType !== 1) return;
            const tag = node.tagName.toLowerCase();
            if (tag === 'circle' || tag === 'ellipse') {
                const cx = parseFloat(node.getAttribute('cx')) || 0;
                const cy = parseFloat(node.getAttribute('cy')) || 0;
                const r = parseFloat(node.getAttribute('r')) || 0;
                consider(cx - r, cy - r);
            } else if (tag === 'rect') {
                const x = parseFloat(node.getAttribute('x')) || 0;
                const y = parseFloat(node.getAttribute('y')) || 0;
                consider(x, y);
            } else if (tag === 'line') {
                const x1 = parseFloat(node.getAttribute('x1')) || 0;
                const y1 = parseFloat(node.getAttribute('y1')) || 0;
                const x2 = parseFloat(node.getAttribute('x2')) || 0;
                const y2 = parseFloat(node.getAttribute('y2')) || 0;
                consider(Math.min(x1, x2), Math.min(y1, y2));
            } else if (tag === 'polygon' || tag === 'polyline') {
                const pts = (node.getAttribute('points') || '').trim();
                if (pts) {
                    pts.split(/\s+/).forEach(pair => {
                        const parts = pair.split(',');
                        if (parts.length >= 2) consider(parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0);
                    });
                }
            } else if (tag === 'g' || tag === 'svg') {
                Array.from(node.children).forEach(child => scan(child));
                return;
            } else if (tag === 'use') {
                // try to read x/y attributes
                const x = parseFloat(node.getAttribute('x')) || 0;
                const y = parseFloat(node.getAttribute('y')) || 0;
                consider(x, y);
            } else if (tag === 'path') {
                // skip complex path parsing; assume it sits near origin if no other hints
            }

            // Also descend into children for composite nodes
            Array.from(node.children).forEach(child => scan(child));
        }

        scan(svgRoot);

        if (!isFinite(minX)) minX = 0;
        if (!isFinite(minY)) minY = 0;
        return { minX, minY };
    }

    // Shift basic coordinate attributes of common SVG elements by dx/dy
    shiftElementCoordinates(node, dx, dy) {
        if (!node || node.nodeType !== 1) return;
        const tag = node.tagName.toLowerCase();
        function shiftAttr(attr) {
            if (node.hasAttribute(attr)) {
                const v = parseFloat(node.getAttribute(attr)) || 0;
                node.setAttribute(attr, (v - dx).toString());
            }
        }

        if (tag === 'circle' || tag === 'ellipse') {
            if (node.hasAttribute('cx')) node.setAttribute('cx', (parseFloat(node.getAttribute('cx') || 0) - dx).toString());
            if (node.hasAttribute('cy')) node.setAttribute('cy', (parseFloat(node.getAttribute('cy') || 0) - dy).toString());
        } else if (tag === 'rect') {
            if (node.hasAttribute('x')) node.setAttribute('x', (parseFloat(node.getAttribute('x') || 0) - dx).toString());
            if (node.hasAttribute('y')) node.setAttribute('y', (parseFloat(node.getAttribute('y') || 0) - dy).toString());
        } else if (tag === 'line') {
            if (node.hasAttribute('x1')) node.setAttribute('x1', (parseFloat(node.getAttribute('x1') || 0) - dx).toString());
            if (node.hasAttribute('y1')) node.setAttribute('y1', (parseFloat(node.getAttribute('y1') || 0) - dy).toString());
            if (node.hasAttribute('x2')) node.setAttribute('x2', (parseFloat(node.getAttribute('x2') || 0) - dx).toString());
            if (node.hasAttribute('y2')) node.setAttribute('y2', (parseFloat(node.getAttribute('y2') || 0) - dy).toString());
        } else if (tag === 'polygon' || tag === 'polyline') {
            const pts = (node.getAttribute('points') || '').trim();
            if (pts) {
                const newPts = pts.split(/\s+/).map(pair => {
                    const parts = pair.split(',');
                    if (parts.length >= 2) {
                        const nx = (parseFloat(parts[0]) || 0) - dx;
                        const ny = (parseFloat(parts[1]) || 0) - dy;
                        return `${nx},${ny}`;
                    }
                    return pair;
                }).join(' ');
                node.setAttribute('points', newPts);
            }
        } else if (tag === 'g' || tag === 'svg') {
            // If group has transform translate, try to incorporate it (best-effort)
            const t = node.getAttribute('transform');
            // For now, simply recurse children
            Array.from(node.children).forEach(child => this.shiftElementCoordinates(child, dx, dy));
            return;
        }

        // Recurse into children
        Array.from(node.children).forEach(child => this.shiftElementCoordinates(child, dx, dy));
    }

    // Generate a unique id based on an original id, avoiding existing ids in the document
    generateUniqueId(origId) {
        if (!origId) return `id-${Date.now()}-${Math.floor(Math.random()*10000)}`;
        this._idCounter = this._idCounter || 1;
        let candidate;
        do {
            candidate = `${origId}-${this._idCounter++}`;
        } while (document.getElementById(candidate));
        return candidate;
    }

    // Extract numeric part from sugar id like 'sugar-12' -> 12. Returns NaN if not found.
    getSugarNumberFromId(id) {
        if (!id || typeof id !== 'string') return NaN;
        const m = id.match(/sugar-?(\d+)$/i);
        if (m) return parseInt(m[1], 10);
        return NaN;
    }

    // Compute deterministic connection id in the form 'connection-<smaller>-<larger>' based on sugar ids
    computeConnectionId(idA, idB) {
        const a = this.getSugarNumberFromId(idA);
        const b = this.getSugarNumberFromId(idB);
        if (!isNaN(a) && !isNaN(b)) {
            const min = Math.min(a, b);
            const max = Math.max(a, b);
            return `connection-${min}-${max}`;
        }
        // Fallback: if we can't parse numbers, create a unique-ish deterministic id using the raw ids
        const safeA = (idA || '').replace(/[^A-Za-z0-9_-]/g, '_');
        const safeB = (idB || '').replace(/[^A-Za-z0-9_-]/g, '_');
        return `connection-${safeA}-${safeB}`;
    }

    // Collect all nodes under a node (or array of nodes)
    collectNodes(rootOrArray) {
        const nodes = [];
        const pushNode = (n) => {
            nodes.push(n);
            Array.from(n.children || []).forEach(c => pushNode(c));
        };
        if (Array.isArray(rootOrArray)) {
            rootOrArray.forEach(r => pushNode(r));
        } else {
            pushNode(rootOrArray);
        }
        return nodes;
    }

    // Build id map for a set of nodes (oldId -> newId)
    // Compute next available sugar id like sugar-2, sugar-3 based on existing ids in the document and any assigned in idMap
    getNextSugarId(existingMap) {
        let max = 0;
        const sugarRegex = /^sugar-?(\d+)$/i;

        // Check existing document ids
        Array.from(document.querySelectorAll('[id]')).forEach(el => {
            const id = el.getAttribute('id');
            if (!id) return;
            const m = id.match(sugarRegex);
            if (m) {
                const n = parseInt(m[1], 10) || 0;
                if (n > max) max = n;
            }
        });

        // Also consider ids already assigned in existingMap
        if (existingMap) {
            Object.values(existingMap).forEach(id => {
                const m = ('' + id).match(sugarRegex);
                if (m) {
                    const n = parseInt(m[1], 10) || 0;
                    if (n > max) max = n;
                }
            });
        }

        return `sugar-${max + 1}`;
    }

    buildIdMapForNodes(nodes) {
        const idMap = {};
        nodes.forEach(node => {
            if (node.getAttribute && node.getAttribute('id')) {
                const oldId = node.getAttribute('id');
                // If the node represents a sugar (by class) or its id looks like a sugar id, allocate a sequential sugar id
                const looksLikeSugarId = /^sugar-?\d+$/i.test(oldId);
                const isSugarClass = node.classList && node.classList.contains && node.classList.contains('sugar');
                if ((isSugarClass || looksLikeSugarId) && !idMap[oldId]) {
                    idMap[oldId] = this.getNextSugarId(idMap);
                } else if (!idMap[oldId]) {
                    idMap[oldId] = this.generateUniqueId(oldId);
                }
            }
        });
        return idMap;
    }

    // Escape regex special characters in string
    escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Apply id map to nodes: rename ids and update references (url(#id), href, xlink:href, and plain '#id')
    applyIdMapToNodes(nodes, idMap) {
        if (!idMap || Object.keys(idMap).length === 0) return;
        const oldIds = Object.keys(idMap);
        // Pre-build regexes for replacements
        const urlRegexes = oldIds.map(old => ({
            old,
            urlRe: new RegExp('url\\(#' + this.escapeRegExp(old) + '\\)', 'g'),
            hashRe: new RegExp('(^|[^A-Za-z0-9_-])#' + this.escapeRegExp(old) + '($|[^A-Za-z0-9_-])', 'g')
        }));

        nodes.forEach(node => {
            if (node.getAttribute && node.getAttribute('id')) {
                const oldId = node.getAttribute('id');
                if (idMap[oldId]) {
                    node.setAttribute('id', idMap[oldId]);
                }
            }

            // Update attributes that may reference ids
            if (node.attributes) {
                Array.from(node.attributes).forEach(attr => {
                    let v = attr.value;
                    if (!v || typeof v !== 'string') return;
                    let newV = v;
                    urlRegexes.forEach(({old, urlRe, hashRe}) => {
                        const newId = idMap[old];
                        if (!newId) return;
                        // url(#old) => url(#new)
                        newV = newV.replace(urlRe, `url(#${newId})`);
                        // href values like '#old' or occurrences of #old bounded by non identifier chars
                        // Replace exact '#old' first
                        if (newV === `#${old}`) newV = `#${newId}`;
                        // Replace any standalone occurrences of #old (best-effort)
                        newV = newV.replace(hashRe, (m, p1, p2) => `${p1}#${newId}${p2}`);
                    });

                    if (newV !== v) {
                        try { node.setAttribute(attr.name, newV); } catch (e) { /* ignore */ }
                    }
                });
            }
        });
    }

    enterPresetMode(src) {
        // Save previous tool so we can restore when exiting preset mode
        this.previousToolBeforePreset = this.currentTool;
        // Enter a dedicated preset mode so the right panel can show the preset UI only in this mode
        this.setTool('preset');
        this.activePreset = { src };
        // No longer show popup notification - instruction text is visible on the right panel
    }

    exitPresetMode() {
        this.activePreset = null;
        // Restore previous tool if available
        if (this.previousToolBeforePreset) {
            this.setTool(this.previousToolBeforePreset);
            this.previousToolBeforePreset = null;
        } else {
            this.setTool('select');
        }
    }
    
    setupCustomization() {
        // Shape and color buttons are now handled in setupStyleControls()
        // This prevents double event listeners
        
        // Custom sugar color controls
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        const customSugarOpacity = document.getElementById('customSugarOpacity');
        const customSugarOpacityValue = document.getElementById('customSugarOpacityValue');
        
        if (customSugarColor && customSugarColorHex) {
            customSugarColor.addEventListener('input', (e) => {
                const color = e.target.value;
                customSugarColorHex.value = color;
                // Clear mixed state when user manually changes value
                customSugarColor.classList.remove('mixed');
                customSugarColorHex.classList.remove('mixed');
                
                // Clear SNFG preset selection (manual override)
                this.clearPresetSelection();
                
                // Update color grid buttons to deactivate them (user is using custom color)
                document.querySelectorAll('.color-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                if (this.currentTool === 'add') {
                    // 添加模式：只更新配置，不应用到任何元素
                    this.currentSugarConfig.color = color;
                    this.currentSugarConfig.type = 'custom'; 
                    this.currentSugarConfig.preset = null;
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applySugarColor(color);
                }
            });
            
            customSugarColorHex.addEventListener('input', (e) => {
                const color = e.target.value;
                if (this.isValidHexColor(color)) {
                    const normalizedColor = this.normalizeColorToHex(color);
                    customSugarColor.value = normalizedColor;
                    customSugarColorHex.value = normalizedColor;
                    // Clear mixed state when user manually changes value
                    customSugarColor.classList.remove('mixed');
                    customSugarColorHex.classList.remove('mixed');
                    
                    // Clear SNFG preset selection (manual override)
                    this.clearPresetSelection();
                    
                    // Update color grid buttons to deactivate them (user is using custom color)
                    document.querySelectorAll('.color-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    if (this.currentTool === 'add') {
                        // 添加模式：只更新配置，不应用到任何元素
                        this.currentSugarConfig.color = normalizedColor;
                        this.currentSugarConfig.type = 'custom';
                        this.currentSugarConfig.preset = null;
                    } else if (this.currentTool === 'select') {
                        // 选择模式：只应用到选中元素，不更新配置
                        this.applySugarColor(normalizedColor);
                    }
                }
            });
        }
        
        // Custom sugar opacity control
        if (customSugarOpacity && customSugarOpacityValue) {
            customSugarOpacity.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                customSugarOpacityValue.textContent = Math.round(value * 100) + '%';
                
                if (this.currentTool === 'add') {
                    // 添加模式：只更新配置，不应用到任何元素
                    if (this.currentSugarConfig) {
                        this.currentSugarConfig.fillOpacity = value;
                    }
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applySugarFillOpacity();
                }
            });
        }
    }
    
    setupStyleControls() {
        // Sugar size control
        const sugarSize = document.getElementById('sugarSize');
        const sugarSizeValue = document.getElementById('sugarSizeValue');
        
        sugarSize.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            sugarSizeValue.textContent = value;
            
            if (this.currentTool === 'add') {
                // 添加模式：只更新配置，不应用到任何元素
                if (this.currentSugarConfig) {
                    this.currentSugarConfig.size = value;
                }
            } else if (this.currentTool === 'select') {
                // 选择模式：只应用到选中元素，不更新配置
                this.applySugarSizeWithoutStep();
            }
        });
        
        // Handle undo/redo step recording for size slider drag
        sugarSize.addEventListener('mousedown', () => {
            if (this.currentTool === 'select') {
                // Start recording and capture initial state
                this.startStep();
                this.sizeSliderDragging = true;
                
                // Record initial state of all selected sugars
                const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
                this.initialSugarStates = selectedSugars.map(sugar => ({
                    id: sugar.getAttribute('id'),
                    beforeData: this.createObjectData(sugar)
                }));
            }
        });
        
        sugarSize.addEventListener('mouseup', () => {
            if (this.currentTool === 'select' && this.sizeSliderDragging) {
                // Record final state and finish step
                if (this.initialSugarStates) {
                    this.initialSugarStates.forEach(state => {
                        const sugar = document.getElementById(state.id);
                        if (sugar) {
                            const afterData = this.createObjectData(sugar);
                            this.recordObjectModified(state.id, state.beforeData, afterData);
                        }
                    });
                    this.initialSugarStates = null;
                }
                this.finishStep();
                this.sizeSliderDragging = false;
            }
        });
        
        // Handle case where mouse is released outside slider
        document.addEventListener('mouseup', () => {
            if (this.currentTool === 'select' && this.sizeSliderDragging) {
                // Record final state and finish step
                if (this.initialSugarStates) {
                    this.initialSugarStates.forEach(state => {
                        const sugar = document.getElementById(state.id);
                        if (sugar) {
                            const afterData = this.createObjectData(sugar);
                            this.recordObjectModified(state.id, state.beforeData, afterData);
                        }
                    });
                    this.initialSugarStates = null;
                }
                this.finishStep();
                this.sizeSliderDragging = false;
            }
        });
        
        // Sugar border style controls
        const sugarBorderWidth = document.getElementById('sugarBorderWidth');
        const sugarBorderWidthValue = document.getElementById('sugarBorderWidthValue');
        const borderStyleButtons = document.querySelectorAll('.border-style-btn');
        
        sugarBorderWidth.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            sugarBorderWidthValue.textContent = value;
            
            // Clear mixed state when user manually changes value
            e.target.classList.remove('mixed');
            if (sugarBorderWidthValue) sugarBorderWidthValue.classList.remove('mixed');
            
            if (this.currentTool === 'add') {
                // 添加模式：只更新配置，不应用到任何元素
                if (this.currentSugarConfig) {
                    this.currentSugarConfig.borderWidth = value;
                }
            } else if (this.currentTool === 'select') {
                // 选择模式：只应用到选中元素，不更新配置
                this.applySugarBorderWidthWithoutStep();
            }
        });
        
        // Handle undo/redo step recording for border width slider drag
        sugarBorderWidth.addEventListener('mousedown', () => {
            if (this.currentTool === 'select') {
                // Start recording and capture initial state
                this.startStep();
                this.borderWidthSliderDragging = true;
                
                // Record initial state of all selected sugars
                const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
                this.initialSugarStatesForBorderWidth = selectedSugars.map(sugar => ({
                    id: sugar.getAttribute('id'),
                    beforeData: this.createObjectData(sugar)
                }));
            }
        });
        
        sugarBorderWidth.addEventListener('mouseup', () => {
            if (this.currentTool === 'select' && this.borderWidthSliderDragging) {
                // Record final state and finish step
                if (this.initialSugarStatesForBorderWidth) {
                    this.initialSugarStatesForBorderWidth.forEach(state => {
                        const sugar = document.getElementById(state.id);
                        if (sugar) {
                            const afterData = this.createObjectData(sugar);
                            this.recordObjectModified(state.id, state.beforeData, afterData);
                        }
                    });
                    this.initialSugarStatesForBorderWidth = null;
                }
                this.finishStep();
                this.borderWidthSliderDragging = false;
            }
        });
        
        // Handle case where mouse is released outside border width slider
        document.addEventListener('mouseup', () => {
            if (this.currentTool === 'select' && this.borderWidthSliderDragging) {
                // Record final state and finish step
                if (this.initialSugarStatesForBorderWidth) {
                    this.initialSugarStatesForBorderWidth.forEach(state => {
                        const sugar = document.getElementById(state.id);
                        if (sugar) {
                            const afterData = this.createObjectData(sugar);
                            this.recordObjectModified(state.id, state.beforeData, afterData);
                        }
                    });
                    this.initialSugarStatesForBorderWidth = null;
                }
                this.finishStep();
                this.borderWidthSliderDragging = false;
            }
        });
        
        borderStyleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                borderStyleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applySugarBorderStyle();
            });
        });
        
        // Sugar border opacity control
        const sugarBorderOpacity = document.getElementById('sugarBorderOpacity');
        const sugarBorderOpacityValue = document.getElementById('sugarBorderOpacityValue');
        
        if (sugarBorderOpacity && sugarBorderOpacityValue) {
            sugarBorderOpacity.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                sugarBorderOpacityValue.textContent = Math.round(value * 100) + '%';
                
                // Clear mixed state when user manually changes value
                e.target.classList.remove('mixed');
                if (sugarBorderOpacityValue) sugarBorderOpacityValue.classList.remove('mixed');
                
                if (this.currentTool === 'add') {
                    // 添加模式：只更新配置，不应用到任何元素
                    if (this.currentSugarConfig) {
                        this.currentSugarConfig.borderOpacity = value;
                    }
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applySugarBorderOpacity();
                }
            });
        }
        
        // Connection line style controls
        const connectionWidth = document.getElementById('connectionStrokeWidth');
        const connectionWidthValue = document.getElementById('connectionStrokeWidthValue');
        const connectionStyleButtons = document.querySelectorAll('.connection-style-btn');
        
        // --- Fix: Only record one undo step when dragging connection stroke width in select mode ---
        connectionWidth.addEventListener('input', (e) => {
            const value = e.target.value;
            connectionWidthValue.textContent = value;
            
            if (this.currentTool === 'add') {
                // 添加模式：只更新配置，不应用到任何元素
                this.currentLinkageConfig.strokeWidth = parseFloat(value);
            } else if (this.currentTool === 'select') {
                // 选择模式：只应用到选中元素，不更新配置
                if (this.connectionWidthSliderDragging) {
                    // Only apply style, don't record step
                    this.applyLinkageStyle();
                } else {
                    this.applyConnectionStyle();
                }
            }
        });

        // Handle undo/redo step recording for connection stroke width slider drag
        connectionWidth.addEventListener('mousedown', () => {
            if (this.currentTool === 'select') {
                this.startStep('Change connection stroke width');
                this.connectionWidthSliderDragging = true;
                // Record initial state of all selected connections
                const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                this.initialConnectionStatesForStrokeWidth = selectedConnections.map(conn => ({
                    id: conn.getAttribute('id'),
                    beforeData: this.createObjectData(conn)
                }));
            }
        });

        connectionWidth.addEventListener('mouseup', () => {
            if (this.currentTool === 'select' && this.connectionWidthSliderDragging) {
                // Record final state and finish step
                if (this.initialConnectionStatesForStrokeWidth) {
                    this.initialConnectionStatesForStrokeWidth.forEach(state => {
                        const conn = document.getElementById(state.id);
                        if (conn) {
                            const afterData = this.createObjectData(conn);
                            this.recordObjectModified(state.id, state.beforeData, afterData);
                        }
                    });
                    this.initialConnectionStatesForStrokeWidth = null;
                }
                this.finishStep();
                this.connectionWidthSliderDragging = false;
            }
        });

        // Handle case where mouse is released outside the slider
        document.addEventListener('mouseup', () => {
            if (this.currentTool === 'select' && this.connectionWidthSliderDragging) {
                // Record final state and finish step
                if (this.initialConnectionStatesForStrokeWidth) {
                    this.initialConnectionStatesForStrokeWidth.forEach(state => {
                        const conn = document.getElementById(state.id);
                        if (conn) {
                            const afterData = this.createObjectData(conn);
                            this.recordObjectModified(state.id, state.beforeData, afterData);
                        }
                    });
                    this.initialConnectionStatesForStrokeWidth = null;
                }
                this.finishStep();
                this.connectionWidthSliderDragging = false;
            }
        });
        
        connectionStyleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                connectionStyleButtons.forEach(b => {
                    b.classList.remove('active', 'mixed');
                });
                btn.classList.add('active');
                
                if (this.currentTool === 'add') {
                    // 添加模式：只更新配置，不应用到任何元素
                    this.currentLinkageConfig.strokeStyle = btn.dataset.style;
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.startStep('Change connection style');
                    this.applyConnectionStyle();
                    this.finishStep();
                }
            });
        });
        
        // Connection opacity control
        const connectionOpacity = document.getElementById('linkageOpacity');
        const connectionOpacityValue = document.getElementById('linkageOpacityValue');
        
        if (connectionOpacity && connectionOpacityValue) {
            // Handle undo/redo step recording for connection opacity slider drag
            connectionOpacity.addEventListener('mousedown', () => {
                if (this.currentTool === 'select') {
                    this.startStep('Change connection opacity');
                    this.connectionOpacitySliderDragging = true;
                    // Record initial state of all selected connections
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                    this.initialConnectionStatesForOpacity = selectedConnections.map(conn => ({
                        id: conn.getAttribute('id'),
                        beforeData: this.createObjectData(conn)
                    }));
                }
            });

            connectionOpacity.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                connectionOpacityValue.textContent = Math.round(value * 100) + '%';
                
                // Clear mixed state when user manually changes value
                e.target.classList.remove('mixed');
                if (connectionOpacityValue) connectionOpacityValue.classList.remove('mixed');
                
                // Apply opacity in select mode (for selected connections)
                if (this.currentTool === 'select') {
                    if (this.connectionOpacitySliderDragging) {
                        // During dragging, apply without starting/finishing steps
                        this.applyConnectionOpacityWithoutStep();
                    } else {
                        // Single click/change: use normal undo logic
                        this.applyConnectionOpacity();
                    }
                }
            });

            connectionOpacity.addEventListener('mouseup', () => {
                if (this.currentTool === 'select' && this.connectionOpacitySliderDragging) {
                    // Record final state and finish step
                    if (this.initialConnectionStatesForOpacity) {
                        this.initialConnectionStatesForOpacity.forEach(state => {
                            const conn = document.getElementById(state.id);
                            if (conn) {
                                const afterData = this.createObjectData(conn);
                                this.recordObjectModified(state.id, state.beforeData, afterData);
                            }
                        });
                        this.initialConnectionStatesForOpacity = null;
                    }
                    this.finishStep();
                    this.connectionOpacitySliderDragging = false;
                }
            });

            // Handle case where mouse is released outside the slider
            document.addEventListener('mouseup', () => {
                if (this.currentTool === 'select' && this.connectionOpacitySliderDragging) {
                    // Record final state and finish step
                    if (this.initialConnectionStatesForOpacity) {
                        this.initialConnectionStatesForOpacity.forEach(state => {
                            const conn = document.getElementById(state.id);
                            if (conn) {
                                const afterData = this.createObjectData(conn);
                                this.recordObjectModified(state.id, state.beforeData, afterData);
                            }
                        });
                        this.initialConnectionStatesForOpacity = null;
                    }
                    this.finishStep();
                    this.connectionOpacitySliderDragging = false;
                }
            });
        }
        
        // Linkage text opacity control
        const linkageTextOpacityControl = document.getElementById('linkageTextOpacity');
        const linkageTextOpacityControlValue = document.getElementById('linkageTextOpacityValue');
        
        if (linkageTextOpacityControl && linkageTextOpacityControlValue) {
            linkageTextOpacityControl.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                linkageTextOpacityControlValue.textContent = Math.round(value * 100) + '%';
                
                // Clear mixed state when user manually changes value
                e.target.classList.remove('mixed');
                if (linkageTextOpacityControlValue) linkageTextOpacityControlValue.classList.remove('mixed');
                
                // Apply to selected connections in select mode
                this.applyLinkageStyle();
            });
        }
        
        // Text style controls
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const fontFamily = document.getElementById('fontFamily');
        const textColor = document.getElementById('textColor');
        const textColorHex = document.getElementById('textColorHex');
        const textStyleButtons = document.querySelectorAll('.text-style-btn');
        
        // Font size control with slider optimization
        fontSize.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            fontSizeValue.textContent = value;
            
            if (this.currentTool === 'text') {
                // 文本工具模式：只更新配置，不应用到任何元素
                this.currentTextConfig.fontSize = value;
            } else if (this.currentTool === 'select') {
                // 选择模式：使用不记录undo的方法，避免拖拽时产生多个undo步骤
                this.applyTextStyleWithoutStep();
            }
        });
        
        // Handle undo/redo step recording for fontSize slider drag
        fontSize.addEventListener('mousedown', () => {
            if (this.currentTool === 'select') {
                // Start recording and capture initial state
                this.startStep('Change text style');
                this.textSliderDragging = true;
                
                // Record initial state of all selected text elements
                const selectedTextElements = [];
                if (this.selectedText) selectedTextElements.push(this.selectedText);
                if (this.selectedTexts.size > 0) {
                    this.selectedTexts.forEach(text => {
                        if (!selectedTextElements.includes(text)) {
                            selectedTextElements.push(text);
                        }
                    });
                }
                
                this.initialTextStates = selectedTextElements.map(text => ({
                    id: text.getAttribute('id'),
                    beforeData: this.createObjectData(text)
                }));
            }
        });
        
        fontSize.addEventListener('mouseup', () => {
            if (this.currentTool === 'select' && this.textSliderDragging) {
                // Record final state and finish step
                if (this.initialTextStates) {
                    this.initialTextStates.forEach(state => {
                        const text = document.getElementById(state.id);
                        if (text) {
                            const afterData = this.createObjectData(text);
                            this.recordObjectModified(state.id, state.beforeData, afterData);
                        }
                    });
                    this.initialTextStates = null;
                }
                this.finishStep();
                this.textSliderDragging = false;
            }
        });
        
        // Handle case where mouse is released outside slider
        document.addEventListener('mouseup', () => {
            if (this.currentTool === 'select' && this.textSliderDragging) {
                // Record final state and finish step
                if (this.initialTextStates) {
                    this.initialTextStates.forEach(state => {
                        const text = document.getElementById(state.id);
                        if (text) {
                            const afterData = this.createObjectData(text);
                            this.recordObjectModified(state.id, state.beforeData, afterData);
                        }
                    });
                    this.initialTextStates = null;
                }
                this.finishStep();
                this.textSliderDragging = false;
            }
        });
        
        // Font family control
        fontFamily.addEventListener('change', (e) => {
            const value = e.target.value;
            
            if (this.currentTool === 'text') {
                // 文本工具模式：只更新配置，不应用到任何元素
                this.currentTextConfig.fontFamily = value;
            } else if (this.currentTool === 'select') {
                // 选择模式：使用统一的样式应用方法，确保为一个undo步骤
                this.applyTextStyle();
            }
        });
        
        // Text color controls
        textColor.addEventListener('input', (e) => {
            const color = e.target.value;
            textColorHex.value = color;
            
            if (this.currentTool === 'text') {
                // 文本工具模式：只更新配置，不应用到任何元素
                this.currentTextConfig.color = color;
            } else if (this.currentTool === 'select') {
                // 选择模式：使用统一的样式应用方法，确保为一个undo步骤
                this.applyTextStyle();
            }
        });
        
        textColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                textColor.value = color;
                
                if (this.currentTool === 'text') {
                    // 文本工具模式：只更新配置，不应用到任何元素
                    this.currentTextConfig.color = color;
                } else if (this.currentTool === 'select') {
                    // 选择模式：使用统一的样式应用方法，确保为一个undo步骤
                    this.applyTextStyle();
                }
            }
        });
        
        // Text style buttons (bold, italic, underline)
        textStyleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // If in mixed state, set to active (like Word behavior)
                if (btn.classList.contains('mixed')) {
                    btn.classList.remove('mixed');
                    btn.classList.add('active');
                } else {
                    btn.classList.toggle('active');
                }
                
                const isActive = btn.classList.contains('active');
                
                if (this.currentTool === 'text') {
                    // 文本工具模式：只更新配置，不应用到任何元素
                    if (btn.id === 'boldBtn') {
                        this.currentTextConfig.bold = isActive;
                    } else if (btn.id === 'italicBtn') {
                        this.currentTextConfig.italic = isActive;
                    } else if (btn.id === 'underlineBtn') {
                        this.currentTextConfig.underline = isActive;
                    }
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applySpecificTextStyle(btn.id, isActive);
                }
            });
        });
        
        // Text opacity control
        const textOpacity = document.getElementById('textOpacity');
        const textOpacityValue = document.getElementById('textOpacityValue');
        
        if (textOpacity && textOpacityValue) {
            textOpacity.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                textOpacityValue.textContent = Math.round(value * 100) + '%';
                
                // Clear mixed state when user manually changes value
                e.target.classList.remove('mixed');
                if (textOpacityValue) textOpacityValue.classList.remove('mixed');
                
                if (this.currentTool === 'text') {
                    // 文本工具模式：只更新配置，不应用到任何元素
                    this.currentTextConfig.opacity = value;
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applyTextOpacity();
                }
            });
        }
        
        // Sugar border color controls
        const sugarBorderColor = document.getElementById('sugarBorderColor');
        const sugarBorderColorHex = document.getElementById('sugarBorderColorHex');
        
        sugarBorderColor.addEventListener('input', (e) => {
            const color = e.target.value;
            sugarBorderColorHex.value = color;
            // Clear mixed state when user manually changes value
            sugarBorderColor.classList.remove('mixed');
            sugarBorderColorHex.classList.remove('mixed');
            
            if (this.currentTool === 'add') {
                // 添加模式：只更新配置，不应用到任何元素
                this.currentSugarConfig.borderColor = color;
            } else if (this.currentTool === 'select') {
                // 选择模式：只应用到选中元素，不更新配置
                this.applySugarBorderColor(color);
            }
        });
        
        sugarBorderColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                sugarBorderColor.value = color;
                // Clear mixed state when user manually changes value
                sugarBorderColor.classList.remove('mixed');
                sugarBorderColorHex.classList.remove('mixed');
                
                if (this.currentTool === 'add') {
                    // 添加模式：只更新配置，不应用到任何元素
                    this.currentSugarConfig.borderColor = color;
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applySugarBorderColor(color);
                }
            }
        });
        
        // Connection color controls
        const connectionColor = document.getElementById('connectionColor');
        const connectionColorHex = document.getElementById('connectionColorHex');
        
        connectionColor.addEventListener('input', (e) => {
            const color = e.target.value;
            connectionColorHex.value = color;
            
            if (this.currentTool === 'add') {
                // 添加模式：只更新配置，不应用到任何元素
                this.currentLinkageConfig.strokeColor = color;
            } else if (this.currentTool === 'select') {
                // 选择模式：只应用到选中元素，不更新配置
                this.startStep('Change connection color');
                this.applyConnectionStyle();
                this.finishStep();
            }
        });
        
        connectionColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                connectionColor.value = color;
                
                if (this.currentTool === 'add') {
                    // 添加模式：只更新配置，不应用到任何元素
                    this.currentLinkageConfig.strokeColor = color;
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.startStep('Change connection color');
                    this.applyConnectionStyle();
                    this.finishStep();
                }
            }
        });
        
        // Linkage mode style controls
        const connectionStrokeWidth = document.getElementById('connectionStrokeWidth');
        const connectionStrokeWidthValue = document.getElementById('connectionStrokeWidthValue');
        const linkageConnectionColor = document.getElementById('connectionColor'); // Same as above, but for linkage mode
        const linkageTextSize = document.getElementById('linkageTextSize');
        const linkageTextSizeValue = document.getElementById('linkageTextSizeValue');
        
        if (connectionStrokeWidth && connectionStrokeWidthValue) {
            connectionStrokeWidth.addEventListener('input', (e) => {
                const value = e.target.value;
                connectionStrokeWidthValue.textContent = value;
                
                // Apply style to selected connections in select mode
                if (this.currentTool === 'select') {
                    if (this.connectionWidthSliderDragging) {
                        this.applyConnectionStyle();
                    } else {
                        this.startStep('Change connection stroke width');
                        this.applyConnectionStyle();
                        this.finishStep();
                    }
                } else {
                    this.applyConnectionStyle();
                }
            });
        }
        
        // --- Undo/Redo step recording for linkage text size slider drag ---
        this.linkageTextSizeSliderDragging = false;
        this.initialConnectionStatesForTextSize = null;
        if (linkageTextSize && linkageTextSizeValue) {
            linkageTextSize.addEventListener('mousedown', () => {
                if (this.currentTool === 'select') {
                    this.startStep('Change linkage text size');
                    this.linkageTextSizeSliderDragging = true;
                    // Record initial states
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                    this.initialConnectionStatesForTextSize = selectedConnections.map(conn => ({
                        id: conn.getAttribute('id'),
                        beforeData: this.createObjectData(conn)
                    }));
                }
            });
            linkageTextSize.addEventListener('input', (e) => {
                const value = e.target.value;
                linkageTextSizeValue.textContent = value;
                console.log('linkageTextSize input event fired, value:', value, 'isUpdatingUI:', this.isUpdatingUI);
                if (this.currentTool === 'select' && !this.isUpdatingUI) {
                    this.applyLinkageStyle();
                }
            });
            linkageTextSize.addEventListener('mouseup', () => {
                if (this.currentTool === 'select' && this.linkageTextSizeSliderDragging) {
                    if (this.initialConnectionStatesForTextSize) {
                        this.initialConnectionStatesForTextSize.forEach(state => {
                            const conn = document.getElementById(state.id);
                            if (conn) {
                                const afterData = this.createObjectData(conn);
                                this.recordObjectModified(state.id, state.beforeData, afterData);
                            }
                        });
                        this.initialConnectionStatesForTextSize = null;
                    }
                    this.finishStep();
                    this.linkageTextSizeSliderDragging = false;
                }
            });
        }
        
        // Linkage text color controls
        const linkageTextColor = document.getElementById('linkageTextColor');
        const linkageTextColorHex = document.getElementById('linkageTextColorHex');
        const linkageTextColorButtons = document.querySelectorAll('[data-target="linkageTextColor"]');
        
        // --- Undo/Redo step recording for linkage text color ---
        this.linkageTextColorDragging = false;
        this.initialConnectionStatesForTextColor = null;
        linkageTextColorButtons.forEach(btn => {
            btn.addEventListener('mousedown', () => {
                console.log('Button mousedown: currentTool =', this.currentTool);
                if (this.currentTool === 'select') {
                    this.startStep('Change linkage text color');
                    this.linkageTextColorDragging = true;
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                    console.log('Button mousedown: selectedConnections count =', selectedConnections.length);
                    this.initialConnectionStatesForTextColor = selectedConnections.map(conn => {
                        const beforeData = this.createObjectData(conn);
                        console.log('linkageTextColor before state - textColor:', beforeData.textColor);
                        return {
                            id: conn.id,
                            beforeData: beforeData
                        };
                    });
                    this.updateLegacySelectionStates();
                }
            });
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                console.log('linkageTextColor button clicked, color:', color, 'isUpdatingUI:', this.isUpdatingUI);
                if (linkageTextColor) {
                    linkageTextColor.value = color;
                    if (linkageTextColorHex) linkageTextColorHex.value = color;
                }
                linkageTextColorButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (this.currentTool === 'select' && !this.isUpdatingUI) {
                    // Apply style now (click happens after mousedown/mouseup) so the input value is updated
                    this.applyLinkageStyle();
                    // After applying style, record after snapshots for any initial states and finish the step
                    try {
                        if (this.initialConnectionStatesForTextColor) {
                            this.initialConnectionStatesForTextColor.forEach(state => {
                                // If already recorded by applyLinkageStyle immediate recording, skip
                                if (state._recorded) return;
                                const conn = document.getElementById(state.id);
                                if (conn) {
                                    const afterData = this.createObjectData(conn);
                                    console.log('linkageTextColor click handler after state - connection data-text-color attr:', conn.getAttribute('data-text-color'));
                                    console.log('linkageTextColor click handler after state - textColor:', afterData.textColor);
                                    this.recordObjectModified(state.id, state.beforeData, afterData);
                                }
                            });
                            this.initialConnectionStatesForTextColor = null;
                        }
                    } catch (e) {}
                    this.finishStep();
                }
            });
            btn.addEventListener('mouseup', () => {
                console.log('Button mouseup: linkageTextColorDragging =', this.linkageTextColorDragging, 'currentTool =', this.currentTool);
                if (this.currentTool === 'select' && this.linkageTextColorDragging) {
                    // Do not finish step here; click handler will apply style and finish the step.
                    this.linkageTextColorDragging = false;
                }
            });
        });
        
        if (linkageTextColor) {
            linkageTextColor.addEventListener('mousedown', () => {
                if (this.currentTool === 'select') {
                    this.startStep('Change linkage text color');
                    this.linkageTextColorDragging = true;
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                    this.initialConnectionStatesForTextColor = selectedConnections.map(conn => ({
                        id: conn.id,
                        beforeData: this.createObjectData(conn)
                    }));
                    this.updateLegacySelectionStates();
                }
            });
            linkageTextColor.addEventListener('input', (e) => {
                const color = e.target.value;
                if (linkageTextColorHex) linkageTextColorHex.value = color;
                linkageTextColorButtons.forEach(b => b.classList.remove('active'));
                if (this.currentTool === 'select' && !this.isUpdatingUI) {
                    this.applyLinkageStyle();
                }
            });
            linkageTextColor.addEventListener('mouseup', () => {
                if (this.currentTool === 'select' && this.linkageTextColorDragging) {
                    // Ensure the style is applied before recording the after state
                    this.applyLinkageStyle();
                    if (this.initialConnectionStatesForTextColor) {
                        this.initialConnectionStatesForTextColor.forEach(state => {
                            const conn = document.getElementById(state.id);
                            if (conn) {
                                const afterData = this.createObjectData(conn);
                                this.recordObjectModified(state.id, state.beforeData, afterData);
                            }
                        });
                        this.initialConnectionStatesForTextColor = null;
                    }
                    this.finishStep();
                    this.linkageTextColorDragging = false;
                }
            });
        }
        
        if (linkageTextColorHex) {
            linkageTextColorHex.addEventListener('mousedown', () => {
                if (this.currentTool === 'select') {
                    this.startStep('Change linkage text color');
                    this.linkageTextColorDragging = true;
                    const selectedConnections = Array.from(this.selectedConnections || []);
                    this.initialConnectionStatesForTextColor = selectedConnections.map(conn => ({
                        id: conn.id,
                        beforeData: this.createObjectData(conn)
                    }));
                }
            });
            linkageTextColorHex.addEventListener('input', (e) => {
                const color = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(color)) {
                    if (linkageTextColor) linkageTextColor.value = color;
                    linkageTextColorButtons.forEach(b => b.classList.remove('active'));
                    if (this.currentTool === 'select') {
                        this.applyLinkageStyle();
                    }
                }
            });
            linkageTextColorHex.addEventListener('mouseup', () => {
                if (this.currentTool === 'select' && this.linkageTextColorDragging) {
                    if (this.initialConnectionStatesForTextColor) {
                        this.initialConnectionStatesForTextColor.forEach(state => {
                            const conn = document.getElementById(state.id);
                            if (conn) {
                                const afterData = this.createObjectData(conn);
                                this.recordObjectModified(state.id, state.beforeData, afterData);
                            }
                        });
                        this.initialConnectionStatesForTextColor = null;
                    }
                    this.finishStep();
                    this.linkageTextColorDragging = false;
                }
            });
        }
        
        // --- Undo/Redo step recording for linkage text font family ---
        this.linkageTextFontFamilyDragging = false;
        this.initialConnectionStatesForTextFontFamily = null;
        const linkageTextFontFamily = document.getElementById('linkageTextFontFamily');
        if (linkageTextFontFamily) {
            linkageTextFontFamily.addEventListener('mousedown', () => {
                if (this.currentTool === 'select') {
                    this.startStep('Change linkage text font family');
                    this.linkageTextFontFamilyDragging = true;
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                    this.initialConnectionStatesForTextFontFamily = selectedConnections.map(conn => ({
                        id: conn.id,
                        beforeData: this.createObjectData(conn)
                    }));
                }
            });
            linkageTextFontFamily.addEventListener('change', (e) => {
                const fontFamily = e.target.value;
                if (this.currentTool === 'select' && !this.isUpdatingUI) {
                    // Apply the style (this will update DOM and may perform immediate recording)
                    this.applyLinkageStyle();

                    // If we started a step on mousedown, finalize it here because change means the user selected a font
                    if (this.initialConnectionStatesForTextFontFamily) {
                        this.initialConnectionStatesForTextFontFamily.forEach(state => {
                            // If applyLinkageStyle already recorded the after snapshot, skip recreating it
                            if (state._recorded) return;

                            const conn = document.getElementById(state.id);
                            if (conn) {
                                const afterData = this.createObjectData(conn);
                                // Force authoritative font family value into snapshot
                                try { afterData.textFontFamily = fontFamily; } catch (e) {}
                                this.recordObjectModified(state.id, state.beforeData, afterData);
                            }
                        });
                        this.initialConnectionStatesForTextFontFamily = null;
                    }

                    this.finishStep();
                }
            });
            // On mouseup we don't finalize the step for dropdowns (user might still be choosing an option).
            // Just clear the temporary dragging flag; finalization happens on 'change' or 'blur'.
            linkageTextFontFamily.addEventListener('mouseup', () => {
                if (this.currentTool === 'select' && this.linkageTextFontFamilyDragging) {
                    // don't finish here to avoid race with change event
                    // keep initialConnectionStatesForTextFontFamily so change can finalize
                    this.linkageTextFontFamilyDragging = true; // keep true until change/blur
                }
            });

            // If the select loses focus without a change, finalize (will be discarded if no modifications)
            linkageTextFontFamily.addEventListener('blur', () => {
                if (this.currentTool === 'select' && this.linkageTextFontFamilyDragging) {
                    // If change already recorded, initialConnectionStatesForTextFontFamily would be null
                    this.initialConnectionStatesForTextFontFamily = null;
                    this.finishStep();
                    this.linkageTextFontFamilyDragging = false;
                }
            });
        }
        
        // --- Undo/Redo step recording for linkage text style buttons ---
        this.linkageTextStyleDragging = false;
        this.initialConnectionStatesForTextStyle = null;
        const linkageTextStyleButtons = document.querySelectorAll('.linkage-text-style-btn');
        linkageTextStyleButtons.forEach(btn => {
            btn.addEventListener('mousedown', () => {
                if (this.currentTool === 'select') {
                    // If another linkage text UI drag (color/size/font family/opacity) is active,
                    // the UI handler is already recording a step. Avoid starting a duplicate
                    // "Change linkage text style" step here. Still mark dragging so mouseup
                    // handlers work, but don't capture before snapshots.
                    if (this.linkageTextColorDragging || this.linkageTextSizeSliderDragging || this.linkageTextFontFamilyDragging || this.linkageTextOpacitySliderDragging) {
                        this.linkageTextStyleDragging = true;
                        this.initialConnectionStatesForTextStyle = null;
                        return;
                    }

                    this.startStep('Change linkage text style');
                    this.linkageTextStyleDragging = true;
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');

                    // Ensure linkage text elements exist before recording
                    selectedConnections.forEach(conn => {
                        this.updateLinkageText(conn);
                    });

                    this.initialConnectionStatesForTextStyle = selectedConnections.map(conn => {
                        const connectionId = conn.getAttribute('id');
                        const configText = this.canvas.querySelector(`#${connectionId}-config-text`);
                        const positionText = this.canvas.querySelector(`#${connectionId}-position-text`);
                        
                        return {
                            id: conn.id,
                            beforeData: this.createObjectData(conn),
                            configTextId: configText ? configText.getAttribute('id') : null,
                            configTextBeforeData: configText ? this.createObjectData(configText) : null,
                            positionTextId: positionText ? positionText.getAttribute('id') : null,
                            positionTextBeforeData: positionText ? this.createObjectData(positionText) : null
                        };
                    });
                }
            });
            btn.addEventListener('click', (e) => {
                const style = e.target.closest('.linkage-text-style-btn').dataset.style;
                e.target.closest('.linkage-text-style-btn').classList.toggle('active');
                if (this.currentTool === 'select' && !this.isUpdatingUI) {
                    this.applyLinkageStyle();
                }
            });
            btn.addEventListener('mouseup', () => {
                if (this.currentTool === 'select' && this.linkageTextStyleDragging) {
                    // Delay finalization to allow click handler (which fires after mouseup) to run first.
                    // This ensures applyLinkageStyle can perform immediate recording and set state._recorded.
                    setTimeout(() => {
                        if (this.initialConnectionStatesForTextStyle) {
                            this.initialConnectionStatesForTextStyle.forEach(state => {
                                // If applyLinkageStyle already recorded an after snapshot for this state, skip recreating it
                                if (state._recorded) {
                                    // Still ensure we record associated text elements if they weren't recorded
                                    if (state.configTextId && !state._configRecorded) {
                                        const configText = document.getElementById(state.configTextId);
                                        if (configText && state.configTextBeforeData) {
                                            const configAfterData = this.createObjectData(configText);
                                            this.recordObjectModified(state.configTextId, state.configTextBeforeData, configAfterData);
                                        }
                                        state._configRecorded = true;
                                    }
                                    if (state.positionTextId && !state._positionRecorded) {
                                        const positionText = document.getElementById(state.positionTextId);
                                        if (positionText && state.positionTextBeforeData) {
                                            const positionAfterData = this.createObjectData(positionText);
                                            this.recordObjectModified(state.positionTextId, state.positionTextBeforeData, positionAfterData);
                                        }
                                        state._positionRecorded = true;
                                    }
                                    return;
                                }

                                const conn = document.getElementById(state.id);
                                if (conn) {
                                    const afterData = this.createObjectData(conn);
                                    // Ensure style flags are authoritative from UI if available
                                    try {
                                        const ital = document.getElementById('linkageTextItalicBtn')?.classList.contains('active');
                                        const bold = document.getElementById('linkageTextBoldBtn')?.classList.contains('active');
                                        const underline = document.getElementById('linkageTextUnderlineBtn')?.classList.contains('active');
                                        afterData.textItalic = (ital ? 'true' : 'false');
                                        afterData.textBold = (bold ? 'true' : 'false');
                                        afterData.textUnderline = (underline ? 'true' : 'false');
                                    } catch (e) {}
                                    this.recordObjectModified(state.id, state.beforeData, afterData);
                                }

                                // Also record text elements
                                if (state.configTextId) {
                                    const configText = document.getElementById(state.configTextId);
                                    if (configText && state.configTextBeforeData) {
                                        const configAfterData = this.createObjectData(configText);
                                        this.recordObjectModified(state.configTextId, state.configTextBeforeData, configAfterData);
                                    }
                                }

                                if (state.positionTextId) {
                                    const positionText = document.getElementById(state.positionTextId);
                                    if (positionText && state.positionTextBeforeData) {
                                        const positionAfterData = this.createObjectData(positionText);
                                        this.recordObjectModified(state.positionTextId, state.positionTextBeforeData, positionAfterData);
                                    }
                                }
                            });
                            this.initialConnectionStatesForTextStyle = null;
                        }
                        this.finishStep();
                        this.linkageTextStyleDragging = false;
                    }, 0);
                }
            });
        });
        
        // --- Undo/Redo step recording for linkage text opacity slider drag ---
        this.linkageTextOpacitySliderDragging = false;
        this.initialConnectionStatesForTextOpacity = null;
        const linkageTextOpacity = document.getElementById('linkageTextOpacity');
        const linkageTextOpacityValue = document.getElementById('linkageTextOpacityValue');
        if (linkageTextOpacity && linkageTextOpacityValue) {
            linkageTextOpacity.addEventListener('mousedown', () => {
                if (this.currentTool === 'select') {
                    this.startStep('Change linkage text opacity');
                    this.linkageTextOpacitySliderDragging = true;
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                    this.initialConnectionStatesForTextOpacity = selectedConnections.map(conn => ({
                        id: conn.id,
                        beforeData: this.createObjectData(conn)
                    }));
                }
            });
            linkageTextOpacity.addEventListener('input', (e) => {
                const value = e.target.value;
                linkageTextOpacityValue.textContent = Math.round(value * 100) + '%';
                if (this.currentTool === 'select' && !this.isUpdatingUI) {
                    this.applyLinkageStyle();
                }
            });
            linkageTextOpacity.addEventListener('mouseup', () => {
                if (this.currentTool === 'select' && this.linkageTextOpacitySliderDragging) {
                    if (this.initialConnectionStatesForTextOpacity) {
                        this.initialConnectionStatesForTextOpacity.forEach(state => {
                            const conn = document.getElementById(state.id);
                            if (conn) {
                                const afterData = this.createObjectData(conn);
                                this.recordObjectModified(state.id, state.beforeData, afterData);
                            }
                        });
                        this.initialConnectionStatesForTextOpacity = null;
                    }
                    this.finishStep();
                    this.linkageTextOpacitySliderDragging = false;
                }
            });
        }
        
        // Linkage input field
        const linkageInput = document.getElementById('linkageInput');
        if (linkageInput) {
            // Handle Enter key to confirm linkage
            linkageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const linkage = linkageInput.value.trim();
                    this.applyLinkageToConnections(linkage);
                    linkageInput.blur(); // Remove focus after applying
                }
            });
            
            // Handle blur (clicking outside) to confirm linkage
            linkageInput.addEventListener('blur', (e) => {
                const linkage = linkageInput.value.trim();
                const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                if (linkage !== '' && selectedConnections.length > 0) {
                    this.applyLinkageToConnections(linkage);
                }
            });
        }
        
        // Reverse linkage button for selection mode
        const reverseLinkage = document.getElementById('reverseLinkage');
        if (reverseLinkage) {
            reverseLinkage.addEventListener('click', () => {
                this.reverseLinkageDirection();
            });
        }
        
        // Linkage quick buttons
        const linkageButtons = document.querySelectorAll('.linkage-btn');
        const linkageInputAdd = document.getElementById('linkageInputAdd');
        linkageButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const linkage = btn.dataset.linkage;
                if (linkageInput) {
                    linkageInput.value = linkage;
                }
                if (linkageInputAdd) {
                    linkageInputAdd.value = linkage;
                }
                
                // Apply linkage based on current mode
                if (this.currentTool === 'select') {
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                    if (selectedConnections.length > 0) {
                        // Select mode with selected connections - apply immediately
                        this.applyLinkageToConnections(linkage);
                    }
                } else if (this.currentTool === 'add') {
                    // Add mode - store for next connection
                    this.currentLinkageConfig.linkage = linkage;
                }
            });
        });
        
        // Show all linkage text checkbox (global visibility control)
        const showAllLinkageText = document.getElementById('showAllLinkageText');
        if (showAllLinkageText) {
            showAllLinkageText.addEventListener('change', (e) => {
                this.refreshAllLinkageTexts();
            });
        }
        
        // Show linkage text checkbox (for selected connections in select mode)
        const showLinkageText = document.getElementById('showLinkageText');
        if (showLinkageText) {
            showLinkageText.addEventListener('change', (e) => {
                if (this.currentTool === 'select') {
                    // Apply to selected connections only
                    this.applyLinkageVisibility();
                }
            });
        }
        
        // ===== Add Mode Linkage Controls =====
        
        // Linkage input for add mode (already declared above with linkage buttons)
        if (linkageInputAdd) {
            linkageInputAdd.addEventListener('input', (e) => {
                this.currentLinkageConfig.linkage = e.target.value.trim() || null;
            });
        }

            // Linkage text font family for add mode
        const linkageTextFontFamilyAdd = document.getElementById('linkageTextFontFamilyAdd');
        if (linkageTextFontFamilyAdd) {
            linkageTextFontFamilyAdd.addEventListener('change', (e) => {
                this.currentLinkageConfig.textFontFamily = e.target.value;
            });
            // Initialize config on load
            this.currentLinkageConfig.textFontFamily = linkageTextFontFamilyAdd.value;
        }

            // Linkage text style buttons (bold, italic, underline) for add mode
            const linkageTextStyleButtonsAdd = document.querySelectorAll('.linkage-text-style-btn-add');
            linkageTextStyleButtonsAdd.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const style = btn.dataset.style;
                    btn.classList.toggle('active');
                    // Update config
                    if (!this.currentLinkageConfig.textStyle) this.currentLinkageConfig.textStyle = {};
                    this.currentLinkageConfig.textStyle[style] = btn.classList.contains('active');
                });
            });

            // Linkage text opacity for add mode
        const linkageTextOpacityAdd = document.getElementById('linkageTextOpacityAdd');
        const linkageTextOpacityAddValue = document.getElementById('linkageTextOpacityAddValue');
        if (linkageTextOpacityAdd && linkageTextOpacityAddValue) {
            linkageTextOpacityAdd.addEventListener('input', (e) => {
                const value = e.target.value;
                this.currentLinkageConfig.textOpacity = parseFloat(value);
                linkageTextOpacityAddValue.textContent = Math.round(value * 100) + '%';
            });
            // Initialize config on load
            this.currentLinkageConfig.textOpacity = parseFloat(linkageTextOpacityAdd.value);
        }
        
        // Reverse linkage button for add mode
        const reverseLinkageAdd = document.getElementById('reverseLinkageAdd');
        if (reverseLinkageAdd) {
            reverseLinkageAdd.addEventListener('click', () => {
                this.currentLinkageConfig.reversed = !this.currentLinkageConfig.reversed;
                // Update button appearance to show active state
                if (this.currentLinkageConfig.reversed) {
                    reverseLinkageAdd.classList.add('active');
                    reverseLinkageAdd.style.backgroundColor = '#e3f2fd';
                    reverseLinkageAdd.style.color = '#0072BC';
                } else {
                    reverseLinkageAdd.classList.remove('active');
                    reverseLinkageAdd.style.backgroundColor = '';
                    reverseLinkageAdd.style.color = '';
                }
            });
        }
        
        // Connection width for add mode
        const connectionWidthAdd = document.getElementById('connectionWidthAdd');
        const connectionWidthAddValue = document.getElementById('connectionWidthAddValue');
        if (connectionWidthAdd && connectionWidthAddValue) {
            connectionWidthAdd.addEventListener('input', (e) => {
                const value = e.target.value;
                this.currentLinkageConfig.strokeWidth = parseFloat(value);
                connectionWidthAddValue.textContent = value;
            });
        }
        
        // Connection style buttons for add mode
        const connectionStyleButtonsAdd = document.querySelectorAll('.connection-style-buttons .connection-style-btn');
        connectionStyleButtonsAdd.forEach(btn => {
            btn.addEventListener('click', (e) => {
                connectionStyleButtonsAdd.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentLinkageConfig.strokeStyle = e.target.dataset.style;
            });
        });
        
        // Connection opacity for add mode
        const connectionOpacityAdd = document.getElementById('connectionOpacityAdd');
        const connectionOpacityAddValue = document.getElementById('connectionOpacityAddValue');
        if (connectionOpacityAdd && connectionOpacityAddValue) {
            connectionOpacityAdd.addEventListener('input', (e) => {
                const value = e.target.value;
                this.currentLinkageConfig.strokeOpacity = parseFloat(value);
                connectionOpacityAddValue.textContent = (value * 100) + '%';
            });
        }
        
        // Connection color for add mode
        const connectionColorAdd = document.getElementById('connectionColorAdd');
        const connectionColorAddHex = document.getElementById('connectionColorAddHex');
        const connectionColorAddButtons = document.querySelectorAll('[data-target="connectionColorAdd"]');
        
        if (connectionColorAdd) {
            connectionColorAdd.addEventListener('input', (e) => {
                const color = this.normalizeColorToHex(e.target.value);
                this.currentLinkageConfig.strokeColor = color;
                if (connectionColorAddHex) connectionColorAddHex.value = color;
                // Update active state
                connectionColorAddButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.color === color);
                });
            });
        }
        
        if (connectionColorAddHex) {
            connectionColorAddHex.addEventListener('input', (e) => {
                let color = e.target.value.trim();
                if (!color.startsWith('#')) color = '#' + color;
                if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                    this.currentLinkageConfig.strokeColor = color;
                    if (connectionColorAdd) connectionColorAdd.value = color;
                    // Update active state
                    connectionColorAddButtons.forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.color === color);
                    });
                }
            });
        }
        
        connectionColorAddButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.currentLinkageConfig.strokeColor = color;
                if (connectionColorAdd) connectionColorAdd.value = color;
                if (connectionColorAddHex) connectionColorAddHex.value = color;
                // Update active state
                connectionColorAddButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Linkage text size for add mode
        const linkageTextSizeAdd = document.getElementById('linkageTextSizeAdd');
        const linkageTextSizeAddValue = document.getElementById('linkageTextSizeAddValue');
        if (linkageTextSizeAdd && linkageTextSizeAddValue) {
            linkageTextSizeAdd.addEventListener('input', (e) => {
                const value = e.target.value;
                this.currentLinkageConfig.textSize = parseInt(value);
                linkageTextSizeAddValue.textContent = value;
            });
        }
        
        // Linkage text color for add mode
        const linkageTextColorAdd = document.getElementById('linkageTextColorAdd');
        const linkageTextColorAddHex = document.getElementById('linkageTextColorAddHex');
        const linkageTextColorAddButtons = document.querySelectorAll('[data-target="linkageTextColorAdd"]');
        
        if (linkageTextColorAdd) {
            linkageTextColorAdd.addEventListener('input', (e) => {
                const color = this.normalizeColorToHex(e.target.value);
                this.currentLinkageConfig.textColor = color;
                if (linkageTextColorAddHex) linkageTextColorAddHex.value = color;
                // Update active state
                linkageTextColorAddButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.color === color);
                });
            });
        }
        
        if (linkageTextColorAddHex) {
            linkageTextColorAddHex.addEventListener('input', (e) => {
                let color = e.target.value.trim();
                if (!color.startsWith('#')) color = '#' + color;
                if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                    this.currentLinkageConfig.textColor = color;
                    if (linkageTextColorAdd) linkageTextColorAdd.value = color;
                    // Update active state
                    linkageTextColorAddButtons.forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.color === color);
                    });
                }
            });
        }
        
        linkageTextColorAddButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.currentLinkageConfig.textColor = color;
                if (linkageTextColorAdd) linkageTextColorAdd.value = color;
                if (linkageTextColorAddHex) linkageTextColorAddHex.value = color;
                // Update active state
                linkageTextColorAddButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Show linkage text checkbox for add mode
        const showLinkageTextAdd = document.getElementById('showLinkageTextAdd');
        if (showLinkageTextAdd) {
            showLinkageTextAdd.addEventListener('change', (e) => {
                this.currentLinkageConfig.showText = e.target.checked;
            });
        }
        
        // ===== End Add Mode Linkage Controls =====
        
        // Color buttons for linkage mode
        const linkageColorButtons = document.querySelectorAll('[data-target="connectionColor"]');
        linkageColorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (linkageConnectionColor) {
                    linkageConnectionColor.value = color;
                    const connectionColorHex = document.getElementById('connectionColorHex');
                    if (connectionColorHex) connectionColorHex.value = color;
                }
                // Update active state
                linkageColorButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                if (this.currentTool === 'select') {
                    this.applyLinkageStyle();
                }
            });
        });
        
        // New Shape Selector System
        this.initializeShapeSelector();
        
        // Legacy shape selection buttons (for backward compatibility)
        const shapeButtons = document.querySelectorAll('.shape-btn');
        shapeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Skip disabled buttons
                if (btn.classList.contains('disabled') || !btn.dataset.shape) {
                    return;
                }
                
                // Only activate one shape at a time
                shapeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Clear SNFG preset selection (manual override)
                this.clearPresetSelection();
                
                // Update configuration for add mode or apply to selected sugars
                if (this.currentTool === 'add') {
                    if (!this.currentSugarConfig) {
                        this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
                    }
                    this.currentSugarConfig.shape = btn.dataset.shape;
                    this.currentSugarConfig.type = 'custom';
                    this.currentSugarConfig.preset = null;
                } else if (this.currentTool === 'select') {
                    this.applySugarShape(btn.dataset.shape);
                }
            });
        });
        
        // Color selection buttons
        const colorButtons = document.querySelectorAll('.color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Use the selectColor function to handle all color updates consistently
                this.selectColor(btn.dataset.color);
            });
        });
        
        // Custom color picker
        const customColorPicker = document.getElementById('customColor');
        if (customColorPicker) {
            customColorPicker.addEventListener('input', (e) => {
                // Deactivate preset color buttons
                colorButtons.forEach(b => b.classList.remove('active'));
                
                // Clear SNFG preset selection (manual override)
                this.clearPresetSelection();
                
                // Update configuration for add mode or apply to selected sugars
                if (this.currentTool === 'add') {
                    if (!this.currentSugarConfig) {
                        this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
                    }
                    this.currentSugarConfig.color = e.target.value;
                    this.currentSugarConfig.type = 'custom';
                    this.currentSugarConfig.preset = null;
                } else if (this.currentTool === 'select') {
                    this.applySugarColor(e.target.value);
                }
            });
        }
        
        // Compact color buttons for borders, connections, text
        const compactColorButtons = document.querySelectorAll('.color-btn-compact');
        compactColorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                const color = btn.dataset.color;
                
                // Remove active class from siblings in the same group
                const parentGrid = btn.parentElement;
                parentGrid.querySelectorAll('.color-btn-compact').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update the corresponding color picker and hex input
                const colorPicker = document.getElementById(target);
                const colorHex = document.getElementById(target + 'Hex');
                
                if (colorPicker) {
                    colorPicker.value = color;
                    // Clear mixed state
                    colorPicker.classList.remove('mixed');
                    
                    // Trigger change event to update the application
                    colorPicker.dispatchEvent(new Event('input'));
                }
                
                if (colorHex) {
                    colorHex.value = color;
                    colorHex.classList.remove('mixed');
                }
            });
        });
    }
    
    setTool(tool) {
        // Don't switch tools if currently editing text (let the edit finish first)
        if (this.isEditingText && this.currentTool !== tool) {
            return;
        }
        
        // Store previous tool before changing
        const previousTool = this.currentTool;
        this.currentTool = tool;
        
        // Clear selections when switching to non-selection modes
        if (tool === 'add' || tool === 'delete' || tool === 'text') {
            this.deselectAll();
            if (this.selectedConnections) {
                this.clearConnectionSelections();
            }
        }
        
        // If switching away from text tool and currently editing, close any open text inputs
        if (tool !== 'text' && this.isEditingText) {
            const textInputs = document.querySelectorAll('.text-input-box');
            textInputs.forEach(input => input.remove());
            this.isEditingText = false;
        }
        
        // If switching away from delete tool, stop erasing
        if (tool !== 'delete' && this.isErasing) {
            this.stopErasing();
        }
        
        // Update button states
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Update canvas cursor
        this.updateCanvasCursor();
        
        // Hide add preview dot when switching tools
        if (this.addPreviewDot) {
            this.addPreviewDot.style.display = 'none';
        }
        
        // Update style panels visibility
        this.updateStylePanel();
        
        // Update left panel visibility (kept for compatibility)
        this.updateLeftPanel();
        
        // Update right panel content based on tool and selections
        this.updateRightPanel();
    }
    
    selectPreset(preset) {
        if (this.snfgPresets[preset]) {
            // Initialize config if it doesn't exist
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            
            // Only update type, preset, shape, and color - keep other settings
            this.currentSugarConfig.type = 'preset';
            this.currentSugarConfig.preset = preset;
            this.currentSugarConfig.shape = this.snfgPresets[preset].shape;
            this.currentSugarConfig.color = this.snfgPresets[preset].color;
            
            // Set size based on shape
            const shape = this.snfgPresets[preset].shape;
            if (shape.includes('square')) {
                this.currentSugarConfig.size = 18;
            } else if (shape.includes('diamond')) {
                this.currentSugarConfig.size = 22;
            } else {
                this.currentSugarConfig.size = 20;
            }
            
            // Update preset button states
            document.querySelectorAll('.preset-item').forEach(item => {
                item.classList.toggle('active', item.dataset.preset === preset);
            });
            
            // Sync with custom controls - highlight corresponding shape and color
            this.syncCustomControlsWithPreset(preset);
            
            // If in select mode, only apply shape and color from preset (not size/border)
            if (this.currentTool === 'select') {
                // Use the same selection logic as applySugarShape and applySugarColor functions
                const sugarsToChange = [];
                if (this.selectedSugar) {
                    sugarsToChange.push(this.selectedSugar);
                }
                if (this.selectedSugars.size > 0) {
                    sugarsToChange.push(...Array.from(this.selectedSugars));
                }
                
                if (sugarsToChange.length > 0) {
                    this.applySugarPreset(this.snfgPresets[preset].shape, this.snfgPresets[preset].color);
                }
            } else {
                // In add mode, apply full preset configuration
                this.setTool('add');
            }
        }
    }
    
    syncCustomControlsWithPreset(preset) {
        const presetConfig = this.snfgPresets[preset];
        if (!presetConfig) return;
        
        // Clear all shape button states first
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.shape-dropdown-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.shape-category').forEach(cat => {
            cat.classList.remove('active');
        });
        
        // Highlight the corresponding shape button (main buttons and dropdown items)
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            if (btn.dataset.shape === presetConfig.shape) {
                btn.classList.add('active');
            }
        });
        document.querySelectorAll('.shape-dropdown-item').forEach(item => {
            const isActive = item.dataset.shape === presetConfig.shape;
            if (isActive) {
                item.classList.add('active');
                // Also activate the parent category if this item matches
                const category = item.closest('.shape-category');
                if (category) {
                    category.classList.add('active');
                    const mainBtn = category.querySelector('.shape-main-btn');
                    if (mainBtn) mainBtn.classList.add('active');
                }
            }
        });
        
        // Highlight the corresponding color button (keep preset and custom selections together)
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === presetConfig.color);
        });
        
        // Update custom color picker to match preset color
        const customColorPicker = document.getElementById('customColor');
        if (customColorPicker) {
            customColorPicker.value = presetConfig.color;
        }
    }
    
    clearPresetSelection() {
        // Clear all preset selections
        document.querySelectorAll('.preset-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Update current config to remove preset
        if (this.currentSugarConfig) {
            this.currentSugarConfig.type = 'custom';
            this.currentSugarConfig.preset = null;
        }
    }

    selectShape(shape) {
        // This method is kept for compatibility but shape selection is now handled in setupStyleControls
        console.warn('selectShape called - this should now be handled by button event listeners');
    }
    
    selectColor(color) {
        const normalizedColor = this.normalizeColorToHex(color);
        
        // Update color grid buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.color === normalizedColor) {
                btn.classList.add('active');
            }
        });
        
        // Update custom color controls
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        if (customSugarColor && customSugarColorHex) {
            customSugarColor.value = normalizedColor;
            customSugarColorHex.value = normalizedColor;
        }
        
        // Clear SNFG preset selection when manually selecting color
        this.clearPresetSelection();
        
        if (this.currentTool === 'add') {
            // 添加模式：更新配置
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.color = normalizedColor;
            this.currentSugarConfig.type = 'custom';
            this.currentSugarConfig.preset = null;
        } else if (this.currentTool === 'select') {
            // 选择模式：应用到选中的糖分子
            this.applySugarColor(normalizedColor);
        }
    }
    
    isValidHexColor(color) {
        return /^#?[0-9A-F]{6}$/i.test(color);
    }
    
    // Convert any color format to hex format for consistency
    normalizeColorToHex(color) {
        if (!color) return '#000000';
        
        // If already hex format, return as is
        if (this.isValidHexColor(color)) {
            return color.startsWith('#') ? color : '#' + color;
        }
        
        // Handle rgb(r, g, b) format
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        // Handle rgba(r, g, b, a) format (ignore alpha)
        const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
        if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1]);
            const g = parseInt(rgbaMatch[2]);
            const b = parseInt(rgbaMatch[3]);
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        // Handle cmyk(c%, m%, y%, k%) format
        const cmykMatch = color.match(/cmyk\((\d+)%?,\s*(\d+)%?,\s*(\d+)%?,\s*(\d+)%?\)/);
        if (cmykMatch) {
            const c = parseFloat(cmykMatch[1]) / 100;
            const m = parseFloat(cmykMatch[2]) / 100;
            const y = parseFloat(cmykMatch[3]) / 100;
            const k = parseFloat(cmykMatch[4]) / 100;
            
            // Convert CMYK to RGB
            const r = Math.round(255 * (1 - c) * (1 - k));
            const g = Math.round(255 * (1 - m) * (1 - k));
            const b = Math.round(255 * (1 - y) * (1 - k));
            
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        // Handle named colors by creating a temporary element
        const tempDiv = document.createElement('div');
        tempDiv.style.color = color;
        document.body.appendChild(tempDiv);
        const computedColor = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);
        
        // If computed color is rgb format, convert it
        const computedRgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (computedRgbMatch) {
            const r = parseInt(computedRgbMatch[1]);
            const g = parseInt(computedRgbMatch[2]);
            const b = parseInt(computedRgbMatch[3]);
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        // Fallback to black if conversion fails
        return '#000000';
    }
    
    // Convert hex color to CMYK format
    hexToCMYK(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        // Convert RGB to CMYK
        const k = 1 - Math.max(r, g, b);
        const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
        const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
        const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
        
        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }
    
    // Convert hex color to HSL format
    hexToHSL(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }
    
    updateCanvasCursor() {
        // Remove all cursor-related classes
        this.canvas.classList.remove('select-mode', 'delete-mode', 'text-mode', 'add-mode', 'add-on-sugar');
        if (this.currentTool === 'select') {
            this.canvas.classList.add('select-mode');
        } else if (this.currentTool === 'delete') {
            this.canvas.classList.add('delete-mode');
        } else if (this.currentTool === 'text') {
            this.canvas.classList.add('text-mode');
        } else if (this.currentTool === 'add') {
            this.canvas.classList.add('add-mode');
        }
    }
    
    updateAddModeCursor(x, y) {
        const clickedElement = this.getElementAtPoint(x, y);
        
        // Remove previous add cursor classes
        this.canvas.classList.remove('add-on-sugar');
        
        // Hide preview dot by default
        if (this.addPreviewDot) {
            this.addPreviewDot.style.display = 'none';
        }
        
        if (clickedElement && clickedElement.classList.contains('sugar')) {
            // Mouse is over a sugar - show crosshair for directional addition
            this.canvas.classList.add('add-on-sugar');
            
            // Show preview dot at the position where new sugar would be added
            if (this.addPreviewDot) {
                const sugarX = parseFloat(clickedElement.getAttribute('data-x'));
                const sugarY = parseFloat(clickedElement.getAttribute('data-y'));
                const bestDir = this.findBestDirection(sugarX, sugarY, x, y);
                const previewX = sugarX + bestDir.dx * this.connectionDistance;
                const previewY = sugarY + bestDir.dy * this.connectionDistance;
                
                this.addPreviewDot.setAttribute('cx', previewX);
                this.addPreviewDot.setAttribute('cy', previewY);
                this.addPreviewDot.style.display = 'block';
            }
        }
        // When not over sugar, default add-mode class shows hand pointer
    }
    
    // Helper method to get SVG coordinates
    getSVGCoordinates(e) {
        // Use SVG's native transformation which should handle all transforms
        const pt = this.canvas.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;

        // getScreenCTM() accounts for all transformations including CSS transforms
        const svgPt = pt.matrixTransform(this.canvas.getScreenCTM().inverse());



        return {
            x: svgPt.x,
            y: svgPt.y
        };
    }
    
    handleMouseDown(e) {
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
    // Store modifier keys state for dragging (primary modifier: Ctrl or Command)
    this.dragWithCtrl = e.ctrlKey || e.metaKey;
        this.dragWithShift = e.shiftKey;
        
        // Find clicked element using unified system
        const clickedElement = this.getElementAtPoint(x, y);
        
        if (this.currentTool === 'select') {
            if (clickedElement) {
                // Reset paste counter when user starts selecting
                this.resetPasteCounter();
                
                // Get SVG-relative coordinates
                const svgX = x;
                const svgY = y;
                
                // Handle Shift+click for multi-selection
                if (e.shiftKey) {
                    this.toggleElementSelection(clickedElement, true);
                    this.updateStylePanel();
                    e.preventDefault();
                    return; // Don't start dragging on shift-click
                }
                
                // Check if element is already selected
                if (this.selectedElements.has(clickedElement)) {
                    // Start dragging all selected elements
                    this.startDragging(x, y, true);
                } else {
                    // Select this element (clear others first)
                    this.selectElement(clickedElement, false);
                    
                    // Check for double-click on text
                    if (this.getElementType(clickedElement) === 'text') {
                        const currentTime = Date.now();
                        if (currentTime - this.lastClickTime < this.doubleClickDelay) {
                            // Double-click detected - enter edit mode
                            this.startTextEditing(clickedElement);
                            e.preventDefault();
                            return;
                        }
                        this.lastClickTime = currentTime;
                    }
                    
                    // Start dragging this element
                    this.startDragging(x, y, false);
                }
                
                this.updateStylePanel();
                e.preventDefault();
            } else {
                // Check if user clicked on a connection
                const clickedConnection = this.getConnectionAtPoint(x, y);
                if (clickedConnection) {
                    this.resetPasteCounter();
                    // Handle Shift+click for multi-selection of connections
                    if (e.shiftKey) {
                        this.toggleConnectionSelection(clickedConnection, true);
                    } else {
                        // Normal click - select only this connection
                        this.selectConnection(clickedConnection, false);
                    }
                    e.preventDefault();
                } else {
                    // Clicked on empty space
                    this.resetPasteCounter();
                    
                    // If currently editing text, finish the edit first
                    if (this.isEditingText) {
                        this.finishTextEditing();
                    }
                    
                    this.clearAllSelections();
                    this.startBoxSelection(x, y);
                    e.preventDefault();
                }
            }
        } else if (this.currentTool === 'add') {
            this.resetPasteCounter();
            if (clickedElement) {
                // Start long press detection for connection dragging
                this.startLongPress(clickedElement, e);
                e.preventDefault();
            }
        } else if (this.currentTool === 'delete') {
            this.resetPasteCounter();
            // Start erasing on mouse down
            this.startErasing(x, y);
            e.preventDefault();
        }
    }
    
    handleMouseMove(e) {
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        // Handle dynamic cursor in add mode
        if (this.currentTool === 'add' && !this.isDragging) {
            this.updateAddModeCursor(x, y);
        }
        
        // Handle hover preview in select mode (when not dragging)
        if (this.currentTool === 'select' && !this.isDragging && !this.isBoxSelecting) {
            const hoveredElement = this.getElementAtPoint(x, y);
            
            if (hoveredElement !== this.hoveredElement) {
                // Clear previous hover
                this.hideHoverPreview();
                
                // Show new hover if element is not selected
                if (hoveredElement && !this.selectedElements.has(hoveredElement)) {
                    this.showHoverPreview(hoveredElement);
                }
            }
        }

        // Handle box selection
        if (this.isBoxSelecting && this.currentTool === 'select') {
            this.updateBoxSelection(x, y);
            e.preventDefault();
        }
        
        // Handle select mode dragging
        if (this.isDragging && this.currentTool === 'select') {
            if (this.isDraggingMultiple && this.selectedElements.size > 0) {
                // Calculate movement delta from initial drag position
                let deltaX = x - this.dragStartX;  
                let deltaY = y - this.dragStartY;
                
                if (this.debugCoordinates) {
                    console.log('Drag delta:', {
                        currentX: x,
                        currentY: y,
                        dragStartX: this.dragStartX,
                        dragStartY: this.dragStartY,
                        deltaX: deltaX,
                        deltaY: deltaY,
                        zoomLevel: this.zoomLevel
                    });
                }
                
                // Apply Shift constraint for axis-aligned movement
                if (this.dragWithShift) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        deltaY = 0; // Horizontal movement only
                    } else {
                        deltaX = 0; // Vertical movement only
                    }
                }
                
                // Move all selected elements
                this.selectedElements.forEach(element => {
                    const initialX = parseFloat(element.getAttribute('data-initial-x'));
                    const initialY = parseFloat(element.getAttribute('data-initial-y'));
                    
                    const newX = initialX + deltaX;
                    const newY = initialY + deltaY;
                    
                    const type = this.getElementType(element);
                    if (type === 'sugar') {
                        this.moveSugar(element, newX, newY);
                    } else if (type === 'text') {
                        this.moveText(element, newX, newY);
                    }
                });
                
                e.preventDefault();
            } else if (this.selectedElements.size === 1) {
                // Single element dragging
                const element = Array.from(this.selectedElements)[0];
                let newX = x - this.dragOffset.x;
                let newY = y - this.dragOffset.y;
                
                // Apply Shift constraint for axis-aligned movement
                if (this.dragWithShift) {
                    const originalX = parseFloat(element.getAttribute('data-initial-x') || element.getAttribute('data-x'));
                    const originalY = parseFloat(element.getAttribute('data-initial-y') || element.getAttribute('data-y'));
                    
                    const deltaX = newX - originalX;
                    const deltaY = newY - originalY;
                    
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        newY = originalY; // Horizontal movement only
                    } else {
                        newX = originalX; // Vertical movement only
                    }
                }
                
                // Update element position
                const type = this.getElementType(element);
                if (type === 'sugar') {
                    this.moveSugar(element, newX, newY);
                } else if (type === 'text') {
                    this.moveText(element, newX, newY);
                }
                
                e.preventDefault();
            }
        }
        
        // Handle connection dragging in add mode
        if (this.isConnectionDragging && this.currentTool === 'add') {
            // Clear previous target highlight
            this.clearConnectionTargetHighlight();
            
            // Find potential target sugar
            const targetSugar = this.getSugarAtPoint(x, y);
            if (targetSugar && targetSugar !== this.connectionStartSugar) {
                this.connectionTargetSugar = targetSugar;
                this.highlightConnectionTarget(targetSugar);
                this.addPreviewDot.style.display = 'none'; // Hide dot when targeting existing sugar
            } else {
                this.connectionTargetSugar = null;
                // Show preview dot at best position for adding new sugar
                const startX = parseFloat(this.connectionStartSugar.getAttribute('data-x'));
                const startY = parseFloat(this.connectionStartSugar.getAttribute('data-y'));
                const bestDir = this.findBestDirection(startX, startY, x, y);
                const previewX = startX + bestDir.dx * this.connectionDistance;
                const previewY = startY + bestDir.dy * this.connectionDistance;
                this.addPreviewDot.setAttribute('cx', previewX);
                this.addPreviewDot.setAttribute('cy', previewY);
                this.addPreviewDot.style.display = 'block';
            }
            
            e.preventDefault();
        }
        
        // Handle continuous erasing in delete mode
        if (this.isErasing && this.currentTool === 'delete') {
            this.continueErasing(x, y);
        }
    }
    
    handleMouseUp(e) {
        // Handle connection dragging completion first
        if (this.isConnectionDragging && this.currentTool === 'add') {
            if (this.connectionTargetSugar && this.connectionStartSugar) {
                // Create connection between start and target sugars
                const linkage = this.currentLinkageConfig.linkage || document.getElementById('linkageInput')?.value || null;
                this.createConnection(this.connectionStartSugar, this.connectionTargetSugar, false, linkage);
                
                // Finish the step so each connection creation is undoable individually
                this.finishStep();
            } else if (this.connectionStartSugar) {
                // Add new sugar at the preview position
                const coords = this.getSVGCoordinates(e);
                const x = coords.x;
                const y = coords.y;
                const startX = parseFloat(this.connectionStartSugar.getAttribute('data-x'));
                const startY = parseFloat(this.connectionStartSugar.getAttribute('data-y'));
                const bestDir = this.findBestDirection(startX, startY, x, y);
                const newX = startX + bestDir.dx * this.connectionDistance;
                const newY = startY + bestDir.dy * this.connectionDistance;
                const sugar = this.createSugar(newX, newY, this.currentSugarConfig);
                this.selectElement(sugar);
                this.recordObjectAdded(this.createObjectData(sugar));
                
                // Create connection between start sugar and new sugar
                const linkage = this.currentLinkageConfig.linkage || document.getElementById('linkageInput')?.value || null;
                this.createConnection(this.connectionStartSugar, sugar, false, linkage);
                
                // Finish the step so each sugar addition is undoable individually
                this.finishStep();
            }
            
            // Clean up connection dragging state
            this.endConnectionDragging();
            
            // Clear long press timer
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            // Prevent the click event from being processed after connection dragging
            this.preventNextClick = true;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        // Clear long press timer if no connection dragging occurred
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
            // If timer was still running, it means no long press occurred, allow normal click
            this.preventNextClick = false;
        }
        
        // Handle box selection completion
        if (this.isBoxSelecting) {
            this.finishBoxSelection(e.shiftKey);
        }
        
    // Handle Ctrl+drag copy functionality
    // Temporarily disabled: creating duplicated elements during Ctrl+drag
    // has been causing accidental duplicate creations in some workflows.
    // To re-enable this behavior later, remove the `&& false` from
    // the condition below (or change to a configurable flag).
    if (this.isDragging && this.dragWithCtrl && this.currentTool === 'select' && false) {
  
            // Copy all selected elements
            const copies = [];
            this.selectedElements.forEach(element => {
                const type = this.getElementType(element);
                let newElement;
                
                if (type === 'sugar') {
                    newElement = this.copySugar(element);
                } else if (type === 'text') {
                    newElement = this.copyText(element);
                }
                
                if (newElement) {
                    copies.push(newElement);
                }
            });
            
            // Clear current selection and select the copies
            this.clearAllSelections();
            copies.forEach(copy => {
                this.selectElement(copy, true);
            });
        }
        
        // Clean up drag state for all selected elements
        this.selectedElements.forEach(element => {
            // Record modification if element was moved during dragging
            if (this.isDragging && element.hasAttribute('data-before-move')) {
                const beforeDataStr = element.getAttribute('data-before-move');
                const beforeData = JSON.parse(beforeDataStr);
                const afterData = this.createObjectData(element);
                
                if (afterData && (beforeData.x !== afterData.x || beforeData.y !== afterData.y)) {
                    this.recordObjectModified(element.getAttribute('id'), beforeData, afterData);
                }
                
                element.removeAttribute('data-before-move');
            }
            
            element.removeAttribute('data-initial-x');
            element.removeAttribute('data-initial-y');
            element.classList.remove('dragging');
        });
        
        // Finish the drag step if we were dragging
        if (this.isDragging) {
            this.finishStep();
        }
        
        // Reset drag flags
        this.isDraggingMultiple = false;
        this.isDraggingMultipleTexts = false;
        
        // Remove global drag listeners as backup cleanup
        document.removeEventListener('mousemove', this.globalDragMouseMove);
        document.removeEventListener('mouseup', this.globalDragMouseUp);
        
        // Stop erasing
        if (this.isErasing) {
            this.stopErasing();
        }

        this.isDragging = false;
        
        // Re-enable workspace transitions after dragging
        const workspace = document.querySelector('.workspace');
        if (workspace) {
            workspace.classList.remove('dragging-active');
        }
        
        // Remove global dragging class from body to re-enable transitions
        document.body.classList.remove('global-dragging');
    }
    
    handleMouseLeave(e) {
        // Clean up any UI artifacts when mouse leaves canvas
        
        // Clear hover previews
        this.clearAllHoverPreviews();
        
        // DON'T stop dragging operations when mouse leaves - let them continue
        // until mouse up event. This prevents elements from getting stuck.
        
        // Clear connection target highlights
        this.clearConnectionTargetHighlight();
        
        // End connection dragging cleanly
        if (this.isConnectionDragging) {
            this.endConnectionDragging();
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }
        
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Stop erasing
        if (this.isErasing) {
            this.stopErasing();
        }
    }
    
    handleCanvasClick(e) {
        // Prevent double handling in select mode
        if (this.currentTool === 'select') return;
        
        // Don't handle regular clicks if we're in connection dragging mode
        if (this.isConnectionDragging) return;
        
        // Skip this click if it was after a long press connection
        if (this.preventNextClick) {
            this.preventNextClick = false;
            return;
        }
        
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        // Check if clicking on existing elements
        const clickedSugar = this.getSugarAtPoint(x, y);
        const clickedText = this.getTextAtPoint(x, y);
        
        if (this.currentTool === 'add') {
            this.startStep('Add sugar');
            if (clickedSugar) {
                // Add sugar connected to existing sugar
                this.addConnectedSugar(clickedSugar, x, y);
            } else {
                // Place sugar on empty canvas
                this.createSugar(x, y, this.currentSugarConfig);
            }
            this.finishStep();
        } else if (this.currentTool === 'text') {
            this.resetPasteCounter();
            if (this.isEditingText) {
                // If currently editing text, ignore clicks to prevent multiple dialogs
                return;
            }
            
            if (clickedText) {
                // Edit existing text
                this.editText(clickedText);
            } else {
                // Create new text at click position
                this.startStep('Add text');
                this.createText(x, y, 'Text');
                this.finishStep();
            }
        } else if (this.currentTool === 'delete') {
            this.startStep('Delete object');
            if (clickedSugar) {
                this.deleteSugar(clickedSugar);
            } else if (clickedText) {
                this.deleteText(clickedText);
            }
            this.finishStep();
        } else {
            // If preset mode active (selected from right panel), insert preset glyph
            if (this.activePreset && this.activePreset.src) {
                const src = this.activePreset.src;
                // Attempt to clone the loaded SVG template and insert at click position
                    this.startStep('Insert preset glycan');
                    console.debug('Preset insertion requested', src, { x, y });
                    this.loadPresetSVG(src).then((svgTemplate) => {
                            try {
                                // Work on a deep clone so we don't touch the original template
                                const cloned = svgTemplate.cloneNode(true);

                                // Compute origin of template graphical objects so we ignore large svg canvas origin
                                const origin = this.computeTemplateOrigin(cloned);
                                const ox = origin.minX;
                                const oy = origin.minY;

                                // Final placement coordinates
                                const dx = x;
                                const dy = y;

                                // Map from original template sugar id -> newly created sugar element
                                const sugarMap = {};
                                const addedNodeIds = [];

                                // Helper to determine sugar coordinates from a template sugar node
                                const getTemplateSugarPosition = (node) => {
                                    let tx = parseFloat(node.getAttribute('data-x'));
                                    let ty = parseFloat(node.getAttribute('data-y'));
                                    if (!isFinite(tx) || !isFinite(ty)) {
                                        // Try common child shapes
                                        const c = node.querySelector('circle,ellipse');
                                        if (c) {
                                            tx = parseFloat(c.getAttribute('cx')) || tx || 0;
                                            ty = parseFloat(c.getAttribute('cy')) || ty || 0;
                                        } else {
                                            const r = node.querySelector('rect');
                                            if (r) {
                                                const rx = parseFloat(r.getAttribute('x')) || 0;
                                                const ry = parseFloat(r.getAttribute('y')) || 0;
                                                const w = parseFloat(r.getAttribute('width')) || 0;
                                                const h = parseFloat(r.getAttribute('height')) || 0;
                                                tx = rx + w/2;
                                                ty = ry + h/2;
                                            } else {
                                                // Fallback to origin
                                                tx = tx || ox || 0;
                                                ty = ty || oy || 0;
                                            }
                                        }
                                    }
                                    return { tx, ty };
                                };

                                // 1) Create sugars via canonical createSugar(...) to preserve sequencing/side-effects
                                const templateSugars = Array.from(cloned.querySelectorAll('.sugar'));
                                templateSugars.forEach(tnode => {
                                    const oldId = tnode.getAttribute('id');
                                    const pos = getTemplateSugarPosition(tnode);
                                    const newX = pos.tx - ox + dx;
                                    const newY = pos.ty - oy + dy;

                                    // Build config from template attributes (best-effort), preserving template's border settings
                                    const shapeElement = tnode.querySelector('.sugar-shape');
                                    let templateBorderWidth = null;
                                    if (shapeElement) {
                                        // Extract border width from template's inline style or attribute
                                        const styleStrokeWidth = shapeElement.style.getPropertyValue('stroke-width');
                                        const attrStrokeWidth = shapeElement.getAttribute('stroke-width');
                                        if (styleStrokeWidth) {
                                            templateBorderWidth = parseFloat(styleStrokeWidth);
                                        } else if (attrStrokeWidth) {
                                            templateBorderWidth = parseFloat(attrStrokeWidth);
                                        }
                                    }
                                    
                                    const sugarConfig = {
                                        shape: tnode.getAttribute('data-shape') || tnode.getAttribute('data-shape-type') || 'circle',
                                        color: tnode.getAttribute('data-color') || tnode.getAttribute('fill') || null,
                                        size: parseFloat(tnode.getAttribute('data-size')) || undefined,
                                        type: 'preset',
                                        preset: this.activePreset?.name || null,
                                        // Use template's border width if defined, otherwise inherit current settings
                                        borderWidth: (templateBorderWidth !== null) ? templateBorderWidth : this.currentSugarConfig?.borderWidth,
                                        borderColor: this.currentSugarConfig?.borderColor,
                                        borderOpacity: this.currentSugarConfig?.borderOpacity,
                                        borderStyle: this.currentSugarConfig?.borderStyle,
                                        fillOpacity: this.currentSugarConfig?.fillOpacity
                                    };

                                    // Create sugar using canonical path so sugarCount increments correctly
                                    const created = this.createSugar(newX, newY, sugarConfig);
                                    if (created && created.getAttribute) {
                                        sugarMap[oldId || `__anon_${Math.random().toString(36).slice(2,8)}`] = created;
                                        addedNodeIds.push(created.getAttribute('id'));
                                    }
                                });
                                console.debug('Preset sugars created', Object.keys(sugarMap).map(k => ({ from: k, id: sugarMap[k] && sugarMap[k].getAttribute ? sugarMap[k].getAttribute('id') : null })), addedNodeIds.slice());

                                // 2) Recreate connections via createConnection(...) so ids and undo match
                                const templateConnections = Array.from(cloned.querySelectorAll('.connection, line[data-start][data-end]'));
                                templateConnections.forEach(conn => {
                                    const sOld = conn.getAttribute('data-start');
                                    const eOld = conn.getAttribute('data-end');
                                    if (!sOld || !eOld) return;
                                    const startEl = sugarMap[sOld];
                                    const endEl = sugarMap[eOld];
                                    if (!startEl || !endEl) return; // ignore connections to external nodes

                                    const linkage = conn.getAttribute('data-linkage') || conn.getAttribute('data-linkage') || null;
                                    
                                    // Extract stroke width from template connection
                                    let templateStrokeWidth = null;
                                    const styleStrokeWidth = conn.style.getPropertyValue('stroke-width');
                                    const attrStrokeWidth = conn.getAttribute('stroke-width');
                                    if (styleStrokeWidth) {
                                        templateStrokeWidth = parseFloat(styleStrokeWidth);
                                    } else if (attrStrokeWidth) {
                                        templateStrokeWidth = parseFloat(attrStrokeWidth);
                                    }
                                    
                                    // createConnection expects sugar elements
                                        try {
                                            const createdConn = this.createConnection(startEl, endEl, false, linkage);
                                            if (createdConn && createdConn.getAttribute) {
                                                addedNodeIds.push(createdConn.getAttribute('id'));
                                                // Apply template stroke width if it exists
                                                if (templateStrokeWidth !== null) {
                                                    createdConn.style.setProperty('stroke-width', templateStrokeWidth, 'important');
                                                }
                                            }
                                        } catch (e) {
                                            // ignore individual connection failures
                                        }
                                });
                                console.debug('Preset connections created, total ids:', addedNodeIds.filter(id => id && id.startsWith('connection-')).slice());

                                // 3) Append non-sugar, non-connection nodes (decorations, texts, defs)
                                const clones = [];
                                const defsClones = [];
                                Array.from(cloned.children).forEach(child => {
                                    const tag = (child.tagName || '').toLowerCase();
                                    // defs go to defsClones
                                    if (tag === 'defs') {
                                        defsClones.push(child.cloneNode(true));
                                        return;
                                    }

                                    // Skip sugar groups (they were created via createSugar)
                                    if (child.classList && child.classList.contains('sugar')) {
                                        return;
                                    }

                                    // Skip connection lines: they were recreated via createConnection
                                    if ((tag === 'line' && child.hasAttribute && child.hasAttribute('data-start') && child.hasAttribute('data-end')) ||
                                        (child.classList && child.classList.contains('connection'))) {
                                        return;
                                    }

                                    // Otherwise clone decorations/texts/etc.
                                    clones.push(child.cloneNode(true));
                                });

                                // Remap ids for these clones and defs to avoid collisions
                                const allNodes = this.collectNodes(defsClones.concat(clones));
                                const idMap = this.buildIdMapForNodes(allNodes);
                                this.applyIdMapToNodes(allNodes, idMap);

                                // Normalize coordinates and place cloned non-sugar nodes
                                clones.forEach(childClone => {
                                    // Remove any connection elements that might still be present inside decorations
                                    Array.from(childClone.querySelectorAll('.connection, line[data-start][data-end]')).forEach(n => n.remove());

                                    this.shiftElementCoordinates(childClone, ox, oy);
                                    this.shiftElementCoordinates(childClone, -dx, -dy);

                                    // Append into canvas
                                    this.canvas.appendChild(childClone);

                                    try {
                                        if (childClone.getAttribute && childClone.getAttribute('id')) {
                                            const od = this.createObjectData(childClone);
                                            this.recordObjectAdded(od);
                                            addedNodeIds.push(childClone.getAttribute('id'));
                                        }
                                        Array.from(childClone.querySelectorAll('*')).forEach(node => {
                                            if (node.getAttribute && node.getAttribute('id')) {
                                                const od = this.createObjectData(node);
                                                this.recordObjectAdded(od);
                                                addedNodeIds.push(node.getAttribute('id'));
                                            }
                                        });
                                    } catch (e) {}
                                });

                                // Append defs to canvas root (after remapping ids)
                                defsClones.forEach(defNode => {
                                    try { this.canvas.appendChild(defNode); } catch (e) {}
                                });

                                console.debug('Preset decorations appended', clones.length, 'defs appended', defsClones.length);

                                // Record a wrapper group for logical grouping in undo
                                try {
                                    const wrapperId = `preset-${Date.now()}`;
                                    this.recordObjectAdded({ id: wrapperId, type: 'preset-group', children: addedNodeIds });
                                } catch (e) {}

                                this.finishStep();
                                console.debug('Preset insertion finished, addedNodeIds:', addedNodeIds);
                                // Exit preset mode after placing
                                this.exitPresetMode();
                                document.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('active'));
                            } catch (err) {
                                console.error('Failed to insert preset:', err);
                                this.finishStep();
                            }
                        }).catch(err => {
                            console.error('Could not load preset svg for insertion', err);
                            this.finishStep();
                        });
            }
        }
    }
    
    handleDoubleClick(e) {
        if (this.currentTool !== 'select') return;
        
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        const clickedSugar = this.getSugarAtPoint(x, y);
        const clickedText = this.getTextAtPoint(x, y);
        
        if (clickedSugar) {
            // Use unified selection system
            this.clearAllSelections();
            this.selectElement(clickedSugar);
            this.updateStylePanel();
        } else if (clickedText) {
            // Double click on text in select mode should edit it
            this.editText(clickedText);
        }
    }
    
    getSugarAtPoint(x, y) {
        const sugars = this.canvas.querySelectorAll('.sugar');
        for (let sugar of sugars) {
            const sugarX = parseFloat(sugar.getAttribute('data-x'));
            const sugarY = parseFloat(sugar.getAttribute('data-y'));
            const distance = Math.sqrt((x - sugarX) ** 2 + (y - sugarY) ** 2);
            // Use actual sugar size for hit detection with a small buffer
            const actualSize = this.getSugarSize(sugar);
            if (distance <= actualSize + 5) {
                return sugar;
            }
        }
        return null;
    }
    
    addConnectedSugar(parentSugar, clickX, clickY, config = null) {
        
        const sugarConfig = config || this.currentSugarConfig;
        const parentX = parseFloat(parentSugar.getAttribute('data-x'));
        const parentY = parseFloat(parentSugar.getAttribute('data-y'));
        
        // Find the best direction based on where the user clicked
        const bestDirection = this.findBestDirection(parentX, parentY, clickX, clickY);
        
        // Calculate position for new sugar
        const newX = parentX + bestDirection.dx * this.connectionDistance;
        const newY = parentY + bestDirection.dy * this.connectionDistance;
        
        // Check if position is available
        const existingSugar = this.getSugarAtPoint(newX, newY);
        if (existingSugar) {
            // Try alternative directions
            const altPosition = this.findAlternativePosition(parentX, parentY, bestDirection);
            if (altPosition) {
                const childSugar = this.createSugar(altPosition.x, altPosition.y, sugarConfig, false); // Don't save state again
                const linkage = this.currentLinkageConfig.linkage || document.getElementById('linkageInput')?.value || null;
                this.createConnection(parentSugar, childSugar, false, linkage);
            }
        } else {
            const childSugar = this.createSugar(newX, newY, sugarConfig, false); // Don't save state again
            const linkage = this.currentLinkageConfig.linkage || document.getElementById('linkageInput')?.value || null;
            this.createConnection(parentSugar, childSugar, false, linkage);
        }
    }
    
    findBestDirection(parentX, parentY, clickX, clickY) {
        const dx = clickX - parentX;
        const dy = clickY - parentY;
        
        // Normalize the direction vector
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return this.directions[8]; // Default to South
        
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        
        // Find the direction that best matches the click direction
        let bestDirection = this.directions[0];
        let bestDot = -2;
        
        for (const direction of this.directions) {
            const dot = normalizedDx * direction.dx + normalizedDy * direction.dy;
            if (dot > bestDot) {
                bestDot = dot;
                bestDirection = direction;
            }
        }
        
        return bestDirection;
    }
    
    findAlternativePosition(parentX, parentY, excludeDirection) {
        // Try other directions
        for (const direction of this.directions) {
            if (direction === excludeDirection) continue;
            
            const newX = parentX + direction.dx * this.connectionDistance;
            const newY = parentY + direction.dy * this.connectionDistance;
            
            if (!this.getSugarAtPoint(newX, newY)) {
                return { x: newX, y: newY };
            }
        }
        return null;
    }
    
    createSugar(x, y, config) {
        this.sugarCount++;
        
        // Create a group element for the sugar
        const sugarGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        sugarGroup.classList.add('sugar');
        sugarGroup.setAttribute('id', `sugar-${this.sugarCount}`);
        sugarGroup.setAttribute('data-x', x);
        sugarGroup.setAttribute('data-y', y);
        sugarGroup.setAttribute('data-shape', config.shape);
        sugarGroup.setAttribute('data-color', config.color);
        
        // Store config data
        if (config.type === 'preset') {
            sugarGroup.setAttribute('data-preset', config.preset);
        }
        
        // Create the shape based on config
        const size = config.size || this.sugarRadius;
        sugarGroup.setAttribute('data-size', size);
        const shape = this.createSugarShape(x, y, config.shape, config.color, size);
        shape.classList.add('sugar-shape');
        
        // Apply border settings from config
        // Check if this is a divided shape that needs special handling
        const shapeType = config.shape;
        if ((shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) ||
            (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) ||
            (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) ||
            (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group'))) {
            // Handle divided shapes: apply settings to both polygon and dividing line
            const polygon = shape.querySelector('polygon');
            const line = shape.querySelector('.dividing-line');
            
            // Compute effective border/fill values (use config if present, otherwise fall back to currentSugarConfig, finally to hard defaults)
            const effectiveBorderWidth = (config && config.borderWidth != null) ? config.borderWidth : (this.currentSugarConfig?.borderWidth ?? 3);
            const effectiveBorderColor = (config && config.borderColor) ? this.normalizeColorToHex(config.borderColor) : (this.currentSugarConfig?.borderColor ? this.normalizeColorToHex(this.currentSugarConfig.borderColor) : '#000000');
            const effectiveBorderOpacity = (config && config.borderOpacity != null) ? config.borderOpacity : (this.currentSugarConfig?.borderOpacity != null ? this.currentSugarConfig.borderOpacity : 1);
            const effectiveFillOpacity = (config && config.fillOpacity != null) ? config.fillOpacity : (this.currentSugarConfig?.fillOpacity != null ? this.currentSugarConfig.fillOpacity : 1);

            if (polygon) polygon.style.setProperty('stroke-width', effectiveBorderWidth, 'important');
            if (line) line.style.setProperty('stroke-width', effectiveBorderWidth, 'important');

            if (polygon) polygon.style.setProperty('stroke', effectiveBorderColor, 'important');
            if (line) line.style.setProperty('stroke', effectiveBorderColor, 'important');

            if (polygon) polygon.style.setProperty('stroke-opacity', effectiveBorderOpacity, 'important');
            if (line) line.style.setProperty('stroke-opacity', effectiveBorderOpacity, 'important');

            if (polygon) polygon.style.setProperty('fill-opacity', effectiveFillOpacity, 'important');
            if (config.borderStyle && config.borderStyle !== 'solid') {
                const width = config.borderWidth || '2';
                let dashArray;
                switch (config.borderStyle) {
                    case 'dashed':
                        dashArray = `${width * 3},${width * 2}`;
                        break;
                    case 'dotted':
                        dashArray = `${width},${width}`;
                        break;
                }
                if (dashArray) {
                    if (polygon) polygon.style.setProperty('stroke-dasharray', dashArray, 'important');
                    if (line) line.style.setProperty('stroke-dasharray', dashArray, 'important');
                }
            }
        } else {
            // Handle regular shapes
            // Apply effective defaults for regular shapes
            const effectiveBorderWidthReg = (config && config.borderWidth != null) ? config.borderWidth : (this.currentSugarConfig?.borderWidth ?? 3);
            const effectiveBorderColorReg = (config && config.borderColor) ? this.normalizeColorToHex(config.borderColor) : (this.currentSugarConfig?.borderColor ? this.normalizeColorToHex(this.currentSugarConfig.borderColor) : '#000000');
            const effectiveBorderOpacityReg = (config && config.borderOpacity != null) ? config.borderOpacity : (this.currentSugarConfig?.borderOpacity != null ? this.currentSugarConfig.borderOpacity : 1);
            const effectiveFillOpacityReg = (config && config.fillOpacity != null) ? config.fillOpacity : (this.currentSugarConfig?.fillOpacity != null ? this.currentSugarConfig.fillOpacity : 1);

            shape.style.setProperty('stroke-width', effectiveBorderWidthReg, 'important');
            shape.style.setProperty('stroke', effectiveBorderColorReg, 'important');
            shape.style.setProperty('stroke-opacity', effectiveBorderOpacityReg, 'important');
            shape.style.setProperty('fill-opacity', effectiveFillOpacityReg, 'important');
            if (config.borderStyle && config.borderStyle !== 'solid') {
                const width = config.borderWidth || '2';
                switch (config.borderStyle) {
                    case 'dashed':
                        shape.style.setProperty('stroke-dasharray', `${width * 3},${width * 2}`, 'important');
                        break;
                    case 'dotted':
                        shape.style.setProperty('stroke-dasharray', `${width},${width}`, 'important');
                        break;
                }
            }
        }
        
        sugarGroup.appendChild(shape);
        
        // Add to canvas
        this.canvas.appendChild(sugarGroup);
        
        // Record creation for undo/redo system
        const objectData = this.createObjectData(sugarGroup);
        if (objectData) {
            this.recordObjectAdded(objectData);
        }
        
        return sugarGroup;
    }
    
    createSugarShape(x, y, shape, color, size = null, strokeWidth = null) {
        const actualSize = size !== null ? size : this.sugarRadius;
        // Do not force a default stroke color/width here — let higher-level code
        // (createSugar / applySugarBorderStyle / selection handlers) apply
        // the desired border color and width. Use null to indicate "no override".
        const strokeColor = null;
        const actualStrokeWidth = strokeWidth !== null ? strokeWidth : null;
        
        let element;
        
        switch (shape) {
            case 'circle':
            case 'circle-filled':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                element.setAttribute('cx', x);
                element.setAttribute('cy', y);
                element.setAttribute('r', actualSize);
                break;
                
            case 'circle-flat':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                element.setAttribute('cx', x);
                element.setAttribute('cy', y);
                element.setAttribute('rx', actualSize * 1.4); // 宽度较大
                element.setAttribute('ry', actualSize * 0.7); // 高度较小
                break;
                
            case 'circle-narrow':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                element.setAttribute('cx', x);
                element.setAttribute('cy', y);
                element.setAttribute('rx', actualSize * 0.7); // 宽度较小
                element.setAttribute('ry', actualSize * 1.4); // 高度较大
                break;
                

            case 'square':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', x - actualSize);
                element.setAttribute('y', y - actualSize);
                element.setAttribute('width', actualSize * 2);
                element.setAttribute('height', actualSize * 2);
                break;

            case 'square-flat':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', x - actualSize);
                element.setAttribute('y', y - actualSize * 0.7);
                element.setAttribute('width', actualSize * 2);
                element.setAttribute('height', actualSize * 1.4);
                break;

            case 'square-narrow':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', x - actualSize * 0.7);
                element.setAttribute('y', y - actualSize);
                element.setAttribute('width', actualSize * 1.4);
                element.setAttribute('height', actualSize * 2);
                break;

            case 'square-divided':
                // 分割正方形，左下白色，右上用户色，左上到右下对角线分割
                const dividedSquareGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                const squareDividedElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                // 四个顶点
                const p1 = {x: x - actualSize, y: y - actualSize}; // 左上
                const p2 = {x: x + actualSize, y: y - actualSize}; // 右上
                const p3 = {x: x + actualSize, y: y + actualSize}; // 右下
                const p4 = {x: x - actualSize, y: y + actualSize}; // 左下
                // points字符串
                const squarePoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
                squareDividedElement.setAttribute('points', squarePoints);

                // 渐变ID
                const gradientSquareId = `square-divided-gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                // 渐变定义
                const defsSquare = this.canvas.querySelector('defs') || this.canvas.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
                const gradientSquare = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradientSquare.id = gradientSquareId;
                // 沿对角线分割，使用45度渐变
                gradientSquare.setAttribute('x1', '0%');
                gradientSquare.setAttribute('y1', '100%');
                gradientSquare.setAttribute('x2', '100%');
                gradientSquare.setAttribute('y2', '0%');
                // 左下部分白色，右上部分用户色
                const stopDiv1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopDiv1.setAttribute('offset', '50%');
                stopDiv1.setAttribute('stop-color', 'white');
                stopDiv1.setAttribute('stop-opacity', '1');
                const stopDiv2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopDiv2.setAttribute('offset', '50%');
                stopDiv2.setAttribute('stop-color', color || '#0072BC');
                stopDiv2.setAttribute('stop-opacity', '1');
                gradientSquare.appendChild(stopDiv1);
                gradientSquare.appendChild(stopDiv2);
                defsSquare.appendChild(gradientSquare);
                squareDividedElement.setAttribute('fill', `url(#${gradientSquareId})`);
                if (strokeColor) squareDividedElement.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) squareDividedElement.setAttribute('stroke-width', actualStrokeWidth);

                // 分割线（左上到右下）
                const dividingLineSquare = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                dividingLineSquare.setAttribute('x1', p1.x);
                dividingLineSquare.setAttribute('y1', p1.y);
                dividingLineSquare.setAttribute('x2', p3.x);
                dividingLineSquare.setAttribute('y2', p3.y);
                if (strokeColor) dividingLineSquare.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) dividingLineSquare.setAttribute('stroke-width', actualStrokeWidth);
                dividingLineSquare.classList.add('dividing-line');

                dividedSquareGroup.appendChild(squareDividedElement);
                dividedSquareGroup.appendChild(dividingLineSquare);
                dividedSquareGroup.setAttribute('data-gradient-id', gradientSquareId);
                dividedSquareGroup.classList.add('square-divided-group');
                element = dividedSquareGroup;
                break;
                
            case 'triangle':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const triPoints = this.generatePolygonPoints(x, y, actualSize, 3, -Math.PI/2);
                element.setAttribute('points', triPoints);
                break;
                
            case 'triangle-inverted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const invertedTriPoints = this.generatePolygonPoints(x, y, actualSize, 3, Math.PI/2);
                element.setAttribute('points', invertedTriPoints);
                break;
                
            case 'triangle-divided':
                // 使用组合方式：多边形 + 渐变 + 分割线
                const dividedGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // 主三角形多边形
                const triangleElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const dividedTriPoints = this.generatePolygonPoints(x, y, actualSize, 3, -Math.PI/2);
                triangleElement.setAttribute('points', dividedTriPoints);
                
                // 创建唯一的渐变ID
                const gradientId = `triangle-divided-gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // 创建渐变定义
                const defs = this.canvas.querySelector('defs') || this.canvas.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
                const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradient.id = gradientId;
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '100%');
                gradient.setAttribute('y2', '0%');
                
                // 左半部分：白色
                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '50%');
                stop1.setAttribute('stop-color', 'white');
                stop1.setAttribute('stop-opacity', '1');
                
                // 右半部分：用户颜色 - 确保颜色正确传递
                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '50%');
                stop2.setAttribute('stop-color', color || '#4CAF50'); // 使用更明显的默认颜色进行调试
                stop2.setAttribute('stop-opacity', '1');
                
                gradient.appendChild(stop1);
                gradient.appendChild(stop2);
                defs.appendChild(gradient);
                
                // 应用渐变到三角形
                triangleElement.setAttribute('fill', `url(#${gradientId})`);
                if (strokeColor) triangleElement.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) triangleElement.setAttribute('stroke-width', actualStrokeWidth);
                
                // 计算分割线坐标（从顶点到底边中点）
                const vertices = this.parsePolygonPoints(dividedTriPoints);
                if (vertices.length >= 3) {
                    // 顶点（第一个点）
                    const topVertex = vertices[0];
                    // 底边中点（第二个和第三个点的中点）
                    const bottomMidX = (vertices[1].x + vertices[2].x) / 2;
                    const bottomMidY = (vertices[1].y + vertices[2].y) / 2;
                    
                    // 创建分割线
                    const dividingLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    dividingLine.setAttribute('x1', topVertex.x);
                    dividingLine.setAttribute('y1', topVertex.y);
                    dividingLine.setAttribute('x2', bottomMidX);
                    dividingLine.setAttribute('y2', bottomMidY);
                    if (strokeColor) dividingLine.setAttribute('stroke', strokeColor);
                    if (actualStrokeWidth) dividingLine.setAttribute('stroke-width', actualStrokeWidth);
                    dividingLine.classList.add('dividing-line');
                    
                    dividedGroup.appendChild(triangleElement);
                    dividedGroup.appendChild(dividingLine);
                } else {
                    // 如果解析失败，只添加三角形
                    dividedGroup.appendChild(triangleElement);
                }
                
                // 存储渐变信息用于后续颜色更新
                dividedGroup.setAttribute('data-gradient-id', gradientId);
                dividedGroup.classList.add('triangle-divided-group');
                element = dividedGroup;
                break;
                
            case 'diamond':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                element.setAttribute('points', diamondPoints);
                break;
                
            case 'diamond-flat':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondFlatPoints = `${x},${y-actualSize*0.7} ${x+actualSize*1.4},${y} ${x},${y+actualSize*0.7} ${x-actualSize*1.4},${y}`;
                element.setAttribute('points', diamondFlatPoints);
                break;
                
            case 'diamond-narrow':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondNarrowPoints = `${x},${y-actualSize*1.4} ${x+actualSize*0.7},${y} ${x},${y+actualSize*1.4} ${x-actualSize*0.7},${y}`;
                element.setAttribute('points', diamondNarrowPoints);
                break;
                
            case 'diamond-divided-top':
                // 分割菱形：上半部分用户颜色，下半部分白色（GlcA标准）
                const dividedTopGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // 主菱形
                const diamondTopElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondTopPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                diamondTopElement.setAttribute('points', diamondTopPoints);
                
                // 创建唯一的渐变ID
                const gradientTopId = `diamond-divided-top-gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // 创建渐变定义
                const defsTop = this.canvas.querySelector('defs') || this.canvas.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
                const gradientTop = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradientTop.id = gradientTopId;
                gradientTop.setAttribute('x1', '0%');
                gradientTop.setAttribute('y1', '0%');
                gradientTop.setAttribute('x2', '0%');
                gradientTop.setAttribute('y2', '100%');
                
                // 上半部分：用户颜色
                const stopTop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopTop1.setAttribute('offset', '50%');
                stopTop1.setAttribute('stop-color', color || '#0072BC');
                stopTop1.setAttribute('stop-opacity', '1');
                
                // 下半部分：白色
                const stopTop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopTop2.setAttribute('offset', '50%');
                stopTop2.setAttribute('stop-color', 'white');
                stopTop2.setAttribute('stop-opacity', '1');
                
                gradientTop.appendChild(stopTop1);
                gradientTop.appendChild(stopTop2);
                defsTop.appendChild(gradientTop);
                
                // 应用渐变
                diamondTopElement.setAttribute('fill', `url(#${gradientTopId})`);
                if (strokeColor) diamondTopElement.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) diamondTopElement.setAttribute('stroke-width', actualStrokeWidth);
                
                // 创建水平分割线
                const dividingLineTop = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                dividingLineTop.setAttribute('x1', x - actualSize);
                dividingLineTop.setAttribute('y1', y);
                dividingLineTop.setAttribute('x2', x + actualSize);
                dividingLineTop.setAttribute('y2', y);
                if (strokeColor) dividingLineTop.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) dividingLineTop.setAttribute('stroke-width', actualStrokeWidth);
                dividingLineTop.classList.add('dividing-line');
                
                dividedTopGroup.appendChild(diamondTopElement);
                dividedTopGroup.appendChild(dividingLineTop);
                
                // 存储渐变信息
                dividedTopGroup.setAttribute('data-gradient-id', gradientTopId);
                dividedTopGroup.classList.add('diamond-divided-top-group');
                element = dividedTopGroup;
                break;
                
            case 'diamond-divided-bottom':
                // 分割菱形：下半部分用户颜色，上半部分白色
                const dividedBottomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // 主菱形
                const diamondBottomElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondBottomPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                diamondBottomElement.setAttribute('points', diamondBottomPoints);
                
                // 创建唯一的渐变ID
                const gradientBottomId = `diamond-divided-bottom-gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // 创建渐变定义
                const defsBottom = this.canvas.querySelector('defs') || this.canvas.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
                const gradientBottom = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradientBottom.id = gradientBottomId;
                gradientBottom.setAttribute('x1', '0%');
                gradientBottom.setAttribute('y1', '0%');
                gradientBottom.setAttribute('x2', '0%');
                gradientBottom.setAttribute('y2', '100%');
                
                // 上半部分：白色
                const stopBottom1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopBottom1.setAttribute('offset', '50%');
                stopBottom1.setAttribute('stop-color', 'white');
                stopBottom1.setAttribute('stop-opacity', '1');
                
                // 下半部分：用户颜色
                const stopBottom2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopBottom2.setAttribute('offset', '50%');
                stopBottom2.setAttribute('stop-color', color || '#0072BC');
                stopBottom2.setAttribute('stop-opacity', '1');
                
                gradientBottom.appendChild(stopBottom1);
                gradientBottom.appendChild(stopBottom2);
                defsBottom.appendChild(gradientBottom);
                
                // 应用渐变
                diamondBottomElement.setAttribute('fill', `url(#${gradientBottomId})`);
                if (strokeColor) diamondBottomElement.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) diamondBottomElement.setAttribute('stroke-width', actualStrokeWidth);
                
                // 创建水平分割线
                const dividingLineBottom = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                dividingLineBottom.setAttribute('x1', x - actualSize);
                dividingLineBottom.setAttribute('y1', y);
                dividingLineBottom.setAttribute('x2', x + actualSize);
                dividingLineBottom.setAttribute('y2', y);
                if (strokeColor) dividingLineBottom.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) dividingLineBottom.setAttribute('stroke-width', actualStrokeWidth);
                dividingLineBottom.classList.add('dividing-line');
                
                dividedBottomGroup.appendChild(diamondBottomElement);
                dividedBottomGroup.appendChild(dividingLineBottom);
                
                // 存储渐变信息
                dividedBottomGroup.setAttribute('data-gradient-id', gradientBottomId);
                dividedBottomGroup.classList.add('diamond-divided-bottom-group');
                element = dividedBottomGroup;
                break;
                
            case 'star':
            case 'star-5':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const starPoints = this.generateStarPoints(x, y, actualSize, 5, 0);
                element.setAttribute('points', starPoints);
                break;
                
            case 'star-5-inverted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const starInvertedPoints = this.generateStarPoints(x, y, actualSize, 5, Math.PI);
                element.setAttribute('points', starInvertedPoints);
                break;
                
            case 'star-4':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const star4Points = this.generateStarPoints(x, y, actualSize, 4, 0);
                element.setAttribute('points', star4Points);
                break;
                
            case 'star-4-tilted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const star4TiltedPoints = this.generateStarPoints(x, y, actualSize, 4, Math.PI/4);
                element.setAttribute('points', star4TiltedPoints);
                break;
                
            case 'star-6':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const star6Points = this.generateStarPoints(x, y, actualSize, 6, 0);
                element.setAttribute('points', star6Points);
                break;
                
            case 'star-6-tilted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const star6TiltedPoints = this.generateStarPoints(x, y, actualSize, 6, Math.PI/6);
                element.setAttribute('points', star6TiltedPoints);
                break;
                
            case 'hexagon':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const hexPoints = this.generatePolygonPoints(x, y, actualSize, 6, 0);
                element.setAttribute('points', hexPoints);
                break;
                
            case 'flat-hexagon':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const flatHexPoints = this.generatePolygonPoints(x, y, actualSize, 6, Math.PI/6);
                element.setAttribute('points', flatHexPoints);
                break;
                
            case 'hexagon-compressed':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const compressedHexPoints = this.generateCompressedPolygonPoints(x, y, actualSize, 6, 0, 0.7);
                element.setAttribute('points', compressedHexPoints);
                break;
                
            case 'flat-hexagon-compressed':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const compressedFlatHexPoints = this.generateCompressedPolygonPoints(x, y, actualSize, 6, Math.PI/6, 0.7);
                element.setAttribute('points', compressedFlatHexPoints);
                break;
                
            case 'flat-diamond':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const flatDiamondPoints = `${x-actualSize*0.7},${y} ${x},${y-actualSize*0.7} ${x+actualSize*0.7},${y} ${x},${y+actualSize*0.7}`;
                element.setAttribute('points', flatDiamondPoints);
                break;
                
            case 'pentagon':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const pentPoints = this.generatePolygonPoints(x, y, actualSize, 5, -Math.PI/2);
                element.setAttribute('points', pentPoints);
                break;
                
            case 'pentagon-inverted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const pentInvertedPoints = this.generatePolygonPoints(x, y, actualSize, 5, Math.PI/2);
                element.setAttribute('points', pentInvertedPoints);
                break;
                
            case 'freeend-asterisk':
                // Asterisk shape for free end - path-based line shape
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createAsteriskPath(x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.classList.add('freeend-asterisk');
                element.setAttribute('data-exclude-export', 'true'); // Mark for exclusion from export
                break;
                
            case 'freeend-wave':
                // Wave line for peptide/protein - stored as data, rendered dynamically
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('data-x', x);
                element.setAttribute('data-y', y);
                element.setAttribute('data-size', actualSize);
                this.updateWavePath(element, x, y, actualSize);
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-linecap', 'round');
                element.classList.add('freeend-wave');
                break;
                
            // Bracket shapes (path-based)
            case 'bracket-left':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createBracketPath('left', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.setAttribute('stroke-linejoin', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'bracket-right':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createBracketPath('right', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.setAttribute('stroke-linejoin', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'paren-left':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createParenPath('left', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'paren-right':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createParenPath('right', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'brace-left':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createBracePath('left', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.setAttribute('stroke-linejoin', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'brace-right':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createBracePath('right', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.setAttribute('stroke-linejoin', 'round');
                element.classList.add('bracket-shape');
                break;
                
            default:
                return this.createSugarShape(x, y, 'circle', color);
        }
        
        // Set fill and stroke
        if (shape === 'triangle-divided' || shape === 'diamond-divided-top' || shape === 'diamond-divided-bottom') {
            // 分割形状的特殊处理已经在case中完成（渐变填充和分割线）
            // 组级别不需要额外的填充和描边设置
        } else if (shape === 'freeend-asterisk') {
            // Asterisk text - use color for fill
            element.setAttribute('fill', color);
        } else if (shape === 'freeend-wave') {
            // Wave line - use color for stroke, preserve stroke-width from attributes
            element.setAttribute('stroke', color);
            if (!element.getAttribute('stroke-width')) {
                element.setAttribute('stroke-width', actualStrokeWidth);
            }
        } else if (shape === 'bracket-left' || shape === 'bracket-right' || 
                   shape === 'paren-left' || shape === 'paren-right' ||
                   shape === 'brace-left' || shape === 'brace-right') {
            // Bracket and parenthesis path shapes - use color for stroke
            element.setAttribute('stroke', color);
            element.setAttribute('stroke-width', actualStrokeWidth);
        } else {
            element.setAttribute('fill', color);
            element.setAttribute('stroke', strokeColor);
            element.setAttribute('stroke-width', actualStrokeWidth);
        }
        
        return element;
    }
    
    generatePolygonPoints(centerX, centerY, radius, sides, rotation = 0) {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (2 * Math.PI * i / sides) + rotation;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        return points.join(' ');
    }
    
    generateCompressedPolygonPoints(centerX, centerY, radius, sides, rotation = 0, heightScale = 0.7) {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (2 * Math.PI * i / sides) + rotation;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle) * heightScale;
            points.push(`${x},${y}`);
        }
        return points.join(' ');
    }
    
    generateDividedTriangleParts(centerX, centerY, radius, rotation = -Math.PI/2) {
        // 使用与generatePolygonPoints相同的计算方法，确保大小一致
        // 计算三角形的三个顶点（与普通三角形完全相同）
        const vertices = [];
        for (let i = 0; i < 3; i++) {
            const angle = (2 * Math.PI * i / 3) + rotation;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            vertices.push({x, y});
        }
        
        // 顶点、左底角、右底角
        const topVertex = vertices[0];
        const leftBottomVertex = vertices[1];
        const rightBottomVertex = vertices[2];
        
        // 底边中点（垂直分割线的底部点）
        const bottomMidX = (leftBottomVertex.x + rightBottomVertex.x) / 2;
        const bottomMidY = (leftBottomVertex.y + rightBottomVertex.y) / 2;
        
        // 左半部分：顶点 + 左底角 + 底边中点（稳定白色）
        const leftPoints = [
            `${topVertex.x},${topVertex.y}`,
            `${leftBottomVertex.x},${leftBottomVertex.y}`,
            `${bottomMidX},${bottomMidY}`
        ].join(' ');
        
        // 右半部分：顶点 + 底边中点 + 右底角（跟随用户颜色）
        const rightPoints = [
            `${topVertex.x},${topVertex.y}`,
            `${bottomMidX},${bottomMidY}`,
            `${rightBottomVertex.x},${rightBottomVertex.y}`
        ].join(' ');
        
        return {leftPoints, rightPoints};
    }
    
    updateWavePath(element, x, y, size) {
        // Update wave path based on position and size
        const waveWidth = size * 2;
        const waveHeight = size * 0.6;
        const wavePath = `M ${x - waveWidth/2} ${y} Q ${x - waveWidth/4} ${y - waveHeight} ${x} ${y} T ${x + waveWidth/2} ${y}`;
        element.setAttribute('d', wavePath);
    }
    
    // Create square bracket path [ or ]
    createBracketPath(side, x, y, size) {
        const height = size * 2;
        const width = size * 0.5;
        
        if (side === 'left') {
            // Left bracket [
            return `M ${x + width/2} ${y - height/2} L ${x - width/2} ${y - height/2} L ${x - width/2} ${y + height/2} L ${x + width/2} ${y + height/2}`;
        } else {
            // Right bracket ]
            return `M ${x - width/2} ${y - height/2} L ${x + width/2} ${y - height/2} L ${x + width/2} ${y + height/2} L ${x - width/2} ${y + height/2}`;
        }
    }
    
    // Create parenthesis path ( or )
    createParenPath(side, x, y, size) {
        const height = size * 2;
        const width = size * 0.3;  // Reduced from 0.6 to 0.3 (half width)
        const curve = size * 0.4;  // Reduced from 0.8 to 0.4 (half curve)
        
        if (side === 'left') {
            // Left parenthesis (
            return `M ${x + width/2} ${y - height/2} Q ${x - curve} ${y - height/4} ${x - curve} ${y} Q ${x - curve} ${y + height/4} ${x + width/2} ${y + height/2}`;
        } else {
            // Right parenthesis )
            return `M ${x - width/2} ${y - height/2} Q ${x + curve} ${y - height/4} ${x + curve} ${y} Q ${x + curve} ${y + height/4} ${x - width/2} ${y + height/2}`;
        }
    }
    
    // Create curly brace path { or }
    createBracePath(side, x, y, size) {
        const height = size * 2;
        const width = size * 0.25;      // Reduced from 0.5 to 0.25 (half width)
        const curveSize = size * 0.15;  // Reduced from 0.3 to 0.15 (half curve)
        const midPoint = y;
        
        if (side === 'left') {
            // Left brace {
            return `M ${x + width/2} ${y - height/2} 
                    Q ${x - width/2} ${y - height/2 + curveSize} ${x - width/2} ${y - height/4}
                    Q ${x - width/2} ${midPoint - curveSize} ${x - width/2 - curveSize} ${midPoint}
                    Q ${x - width/2} ${midPoint + curveSize} ${x - width/2} ${y + height/4}
                    Q ${x - width/2} ${y + height/2 - curveSize} ${x + width/2} ${y + height/2}`;
        } else {
            // Right brace }
            return `M ${x - width/2} ${y - height/2}
                    Q ${x + width/2} ${y - height/2 + curveSize} ${x + width/2} ${y - height/4}
                    Q ${x + width/2} ${midPoint - curveSize} ${x + width/2 + curveSize} ${midPoint}
                    Q ${x + width/2} ${midPoint + curveSize} ${x + width/2} ${y + height/4}
                    Q ${x + width/2} ${y + height/2 - curveSize} ${x - width/2} ${y + height/2}`;
        }
    }
    
    // Create asterisk path * (6-pointed star for free end)
    createAsteriskPath(x, y, size) {
        const length = size * 1.2; // Length of each ray
        const paths = [];
        
        // Create 6 rays radiating from center at 60-degree intervals
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * i / 3) - Math.PI / 2; // Start from top, 60° apart
            const endX = x + length * Math.cos(angle);
            const endY = y + length * Math.sin(angle);
            paths.push(`M ${x} ${y} L ${endX} ${endY}`);
        }
        
        return paths.join(' ');
    }
    
    parsePolygonPoints(pointsStr) {
        // 解析多边形点字符串，返回坐标数组
        const points = [];
        const coords = pointsStr.trim().split(/\s+/);
        
        for (const coord of coords) {
            const [x, y] = coord.split(',').map(Number);
            if (!isNaN(x) && !isNaN(y)) {
                points.push({x, y});
            }
        }
        
        return points;
    }
    
    generateStarPoints(centerX, centerY, radius, points, rotation = 0) {
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        const pointsArray = [];
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI * i / points) - Math.PI / 2 + rotation;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            pointsArray.push(`${x},${y}`);
        }
        
        return pointsArray.join(' ');
    }
    
    darkenColor(color, percent) {
        // Simple color darkening function
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    // Deprecated: selectSugar method removed - use selectElement() instead
    
    // Deprecated: selectSugarOnly method removed - use selectElement() instead
    
    // Deprecated: deselectSugar method removed - use deselectElement() instead
    
    // Deprecated: selectText and selectTextOnly methods removed - use selectElement() instead
    
    // Deprecated: deselectText method removed - use deselectElement() instead
    
    deselectAll() {
        // Use unified selection system
        this.clearAllSelections();
        
        // Always update panels when deselecting
        this.updateStylePanel();
        this.updateLeftPanel();
        this.updateRightPanel();
    }
    
    // Deprecated: Multiple old deselection methods removed - use clearAllSelections() instead
    
    addSelectionHighlight(sugar) {
        // Remove existing highlight for this sugar
        this.removeSelectionHighlight(sugar);
        
        const x = parseFloat(sugar.getAttribute('data-x'));
        const y = parseFloat(sugar.getAttribute('data-y'));
        
        // Create unique highlight ID for this sugar
        const highlightId = 'highlight-' + sugar.getAttribute('id');
        
        // Create highlight circle
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.classList.add('selection-highlight');
        highlight.setAttribute('id', highlightId);
        highlight.setAttribute('cx', x);
        highlight.setAttribute('cy', y);
        // Use actual sugar size for highlight
        const actualSize = this.getSugarSize(sugar);
        highlight.setAttribute('r', actualSize + 5);
        highlight.setAttribute('fill', 'none');
        highlight.setAttribute('stroke', '#0072BC');
        highlight.setAttribute('stroke-width', '2');
        highlight.setAttribute('stroke-dasharray', '5,5');
        highlight.setAttribute('pointer-events', 'none');
        
        // Insert before the sugar so it appears behind
        this.canvas.insertBefore(highlight, sugar);
        sugar.setAttribute('data-highlight-id', highlightId);
    }
    
    updateSelectionHighlightPosition(sugar, x, y) {
        const highlightId = sugar.getAttribute('data-highlight-id');
        if (highlightId) {
            const highlight = this.canvas.querySelector('#' + highlightId);
            if (highlight) {
                highlight.setAttribute('cx', x);
                highlight.setAttribute('cy', y);
            }
        }
    }
    
    removeSelectionHighlight(sugar) {
        if (sugar) {
            const highlightId = sugar.getAttribute('data-highlight-id');
            if (highlightId) {
                const highlight = this.canvas.querySelector('#' + highlightId);
                if (highlight) {
                    highlight.remove();
                }
                sugar.removeAttribute('data-highlight-id');
            }
        }
    }
    
    addTextSelectionHighlight(text) {
        const x = parseFloat(text.getAttribute('x'));
        const y = parseFloat(text.getAttribute('y'));
        
        // Get text dimensions for background rect
        const bbox = text.getBBox();
        
        // Create selection highlight rectangle
        const highlightId = 'text-highlight-' + Date.now();
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        highlight.setAttribute('id', highlightId);
        highlight.setAttribute('x', bbox.x - 4);
        highlight.setAttribute('y', bbox.y - 2);
        highlight.setAttribute('width', bbox.width + 8);
        highlight.setAttribute('height', bbox.height + 4);
        highlight.setAttribute('fill', '#0072BC33');  // #0072BC with 20% opacity (0.2 * 255 = 51 = 0x33)
        highlight.setAttribute('stroke', '#0072BC');
        highlight.setAttribute('stroke-width', '2');
        highlight.setAttribute('stroke-dasharray', '5,5');
        highlight.setAttribute('rx', '3');
        highlight.setAttribute('ry', '3');
        highlight.setAttribute('pointer-events', 'none');
        
        // Insert before the text so it appears behind
        this.canvas.insertBefore(highlight, text);
        text.setAttribute('data-text-highlight-id', highlightId);
    }
    
    removeTextSelectionHighlight(text) {
        if (text) {
            const highlightId = text.getAttribute('data-text-highlight-id');
            if (highlightId) {
                const highlight = this.canvas.querySelector('#' + highlightId);
                if (highlight) {
                    highlight.remove();
                }
                text.removeAttribute('data-text-highlight-id');
            }
        }
    }
    
    moveSugar(sugar, newX, newY) {
        const oldX = parseFloat(sugar.getAttribute('data-x'));
        const oldY = parseFloat(sugar.getAttribute('data-y'));
        
        // Update sugar position
        sugar.setAttribute('data-x', newX);
        sugar.setAttribute('data-y', newY);
        
        // Update the sugar shape position
        const shape = sugar.querySelector('.sugar-shape');
        const shapeType = sugar.getAttribute('data-shape');
        if (shape && shapeType) {
            this.updateShapePosition(shape, shapeType, newX, newY);
        }
        
        // Update selection highlight position directly without recreating
        if (sugar.classList.contains('selected') || this.selectedSugars.has(sugar)) {
            this.updateSelectionHighlightPosition(sugar, newX, newY);
        }
        
        // Update connected lines
        this.updateConnectedLines(sugar, oldX, oldY, newX, newY);
    }
    
    updateShapePosition(shape, shapeType, x, y) {
        if (!shape) return; // Safety check
        
        // Get the actual size from the sugar element's data-size attribute
        // Find the parent sugar element
        let sugarElement = shape.parentElement;
        while (sugarElement && !sugarElement.classList.contains('sugar')) {
            sugarElement = sugarElement.parentElement;
        }
        
        // Use the sugar's actual size if available, otherwise fall back to default
        const size = sugarElement ? 
            (parseFloat(sugarElement.getAttribute('data-size')) || this.sugarRadius) : 
            this.sugarRadius;
        
        switch (shapeType) {
            case 'circle':
            case 'circle-filled':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                break;
                
            case 'circle-flat':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', size * 1.4);
                shape.setAttribute('ry', size * 0.7);
                break;
                
            case 'circle-narrow':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', size * 0.7);
                shape.setAttribute('ry', size * 1.4);
                break;

            case 'square':
                shape.setAttribute('x', x - size);
                shape.setAttribute('y', y - size);
                break;

            case 'square-flat':
                shape.setAttribute('x', x - size);
                shape.setAttribute('y', y - size * 0.7);
                shape.setAttribute('width', size * 2);
                shape.setAttribute('height', size * 1.4);
                break;

            case 'square-narrow':
                shape.setAttribute('x', x - size * 0.7);
                shape.setAttribute('y', y - size);
                shape.setAttribute('width', size * 1.4);
                shape.setAttribute('height', size * 2);
                break;

            case 'square-divided':
                // 分割正方形拖拽，更新group内polygon和分割线
                if (shape.classList.contains('square-divided-group')) {
                    const p1 = {x: x - size, y: y - size}; // 左上
                    const p2 = {x: x + size, y: y - size}; // 右上
                    const p3 = {x: x + size, y: y + size}; // 右下
                    const p4 = {x: x - size, y: y + size}; // 左下
                    const squarePoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
                    const polygon = shape.querySelector('polygon');
                    if (polygon) polygon.setAttribute('points', squarePoints);
                    const line = shape.querySelector('.dividing-line');
                    if (line) {
                        line.setAttribute('x1', p1.x);
                        line.setAttribute('y1', p1.y);
                        line.setAttribute('x2', p3.x);
                        line.setAttribute('y2', p3.y);
                    }
                }
                break;
                
            case 'triangle':
                const triPoints = this.generatePolygonPoints(x, y, size, 3, -Math.PI/2);
                shape.setAttribute('points', triPoints);
                break;
                
            case 'triangle-inverted':
                const invertedTriPoints = this.generatePolygonPoints(x, y, size, 3, Math.PI/2);
                shape.setAttribute('points', invertedTriPoints);
                break;
                
            case 'triangle-divided':
                // 新的分割三角形结构：group包含polygon+line
                if (shape.classList.contains('triangle-divided-group')) {
                    // 重新计算三角形点
                    const newTriPoints = this.generatePolygonPoints(x, y, size, 3, -Math.PI/2);
                    
                    // 更新多边形
                    const polygon = shape.querySelector('polygon');
                    if (polygon) {
                        polygon.setAttribute('points', newTriPoints);
                    }
                    
                    // 更新分割线
                    const line = shape.querySelector('.dividing-line');
                    if (line) {
                        const vertices = this.parsePolygonPoints(newTriPoints);
                        if (vertices.length >= 3) {
                            const topVertex = vertices[0];
                            const bottomMidX = (vertices[1].x + vertices[2].x) / 2;
                            const bottomMidY = (vertices[1].y + vertices[2].y) / 2;
                            
                            line.setAttribute('x1', topVertex.x);
                            line.setAttribute('y1', topVertex.y);
                            line.setAttribute('x2', bottomMidX);
                            line.setAttribute('y2', bottomMidY);
                        }
                    }
                }
                break;
                
            case 'diamond':
                const diamondPoints = `${x},${y-size} ${x+size},${y} ${x},${y+size} ${x-size},${y}`;
                shape.setAttribute('points', diamondPoints);
                break;
                
            case 'diamond-flat':
                const diamondFlatPoints = `${x},${y-size*0.7} ${x+size*1.4},${y} ${x},${y+size*0.7} ${x-size*1.4},${y}`;
                shape.setAttribute('points', diamondFlatPoints);
                break;
                
            case 'diamond-narrow':
                const diamondNarrowPoints = `${x},${y-size*1.4} ${x+size*0.7},${y} ${x},${y+size*1.4} ${x-size*0.7},${y}`;
                shape.setAttribute('points', diamondNarrowPoints);
                break;
                
            case 'diamond-divided-top':
                // 分割菱形（下白）结构：group包含polygon+line
                if (shape.classList.contains('diamond-divided-top-group')) {
                    // 重新计算菱形点
                    const newDiamondTopPoints = `${x},${y-size} ${x+size},${y} ${x},${y+size} ${x-size},${y}`;
                    
                    // 更新多边形
                    const polygon = shape.querySelector('polygon');
                    if (polygon) {
                        polygon.setAttribute('points', newDiamondTopPoints);
                    }
                    
                    // 更新水平分割线
                    const line = shape.querySelector('.dividing-line');
                    if (line) {
                        line.setAttribute('x1', x - size);
                        line.setAttribute('y1', y);
                        line.setAttribute('x2', x + size);
                        line.setAttribute('y2', y);
                    }
                }
                break;
                
            case 'diamond-divided-bottom':
                // 分割菱形（上白）结构：group包含polygon+line
                if (shape.classList.contains('diamond-divided-bottom-group')) {
                    // 重新计算菱形点
                    const newDiamondBottomPoints = `${x},${y-size} ${x+size},${y} ${x},${y+size} ${x-size},${y}`;
                    
                    // 更新多边形
                    const polygon = shape.querySelector('polygon');
                    if (polygon) {
                        polygon.setAttribute('points', newDiamondBottomPoints);
                    }
                    
                    // 更新水平分割线
                    const line = shape.querySelector('.dividing-line');
                    if (line) {
                        line.setAttribute('x1', x - size);
                        line.setAttribute('y1', y);
                        line.setAttribute('x2', x + size);
                        line.setAttribute('y2', y);
                    }
                }
                break;
                
            case 'star':
            case 'star-5':
                const starPoints = this.generateStarPoints(x, y, size, 5, 0);
                shape.setAttribute('points', starPoints);
                break;
                
            case 'star-5-inverted':
                const starInvertedPoints = this.generateStarPoints(x, y, size, 5, Math.PI);
                shape.setAttribute('points', starInvertedPoints);
                break;
                
            case 'star-4':
                const star4Points = this.generateStarPoints(x, y, size, 4, 0);
                shape.setAttribute('points', star4Points);
                break;
                
            case 'star-4-tilted':
                const star4TiltedPoints = this.generateStarPoints(x, y, size, 4, Math.PI/4);
                shape.setAttribute('points', star4TiltedPoints);
                break;
                
            case 'star-6':
                const star6Points = this.generateStarPoints(x, y, size, 6, 0);
                shape.setAttribute('points', star6Points);
                break;
                
            case 'star-6-tilted':
                const star6TiltedPoints = this.generateStarPoints(x, y, size, 6, Math.PI/6);
                shape.setAttribute('points', star6TiltedPoints);
                break;
                
            case 'hexagon':
                const hexPoints = this.generatePolygonPoints(x, y, size, 6, 0);
                shape.setAttribute('points', hexPoints);
                break;
                
            case 'flat-hexagon':
                const flatHexPoints = this.generatePolygonPoints(x, y, size, 6, Math.PI/6);
                shape.setAttribute('points', flatHexPoints);
                break;
                
            case 'hexagon-compressed':
                const compressedHexPoints = this.generateCompressedPolygonPoints(x, y, size, 6, 0, 0.7);
                shape.setAttribute('points', compressedHexPoints);
                break;
                
            case 'flat-hexagon-compressed':
                const compressedFlatHexPoints = this.generateCompressedPolygonPoints(x, y, size, 6, Math.PI/6, 0.7);
                shape.setAttribute('points', compressedFlatHexPoints);
                break;
                
            case 'flat-diamond':
                const flatDiamondPoints = `${x-size*0.7},${y} ${x},${y-size*0.7} ${x+size*0.7},${y} ${x},${y+size*0.7}`;
                shape.setAttribute('points', flatDiamondPoints);
                break;
                
            case 'pentagon':
                const pentPoints = this.generatePolygonPoints(x, y, size, 5, -Math.PI/2);
                shape.setAttribute('points', pentPoints);
                break;
                
            case 'pentagon-inverted':
                const pentInvertedPoints = this.generatePolygonPoints(x, y, size, 5, Math.PI/2);
                shape.setAttribute('points', pentInvertedPoints);
                break;
                
            case 'freeend-asterisk':
                // Update asterisk path position
                shape.setAttribute('d', this.createAsteriskPath(x, y, size));
                break;
                
            case 'freeend-wave':
                // Update wave path
                this.updateWavePath(shape, x, y, size);
                break;
                
            case 'bracket-left':
                shape.setAttribute('d', this.createBracketPath('left', x, y, size));
                break;
                
            case 'bracket-right':
                shape.setAttribute('d', this.createBracketPath('right', x, y, size));
                break;
                
            case 'paren-left':
                shape.setAttribute('d', this.createParenPath('left', x, y, size));
                break;
                
            case 'paren-right':
                shape.setAttribute('d', this.createParenPath('right', x, y, size));
                break;
                
            case 'brace-left':
                shape.setAttribute('d', this.createBracePath('left', x, y, size));
                break;
                
            case 'brace-right':
                shape.setAttribute('d', this.createBracePath('right', x, y, size));
                break;
        }
    }
    
    // Update existing shape element to a different shape type
    updateShapeToType(shape, newShapeType, x, y, color, size, strokeWidth = null) {
        if (!shape) return;
        
        const currentType = shape.tagName.toLowerCase();
        const targetType = this.getTargetElementType(newShapeType);
        
        // If the SVG element type needs to change (e.g., circle to rect), we need to replace it
        if (currentType !== targetType) {
            const parent = shape.parentElement;
            const oldShape = shape;
            
            // Create new shape element
            const newShape = this.createSugarShape(x, y, newShapeType, color, size, strokeWidth);
            newShape.classList.add('sugar-shape');

            // Preserve stroke-related properties from the old shape onto the new one.
            try {
                // If the old shape is a grouped/divided shape, prefer reading stroke values
                // from its inner polygon/line elements. Otherwise fall back to attributes on
                // the container element itself.
                let oldStroke = null;
                let oldStrokeWidth = null;
                let oldDash = null;
                let oldStrokeOpacity = null;

                // Try to find inner elements that commonly hold stroke information
                const oldInnerPoly = oldShape.querySelector ? (oldShape.querySelector('polygon') || oldShape.querySelector('path') || oldShape.querySelector('ellipse') || oldShape.querySelector('rect')) : null;
                const oldInnerLine = oldShape.querySelector ? oldShape.querySelector('.dividing-line') : null;

                if (oldInnerPoly) {
                    oldStroke = oldInnerPoly.style.stroke || oldInnerPoly.getAttribute('stroke') || null;
                    oldStrokeWidth = oldInnerPoly.style.strokeWidth || oldInnerPoly.getAttribute('stroke-width') || null;
                    oldDash = oldInnerPoly.style.strokeDasharray || oldInnerPoly.getAttribute('stroke-dasharray') || null;
                    oldStrokeOpacity = oldInnerPoly.style.strokeOpacity || oldInnerPoly.getAttribute('stroke-opacity') || null;
                }

                // If the dividing line has stroke properties, prefer them for the line element
                if (oldInnerLine && !oldStroke) {
                    oldStroke = oldInnerLine.style.stroke || oldInnerLine.getAttribute('stroke') || oldStroke;
                }
                if (oldInnerLine && !oldStrokeWidth) {
                    oldStrokeWidth = oldInnerLine.style.strokeWidth || oldInnerLine.getAttribute('stroke-width') || oldStrokeWidth;
                }
                if (oldInnerLine && !oldDash) {
                    oldDash = oldInnerLine.style.strokeDasharray || oldInnerLine.getAttribute('stroke-dasharray') || oldDash;
                }
                if (oldInnerLine && !oldStrokeOpacity) {
                    oldStrokeOpacity = oldInnerLine.style.strokeOpacity || oldInnerLine.getAttribute('stroke-opacity') || oldStrokeOpacity;
                }

                // Fallback to container-level attributes if inner elements had no values
                if (!oldStroke) oldStroke = oldShape.style.stroke || oldShape.getAttribute('stroke') || null;
                if (!oldStrokeWidth) oldStrokeWidth = oldShape.style.strokeWidth || oldShape.getAttribute('stroke-width') || null;
                if (!oldDash) oldDash = oldShape.style.strokeDasharray || oldShape.getAttribute('stroke-dasharray') || null;
                if (!oldStrokeOpacity) oldStrokeOpacity = oldShape.style.strokeOpacity || oldShape.getAttribute('stroke-opacity') || null;

                // If newShape is a group (complex divided shape), apply to inner polygon and dividing line
                const innerPoly = newShape.querySelector ? newShape.querySelector('polygon') : null;
                const innerLine = newShape.querySelector ? newShape.querySelector('.dividing-line') : null;
                if (innerPoly) {
                    if (oldStroke) innerPoly.style.setProperty('stroke', oldStroke, 'important');
                    if (oldStrokeWidth) innerPoly.style.setProperty('stroke-width', oldStrokeWidth, 'important');
                    if (oldDash) innerPoly.style.setProperty('stroke-dasharray', oldDash, 'important');
                    if (oldStrokeOpacity) innerPoly.style.setProperty('stroke-opacity', oldStrokeOpacity, 'important');
                }
                if (innerLine) {
                    if (oldStroke) innerLine.style.setProperty('stroke', oldStroke, 'important');
                    if (oldStrokeWidth) innerLine.style.setProperty('stroke-width', oldStrokeWidth, 'important');
                    if (oldDash) innerLine.style.setProperty('stroke-dasharray', oldDash, 'important');
                    if (oldStrokeOpacity) innerLine.style.setProperty('stroke-opacity', oldStrokeOpacity, 'important');
                }

                // For simple elements, copy attributes directly
                if (!innerPoly && !innerLine) {
                    if (oldStroke) newShape.style.setProperty('stroke', oldStroke, 'important');
                    if (oldStrokeWidth) newShape.style.setProperty('stroke-width', oldStrokeWidth, 'important');
                    if (oldDash) newShape.style.setProperty('stroke-dasharray', oldDash, 'important');
                    if (oldStrokeOpacity) newShape.style.setProperty('stroke-opacity', oldStrokeOpacity, 'important');
                }
            } catch (e) {}

            // Replace the old shape with the new one
            parent.replaceChild(newShape, oldShape);
        } else {
            // Same element type, just update attributes
            this.updateShapeAttributes(shape, newShapeType, x, y, color, size, strokeWidth);
        }
    }
    
    // Get the SVG element type needed for a shape
    getTargetElementType(shapeType) {
        switch (shapeType) {
            case 'circle':
            case 'circle-filled':
                return 'circle';
            case 'circle-flat':
            case 'circle-narrow':
                return 'ellipse';
            case 'square':
            case 'square-flat':
            case 'square-narrow':
                return 'rect';
            case 'square-divided':
            case 'triangle-divided':
            case 'diamond-divided-top':
            case 'diamond-divided-bottom':
                return 'g'; // These are complex shapes with gradients and multiple elements
            case 'triangle':
            case 'triangle-filled':
            case 'triangle-inverted':
            case 'diamond':
            case 'diamond-flat':
            case 'diamond-narrow':
            case 'star':
            case 'star-5':
            case 'star-5-inverted':
            case 'star-4':
            case 'star-4-tilted':
            case 'star-6':
            case 'star-6-tilted':
            case 'hexagon':
            case 'flat-hexagon':
            case 'hexagon-compressed':
            case 'flat-hexagon-compressed':
            case 'flat-diamond':
            case 'pentagon':
            case 'pentagon-inverted':
                return 'polygon';
            default:
                return 'polygon'; // Default for complex shapes
        }
    }
    
    // Update shape attributes for same element type
    updateShapeAttributes(shape, shapeType, x, y, color, size, strokeWidth = null) {
        const actualSize = size || this.sugarRadius;
    // Determine effective stroke width: use provided strokeWidth, otherwise use currentSugarConfig or fallback 3
    const actualStrokeWidth = (strokeWidth !== null && strokeWidth !== undefined) ? strokeWidth : (this.currentSugarConfig?.borderWidth ?? 3);
        
        // Update position and size attributes based on shape type
        switch (shapeType) {
            case 'circle':
            case 'circle-filled':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('r', actualSize);
                break;
                
            case 'circle-flat':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', actualSize * 1.4);
                shape.setAttribute('ry', actualSize * 0.7);
                break;
                
            case 'circle-narrow':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', actualSize * 0.7);
                shape.setAttribute('ry', actualSize * 1.4);
                break;
                
            case 'square':
                shape.setAttribute('x', x - actualSize);
                shape.setAttribute('y', y - actualSize);
                shape.setAttribute('width', actualSize * 2);
                shape.setAttribute('height', actualSize * 2);
                break;
                
            case 'square-flat':
                shape.setAttribute('x', x - actualSize);
                shape.setAttribute('y', y - actualSize * 0.7);
                shape.setAttribute('width', actualSize * 2);
                shape.setAttribute('height', actualSize * 1.4);
                break;
                
            case 'square-narrow':
                shape.setAttribute('x', x - actualSize * 0.7);
                shape.setAttribute('y', y - actualSize);
                shape.setAttribute('width', actualSize * 1.4);
                shape.setAttribute('height', actualSize * 2);
                break;
                
            case 'triangle':
            case 'triangle-filled':
                const triPoints = `${x},${y-actualSize} ${x+actualSize*0.866},${y+actualSize*0.5} ${x-actualSize*0.866},${y+actualSize*0.5}`;
                shape.setAttribute('points', triPoints);
                break;
                
            case 'triangle-inverted':
                const triInvPoints = `${x},${y+actualSize} ${x+actualSize*0.866},${y-actualSize*0.5} ${x-actualSize*0.866},${y-actualSize*0.5}`;
                shape.setAttribute('points', triInvPoints);
                break;
                
            case 'diamond':
                const diamondPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                shape.setAttribute('points', diamondPoints);
                break;
                
            case 'diamond-flat':
                const diamondFlatPoints = `${x},${y-actualSize*0.7} ${x+actualSize*1.4},${y} ${x},${y+actualSize*0.7} ${x-actualSize*1.4},${y}`;
                shape.setAttribute('points', diamondFlatPoints);
                break;
                
            case 'diamond-narrow':
                const diamondNarrowPoints = `${x},${y-actualSize*1.4} ${x+actualSize*0.7},${y} ${x},${y+actualSize*1.4} ${x-actualSize*0.7},${y}`;
                shape.setAttribute('points', diamondNarrowPoints);
                break;
                
            case 'star-5':
                const star5Points = this.generateStarPoints(x, y, actualSize, 5, 0);
                shape.setAttribute('points', star5Points);
                break;
                
            case 'diamond-divided-top':
                // For complex shapes like diamond-divided-top, we need to replace the entire element
                // since it involves gradients and multiple elements
                console.warn('Cannot update diamond-divided-top in place, need full replacement');
                // This will be handled by the element replacement logic in updateShapeToType
                break;
                
            // Add other shape types as needed...
        }
        
        // Update color and stroke based on shape type
        const normalizedFillColor = this.normalizeColorToHex(color);
        
        if (shapeType === 'freeend-asterisk') {
            // Asterisk text - use color for fill, no stroke
            shape.style.setProperty('fill', normalizedFillColor, 'important');
            shape.style.removeProperty('stroke');
            shape.style.removeProperty('stroke-width');
        } else if (shapeType === 'freeend-wave') {
            // Wave line - use color for stroke
            shape.style.setProperty('stroke', normalizedFillColor, 'important');
            shape.style.setProperty('stroke-width', actualStrokeWidth, 'important');
            shape.style.removeProperty('fill');
        } else if (shapeType === 'bracket-left' || shapeType === 'bracket-right' || 
                   shapeType === 'paren-left' || shapeType === 'paren-right' ||
                   shapeType === 'brace-left' || shapeType === 'brace-right') {
            // Bracket and parenthesis path shapes - use color for stroke
            shape.style.setProperty('stroke', normalizedFillColor, 'important');
            shape.style.setProperty('stroke-width', actualStrokeWidth, 'important');
            shape.style.removeProperty('fill');
        } else {
            // Regular shapes - use color for fill.
            shape.style.setProperty('fill', normalizedFillColor, 'important');

            // Ensure stroke and stroke-width exist: prefer existing attribute/style, otherwise use defaults
            const existingStroke = shape.style.stroke || shape.getAttribute('stroke');
            const existingStrokeWidth = shape.style.strokeWidth || shape.getAttribute('stroke-width');

            const effectiveStroke = existingStroke || (this.currentSugarConfig?.borderColor ? this.normalizeColorToHex(this.currentSugarConfig.borderColor) : '#000000');
            const effectiveStrokeWidth = existingStrokeWidth || actualStrokeWidth;

            if (effectiveStroke) shape.style.setProperty('stroke', effectiveStroke, 'important');
            if (effectiveStrokeWidth) shape.style.setProperty('stroke-width', effectiveStrokeWidth, 'important');
        }
    }

    updateConnectedLines(sugar, oldX, oldY, newX, newY) {
        const sugarId = sugar.getAttribute('id');
        const connections = this.canvas.querySelectorAll('.connection');
        
        connections.forEach(line => {
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            
            // Check if this line is connected to the moved sugar
            let updated = false;
            if (Math.abs(x1 - oldX) < 1 && Math.abs(y1 - oldY) < 1) {
                // This line starts from the moved sugar
                line.setAttribute('x1', newX);
                line.setAttribute('y1', newY);
                updated = true;
            } else if (Math.abs(x2 - oldX) < 1 && Math.abs(y2 - oldY) < 1) {
                // This line ends at the moved sugar
                line.setAttribute('x2', newX);
                line.setAttribute('y2', newY);
                updated = true;
            }
            
            // Update linkage text position if this connection was updated
            if (updated) {
                this.updateLinkageText(line);
            }
        });
    }
    
    applySugarConfig(sugar, config) {
        // Update sugar attributes
        sugar.setAttribute('data-shape', config.shape);
        sugar.setAttribute('data-color', config.color);
        
        if (config.type === 'preset') {
            sugar.setAttribute('data-preset', config.preset);
        } else {
            sugar.removeAttribute('data-preset');
        }
        
        // Get current position
        const x = parseFloat(sugar.getAttribute('data-x'));
        const y = parseFloat(sugar.getAttribute('data-y'));
        
        // Remove old shape
        const oldShape = sugar.querySelector('.sugar-shape');
        if (oldShape) {
            oldShape.remove();
        }
        
        // Create new shape
        const newShape = this.createSugarShape(x, y, config.shape, config.color);
        newShape.classList.add('sugar-shape');
        sugar.appendChild(newShape);
    }
    
    // 新的统一选择UI更新方法
    updateSelectionUI() {
        const selectedElements = Array.from(this.selectedElements);
        
        if (selectedElements.length === 0) {
            this.clearUISelections(); // 使用不同的方法名避免循环调用
            return;
        }
        
        // 获取所有选中元素的糖数据
        const sugarDataList = selectedElements
            .filter(element => element && element.classList && element.classList.contains('sugar'))
            .map(element => ({
                shape: element.getAttribute('data-shape'),
                color: element.getAttribute('data-color'),
                preset: element.getAttribute('data-preset'),
                size: parseFloat(element.getAttribute('data-size')) || 20
            }))
            .filter(data => data.shape && data.color);
            
        if (sugarDataList.length === 0) {
            this.clearAllSelections();
            return;
        }
        
        if (sugarDataList.length === 1) {
            // 单个选择
            this.updateSingleSelectionUI(sugarDataList[0]);
        } else {
            // 多个选择
            this.updateMultipleSelectionUI(sugarDataList);
        }
    }
    
    // 单个元素选择的UI更新
    updateSingleSelectionUI(sugarData) {
        console.log('Updating UI for single selected sugar:', sugarData);
        
        // Safety check to prevent shape from being reset
        if (!sugarData.shape) {
            console.warn('No shape data found for selected sugar');
            return;
        }
        
        // 定义默认调色板颜色
        const defaultColors = [
            '#0072BC', '#00A651', '#FFD400', '#8FCCE9', 
            '#F69EA1', '#A54399', '#A17A4D', '#F47920',
            '#ED1C24', '#FFFFFF', '#808080', '#000000'
        ];
        
        // 清除所有UI选择状态（仅仅清除视觉选中状态，不影响参数）
        this.clearUISelections();
        
        // 更新选中糖分子的显示颜色（不影响添加模式参数）
        const selectedSugar = Array.from(this.selectedElements).find(el => el.classList.contains('sugar'));
        let effectiveFillColor = sugarData.color;
        if (selectedSugar) {
            const shape = selectedSugar.querySelector('.sugar-shape');
            if (shape) {
                effectiveFillColor = this.getEffectiveFillColor(shape);
            }
        }
        
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        if (customSugarColor && effectiveFillColor) {
            customSugarColor.value = effectiveFillColor;
        }
        if (customSugarColorHex && effectiveFillColor) {
            customSugarColorHex.value = effectiveFillColor;
        }
        
        // 更新形状按钮 - 显示实际形状 (主按钮和下拉项目)
        const mappedShape = this.mapLegacyShape(sugarData.shape);
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            if (btn.dataset.shape === mappedShape) {
                btn.classList.add('active');
            }
        });
        document.querySelectorAll('.shape-dropdown-item').forEach(item => {
            if (item.dataset.shape === mappedShape) {
                item.classList.add('active');
                // Also activate the parent category
                const category = item.closest('.shape-category');
                if (category) {
                    category.classList.add('active');
                    const mainBtn = category.querySelector('.shape-main-btn');
                    if (mainBtn) mainBtn.classList.add('active');
                }
            }
        });
        
        // 更新新的形状选择器 - 显示实际子形状
        if (this.updateShapeSelectorFromSelection) {
            this.updateShapeSelectorFromSelection([sugarData.shape]);
        }
        
        // 更新颜色按钮 - 只有在默认调色板中的颜色才显示选中
        const normalizedSugarColor = this.normalizeColorToHex(sugarData.color);
        document.querySelectorAll('.color-btn').forEach(btn => {
            if (btn.dataset.color === normalizedSugarColor && defaultColors.includes(normalizedSugarColor)) {
                btn.classList.add('active');
            }
        });
        
        // 更新边框颜色预设按钮 - 获取选中糖的边框颜色并激活匹配的预设按钮
        const selectedSugarForBorder = Array.from(this.selectedElements).find(el => el.classList.contains('sugar'));
        if (selectedSugarForBorder) {
            const shape = selectedSugarForBorder.querySelector('.sugar-shape');
            if (shape) {
                const borderColor = shape.style.stroke || shape.getAttribute('stroke') || '#000000';
                const normalizedBorderColor = this.normalizeColorToHex(borderColor);
                
                // 激活匹配的边框颜色预设按钮
                document.querySelectorAll('.color-btn-compact[data-target="sugarBorderColor"]').forEach(btn => {
                    if (btn.dataset.color === normalizedBorderColor) {
                        btn.classList.add('active');
                    }
                });
            }
        }
        
        // 查找匹配的SNFG预设
        let matchingPreset = null;
        const presetMappedShape = this.mapLegacyShape(sugarData.shape);
        for (const [presetKey, presetConfig] of Object.entries(this.snfgPresets)) {
            if (presetConfig.shape === presetMappedShape && presetConfig.color === normalizedSugarColor) {
                matchingPreset = presetKey;
                break;
            }
        }
        
        // 更新SNFG预设按钮 - 如果匹配则显示选中
        document.querySelectorAll('.snfg-btn, .preset-item').forEach(btn => {
            if (btn.dataset.preset === matchingPreset) {
                btn.classList.add('active');
            }
        });
        
        // 更新尺寸显示（仅显示，不修改添加模式参数）
        const sizeDisplay = document.getElementById('sugarSizeDisplay');
        if (sizeDisplay) {
            sizeDisplay.textContent = sugarData.size;
        }
        
        const sizeSlider = document.getElementById('sugarSize');
        if (sizeSlider) {
            sizeSlider.value = sugarData.size;
        }
        
        // 重要：不修改 this.currentSugarConfig！
        // 选中糖分子的显示与添加新糖的参数应该是独立的
        // this.currentSugarConfig 应该保持上次选择的添加参数不变
    }
    
    // 多个元素选择的UI更新
    updateMultipleSelectionUI(sugarDataList) {
        console.log('Updating UI for multiple selected sugars:', sugarDataList);
        
        // 定义默认调色板颜色
        const defaultColors = [
            '#0072BC', '#00A651', '#FFD400', '#8FCCE9', 
            '#F69EA1', '#A54399', '#A17A4D', '#F47920',
            '#ED1C24', '#FFFFFF', '#808080', '#000000'
        ];
        
        // 清除所有UI选择状态（仅仅清除视觉选中状态）
        this.clearUISelections();
        
        // 检查各属性一致性
        const shapes = [...new Set(sugarDataList.map(data => data.shape))];
        const colors = [...new Set(sugarDataList.map(data => this.normalizeColorToHex(data.color)))];
        const sizes = [...new Set(sugarDataList.map(data => data.size))];
        
        // 多选时，如果参数不一致，不显示具体内容（按照需求）
        
        // 更新形状按钮 - 只有当所有选中元素形状相同时才显示选中
        if (shapes.length === 1) {
            const mappedShape = this.mapLegacyShape(shapes[0]);
            document.querySelectorAll('.shape-main-btn').forEach(btn => {
                if (btn.dataset.shape === mappedShape) {
                    btn.classList.add('active');
                }
            });
            document.querySelectorAll('.shape-dropdown-item').forEach(item => {
                const isActive = item.dataset.shape === mappedShape;
                item.classList.toggle('active', isActive);
                if (isActive) {
                    const category = item.closest('.shape-category');
                    if (category) {
                        category.classList.add('active');
                        const mainBtn = category.querySelector('.shape-main-btn');
                        if (mainBtn) mainBtn.classList.add('active');
                    }
                }
            });
            
            // 更新形状选择器
            if (this.updateShapeSelectorFromSelection) {
                this.updateShapeSelectorFromSelection(shapes);
            }
        }
        
        // 更新颜色按钮 - 只有当所有选中元素颜色相同且在默认调色板中时才显示选中
        if (colors.length === 1 && defaultColors.includes(colors[0])) {
            document.querySelectorAll('.color-btn').forEach(btn => {
                if (btn.dataset.color === colors[0]) {
                    btn.classList.add('active');
                }
            });
        }
        
        // 更新边框颜色预设按钮 - 检查所有选中糖的边框颜色是否相同
        const selectedSugars = Array.from(this.selectedElements).filter(el => el.classList.contains('sugar'));
        if (selectedSugars.length > 0) {
            const borderColors = [...new Set(selectedSugars.map(sugar => {
                const shape = sugar.querySelector('.sugar-shape');
                if (shape) {
                    const borderColor = shape.style.stroke || shape.getAttribute('stroke') || '#000000';
                    return this.normalizeColorToHex(borderColor);
                }
                return null;
            }).filter(color => color !== null))];
            
            // 如果所有选中糖的边框颜色相同，激活对应的预设按钮
            if (borderColors.length === 1) {
                document.querySelectorAll('.color-btn-compact[data-target="sugarBorderColor"]').forEach(btn => {
                    if (btn.dataset.color === borderColors[0]) {
                        btn.classList.add('active');
                    }
                });
            }
        }
        
        // 检查SNFG预设匹配 - 只有当所有选中元素都匹配同一个预设时才显示选中
        let commonPreset = null;
        if (shapes.length === 1 && colors.length === 1) {
            const multiMappedShape = this.mapLegacyShape(shapes[0]);
            for (const [presetKey, presetConfig] of Object.entries(this.snfgPresets)) {
                if (presetConfig.shape === multiMappedShape && presetConfig.color === colors[0]) {
                    commonPreset = presetKey;
                    break;
                }
            }
        }
        
        document.querySelectorAll('.snfg-btn, .preset-item').forEach(btn => {
            if (btn.dataset.preset === commonPreset) {
                btn.classList.add('active');
            }
        });
        
        // 更新颜色显示 - 如果颜色一致则显示该颜色，否则不显示任何颜色
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        
        if (colors.length === 1) {
            // 颜色一致，显示该颜色
            if (customSugarColor) {
                customSugarColor.value = colors[0];
                customSugarColor.classList.remove('mixed');
            }
            if (customSugarColorHex) {
                customSugarColorHex.value = colors[0];
                customSugarColorHex.classList.remove('mixed');
            }
        } else {
            // 颜色不一致，显示混合状态
            if (customSugarColor) {
                customSugarColor.classList.add('mixed');
            }
            if (customSugarColorHex) {
                customSugarColorHex.value = window.languageManager.getTranslation('mixed') || 'Mixed';
                customSugarColorHex.classList.add('mixed');
            }
        }
        
        // 更新尺寸显示 - 如果尺寸一致则显示该尺寸，否则显示混合状态
        const sizeDisplay = document.getElementById('sugarSizeDisplay');
        const sizeSlider = document.getElementById('sugarSize');
        
        if (sizes.length === 1) {
            if (sizeDisplay) sizeDisplay.textContent = sizes[0];
            if (sizeSlider) {
                sizeSlider.value = sizes[0];
                sizeSlider.classList.remove('mixed');
            }
        } else {
            if (sizeDisplay) sizeDisplay.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
            if (sizeSlider) {
                sizeSlider.classList.add('mixed');
            }
        }
        
        // 重要：不修改 this.currentSugarConfig！
        // 多选时不应该影响添加新糖的参数
    }
    
    // 清除UI选择状态（不触发其他更新）
    clearUISelections() {
        document.querySelectorAll('.shape-main-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.shape-dropdown-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.color-btn-compact').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.snfg-btn, .preset-item').forEach(btn => btn.classList.remove('active'));
        
        // 清除新形状选择器的选择状态
        document.querySelectorAll('.shape-category').forEach(cat => cat.classList.remove('active'));
        document.querySelectorAll('.shape-main-btn').forEach(btn => btn.classList.remove('active'));
        
        const sizeDisplay = document.getElementById('sugarSizeDisplay');
        if (sizeDisplay) sizeDisplay.textContent = '20';
        
        const sizeSlider = document.getElementById('sugarSize');
        if (sizeSlider) sizeSlider.value = '20';
    }
    
    updateUIForSelectedSugar(sugar) {
        // 保持向后兼容性，但使用新的统一方法
        this.updateSelectionUI();
    }
    
    getTextAtPoint(x, y) {
        const texts = this.canvas.querySelectorAll('.text-element');
        for (let text of texts) {
            const textX = parseFloat(text.getAttribute('data-x'));
            const textY = parseFloat(text.getAttribute('data-y'));
            const bbox = text.getBBox();
            
            if (x >= textX && x <= textX + bbox.width &&
                y >= textY - bbox.height && y <= textY) {
                return text;
            }
        }
        return null;
    }
    
    createText(x, y, content = 'Text', autoEdit = true) {
        this.textCount++;
        
        // Create text element
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.classList.add('text-element');
        textElement.setAttribute('id', `text-${this.textCount}`);
        textElement.setAttribute('x', x);
        textElement.setAttribute('y', y);
        textElement.setAttribute('data-x', x);
        textElement.setAttribute('data-y', y);
        textElement.textContent = content;
        
        // Get current text configuration when in text tool mode
        let textConfig = { fontSize: 16, fontFamily: 'Arial', color: '#2c3e50', opacity: 1, bold: false, italic: false, underline: false };
        if (this.currentTool === 'text') {
            textConfig = this.getCurrentTextConfig();
        }
        
        // Set styles from configuration
        textElement.style.setProperty('font-family', textConfig.fontFamily, 'important');
        textElement.style.setProperty('font-size', `${textConfig.fontSize}px`, 'important');
        const normalizedTextColor = this.normalizeColorToHex(textConfig.color);
        textElement.style.setProperty('fill', normalizedTextColor, 'important');
        
        if (textConfig.opacity !== undefined) {
            textElement.style.setProperty('fill-opacity', textConfig.opacity, 'important');
        }
        
        if (textConfig.bold) {
            textElement.style.setProperty('font-weight', 'bold', 'important');
        }
        if (textConfig.italic) {
            textElement.style.setProperty('font-style', 'italic', 'important');
        }
        if (textConfig.underline) {
            textElement.style.setProperty('text-decoration', 'underline', 'important');
        }
        
        // Add to canvas
        this.canvas.appendChild(textElement);
        
        // Record creation for undo/redo system
        const objectData = this.createObjectData(textElement);
        if (objectData) {
            this.recordObjectAdded(objectData);
        }
        
        // If content is default and autoEdit is enabled, immediately edit it
        if (content === 'Text' && autoEdit) {
            setTimeout(() => this.editText(textElement), 10);
        }
        
        return textElement;
    }
    
    editText(textElement) {
        // If already editing, don't start another edit
        if (this.isEditingText) {
            return;
        }
        
        this.isEditingText = true;
        
        const x = parseFloat(textElement.getAttribute('data-x'));
        const y = parseFloat(textElement.getAttribute('data-y'));
        
        // Use SVG coordinate transformation to get screen position
        const svgPoint = this.canvas.createSVGPoint();
        svgPoint.x = x;
        svgPoint.y = y;
        
        // Transform SVG coordinates to screen coordinates
        const screenPoint = svgPoint.matrixTransform(this.canvas.getScreenCTM());
        
        // Create input box
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-input-box';
        input.value = textElement.textContent;
        input.style.left = screenPoint.x + 'px';
        input.style.top = (screenPoint.y - 20) + 'px';
        
        // Add to document
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        // Handle input completion
        const finishEdit = () => {
            const newText = input.value.trim();
            const originalText = textElement.textContent;
            
            if (newText && newText !== originalText) {
                // Record the text content change as an undo step
                this.startStep('Edit text');
                const beforeData = this.createObjectData(textElement);
                textElement.textContent = newText;
                const afterData = this.createObjectData(textElement);
                this.recordObjectModified(textElement.getAttribute('id'), beforeData, afterData);
                this.finishStep();
            } else if (!newText) {
                // If empty, delete the text element (this already records undo in deleteText)
                this.deleteText(textElement);
            }
            // If newText === originalText, no change needed, no undo step required
            
            document.body.removeChild(input);
            
            // Delay resetting isEditingText to prevent immediate new text creation
            setTimeout(() => {
                this.isEditingText = false;
            }, 100);
        };
        
        const cancelEdit = () => {
            document.body.removeChild(input);
            
            // Delay resetting isEditingText to prevent immediate new text creation
            setTimeout(() => {
                this.isEditingText = false;
            }, 100);
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }
    
    finishTextEditing() {
        // Find any active text input boxes and finish their editing
        const textInputs = document.querySelectorAll('.text-input-box');
        textInputs.forEach(input => {
            // Trigger blur event to save the text
            input.blur();
        });
    }
    
    moveText(textElement, newX, newY) {
        textElement.setAttribute('x', newX);
        textElement.setAttribute('y', newY);
        textElement.setAttribute('data-x', newX);
        textElement.setAttribute('data-y', newY);
        
        // Update highlight position if this text is selected
        if (textElement.classList.contains('selected') || this.selectedTexts.has(textElement)) {
            this.removeTextSelectionHighlight(textElement);
            this.addTextSelectionHighlight(textElement);
        }
    }
    
    deleteText(textElement) {
        // Record removal for undo/redo system before actually deleting
        const textId = textElement.getAttribute('id');
        this.recordObjectRemoved(textId);
        
        if (this.selectedText === textElement) {
            this.selectedText = null;
        }
        // Remove from multiple selection if selected
        this.selectedTexts.delete(textElement);
        
        // Remove text selection highlight before deleting
        this.removeTextSelectionHighlight(textElement);
        textElement.remove();
    }
    
    startLongPress(sugar, event) {
        this.connectionStartSugar = sugar;
        
        // Set a timer for long press detection
        this.longPressTimer = setTimeout(() => {
            // Long press detected, start connection dragging
            this.isConnectionDragging = true;
            this.highlightConnectionStart(sugar);
            
            // Show add preview dot at start position initially
            if (this.addPreviewDot) {
                const startX = parseFloat(sugar.getAttribute('data-x'));
                const startY = parseFloat(sugar.getAttribute('data-y'));
                this.addPreviewDot.setAttribute('cx', startX);
                this.addPreviewDot.setAttribute('cy', startY);
                this.addPreviewDot.style.display = 'block';
            }
            
            // Change cursor to indicate connection mode
            this.canvas.style.cursor = 'crosshair';
            
            // Set a flag to prevent click event processing
            this.preventNextClick = true;
            
            // Prevent regular click handling
            event.preventDefault();
        }, this.longPressDelay);
    }
    
    endConnectionDragging() {
        this.isConnectionDragging = false;
        this.connectionStartSugar = null;
        this.connectionTargetSugar = null;
        
        // Clear highlights
        this.clearConnectionStartHighlight();
        this.clearConnectionTargetHighlight();
        
        // Hide add preview dot
        if (this.addPreviewDot) {
            this.addPreviewDot.style.display = 'none';
        }
        
        // Reset cursor
        this.canvas.style.cursor = '';
        
        // Set flag to prevent next click from creating a sugar
        setTimeout(() => {
            this.preventNextClick = false;
        }, 50);
    }
    
    highlightConnectionStart(sugar) {
        // Remove existing start highlight
        this.clearConnectionStartHighlight();
        
        const x = parseFloat(sugar.getAttribute('data-x'));
        const y = parseFloat(sugar.getAttribute('data-y'));
        
        // Create start highlight (green circle)
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.classList.add('connection-start-highlight');
        highlight.setAttribute('cx', x);
        highlight.setAttribute('cy', y);
        // Use actual sugar size for connection start highlight
        const actualSize = this.getSugarSize(sugar);
        highlight.setAttribute('r', actualSize + 8);
        highlight.setAttribute('fill', 'none');
        highlight.setAttribute('stroke', '#00A651');
        highlight.setAttribute('stroke-width', '3');
        highlight.setAttribute('stroke-dasharray', '8,4');
        highlight.setAttribute('pointer-events', 'none');
        
        // Insert before the sugar so it appears behind
        this.canvas.insertBefore(highlight, sugar);
    }
    
    clearConnectionStartHighlight() {
        const highlights = this.canvas.querySelectorAll('.connection-start-highlight');
        highlights.forEach(highlight => highlight.remove());
    }
    
    highlightConnectionTarget(sugar) {
        const x = parseFloat(sugar.getAttribute('data-x'));
        const y = parseFloat(sugar.getAttribute('data-y'));
        
        // Create target highlight (orange circle)
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.classList.add('connection-target-highlight');
        highlight.setAttribute('cx', x);
        highlight.setAttribute('cy', y);
        // Use actual sugar size for connection target highlight
        const actualSize = this.getSugarSize(sugar);
        highlight.setAttribute('r', actualSize + 6);
        highlight.setAttribute('fill', 'none');
        highlight.setAttribute('stroke', '#F47920');
        highlight.setAttribute('stroke-width', '3');
        highlight.setAttribute('stroke-dasharray', '6,3');
        highlight.setAttribute('pointer-events', 'none');
        
        // Insert before the sugar so it appears behind
        this.canvas.insertBefore(highlight, sugar);
    }
    
    clearConnectionTargetHighlight() {
        const highlights = this.canvas.querySelectorAll('.connection-target-highlight');
        highlights.forEach(highlight => highlight.remove());
    }
    
    // Check if two sugars are already connected
    areConnected(sugar1, sugar2) {
        const x1 = parseFloat(sugar1.getAttribute('data-x'));
        const y1 = parseFloat(sugar1.getAttribute('data-y'));
        const x2 = parseFloat(sugar2.getAttribute('data-x'));
        const y2 = parseFloat(sugar2.getAttribute('data-y'));
        
        const connections = this.canvas.querySelectorAll('.connection');
        
        for (let line of connections) {
            const lx1 = parseFloat(line.getAttribute('x1'));
            const ly1 = parseFloat(line.getAttribute('y1'));
            const lx2 = parseFloat(line.getAttribute('x2'));
            const ly2 = parseFloat(line.getAttribute('y2'));
            
            // Check both directions
            if ((Math.abs(lx1 - x1) < 1 && Math.abs(ly1 - y1) < 1 &&
                 Math.abs(lx2 - x2) < 1 && Math.abs(ly2 - y2) < 1) ||
                (Math.abs(lx1 - x2) < 1 && Math.abs(ly1 - y2) < 1 &&
                 Math.abs(lx2 - x1) < 1 && Math.abs(ly2 - y1) < 1)) {
                return true;
            }
        }
        return false;
    }
    
    createConnection(parentSugar, childSugar, skipDefaultStyling = false, linkageInfo = null) {
        // Handle reversed linkage direction if in add mode
        if (this.currentTool === 'add' && this.currentLinkageConfig.reversed) {
            // Swap parent and child to reverse the direction
            [parentSugar, childSugar] = [childSugar, parentSugar];
        }
        
        // Check if already connected
        if (this.areConnected(parentSugar, childSugar)) {
            return; // Don't create duplicate connections
        }
        
        const parentX = parseFloat(parentSugar.getAttribute('data-x'));
        const parentY = parseFloat(parentSugar.getAttribute('data-y'));
        const childX = parseFloat(childSugar.getAttribute('data-x'));
        const childY = parseFloat(childSugar.getAttribute('data-y'));
        
        // Create connection line between centers
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('connection');
        line.setAttribute('x1', parentX);
        line.setAttribute('y1', parentY);
        line.setAttribute('x2', childX);
        line.setAttribute('y2', childY);
        
        // Set linkage information (default to unknown if not provided)
        const normalizedLinkage = linkageInfo ? this.normalizeLinkage(linkageInfo) : '??-?';
        line.setAttribute('data-linkage', normalizedLinkage);
        
        // Set linkage visibility based on mode
        if (this.currentTool === 'add') {
            // In add mode, use showText from currentLinkageConfig
            line.setAttribute('data-linkage-visible', this.currentLinkageConfig.showText ? 'true' : 'false');
        } else {
            // In other modes, default to false to match the default behavior when adding sugars
            line.setAttribute('data-linkage-visible', 'false');
        }
        
        // Apply styling based on current linkage settings or defaults
        if (!skipDefaultStyling) {
            // Get current linkage style settings from currentLinkageConfig or UI
            let width, color, opacity, style;
            
            if (this.currentTool === 'add') {
                // In add mode, use currentLinkageConfig
                width = this.currentLinkageConfig.strokeWidth || 2;
                color = this.currentLinkageConfig.strokeColor || '#000000';
                opacity = this.currentLinkageConfig.strokeOpacity || 1;
                style = this.currentLinkageConfig.strokeStyle || 'solid';
            } else {
                // In other modes, use UI values
                width = document.getElementById('connectionStrokeWidth')?.value || '2';
                color = document.getElementById('connectionColor')?.value || '#000000';
                opacity = document.getElementById('linkageOpacity')?.value || '1';
                
                // Get active style button for dash pattern
                const styleBtn = document.querySelector('.connection-style-btn.active');
                style = styleBtn ? styleBtn.dataset.style : 'solid';
            }
            
            // Debug logging
            console.log('CreateConnection - applying styles:', {
                width: width,
                color: color,
                opacity: opacity,
                style: style,
                linkage: normalizedLinkage,
                mode: this.currentTool
            });
            
            // Normalize color to hex format before applying
            const normalizedColor = this.normalizeColorToHex(color);
            
            // Apply the settings to the line using style properties to override CSS
            line.style.setProperty('stroke', normalizedColor, 'important');
            line.style.setProperty('stroke-width', width, 'important');
            line.style.setProperty('stroke-opacity', opacity, 'important');
            
            console.log('Applied styles with !important:', {
                stroke: normalizedColor,  // Show the hex value we actually applied
                strokeWidth: width,
                strokeOpacity: opacity,
                computedStrokeWidth: getComputedStyle(line).strokeWidth
            });
            
            // Apply dash pattern based on style
            switch (style) {
                case 'dashed':
                    line.setAttribute('stroke-dasharray', `${width * 4},${width * 2}`);
                    break;
                case 'dotted':
                    line.setAttribute('stroke-dasharray', `${width},${width}`);
                    break;
                default: // solid
                    // Remove any existing dasharray
                    line.removeAttribute('stroke-dasharray');
            }
            
            // Store text style preferences from currentLinkageConfig when in add mode
            if (this.currentTool === 'add') {
                  line.setAttribute('data-text-size', this.currentLinkageConfig.textSize || 12);
                  line.setAttribute('data-text-color', this.currentLinkageConfig.textColor || '#000000');
                  line.setAttribute('data-text-font-family', this.currentLinkageConfig.textFontFamily || 'Arial');
                  line.setAttribute('data-text-opacity', this.currentLinkageConfig.textOpacity != null ? this.currentLinkageConfig.textOpacity : 1);
                  if (this.currentLinkageConfig.textStyle) {
                     line.setAttribute('data-text-bold', this.currentLinkageConfig.textStyle.bold ? 'true' : 'false');
                     line.setAttribute('data-text-italic', this.currentLinkageConfig.textStyle.italic ? 'true' : 'false');
                     line.setAttribute('data-text-underline', this.currentLinkageConfig.textStyle.underline ? 'true' : 'false');
                  }
            }
        }
        
        // Store sugar IDs for style management
        line.setAttribute('data-start', parentSugar.getAttribute('id'));
        line.setAttribute('data-end', childSugar.getAttribute('id'));
        // Assign deterministic connection id based on sugar numbers (connection-<min>-<max>)
        try {
            const startId = parentSugar.getAttribute('id');
            const endId = childSugar.getAttribute('id');
            let connId = this.computeConnectionId(startId, endId);
            // Avoid collision: if id already exists, append a suffix
            if (document.getElementById(connId)) {
                let suffix = 1;
                while (document.getElementById(connId + `-${suffix}`)) suffix++;
                connId = `${connId}-${suffix}`;
            }
            line.setAttribute('id', connId);
        } catch (e) {
            // fallback to generated id
            if (!line.getAttribute('id')) line.setAttribute('id', this.generateUniqueId('connection'));
        }
        
        // Insert line before sugars so it appears behind them
        this.canvas.insertBefore(line, this.canvas.firstChild);
        
        // Create linkage text label if checkbox is checked
        this.updateLinkageText(line);
        
        // Record creation for undo/redo system
        const objectData = this.createObjectData(line);
        if (objectData) {
            this.recordObjectAdded(objectData);
        }
        
        return line; // Return the created line for further styling if needed
    }
    
    // Normalize linkage information to standard format
    normalizeLinkage(linkage) {
        if (!linkage || linkage.trim() === '') return '??-?';

        // Normalize whitespace and to lower-case for easier parsing
        let s = ('' + linkage).trim();

        // Replace ASCII A/a and B/b with Greek α/β equivalents (accept both cases)
        s = s.replace(/A/gi, 'α');
        s = s.replace(/B/gi, 'β');

        // Replace common latin alternatives that users might type (like "a"/"b")
        s = s.replace(/^a/iu, 'α');
        s = s.replace(/^b/iu, 'β');

        // Remove surrounding spaces
        s = s.replace(/\s+/g, '');

        // Now possible valid forms:
        // 1) single greek letter: "α" or "β"
        // 2) greek + digits with optional dash: "α1-2", "α12" (means 1-2), "β13" (means 1-3)
        // 3) already normalized forms

        // Accept single-letter forms
        if (/^[αβ]$/i.test(s)) return s;

        // Match greek + digits (with or without dash)
        const m = s.match(/^([αβ])(\d+)(?:-(\d+))?$/i);
        if (m) {
            const letter = m[1];
            const numA = m[2];
            const numB = m[3];

            // If both numbers are provided via dash, use them
            if (numB !== undefined) {
                return `${letter}${numA}-${numB}`;
            }

            // If only one numeric string provided, try to split into two single-digit numbers
            if (numA.length === 2) {
                const a = numA.charAt(0);
                const b = numA.charAt(1);
                if (/^\d$/.test(a) && /^\d$/.test(b)) {
                    return `${letter}${a}-${b}`;
                }
            }

            // If more than 2 digits or cannot interpret, fallback to unknown
            return '??-?';
        }

        // Also accept inputs where user typed greek name words like 'alpha'/'beta' (lower/upper)
        const alphaMatch = s.match(/^(alpha)(\d+)(?:-(\d+))?$/i);
        if (alphaMatch) {
            const numA = alphaMatch[2];
            const numB = alphaMatch[3];
            if (numB !== undefined) return `α${numA}-${numB}`;
            if (numA.length === 2) return `α${numA.charAt(0)}-${numA.charAt(1)}`;
            return '??-?';
        }
        const betaMatch = s.match(/^(beta)(\d+)(?:-(\d+))?$/i);
        if (betaMatch) {
            const numA = betaMatch[2];
            const numB = betaMatch[3];
            if (numB !== undefined) return `β${numA}-${numB}`;
            if (numA.length === 2) return `β${numA.charAt(0)}-${numA.charAt(1)}`;
            return '??-?';
        }

        // If none matched, it's unformattable
        return '??-?';
    }
    
    // Generate unique ID for elements
    generateUniqueId(prefix = 'element') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Parse linkage information into configuration and position (SNFG standard)
    // Input: "α1-3" or "β1-4" format
    // Output: { config: "α", position: "3" } (removes the '1-' part, keeps only the target position)
    parseLinkageInfo(linkage) {
        if (!linkage || linkage === '??-?' || linkage.trim() === '') {
            return { config: '?', position: '?' };
        }
        
        const trimmed = linkage.trim();
        
        // Match pattern: α/β followed by optional number-number format
        // Examples: α1-3 → {config: α, position: 3}, β1-4 → {config: β, position: 4}
        const match = trimmed.match(/^([αβ])(\d+-(\d+))?$/);
        
        if (match) {
            const config = match[1]; // α or β
            const position = match[3] || ''; // The second number after dash, or empty if just α/β
            return { config, position };
        }
        
        // If doesn't match expected format, return unknown
        return { config: '?', position: '?' };
    }
    
    // Update or create linkage text label for a connection
    updateLinkageText(connection, textSize, textColor, textFontFamily, textBold, textItalic, textUnderline, textOpacity) {
        // Check both global visibility and connection-specific visibility
        const showAllLinkageText = document.getElementById('showAllLinkageText')?.checked ?? true; // Default to true if checkbox doesn't exist
        const connectionVisible = connection.getAttribute('data-linkage-visible') !== 'false';
        
        // Find existing linkage text elements for this connection
        const connectionId = connection.getAttribute('id') || this.generateUniqueId('connection');
        if (!connection.getAttribute('id')) {
            connection.setAttribute('id', connectionId);
        }
        
        // Look for both config and position text elements
        let configText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="config"]`);
        let positionText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="position"]`);
        
        if (!showAllLinkageText || !connectionVisible) {
            // Remove linkage text if global checkbox is unchecked or connection is set to hidden
            if (configText) configText.remove();
            if (positionText) positionText.remove();
            return;
        }
        
        // Get linkage info and parse it
        const linkage = connection.getAttribute('data-linkage') || '??-?';
        const { config, position } = this.parseLinkageInfo(linkage);
        
        // Try to get text size and color from parameters (set during creation in add mode)
        // If not provided, fall back to UI controls or defaults
        let finalTextSize = textSize;
        let finalTextColor = textColor;
        let finalTextFontFamily = textFontFamily;
        let finalTextBold = textBold;
        let finalTextItalic = textItalic;
        let finalTextUnderline = textUnderline;
        let finalTextOpacity = textOpacity;
        
        if (!finalTextSize) {
            finalTextSize = connection.getAttribute('data-text-size') || document.getElementById('linkageTextSize')?.value || '12';
        }
        if (!finalTextColor) {
            finalTextColor = connection.getAttribute('data-text-color') || document.getElementById('linkageTextColor')?.value || '#000000';
        }
        if (!finalTextFontFamily) {
            finalTextFontFamily = connection.getAttribute('data-text-font-family') || document.getElementById('linkageTextFontFamily')?.value || 'Arial';
        }
        if (finalTextBold === undefined) {
            const attr = connection.getAttribute('data-text-bold');
            if (attr !== null) {
                finalTextBold = attr === 'true';
            } else {
                finalTextBold = document.getElementById('linkageTextBoldBtn')?.classList.contains('active') || false;
            }
        }
        if (finalTextItalic === undefined) {
            const attr = connection.getAttribute('data-text-italic');
            if (attr !== null) {
                finalTextItalic = attr === 'true';
            } else {
                finalTextItalic = document.getElementById('linkageTextItalicBtn')?.classList.contains('active') || false;
            }
        }
        if (finalTextUnderline === undefined) {
            const attr = connection.getAttribute('data-text-underline');
            if (attr !== null) {
                finalTextUnderline = attr === 'true';
            } else {
                finalTextUnderline = document.getElementById('linkageTextUnderlineBtn')?.classList.contains('active') || false;
            }
        }
        if (!finalTextOpacity) {
            finalTextOpacity = connection.getAttribute('data-text-opacity') || document.getElementById('linkageTextOpacity')?.value || '1';
        }
        
        // Get connection coordinates
        // x1,y1 = start sugar (B in your description), x2,y2 = end sugar (A in your description)
        const x1 = parseFloat(connection.getAttribute('x1'));
        const y1 = parseFloat(connection.getAttribute('y1'));
        const x2 = parseFloat(connection.getAttribute('x2'));
        const y2 = parseFloat(connection.getAttribute('y2'));
        
        // Calculate vector from start (B) to end (A)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return; // Avoid division by zero
        
        // Normalized direction vector
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Perpendicular vector (right side of the stroke, pointing from B to A)
        const perpX = -dirY;
        const perpY = dirX;
        
        // Offset distance from the line
        const offset = 8;
        
        // Position for config (α/β) - closer to end sugar (A), on the right side
        const configRatio = 0.65; // 65% along the line from start to end
        const configX = x1 + dx * configRatio + perpX * offset;
        const configY = y1 + dy * configRatio + perpY * offset;
        
        // Position for position number - closer to start sugar (B), on the right side
        const positionRatio = 0.35; // 35% along the line from start to end
        const positionX = x1 + dx * positionRatio + perpX * offset;
        const positionY = y1 + dy * positionRatio + perpY * offset;
        
        // Create or update config text (α/β)
        if (!configText) {
            configText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            configText.classList.add('linkage-label');
            configText.setAttribute('data-connection-id', connectionId);
            configText.setAttribute('data-linkage-part', 'config');
            configText.setAttribute('id', `${connectionId}-config-text`);
            this.canvas.appendChild(configText);
        }
        
        configText.textContent = config;
        configText.setAttribute('x', configX);
        configText.setAttribute('y', configY);
        configText.style.setProperty('font-size', finalTextSize + 'px', 'important');
        configText.style.setProperty('font-family', finalTextFontFamily, 'important');
        const normalizedConfigTextColor = this.normalizeColorToHex(finalTextColor);
        configText.style.setProperty('fill', normalizedConfigTextColor, 'important');
        configText.style.setProperty('fill-opacity', finalTextOpacity, 'important');
        
        if (finalTextBold) {
            configText.style.setProperty('font-weight', 'bold', 'important');
        } else {
            configText.style.removeProperty('font-weight');
        }
        
        if (finalTextItalic) {
            configText.style.setProperty('font-style', 'italic', 'important');
        } else {
            configText.style.removeProperty('font-style');
        }
        
        if (finalTextUnderline) {
            configText.style.setProperty('text-decoration', 'underline', 'important');
        } else {
            configText.style.removeProperty('text-decoration');
        }
        
        configText.setAttribute('text-anchor', 'middle');
        configText.setAttribute('dominant-baseline', 'middle');
        configText.setAttribute('pointer-events', 'none'); // Don't interfere with selection
        
        // Create or update position text (the number)
        if (!positionText) {
            positionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            positionText.classList.add('linkage-label');
            positionText.setAttribute('data-connection-id', connectionId);
            positionText.setAttribute('data-linkage-part', 'position');
            positionText.setAttribute('id', `${connectionId}-position-text`);
            this.canvas.appendChild(positionText);
        }
        
        positionText.textContent = position;
        positionText.setAttribute('x', positionX);
        positionText.setAttribute('y', positionY);
        positionText.style.setProperty('font-size', finalTextSize + 'px', 'important');
        positionText.style.setProperty('font-family', finalTextFontFamily, 'important');
        const normalizedPositionTextColor = this.normalizeColorToHex(finalTextColor);
        positionText.style.setProperty('fill', normalizedPositionTextColor, 'important');
        positionText.style.setProperty('fill-opacity', finalTextOpacity, 'important');
        
        if (finalTextBold) {
            positionText.style.setProperty('font-weight', 'bold', 'important');
        } else {
            positionText.style.removeProperty('font-weight');
        }
        
        if (finalTextItalic) {
            positionText.style.setProperty('font-style', 'italic', 'important');
        } else {
            positionText.style.removeProperty('font-style');
        }
        
        if (finalTextUnderline) {
            positionText.style.setProperty('text-decoration', 'underline', 'important');
        } else {
            positionText.style.removeProperty('text-decoration');
        }
        
        positionText.setAttribute('text-anchor', 'middle');
        positionText.setAttribute('dominant-baseline', 'middle');
        positionText.setAttribute('pointer-events', 'none'); // Don't interfere with selection
    }
    
    // Update linkage information for selected connection(s)
    updateConnectionLinkage(linkage, selectedConnections = null) {
        const normalizedLinkage = this.normalizeLinkage(linkage);

        // Use provided connections or fall back to legacy selection for backward compatibility
        const connections = selectedConnections || Array.from(this.selectedConnections || []);

        connections.forEach(connection => {
            // Record before state if we're in an undo/redo step
            const beforeData = this.createObjectData(connection);

            connection.setAttribute('data-linkage', normalizedLinkage);
            this.updateLinkageText(connection);

            // Record after state if we're in an undo/redo step
            const afterData = this.createObjectData(connection);
            this.recordObjectModified(connection.getAttribute('id'), beforeData, afterData);
        });
    }
    
    // Refresh all linkage text displays (when checkbox changes)
    refreshAllLinkageTexts() {
        const connections = this.canvas.querySelectorAll('.connection');
        connections.forEach(connection => {
            this.updateLinkageText(connection);
        });
    }
    
    deleteSugar(sugar) {
        // Record removal for undo/redo system before actually deleting
        const sugarId = sugar.getAttribute('id');
        this.recordObjectRemoved(sugarId);
        
        // Collect connected connections for removal tracking
        const sugarX = parseFloat(sugar.getAttribute('data-x'));
        const sugarY = parseFloat(sugar.getAttribute('data-y'));
        
        const connections = this.canvas.querySelectorAll('.connection');
        const connectionsToRemove = [];
        
        connections.forEach(connection => {
            const x1 = parseFloat(connection.getAttribute('x1'));
            const y1 = parseFloat(connection.getAttribute('y1'));
            const x2 = parseFloat(connection.getAttribute('x2'));
            const y2 = parseFloat(connection.getAttribute('y2'));
            
            if ((x1 === sugarX && y1 === sugarY) || (x2 === sugarX && y2 === sugarY)) {
                connectionsToRemove.push(connection);
            }
        });
        
        // Record connected connection removals
        connectionsToRemove.forEach(connection => {
            const connectionId = connection.getAttribute('id');
            if (connectionId) {
                this.recordObjectRemoved(connectionId);
            }
        });
        
        // Remove from selection if selected
        if (this.selectedSugar === sugar) {
            this.selectedSugar = null;
        }
        this.selectedSugars.delete(sugar);
        
        // Remove connections involving this sugar
        connectionsToRemove.forEach(connection => {
            // Remove associated linkage text before removing connection
            const connectionId = connection.getAttribute('id');
            if (connectionId) {
                // Remove both config and position text elements
                const configText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="config"]`);
                const positionText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="position"]`);
                if (configText) configText.remove();
                if (positionText) positionText.remove();
                
                // Also remove any old-style single linkage text (for backward compatibility)
                const oldLinkageText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"]:not([data-linkage-part])`);
                if (oldLinkageText) oldLinkageText.remove();
            }
            connection.remove();
        });
        
        // Remove selection highlight before deleting the sugar
        this.removeSelectionHighlight(sugar);
        
        // Remove the sugar
        sugar.remove();
    }
    
    downloadSVG() {
        // Get current export area dimensions
        const exportSize = this.exportSizes[this.currentExportSize];
        const { width, height } = exportSize;
        // Calculate export area bounds in canvas coordinates (default centered area)
        const canvasCenterX = 2000;
        const canvasCenterY = 1400;
        const defaultMinX = canvasCenterX - width / 2;
        const defaultMinY = canvasCenterY - height / 2;
        const defaultMaxX = canvasCenterX + width / 2;
        const defaultMaxY = canvasCenterY + height / 2;

        // Compute tight bbox of content inside the default export area
        const tightBBox = this.computeExportBBox(defaultMinX, defaultMinY, defaultMaxX, defaultMaxY);

        // If we have content, use tight bbox; otherwise fall back to default centered area
        const useMinX = tightBBox ? tightBBox.minX : defaultMinX;
        const useMinY = tightBBox ? tightBBox.minY : defaultMinY;
        const useMaxX = tightBBox ? tightBBox.maxX : defaultMaxX;
        const useMaxY = tightBBox ? tightBBox.maxY : defaultMaxY;

        const exportW = Math.ceil(useMaxX - useMinX) || width;
        const exportH = Math.ceil(useMaxY - useMinY) || height;

        // Create a clean SVG for export with only elements within bounds
        const exportSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        exportSVG.setAttribute('width', exportW);
        exportSVG.setAttribute('height', exportH);
        exportSVG.setAttribute('viewBox', `0 0 ${exportW} ${exportH}`);
        exportSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        exportSVG.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        // Copy only elements within computed bounds and translate them to origin
        this.copyElementsInBounds(exportSVG, useMinX, useMinY, useMaxX, useMaxY);

        // Get the SVG string
        const svgString = new XMLSerializer().serializeToString(exportSVG);
        
        // Add CSS styles inline for better compatibility
        const styledSVG = this.addInlineStyles(svgString);
        
        // Create and download the file
        const blob = new Blob([styledSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `glycan-structure-${new Date().getTime()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    // Copy only elements that are within the export bounds
    copyElementsInBounds(targetSVG, minX, minY, maxX, maxY) {
        const allElements = this.canvas.children;
        
        // Collect gradient IDs referenced by divided shapes that will be copied
        const gradientIdsToCopy = new Set();
        
        // First pass: identify which gradients need to be copied
        for (let element of allElements) {
            // Skip temporary UI elements
            if (element.classList.contains('selection-highlight') || 
                element.classList.contains('selection-box') ||
                element.classList.contains('connection-preview')) {
                continue;
            }
            
            let shouldInclude = false;
            
            if (element.classList.contains('sugar')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                const size = parseFloat(element.getAttribute('data-size')) || this.sugarRadius;
                
                // Include if sugar is at least partially within bounds
                if (x + size >= minX && x - size <= maxX && y + size >= minY && y - size <= maxY) {
                    shouldInclude = true;
                }
            } else if (element.classList.contains('text-element')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                
                // Include if text position is within bounds
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    shouldInclude = true;
                }
            } else if (element.classList.contains('connection')) {
                // Include connections if either endpoint is within bounds
                const x1 = parseFloat(element.getAttribute('x1'));
                const y1 = parseFloat(element.getAttribute('y1'));
                const x2 = parseFloat(element.getAttribute('x2'));
                const y2 = parseFloat(element.getAttribute('y2'));
                
                if ((x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) ||
                    (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY)) {
                    shouldInclude = true;
                }
            } else if (element.tagName && element.tagName.toLowerCase() === 'text' && element.classList.contains('linkage-label')) {
                // Linkage label text elements (config/position) - include if within bounds
                const x = parseFloat(element.getAttribute('x'));
                const y = parseFloat(element.getAttribute('y'));
                if (!isNaN(x) && !isNaN(y)) {
                    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                        shouldInclude = true;
                    }
                }
            }
            
            // If this sugar will be included, check if it references gradients
            if (shouldInclude && element.classList.contains('sugar')) {
                const shape = element.querySelector('.sugar-shape');
                if (shape) {
                    const gradientId = shape.getAttribute('data-gradient-id');
                    if (gradientId) {
                        gradientIdsToCopy.add(gradientId);
                    }
                }
            }
        }
        
        // Copy referenced gradients to target SVG
        if (gradientIdsToCopy.size > 0) {
            // Ensure target SVG has a defs element
            let targetDefs = targetSVG.querySelector('defs');
            if (!targetDefs) {
                targetDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                targetSVG.insertBefore(targetDefs, targetSVG.firstChild);
            }
            
            // Copy each gradient
            const sourceDefs = this.canvas.querySelector('defs');
            if (sourceDefs) {
                gradientIdsToCopy.forEach(gradientId => {
                    const gradient = sourceDefs.querySelector('#' + gradientId);
                    if (gradient && !targetDefs.querySelector('#' + gradientId)) {
                        const clonedGradient = gradient.cloneNode(true);
                        targetDefs.appendChild(clonedGradient);
                    }
                });
            }
        }
        
        // Second pass: copy the actual elements
        for (let element of allElements) {
            // Skip temporary UI elements
            if (element.classList.contains('selection-highlight') || 
                element.classList.contains('selection-box') ||
                element.classList.contains('connection-preview')) {
                continue;
            }
            
            let shouldInclude = false;
            
            if (element.classList.contains('sugar')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                const size = parseFloat(element.getAttribute('data-size')) || this.sugarRadius;
                
                // Include if sugar is at least partially within bounds
                if (x + size >= minX && x - size <= maxX && y + size >= minY && y - size <= maxY) {
                    shouldInclude = true;
                }
            } else if (element.classList.contains('text-element')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                
                // Include if text position is within bounds
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    shouldInclude = true;
                }
            } else if (element.classList.contains('connection')) {
                // Include connections if either endpoint is within bounds
                const x1 = parseFloat(element.getAttribute('x1'));
                const y1 = parseFloat(element.getAttribute('y1'));
                const x2 = parseFloat(element.getAttribute('x2'));
                const y2 = parseFloat(element.getAttribute('y2'));
                
                if ((x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) ||
                    (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY)) {
                    shouldInclude = true;
                }
            } else if (element.tagName && element.tagName.toLowerCase() === 'text' && element.classList.contains('linkage-label')) {
                // Linkage label text elements (config/position) - include if within bounds
                const x = parseFloat(element.getAttribute('x'));
                const y = parseFloat(element.getAttribute('y'));
                if (!isNaN(x) && !isNaN(y)) {
                    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                        shouldInclude = true;
                    }
                }
            }
            
            if (shouldInclude) {
                const clonedElement = element.cloneNode(true);
                
                // Check for exclude-export attribute on child shapes (like freeend-asterisk)
                const excludedShapes = clonedElement.querySelectorAll('[data-exclude-export="true"]');
                excludedShapes.forEach(shape => shape.remove());
                
                // Translate coordinates relative to export area bounds
                if (clonedElement.classList.contains('sugar')) {
                    const x = parseFloat(clonedElement.getAttribute('data-x'));
                    const y = parseFloat(clonedElement.getAttribute('data-y'));
                    const newX = x - minX;
                    const newY = y - minY;
                    
                    clonedElement.setAttribute('data-x', newX);
                    clonedElement.setAttribute('data-y', newY);
                    
                    // Update all child shape elements' coordinates
                    const childShapes = clonedElement.querySelectorAll('circle, rect, polygon, ellipse, path, text, line');
                    childShapes.forEach(shape => {
                        if (shape.hasAttribute('cx') && shape.hasAttribute('cy')) {
                            // Circle or ellipse
                            const cx = parseFloat(shape.getAttribute('cx'));
                            const cy = parseFloat(shape.getAttribute('cy'));
                            shape.setAttribute('cx', cx - minX);
                            shape.setAttribute('cy', cy - minY);
                        }
                        if (shape.hasAttribute('x') && shape.hasAttribute('y')) {
                            // Rectangle or text element
                            const shapeX = parseFloat(shape.getAttribute('x'));
                            const shapeY = parseFloat(shape.getAttribute('y'));
                            shape.setAttribute('x', shapeX - minX);
                            shape.setAttribute('y', shapeY - minY);
                        }
                        if (shape.hasAttribute('points')) {
                            // Polygon
                            const points = shape.getAttribute('points');
                            const newPoints = points.split(' ').map(point => {
                                const [px, py] = point.split(',').map(parseFloat);
                                return `${px - minX},${py - minY}`;
                            }).join(' ');
                            shape.setAttribute('points', newPoints);
                        }
                        if (shape.hasAttribute('d')) {
                            // Path element (like freeend-wave) - update path coordinates
                            const d = shape.getAttribute('d');
                            const updatedD = d.replace(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g, (match, xVal, yVal) => {
                                const adjustedX = parseFloat(xVal) - minX;
                                const adjustedY = parseFloat(yVal) - minY;
                                return `${adjustedX} ${adjustedY}`;
                            });
                            shape.setAttribute('d', updatedD);
                        }
                        if (shape.hasAttribute('x1') && shape.hasAttribute('y1') && shape.hasAttribute('x2') && shape.hasAttribute('y2')) {
                            // Line element (like dividing lines in divided shapes)
                            const x1 = parseFloat(shape.getAttribute('x1'));
                            const y1 = parseFloat(shape.getAttribute('y1'));
                            const x2 = parseFloat(shape.getAttribute('x2'));
                            const y2 = parseFloat(shape.getAttribute('y2'));
                            shape.setAttribute('x1', x1 - minX);
                            shape.setAttribute('y1', y1 - minY);
                            shape.setAttribute('x2', x2 - minX);
                            shape.setAttribute('y2', y2 - minY);
                        }
                    });
                } else if (clonedElement.classList.contains('text-element')) {
                    const x = parseFloat(clonedElement.getAttribute('data-x'));
                    const y = parseFloat(clonedElement.getAttribute('data-y'));
                    const newX = x - minX;
                    const newY = y - minY;
                    
                    clonedElement.setAttribute('data-x', newX);
                    clonedElement.setAttribute('data-y', newY);
                    clonedElement.setAttribute('x', newX);
                    clonedElement.setAttribute('y', newY);
                } else if (clonedElement.tagName && clonedElement.tagName.toLowerCase() === 'text' && clonedElement.classList.contains('linkage-label')) {
                    // Translate linkage-label text elements (config and position labels)
                    const x = parseFloat(clonedElement.getAttribute('x'));
                    const y = parseFloat(clonedElement.getAttribute('y'));
                    if (!isNaN(x) && !isNaN(y)) {
                        const newX = x - minX;
                        const newY = y - minY;
                        clonedElement.setAttribute('x', newX);
                        clonedElement.setAttribute('y', newY);
                    }
                } else if (clonedElement.classList.contains('connection')) {
                    const x1 = parseFloat(clonedElement.getAttribute('x1'));
                    const y1 = parseFloat(clonedElement.getAttribute('y1'));
                    const x2 = parseFloat(clonedElement.getAttribute('x2'));
                    const y2 = parseFloat(clonedElement.getAttribute('y2'));
                    
                    clonedElement.setAttribute('x1', x1 - minX);
                    clonedElement.setAttribute('y1', y1 - minY);
                    clonedElement.setAttribute('x2', x2 - minX);
                    clonedElement.setAttribute('y2', y2 - minY);
                }
                
                targetSVG.appendChild(clonedElement);
            }
        }
    }

    // Compute the union bounding box (in canvas coordinates) of all elements that would be included
    // between the provided bounds. Returns { minX, minY, maxX, maxY } or null if nothing found.
    computeExportBBox(minX, minY, maxX, maxY) {
        const allElements = this.canvas.children;
        let found = false;
        let minUsedX = Infinity, minUsedY = Infinity, maxUsedX = -Infinity, maxUsedY = -Infinity;

        for (let element of allElements) {
            if (element.classList.contains('selection-highlight') ||
                element.classList.contains('selection-box') ||
                element.classList.contains('connection-preview')) {
                continue;
            }

            if (element.classList.contains('sugar')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                const size = parseFloat(element.getAttribute('data-size')) || this.sugarRadius;
                if (x + size >= minX && x - size <= maxX && y + size >= minY && y - size <= maxY) {
                    found = true;
                    if (x - size < minUsedX) minUsedX = x - size;
                    if (y - size < minUsedY) minUsedY = y - size;
                    if (x + size > maxUsedX) maxUsedX = x + size;
                    if (y + size > maxUsedY) maxUsedY = y + size;
                }
            } else if (element.classList.contains('text-element')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    found = true;
                    if (x < minUsedX) minUsedX = x;
                    if (y < minUsedY) minUsedY = y;
                    if (x > maxUsedX) maxUsedX = x;
                    if (y > maxUsedY) maxUsedY = y;
                }
            } else if (element.classList.contains('connection')) {
                const x1 = parseFloat(element.getAttribute('x1'));
                const y1 = parseFloat(element.getAttribute('y1'));
                const x2 = parseFloat(element.getAttribute('x2'));
                const y2 = parseFloat(element.getAttribute('y2'));
                if ((x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) ||
                    (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY)) {
                    found = true;
                    const lineMinX = Math.min(x1, x2);
                    const lineMinY = Math.min(y1, y2);
                    const lineMaxX = Math.max(x1, x2);
                    const lineMaxY = Math.max(y1, y2);
                    if (lineMinX < minUsedX) minUsedX = lineMinX;
                    if (lineMinY < minUsedY) minUsedY = lineMinY;
                    if (lineMaxX > maxUsedX) maxUsedX = lineMaxX;
                    if (lineMaxY > maxUsedY) maxUsedY = lineMaxY;
                }
            } else if (element.tagName && element.tagName.toLowerCase() === 'text' && element.classList.contains('linkage-label')) {
                const x = parseFloat(element.getAttribute('x'));
                const y = parseFloat(element.getAttribute('y'));
                if (!isNaN(x) && !isNaN(y)) {
                    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                        found = true;
                        if (x < minUsedX) minUsedX = x;
                        if (y < minUsedY) minUsedY = y;
                        if (x > maxUsedX) maxUsedX = x;
                        if (y > maxUsedY) maxUsedY = y;
                    }
                }
            }
        }

        if (!found) return null;
        return { minX: minUsedX, minY: minUsedY, maxX: maxUsedX, maxY: maxUsedY };
    }
    
    addInlineStyles(svgString) {
        // Add basic styles inline for better compatibility with external programs
        const styleString = `
            <defs>
                <style>
                    .sugar .sugar-shape {
                        stroke-width: 2;
                    }
                    .connection {
                        stroke: #808080;
                        stroke-width: 2;
                        fill: none;
                    }
                    .text-element {
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        fill: #2c3e50;
                    }
                </style>
            </defs>
        `;
        
        // Insert styles after the opening svg tag but before content
        const svgTagEndIndex = svgString.indexOf('>');
        if (svgTagEndIndex !== -1) {
            return svgString.slice(0, svgTagEndIndex + 1) + styleString + svgString.slice(svgTagEndIndex + 1);
        }
        return svgString;
    }
    
    // Helper method to close export dropdown
    closeExportDropdown() {
        const exportDropdown = document.querySelector('.export-dropdown');
        if (exportDropdown) {
            exportDropdown.classList.remove('open');
        }
    }
    
    exportCanvas(format) {
        switch (format) {
            case 'svg':
                this.downloadSVG();
                break;
            case 'png':
                this.exportAsPNG();
                break;
            case 'jpg':
                this.exportAsJPG();
                break;
            default:
                console.error('Unknown export format:', format);
        }
    }
    
    exportAsPNG() {
        // Create export SVG with only export area content
        const exportSize = this.exportSizes[this.currentExportSize];
        const { width, height } = exportSize;
        
    // Calculate export area bounds in canvas coordinates (default centered area)
    const canvasCenterX = 2000;
    const canvasCenterY = 1400;
    const defaultMinX = canvasCenterX - width / 2;
    const defaultMinY = canvasCenterY - height / 2;
    const defaultMaxX = canvasCenterX + width / 2;
    const defaultMaxY = canvasCenterY + height / 2;

    const tightBBox = this.computeExportBBox(defaultMinX, defaultMinY, defaultMaxX, defaultMaxY);
    const useMinX = tightBBox ? tightBBox.minX : defaultMinX;
    const useMinY = tightBBox ? tightBBox.minY : defaultMinY;
    const useMaxX = tightBBox ? tightBBox.maxX : defaultMaxX;
    const useMaxY = tightBBox ? tightBBox.maxY : defaultMaxY;

    const exportW = Math.ceil(useMaxX - useMinX) || width;
    const exportH = Math.ceil(useMaxY - useMinY) || height;

    const exportSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSVG.setAttribute('width', exportW);
    exportSVG.setAttribute('height', exportH);
    exportSVG.setAttribute('viewBox', `0 0 ${exportW} ${exportH}`);
    exportSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Copy only elements within computed bounds
    this.copyElementsInBounds(exportSVG, useMinX, useMinY, useMaxX, useMaxY);

    const svgString = new XMLSerializer().serializeToString(exportSVG);
    const styledSVG = this.addInlineStyles(svgString);

    // Create canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Use export area dimensions (tight bbox) instead of main canvas dimensions
    const svgWidth = exportW;
    const svgHeight = exportH;
        
        // Set canvas size with higher resolution for better quality
        const scale = 2;
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        
        // Scale context for high resolution
        ctx.scale(scale, scale);
        
        const img = new Image();
        img.onload = () => {
            // Clear canvas (keep transparent background for PNG)
            ctx.clearRect(0, 0, svgWidth, svgHeight);

            // Draw the SVG image at the correct size
            ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
            
            // Convert to PNG and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `glycan-structure-${new Date().getTime()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        
        const svgBlob = new Blob([styledSVG], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
    }
    
    exportAsJPG() {
        // Create export SVG with only export area content
        const exportSize = this.exportSizes[this.currentExportSize];
        const { width, height } = exportSize;
        
        // Calculate export area bounds in canvas coordinates (default centered area)
        const canvasCenterX = 2000;
        const canvasCenterY = 1400;
        const defaultMinX = canvasCenterX - width / 2;
        const defaultMinY = canvasCenterY - height / 2;
        const defaultMaxX = canvasCenterX + width / 2;
        const defaultMaxY = canvasCenterY + height / 2;

        const tightBBox = this.computeExportBBox(defaultMinX, defaultMinY, defaultMaxX, defaultMaxY);
        const useMinX = tightBBox ? tightBBox.minX : defaultMinX;
        const useMinY = tightBBox ? tightBBox.minY : defaultMinY;
        const useMaxX = tightBBox ? tightBBox.maxX : defaultMaxX;
        const useMaxY = tightBBox ? tightBBox.maxY : defaultMaxY;

        const exportW = Math.ceil(useMaxX - useMinX) || width;
        const exportH = Math.ceil(useMaxY - useMinY) || height;

        const exportSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        exportSVG.setAttribute('width', exportW);
        exportSVG.setAttribute('height', exportH);
        exportSVG.setAttribute('viewBox', `0 0 ${exportW} ${exportH}`);
        exportSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Copy only elements within computed bounds
        this.copyElementsInBounds(exportSVG, useMinX, useMinY, useMaxX, useMaxY);

        const svgString = new XMLSerializer().serializeToString(exportSVG);
        const styledSVG = this.addInlineStyles(svgString);

        // Create canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use export area dimensions (tight bbox)
        const svgWidth = exportW;
        const svgHeight = exportH;

        // Set canvas size with higher resolution for better quality
        const scale = 2;
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;

        // Scale context for high resolution and set white background
        ctx.scale(scale, scale);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, svgWidth, svgHeight);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);

            // Convert to JPG and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `glycan-structure-${new Date().getTime()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.9);
        };

        const svgBlob = new Blob([styledSVG], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
    }
    
    clearCanvas() {
        // Start recording a step for clear operation
        this.startStep('Clear canvas');
        
        // Record all existing objects for removal
        this.canvas.querySelectorAll('.sugar, .text-element, .connection').forEach(element => {
            const elementId = element.getAttribute('id');
            if (elementId) {
                this.recordObjectRemoved(elementId);
            }
        });
        
        // Deselect any selected elements
        this.deselectAll();
        
        // End any connection dragging
        this.endConnectionDragging();
        
        // Clear any timers
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Remove any text input boxes that might be open
        const textInputs = document.querySelectorAll('.text-input-box');
        textInputs.forEach(input => input.remove());
        
        // Reset editing state
        this.isEditingText = false;
        
        // Remove all elements from canvas
        while (this.canvas.firstChild) {
            this.canvas.removeChild(this.canvas.firstChild);
        }
        
        // Reset counters
        this.sugarCount = 0;
        this.textCount = 0;

        // Recreate addPreviewDot so add-mode still shows a preview after clearing
        try {
            // If a preview dot already exists as a reference, discard and recreate to ensure it's attached to the canvas
            this.addPreviewDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            this.addPreviewDot.setAttribute('r', '10');
            // Keep same styling used during init; color may be overridden elsewhere if purple is desired
            this.addPreviewDot.setAttribute('fill', 'blue');
            this.addPreviewDot.setAttribute('opacity', '0.3');
            this.addPreviewDot.style.display = 'none';
            if (this.canvas) this.canvas.appendChild(this.addPreviewDot);
        } catch (err) {
            // If something goes wrong, log but don't block clearing
            console.error('Failed to recreate addPreviewDot after clearCanvas:', err);
        }
        
        // Finish recording the step
        this.finishStep();
    }
    
    // Helper method to convert SVG coordinates to screen coordinates
    svgToScreenCoordinates(svgX, svgY) {
        const pt = this.canvas.createSVGPoint();
        pt.x = svgX;
        pt.y = svgY;
        
        // Transform SVG coordinates to screen coordinates
        const screenPt = pt.matrixTransform(this.canvas.getScreenCTM());
        
        return {
            x: screenPt.x,
            y: screenPt.y
        };
    }
    
    // Box selection methods
    startBoxSelection(x, y) {
        this.isBoxSelecting = true;
        this.boxSelectionStart = { x, y };
        
        // Create selection box as HTML overlay instead of SVG element
        this.selectionBox = document.createElement('div');
        this.selectionBox.classList.add('selection-box-overlay');
        
        // Convert SVG coordinates to screen coordinates, then to workspace coordinates
        const screenCoords = this.svgToScreenCoordinates(x, y);
        const workspace = document.getElementById('workspace');
        const workspaceRect = workspace.getBoundingClientRect();
        
        // Account for workspace scroll position
        const workspaceX = screenCoords.x - workspaceRect.left + workspace.scrollLeft;
        const workspaceY = screenCoords.y - workspaceRect.top + workspace.scrollTop;
        
        this.selectionBox.style.left = workspaceX + 'px';
        this.selectionBox.style.top = workspaceY + 'px';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        
        // Add to workspace instead of canvas
        workspace.appendChild(this.selectionBox);
        
        // Add global event listeners for box selection outside canvas
        this.globalBoxSelectionMouseMove = (e) => this.handleGlobalBoxSelectionMove(e);
        this.globalBoxSelectionMouseUp = (e) => this.handleGlobalBoxSelectionUp(e);
        
        document.addEventListener('mousemove', this.globalBoxSelectionMouseMove);
        document.addEventListener('mouseup', this.globalBoxSelectionMouseUp);
    }
    
    updateBoxSelection(currentX, currentY) {
        if (!this.selectionBox) return;
        
        const startX = this.boxSelectionStart.x;
        const startY = this.boxSelectionStart.y;
        
        // Calculate rectangle bounds in SVG coordinates
        const selectionX = Math.min(startX, currentX);
        const selectionY = Math.min(startY, currentY);
        const selectionWidth = Math.abs(currentX - startX);
        const selectionHeight = Math.abs(currentY - startY);
        
        // Convert SVG coordinates to workspace coordinates for the HTML overlay
        const startScreenCoords = this.svgToScreenCoordinates(selectionX, selectionY);
        const endScreenCoords = this.svgToScreenCoordinates(selectionX + selectionWidth, selectionY + selectionHeight);
        const workspace = document.getElementById('workspace');
        const workspaceRect = workspace.getBoundingClientRect();

        // Account for workspace scroll position
        const workspaceX = startScreenCoords.x - workspaceRect.left + workspace.scrollLeft;
        const workspaceY = startScreenCoords.y - workspaceRect.top + workspace.scrollTop;
        const workspaceWidth = endScreenCoords.x - startScreenCoords.x;
        const workspaceHeight = endScreenCoords.y - startScreenCoords.y;
        
        // Update visual selection box (HTML overlay can extend across full workspace)
        this.selectionBox.style.left = workspaceX + 'px';
        this.selectionBox.style.top = workspaceY + 'px';
        this.selectionBox.style.width = workspaceWidth + 'px';
        this.selectionBox.style.height = workspaceHeight + 'px';
        
        // Store unclamped bounds for selection logic
        this.currentSelectionBounds = {
            x: selectionX,
            y: selectionY,
            width: selectionWidth,
            height: selectionHeight
        };
        
        // Preview selection using unclamped bounds
        this.previewBoxSelection(selectionX, selectionY, selectionWidth, selectionHeight);
    }
    
    handleGlobalBoxSelectionMove(e) {
        if (!this.isBoxSelecting) return;
        
        // Convert global coordinates to SVG coordinates
        const coords = this.getSVGCoordinates(e);
        
        this.updateBoxSelection(coords.x, coords.y);
        e.preventDefault();
    }
    
    handleGlobalBoxSelectionUp(e) {
        if (!this.isBoxSelecting) return;
        
        // Remove global event listeners
        document.removeEventListener('mousemove', this.globalBoxSelectionMouseMove);
        document.removeEventListener('mouseup', this.globalBoxSelectionMouseUp);
        
        // Finish box selection
        this.finishBoxSelection(e.shiftKey);
        e.preventDefault();
    }
    
    handleGlobalDragMove(e) {
        if (!this.isDragging || this.currentTool !== 'select') return;
        
        // Convert global coordinates to SVG coordinates
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        // Use the existing drag logic from handleMouseMove
        if (this.isDraggingMultiple && this.selectedElements.size > 0) {
            // Calculate movement delta from initial drag position
            let deltaX = x - this.dragStartX;  
            let deltaY = y - this.dragStartY;
            
            // Apply Shift constraint for axis-aligned movement
            if (this.dragWithShift) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    deltaY = 0; // Horizontal movement only
                } else {
                    deltaX = 0; // Vertical movement only
                }
            }
            
            // Move all selected elements
            this.selectedElements.forEach(element => {
                const initialX = parseFloat(element.getAttribute('data-initial-x'));
                const initialY = parseFloat(element.getAttribute('data-initial-y'));
                
                const newX = initialX + deltaX;
                const newY = initialY + deltaY;
                
                const type = this.getElementType(element);
                if (type === 'sugar') {
                    this.moveSugar(element, newX, newY);
                } else if (type === 'text') {
                    this.moveText(element, newX, newY);
                }
            });
        }
        
        e.preventDefault();
    }
    
    handleGlobalDragUp(e) {
        if (!this.isDragging) return;
        
        // Remove global event listeners
        document.removeEventListener('mousemove', this.globalDragMouseMove);
        document.removeEventListener('mouseup', this.globalDragMouseUp);
        
        // Use existing mouse up logic
        this.handleMouseUp(e);
    }
    
    previewBoxSelection(boxX, boxY, boxWidth, boxHeight) {
        // Clear previous previews
        this.clearBoxSelectionPreviews();
        this.hoveredElements.clear();
        
        // In select mode, check sugars, texts, and connections
        const sugars = this.canvas.querySelectorAll('.sugar');
        const texts = this.canvas.querySelectorAll('.text-element');
        const connections = this.canvas.querySelectorAll('.connection');
        
        // Check sugars
        sugars.forEach(sugar => {
            const sugarX = parseFloat(sugar.getAttribute('data-x'));
            const sugarY = parseFloat(sugar.getAttribute('data-y'));
            
            // Check if sugar center is within the selection box
            if (sugarX >= boxX && sugarX <= boxX + boxWidth &&
                sugarY >= boxY && sugarY <= boxY + boxHeight) {
                sugar.classList.add('box-selection-preview');
                this.hoveredElements.add(sugar);
            }
        });
        
        // Check texts
        texts.forEach(text => {
            const textX = parseFloat(text.getAttribute('data-x'));
            const textY = parseFloat(text.getAttribute('data-y'));
            
            // Check if text position is within the selection box
            if (textX >= boxX && textX <= boxX + boxWidth &&
                textY >= boxY && textY <= boxY + boxHeight) {
                text.classList.add('box-selection-preview');
                this.hoveredElements.add(text);
            }
        });
        
        // Check connections
        connections.forEach(line => {
            // Get line endpoints
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            
            // Check if line intersects with selection box
            if (this.lineIntersectsBox(x1, y1, x2, y2, boxX, boxY, boxX + boxWidth, boxY + boxHeight)) {
                line.classList.add('box-selection-preview');
                this.hoveredElements.add(line);
            }
        });
    }
    
    clearBoxSelectionPreviews() {
        const previews = this.canvas.querySelectorAll('.box-selection-preview');
        previews.forEach(element => element.classList.remove('box-selection-preview'));
    }
    
    clearSelectionBox() {
        if (this.selectionBox) {
            // Remove HTML overlay from workspace
            document.getElementById('workspace').removeChild(this.selectionBox);
            this.selectionBox = null;
        }
        this.currentSelectionBounds = null; // Clear stored bounds
        this.clearBoxSelectionPreviews();
        
        // Remove global event listeners if they exist
        if (this.globalBoxSelectionMouseMove) {
            document.removeEventListener('mousemove', this.globalBoxSelectionMouseMove);
            this.globalBoxSelectionMouseMove = null;
        }
        if (this.globalBoxSelectionMouseUp) {
            document.removeEventListener('mouseup', this.globalBoxSelectionMouseUp);
            this.globalBoxSelectionMouseUp = null;
        }
    }
    
    finishBoxSelection(isShiftKey = false) {
        if (!this.isBoxSelecting || !this.selectionBox) return;
        
        // Get elements that were previewed during box selection
        const elementsInBox = Array.from(this.hoveredElements);
        
        if (!isShiftKey) {
            // Normal box selection - clear all previous selections
            this.clearAllSelections();
        }
        
        // Handle Shift box selection logic
        if (isShiftKey && elementsInBox.length > 0) {
            // Check if ALL elements in box are already selected
            const allElementsSelected = elementsInBox.every(element => 
                this.selectedElements.has(element)
            );

            if (allElementsSelected) {
                // All elements are selected - remove them from selection
                elementsInBox.forEach(element => {
                    // Use type-aware deselection for connections
                    if (this.getElementType(element) === 'connection') {
                        this.deselectConnection(element);
                    } else {
                        this.deselectElement(element);
                    }
                });
            } else {
                // Some elements are not selected - add all unselected to selection
                elementsInBox.forEach(element => {
                    if (!this.selectedElements.has(element)) {
                        if (this.getElementType(element) === 'connection') {
                            this.selectConnection(element, true);
                        } else {
                            this.selectElement(element, true);
                        }
                    }
                });
            }
        } else {
            // Normal selection - select all elements in box
            elementsInBox.forEach(element => {
                if (this.getElementType(element) === 'connection') {
                    this.selectConnection(element, true);
                } else {
                    this.selectElement(element, true);
                }
            });
        }
        
        // Clean up
        this.clearBoxSelectionPreviews();
        this.hoveredElements.clear();
        if (this.selectionBox) {
            // Remove HTML overlay from workspace
            document.getElementById('workspace').removeChild(this.selectionBox);
            this.selectionBox = null;
        }
        this.currentSelectionBounds = null; // Clear stored bounds
        
        // Remove global event listeners
        if (this.globalBoxSelectionMouseMove) {
            document.removeEventListener('mousemove', this.globalBoxSelectionMouseMove);
            this.globalBoxSelectionMouseMove = null;
        }
        if (this.globalBoxSelectionMouseUp) {
            document.removeEventListener('mouseup', this.globalBoxSelectionMouseUp);
            this.globalBoxSelectionMouseUp = null;
        }
        
        this.isBoxSelecting = false;
        
        // Update right panel to show controls for selected elements
        this.updateRightPanel();
    }
    
    lineIntersectsBox(x1, y1, x2, y2, boxLeft, boxTop, boxRight, boxBottom) {
        // Check if a line segment intersects with a rectangle
        // First check if either endpoint is inside the box
        if ((x1 >= boxLeft && x1 <= boxRight && y1 >= boxTop && y1 <= boxBottom) ||
            (x2 >= boxLeft && x2 <= boxRight && y2 >= boxTop && y2 <= boxBottom)) {
            return true;
        }
        
        // Check if line intersects any of the box edges
        return this.lineIntersectsLine(x1, y1, x2, y2, boxLeft, boxTop, boxRight, boxTop) ||     // top edge
               this.lineIntersectsLine(x1, y1, x2, y2, boxRight, boxTop, boxRight, boxBottom) || // right edge
               this.lineIntersectsLine(x1, y1, x2, y2, boxRight, boxBottom, boxLeft, boxBottom) || // bottom edge
               this.lineIntersectsLine(x1, y1, x2, y2, boxLeft, boxBottom, boxLeft, boxTop);     // left edge
    }
    
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Check if two line segments intersect
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return false; // Lines are parallel
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    // Left panel control methods (now controls right panel in new layout)
    updateLeftPanel() {
        // Left panel only contains tools now, no dynamic content
        // This method is kept for compatibility but doesn't need to do anything
        return;
    }
    
    updateRightPanel() {
        const sugarControlsSection = document.getElementById('sugarControlsSection');
        const textControlsSection = document.getElementById('textControlsSection');
        const linkageControlsSection = document.getElementById('linkageControlsSection');
        const emptyControlsSection = document.getElementById('emptyControlsSection');
        
        // Determine what to show based on current tool and selections
        const showSugarControls = this.shouldShowSugarControls();
        const showTextControls = this.shouldShowTextControls();
        const showLinkageControls = this.shouldShowLinkageControls();
        
        // Hide all sections first
        if (sugarControlsSection) sugarControlsSection.style.display = 'none';
        if (textControlsSection) textControlsSection.style.display = 'none';
        if (linkageControlsSection) linkageControlsSection.style.display = 'none';
        if (emptyControlsSection) emptyControlsSection.style.display = 'none';
        
        // Show appropriate section(s)
        if (showSugarControls && sugarControlsSection) {
            sugarControlsSection.style.display = 'block';
            this.updateSugarControlValues();
        }
        if (showTextControls && textControlsSection) {
            textControlsSection.style.display = 'block';
            this.updateTextControlValues();
        }
        if (showLinkageControls && linkageControlsSection) {
            linkageControlsSection.style.display = 'block';
            console.log('updateRightPanel: Calling updateLinkageControlValues');
            this.updateLinkageControlValues();
        }
        // Only show the empty state when no other control sections should be visible
        // and we are NOT in preset mode (preset has its own UI)
        const isPresetMode = this.currentTool === 'preset';
        if (!showSugarControls && !showTextControls && !showLinkageControls && !isPresetMode && emptyControlsSection) {
            emptyControlsSection.style.display = 'block';
        }
        // Preset glycan section: only visible in dedicated 'preset' mode
        const presetGlycanSection = document.getElementById('presetGlycanSection');
        if (presetGlycanSection) {
            if (this.currentTool === 'preset') {
                presetGlycanSection.style.display = 'block';
            } else {
                presetGlycanSection.style.display = 'none';
            }
        }
        
        // Update connection status
        this.updateConnectionStatus();

        // Ensure add-mode linkage preselection panel is only visible in add mode
        const linkagePreselectionSection = document.getElementById('linkagePreselectionSection');
        if (linkagePreselectionSection) {
            if (this.currentTool === 'add') {
                linkagePreselectionSection.style.display = 'block';
            } else {
                linkagePreselectionSection.style.display = 'none';
            }
        }
    }
    
    shouldShowSugarControls() {
        // Show sugar controls when:
        // 1. Current tool is 'add'
        // 2. Selected elements include at least one sugar
        if (this.currentTool === 'add') {
            return true;
        }
        
        if (this.currentTool === 'select') {
            // Check if any selected elements are sugars
            return this.selectedSugars.size > 0 || this.selectedSugar !== null;
        }
        
        return false;
    }
    
    shouldShowTextControls() {
        // Show text controls when:
        // 1. Current tool is 'text'
        // 2. Selected elements include at least one text
        if (this.currentTool === 'text') {
            return true;
        }
        
        if (this.currentTool === 'select') {
            // Check if any selected text elements
            return this.selectedText !== null || this.selectedTexts.size > 0;
        }
        
        return false;
    }
    
    shouldShowLinkageControls() {
        // Show linkage controls when:
        // In select mode and connections are selected
        if (this.currentTool === 'select') {
            return this.selectedConnections && this.selectedConnections.size > 0;
        }
        
        return false;
    }
    
    updateConnectionStatus() {
        const connectionStatus = document.getElementById('connectionStatus');
        if (!connectionStatus) return;
        
        const statusText = connectionStatus.querySelector('.status-text');
        if (!statusText) return;
        
        if (this.currentTool === 'select') {
            // Count connections between selected sugars
            let connectionCount = 0;
            const selectedSugarElements = Array.from(this.selectedSugars);
            if (this.selectedSugar) {
                selectedSugarElements.push(this.selectedSugar);
            }
            
            // Count connections
            const allConnections = document.querySelectorAll('.connection-line');
            allConnections.forEach(connection => {
                const startSugar = document.getElementById(connection.getAttribute('data-start'));
                const endSugar = document.getElementById(connection.getAttribute('data-end'));
                
                if ((selectedSugarElements.includes(startSugar) || selectedSugarElements.includes(endSugar))) {
                    connectionCount++;
                }
            });
            
            statusText.textContent = `选中了 ${connectionCount} 条连接线`;
            connectionStatus.className = connectionCount > 0 ? 'connection-status has-connections' : 'connection-status';
        } else {
            statusText.textContent = '选中了 0 条连接线';
            connectionStatus.className = 'connection-status';
        }
    }
    
    updateSugarControlValues() {
        if (this.currentTool === 'add') {
            // In add mode, show current panel configuration (default values)
            this.updateSugarControlsToDefaults();
        } else if (this.currentTool === 'select') {
            // In select mode, show selected sugar properties or mixed values
            this.updateSugarControlsFromSelection();
        }
    }
    
    updateTextControlValues() {
        if (this.currentTool === 'text') {
            // In text mode, show current panel configuration
            this.updateTextControlsToDefaults();
        } else if (this.currentTool === 'select') {
            // In select mode, show selected text properties or mixed values
            this.updateTextControlsFromSelection();
        }
    }
    
    updateLinkageControlValues() {
        console.log('updateLinkageControlValues called, currentTool:', this.currentTool, 'selectedConnections size:', this.selectedConnections ? this.selectedConnections.size : 0);
        // In select mode with connections selected, show linkage properties
        if (this.currentTool === 'select' && this.selectedConnections && this.selectedConnections.size > 0) {
            this.updateLinkageControlsFromSelection();
        }
    }
    
    updateLinkageControlsFromSelection() {
        // Set flag to prevent style application during UI update
        console.log('updateLinkageControlsFromSelection: Setting isUpdatingUI = true');
        this.isUpdatingUI = true;
        
        const connections = Array.from(this.selectedConnections);
        
        if (connections.length === 0) {
            this.isUpdatingUI = false;
            return;
        }
        
        // Get values from first connection
        const firstConn = connections[0];
        const firstLinkage = firstConn.getAttribute('data-linkage') || '';
        const firstWidth = parseFloat(firstConn.style.strokeWidth || firstConn.getAttribute('stroke-width')) || 2;
        const firstColorRaw = firstConn.style.stroke || firstConn.getAttribute('stroke') || '#000000';
        const firstColor = this.normalizeColorToHex(firstColorRaw); // Convert to hex format
        const firstOpacity = parseFloat(firstConn.style.strokeOpacity || firstConn.getAttribute('stroke-opacity')) || 1;
        const firstDashArray = firstConn.style.strokeDasharray || firstConn.getAttribute('stroke-dasharray') || '';
        const firstVisible = firstConn.getAttribute('data-linkage-visible') !== 'false';
        const firstTextSize = firstConn.getAttribute('data-text-size') || '12';
        const firstTextColorRaw = firstConn.getAttribute('data-text-color') || '#000000';
        const firstTextColor = this.normalizeColorToHex(firstTextColorRaw); // Convert to hex format
        const firstTextOpacity = parseFloat(firstConn.getAttribute('data-text-opacity')) || 1;
        const firstTextFontFamily = firstConn.getAttribute('data-text-font-family') || 'Arial';
        
        // Determine style from dash array
        let firstStyle = 'solid';
        if (firstDashArray) {
            const dashValues = firstDashArray.split(',').map(v => parseFloat(v.trim()));
            if (dashValues.length >= 2) {
                const ratio = dashValues[0] / dashValues[1];
                if (ratio > 1.5) firstStyle = 'dashed';
                else firstStyle = 'dotted';
            }
        }
        
        // Check if all connections have same values
        let mixedLinkage = false, mixedWidth = false, mixedColor = false, mixedOpacity = false;
        let mixedStyle = false, mixedVisible = false, mixedTextSize = false, mixedTextColor = false, mixedTextOpacity = false, mixedTextFontFamily = false;
        
        for (let i = 1; i < connections.length; i++) {
            const conn = connections[i];
            if ((conn.getAttribute('data-linkage') || '') !== firstLinkage) mixedLinkage = true;
            if ((parseFloat(conn.style.strokeWidth || conn.getAttribute('stroke-width')) || 2) !== firstWidth) mixedWidth = true;
            
            // Normalize color before comparison
            const connColorRaw = conn.style.stroke || conn.getAttribute('stroke') || '#000000';
            const connColor = this.normalizeColorToHex(connColorRaw);
            if (connColor !== firstColor) mixedColor = true;
            
            if ((parseFloat(conn.style.strokeOpacity || conn.getAttribute('stroke-opacity')) || 1) !== firstOpacity) mixedOpacity = true;
            if ((conn.getAttribute('data-linkage-visible') !== 'false') !== firstVisible) mixedVisible = true;
            if ((conn.getAttribute('data-text-size') || '12') !== firstTextSize) mixedTextSize = true;
            
            // Normalize text color before comparison
            const connTextColorRaw = conn.getAttribute('data-text-color') || '#000000';
            const connTextColor = this.normalizeColorToHex(connTextColorRaw);
            if (connTextColor !== firstTextColor) mixedTextColor = true;
            
            if ((parseFloat(conn.getAttribute('data-text-opacity')) || 1) !== firstTextOpacity) mixedTextOpacity = true;
            if ((conn.getAttribute('data-text-font-family') || 'Arial') !== firstTextFontFamily) mixedTextFontFamily = true;
            
            const dashArray = conn.style.strokeDasharray || conn.getAttribute('stroke-dasharray') || '';
            let style = 'solid';
            if (dashArray) {
                const dashValues = dashArray.split(',').map(v => parseFloat(v.trim()));
                if (dashValues.length >= 2) {
                    const ratio = dashValues[0] / dashValues[1];
                    if (ratio > 1.5) style = 'dashed';
                    else style = 'dotted';
                }
            }
            if (style !== firstStyle) mixedStyle = true;
        }
        
        // Update controls
        const linkageInput = document.getElementById('linkageInput');
        const connectionStrokeWidth = document.getElementById('connectionStrokeWidth');
        const connectionStrokeWidthValue = document.getElementById('connectionStrokeWidthValue');
        const connectionColor = document.getElementById('connectionColor');
        const connectionColorHex = document.getElementById('connectionColorHex');
        const linkageOpacity = document.getElementById('linkageOpacity');
        const linkageOpacityValue = document.getElementById('linkageOpacityValue');
        const showLinkageText = document.getElementById('showLinkageText');
        const linkageTextSize = document.getElementById('linkageTextSize');
        const linkageTextSizeValue = document.getElementById('linkageTextSizeValue');
        const linkageTextColor = document.getElementById('linkageTextColor');
        const linkageTextColorHex = document.getElementById('linkageTextColorHex');
        const linkageTextOpacity = document.getElementById('linkageTextOpacity');
        const linkageTextOpacityValue = document.getElementById('linkageTextOpacityValue');
        const linkageTextFontFamily = document.getElementById('linkageTextFontFamily');
        
        if (linkageInput) {
            linkageInput.value = mixedLinkage ? '' : firstLinkage;
            if (mixedLinkage) {
                linkageInput.placeholder = window.languageManager.getTranslation('mixed') || 'Mixed';
            } else {
                linkageInput.placeholder = '输入键连信息 (如: α1-2, B14)';
            }
        }
        
        if (connectionStrokeWidth && connectionStrokeWidthValue) {
            connectionStrokeWidth.value = mixedWidth ? '' : firstWidth;
            connectionStrokeWidthValue.textContent = mixedWidth ? (window.languageManager.getTranslation('mixed') || 'Mixed') : firstWidth;
        }
        
        if (connectionColor && connectionColorHex) {
            connectionColor.value = mixedColor ? '#000000' : firstColor;
            connectionColorHex.value = mixedColor ? '' : firstColor;
            if (mixedColor) {
                connectionColor.classList.add('mixed');
                connectionColorHex.placeholder = window.languageManager.getTranslation('mixed') || 'Mixed';
            } else {
                connectionColor.classList.remove('mixed');
                connectionColorHex.placeholder = firstColor;
            }
        }
        
        if (linkageOpacity && linkageOpacityValue) {
            linkageOpacity.value = mixedOpacity ? '1' : firstOpacity;
            linkageOpacityValue.textContent = mixedOpacity ? (window.languageManager.getTranslation('mixed') || 'Mixed') : Math.round(firstOpacity * 100) + '%';
        }
        
        if (showLinkageText) {
            showLinkageText.checked = !mixedVisible && firstVisible;
            showLinkageText.indeterminate = mixedVisible;
        }
        
        if (linkageTextSize && linkageTextSizeValue) {
            linkageTextSize.value = mixedTextSize ? '12' : firstTextSize;
            linkageTextSizeValue.textContent = mixedTextSize ? (window.languageManager.getTranslation('mixed') || 'Mixed') : firstTextSize;
        }
        
        if (linkageTextColor && linkageTextColorHex) {
            linkageTextColor.value = mixedTextColor ? '#000000' : firstTextColor;
            linkageTextColorHex.value = mixedTextColor ? '' : firstTextColor;
            if (mixedTextColor) {
                linkageTextColor.classList.add('mixed');
                linkageTextColorHex.placeholder = window.languageManager.getTranslation('mixed') || 'Mixed';
            } else {
                linkageTextColor.classList.remove('mixed');
                linkageTextColorHex.placeholder = firstTextColor;
            }
        }
        
        if (linkageTextOpacity && linkageTextOpacityValue) {
            linkageTextOpacity.value = mixedTextOpacity ? '1' : firstTextOpacity;
            linkageTextOpacityValue.textContent = mixedTextOpacity ? (window.languageManager.getTranslation('mixed') || 'Mixed') : Math.round(firstTextOpacity * 100) + '%';
        }
        
        if (linkageTextFontFamily) {
            linkageTextFontFamily.value = mixedTextFontFamily ? '' : firstTextFontFamily;
        }
        
        // Update style buttons
        document.querySelectorAll('.connection-style-btn').forEach(btn => {
            btn.classList.toggle('active', !mixedStyle && btn.dataset.style === firstStyle);
        });
        
        // Update color buttons
        document.querySelectorAll('.color-btn-compact[data-target="connectionColor"]').forEach(btn => {
            btn.classList.toggle('active', !mixedColor && btn.dataset.color.toLowerCase() === firstColor.toLowerCase());
        });
        
        document.querySelectorAll('.color-btn-compact[data-target="linkageTextColor"]').forEach(btn => {
            btn.classList.toggle('active', !mixedTextColor && btn.dataset.color.toLowerCase() === firstTextColor.toLowerCase());
        });

        // Sync bold/italic/underline buttons based on selected connections.
        try {
            const boldBtn = document.getElementById('linkageTextBoldBtn');
            const italicBtn = document.getElementById('linkageTextItalicBtn');
            const underlineBtn = document.getElementById('linkageTextUnderlineBtn');

            if (connections.length > 0) {
                let boldCount = 0, italicCount = 0, underlineCount = 0;
                connections.forEach(conn => {
                    const b = conn.getAttribute('data-text-bold');
                    const i = conn.getAttribute('data-text-italic');
                    const u = conn.getAttribute('data-text-underline');
                    if (b === 'true') boldCount++;
                    if (i === 'true') italicCount++;
                    if (u === 'true') underlineCount++;
                });

                const total = connections.length;
                if (boldBtn) {
                    if (boldCount === total) { boldBtn.classList.add('active'); boldBtn.removeAttribute('data-mixed'); }
                    else if (boldCount === 0) { boldBtn.classList.remove('active'); boldBtn.removeAttribute('data-mixed'); }
                    else { boldBtn.classList.remove('active'); boldBtn.setAttribute('data-mixed', 'true'); }
                }
                if (italicBtn) {
                    if (italicCount === total) { italicBtn.classList.add('active'); italicBtn.removeAttribute('data-mixed'); }
                    else if (italicCount === 0) { italicBtn.classList.remove('active'); italicBtn.removeAttribute('data-mixed'); }
                    else { italicBtn.classList.remove('active'); italicBtn.setAttribute('data-mixed', 'true'); }
                }
                if (underlineBtn) {
                    if (underlineCount === total) { underlineBtn.classList.add('active'); underlineBtn.removeAttribute('data-mixed'); }
                    else if (underlineCount === 0) { underlineBtn.classList.remove('active'); underlineBtn.removeAttribute('data-mixed'); }
                    else { underlineBtn.classList.remove('active'); underlineBtn.setAttribute('data-mixed', 'true'); }
                }
            }
        } catch (e) {
            console.error('Error syncing linkage style buttons:', e);
        }

        console.log('updateLinkageControlsFromSelection: Setting isUpdatingUI = false');
        this.isUpdatingUI = false;
    }
    
    updateSugarControlsToDefaults() {
        // Set controls to current configuration values (what will be used for new sugars)
        const sugarType = document.getElementById('sugarType');
        const sugarSize = document.getElementById('sugarSize');
        const sugarBorderWidth = document.getElementById('sugarBorderWidth');
        const sugarBorderColor = document.getElementById('sugarBorderColor');
        const sugarBorderColorHex = document.getElementById('sugarBorderColorHex');
        
        // Clear mixed states when not in selection mode
        if (sugarBorderColor) sugarBorderColor.classList.remove('mixed');
        if (sugarBorderColorHex) sugarBorderColorHex.classList.remove('mixed');
        if (sugarBorderWidth) sugarBorderWidth.classList.remove('mixed');
        const sugarBorderWidthValue = document.getElementById('sugarBorderWidthValue');
        if (sugarBorderWidthValue) sugarBorderWidthValue.classList.remove('mixed');
        
        // These should reflect current tool settings, not change them
        // The values should be what's currently set as defaults
    }
    
    updateTextControlsToDefaults() {
        // Set controls to current configuration values (what will be used for new text)
        const fontSize = document.getElementById('fontSize');
        const fontFamily = document.getElementById('fontFamily');
        const textColor = document.getElementById('textColor');
        
        // These should reflect current tool settings, not change them
    }
    
    updateSugarControlsFromSelection() {
        // Set flag to prevent style application during UI update
        this.isUpdatingUI = true;
        
        // Use new unified selection UI method for shape/color/preset handling
        this.updateSelectionUI();
        
        // Get selected sugars using unified selection system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) {
            this.isUpdatingUI = false;
            return;
        }
        
        // Get values from first sugar for detailed controls
        const firstSugar = selectedSugars[0];
        const firstType = firstSugar.getAttribute('data-shape');
        const firstSize = this.getSugarSize(firstSugar);
        const firstShape = firstSugar.querySelector('.sugar-shape');
        const firstBorderWidth = firstShape ? this.getEffectiveBorderWidth(firstShape) : 2;
        const firstBorderColor = firstShape ? this.getEffectiveBorderColor(firstShape) : '#000000';
        const firstBorderOpacity = firstShape ? this.getEffectiveBorderOpacity(firstShape) : 1;
        const firstFillColor = firstShape ? this.getEffectiveFillColor(firstShape) : '#0072BC';
        const firstFillOpacity = firstShape ? (parseFloat(firstShape.style.fillOpacity || firstShape.getAttribute('fill-opacity')) || 1) : 1;
        
        // Check if all selected sugars have same values for detailed controls
        let mixedType = false, mixedSize = false, mixedBorderWidth = false, mixedBorderColor = false, mixedBorderOpacity = false;
        let mixedFillColor = false, mixedFillOpacity = false;
        
        for (let i = 1; i < selectedSugars.length; i++) {
            const sugar = selectedSugars[i];
            const shape = sugar.querySelector('.sugar-shape');
            
            if (sugar.getAttribute('data-shape') !== firstType) mixedType = true;
            if (this.getSugarSize(sugar) !== firstSize) mixedSize = true;
            if (shape) {
                const borderWidth = this.getEffectiveBorderWidth(shape);
                const borderColor = this.getEffectiveBorderColor(shape);
                const borderOpacity = this.getEffectiveBorderOpacity(shape);
                const fillColor = this.getEffectiveFillColor(shape);
                const fillOpacity = parseFloat(shape.style.fillOpacity || shape.getAttribute('fill-opacity')) || 1;
                if (borderWidth !== firstBorderWidth) mixedBorderWidth = true;
                if (borderColor !== firstBorderColor) mixedBorderColor = true;
                if (borderOpacity !== firstBorderOpacity) mixedBorderOpacity = true;
                if (fillColor !== firstFillColor) mixedFillColor = true;
                if (fillOpacity !== firstFillOpacity) mixedFillOpacity = true;
            }
        }
        
        // Update detailed controls (these are handled separately from main UI)
        const sugarType = document.getElementById('sugarType');
        const sugarSize = document.getElementById('sugarSize');
        const sugarSizeValue = document.getElementById('sugarSizeValue');
        const sugarBorderWidth = document.getElementById('sugarBorderWidth');
        const sugarBorderWidthValue = document.getElementById('sugarBorderWidthValue');
        const sugarBorderColor = document.getElementById('sugarBorderColor');
        const sugarBorderColorHex = document.getElementById('sugarBorderColorHex');
        const sugarBorderOpacity = document.getElementById('sugarBorderOpacity');
        const sugarBorderOpacityValue = document.getElementById('sugarBorderOpacityValue');
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        const customSugarOpacity = document.getElementById('customSugarOpacity');
        const customSugarOpacityValue = document.getElementById('customSugarOpacityValue');
        
        if (sugarType) {
            sugarType.value = mixedType ? '' : firstType;
        }
        
        if (sugarSize && sugarSizeValue) {
            if (mixedSize) {
                sugarSize.value = '';
                sugarSizeValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                sugarSize.classList.add('mixed');
                sugarSizeValue.classList.add('mixed');
            } else {
                sugarSize.value = firstSize;
                sugarSizeValue.textContent = firstSize;
                sugarSize.classList.remove('mixed');
                sugarSizeValue.classList.remove('mixed');
            }
        }
        
        if (sugarBorderWidth && sugarBorderWidthValue) {
            if (mixedBorderWidth) {
                sugarBorderWidth.value = '';
                sugarBorderWidthValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                sugarBorderWidth.classList.add('mixed');
                sugarBorderWidthValue.classList.add('mixed');
            } else {
                sugarBorderWidth.value = firstBorderWidth;
                sugarBorderWidthValue.textContent = firstBorderWidth;
                sugarBorderWidth.classList.remove('mixed');
                sugarBorderWidthValue.classList.remove('mixed');
            }
        }
        
        if (sugarBorderColor && sugarBorderColorHex) {
            if (mixedBorderColor) {
                sugarBorderColor.value = '#ffffff';
                sugarBorderColorHex.value = '';
                sugarBorderColor.classList.add('mixed');
                sugarBorderColorHex.classList.add('mixed');
            } else {
                const hexBorderColor = this.normalizeColorToHex(firstBorderColor);
                sugarBorderColor.value = hexBorderColor;
                sugarBorderColorHex.value = hexBorderColor;
                sugarBorderColor.classList.remove('mixed');
                sugarBorderColorHex.classList.remove('mixed');
            }
        }
        
        if (sugarBorderOpacity && sugarBorderOpacityValue) {
            if (mixedBorderOpacity) {
                sugarBorderOpacity.value = '';
                sugarBorderOpacityValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                sugarBorderOpacity.classList.add('mixed');
                sugarBorderOpacityValue.classList.add('mixed');
            } else {
                sugarBorderOpacity.value = firstBorderOpacity;
                sugarBorderOpacityValue.textContent = Math.round(firstBorderOpacity * 100) + '%';
                sugarBorderOpacity.classList.remove('mixed');
                sugarBorderOpacityValue.classList.remove('mixed');
            }
        }
        
        // Update custom sugar color (additional detailed control)  
        if (customSugarColor && customSugarColorHex) {
            if (mixedFillColor) {
                customSugarColor.value = '#ffffff';
                customSugarColorHex.value = '';
                customSugarColor.classList.add('mixed');
                customSugarColorHex.classList.add('mixed');
            } else {
                const hexFillColor = this.normalizeColorToHex(firstFillColor);
                customSugarColor.value = hexFillColor;
                customSugarColorHex.value = hexFillColor;
                customSugarColor.classList.remove('mixed');
                customSugarColorHex.classList.remove('mixed');
            }
        }
        
        // Update custom sugar opacity
        if (customSugarOpacity && customSugarOpacityValue) {
            if (mixedFillOpacity) {
                customSugarOpacity.value = '';
                customSugarOpacityValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                customSugarOpacity.classList.add('mixed');
                customSugarOpacityValue.classList.add('mixed');
            } else {
                customSugarOpacity.value = firstFillOpacity;
                customSugarOpacityValue.textContent = Math.round(firstFillOpacity * 100) + '%';
                customSugarOpacity.classList.remove('mixed');
                customSugarOpacityValue.classList.remove('mixed');
            }
        }
        
        // Update border style buttons based on selected sugars
        const borderStyleButtons = document.querySelectorAll('.border-style-btn');
        if (borderStyleButtons.length > 0) {
            // Get border style from first sugar
            let firstBorderStyle = 'solid';
            if (firstShape) {
                const dashArray = this.getEffectiveBorderDashArray(firstShape);
                if (dashArray) {
                    const dashValues = dashArray.split(',').map(v => parseFloat(v.trim()));
                    if (dashValues.length === 2) {
                        const width = firstBorderWidth;
                        if (dashValues[0] === width * 3 && dashValues[1] === width * 2) {
                            firstBorderStyle = 'dashed';
                        } else if (dashValues[0] === width && dashValues[1] === width) {
                            firstBorderStyle = 'dotted';
                        }
                    }
                }
            }
            
            // Check if all selected sugars have same border style
            let mixedBorderStyle = false;
            for (let i = 1; i < selectedSugars.length; i++) {
                const sugar = selectedSugars[i];
                const shape = sugar.querySelector('.sugar-shape');
                let borderStyle = 'solid';
                if (shape) {
                    const dashArray = this.getEffectiveBorderDashArray(shape);
                    const width = this.getEffectiveBorderWidth(shape);
                    if (dashArray) {
                        const dashValues = dashArray.split(',').map(v => parseFloat(v.trim()));
                        if (dashValues.length === 2) {
                            if (dashValues[0] === width * 3 && dashValues[1] === width * 2) {
                                borderStyle = 'dashed';
                            } else if (dashValues[0] === width && dashValues[1] === width) {
                                borderStyle = 'dotted';
                            }
                        }
                    }
                }
                if (borderStyle !== firstBorderStyle) {
                    mixedBorderStyle = true;
                    break;
                }
            }
            
            // Update border style button states
            borderStyleButtons.forEach(btn => {
                if (mixedBorderStyle) {
                    btn.classList.remove('active');
                    btn.classList.add('mixed');
                } else {
                    btn.classList.toggle('active', btn.dataset.style === firstBorderStyle);
                    btn.classList.remove('mixed');
                }
            });
        }
        
        // Clear flag after UI update is complete
        this.isUpdatingUI = false;
    }
    
    updateTextControlsFromSelection() {
        // Check for mixed values across selected texts
        const selectedTexts = Array.from(this.selectedTexts);
        if (this.selectedText && !selectedTexts.includes(this.selectedText)) {
            selectedTexts.push(this.selectedText);
        }
        
        if (selectedTexts.length === 0) return;
        
        // Get values from first text
        const firstText = selectedTexts[0];
        const firstFontSize = parseFloat(firstText.style.fontSize || '16');
        const firstFontFamily = firstText.style.fontFamily || 'Arial';
        const firstColor = firstText.style.fill || firstText.getAttribute('fill') || '#000000';
        const firstBold = firstText.style.fontWeight === 'bold';
        const firstItalic = firstText.style.fontStyle === 'italic';
        const firstUnderline = firstText.style.textDecoration === 'underline';
        
        // Check for mixed values
        let mixedSize = false, mixedFamily = false, mixedColor = false;
        let mixedBold = false, mixedItalic = false, mixedUnderline = false;
        
        for (let i = 1; i < selectedTexts.length; i++) {
            const text = selectedTexts[i];
            const fontSize = parseFloat(text.style.fontSize || '16');
            const fontFamily = text.style.fontFamily || 'Arial';
            const color = text.style.fill || text.getAttribute('fill') || '#000000';
            const bold = text.style.fontWeight === 'bold';
            const italic = text.style.fontStyle === 'italic';
            const underline = text.style.textDecoration === 'underline';
            
            if (fontSize !== firstFontSize) mixedSize = true;
            if (fontFamily !== firstFontFamily) mixedFamily = true;
            if (color !== firstColor) mixedColor = true;
            if (bold !== firstBold) mixedBold = true;
            if (italic !== firstItalic) mixedItalic = true;
            if (underline !== firstUnderline) mixedUnderline = true;
        }
        
        // Update controls
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const fontFamily = document.getElementById('fontFamily');
        const textColor = document.getElementById('textColor');
        const textColorHex = document.getElementById('textColorHex');
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        if (fontSize && fontSizeValue) {
            if (mixedSize) {
                fontSize.value = '';
                fontSizeValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
            } else {
                fontSize.value = firstFontSize;
                fontSizeValue.textContent = firstFontSize;
            }
        }
        if (fontFamily) {
            fontFamily.value = mixedFamily ? '' : firstFontFamily.replace(/['"]/g, '');
        }
        if (textColor && textColorHex) {
            if (mixedColor) {
                textColor.value = '#ffffff';
                textColorHex.value = '';
            } else {
                const hexColor = this.normalizeColorToHex(firstColor);
                textColor.value = hexColor;
                textColorHex.value = hexColor;
            }
        }
        
        // Update style buttons with mixed state
        if (boldBtn) {
            boldBtn.classList.toggle('active', !mixedBold && firstBold);
            boldBtn.classList.toggle('mixed', mixedBold);
        }
        if (italicBtn) {
            italicBtn.classList.toggle('active', !mixedItalic && firstItalic);
            italicBtn.classList.toggle('mixed', mixedItalic);
        }
        if (underlineBtn) {
            underlineBtn.classList.toggle('active', !mixedUnderline && firstUnderline);
            underlineBtn.classList.toggle('mixed', mixedUnderline);
        }
    }
    
    getCurrentTextConfig() {
        if (this.currentTool === 'text') {
            // 文本工具模式：使用保存的配置
            return this.currentTextConfig || {
                fontSize: 16,
                fontFamily: 'Arial, sans-serif',
                color: '#000000',
                bold: false,
                italic: false,
                underline: false
            };
        } else {
            // 选择模式或其他模式：从右侧面板读取当前值
            const fontSize = document.getElementById('fontSize');
            const fontFamily = document.getElementById('fontFamily');
            const textColor = document.getElementById('textColor');
            const boldBtn = document.getElementById('bold');
            const italicBtn = document.getElementById('italic');
            const underlineBtn = document.getElementById('underline');
            
            return {
                fontSize: fontSize ? parseInt(fontSize.value) : 16,
                fontFamily: fontFamily ? fontFamily.value : 'Arial, sans-serif',
                color: textColor ? textColor.value : '#000000',
                bold: boldBtn ? boldBtn.classList.contains('active') : false,
                italic: italicBtn ? italicBtn.classList.contains('active') : false,
                underline: underlineBtn ? underlineBtn.classList.contains('active') : false
            };
        }
    }
    
    // Eraser methods
    startErasing(x, y) {
        this.isErasing = true;
        this.lastErasedElement = null;
        
        // Immediately erase at current position
        this.eraseAtPosition(x, y);
    }
    
    continueErasing(x, y) {
        if (this.isErasing) {
            this.eraseAtPosition(x, y);
        }
    }
    
    stopErasing() {
        this.isErasing = false;
        this.lastErasedElement = null;
        if (this.eraserTimer) {
            clearInterval(this.eraserTimer);
            this.eraserTimer = null;
        }
    }
    
    eraseAtPosition(x, y) {
        // Find elements at current position
        const clickedSugar = this.getSugarAtPoint(x, y);
        const clickedText = this.getTextAtPoint(x, y);
        
        // Prevent deleting the same element multiple times during one drag
        const elementToErase = clickedSugar || clickedText;
        if (elementToErase && elementToErase !== this.lastErasedElement) {
            if (clickedSugar) {
                this.deleteSugar(clickedSugar);
            } else if (clickedText) {
                this.deleteText(clickedText);
            }
            this.lastErasedElement = elementToErase;
        }
    }
    
    // Clear custom sugar type selections when switching contexts
    clearCustomSugarSelections() {
        // Clear shape selections
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.shape-dropdown-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.shape-category').forEach(cat => {
            cat.classList.remove('active');
        });
        
        // Clear color selections  
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Clear preset selections
        document.querySelectorAll('.preset-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    // Style control methods
    updateStylePanel() {
        // Use the correct panel IDs from the main index.html
        const sugarControlsSection = document.getElementById('sugarControlsSection');
        const textControlsSection = document.getElementById('textControlsSection');
        const emptyControlsSection = document.getElementById('emptyControlsSection');
        const linkagePreselectionSection = document.getElementById('linkagePreselectionSection');
        
        if (!sugarControlsSection || !textControlsSection || !emptyControlsSection) return;
        
        if (this.currentTool === 'add') {
            // 添加模式：总是显示糖分子控制面板并显示添加配置参数
            sugarControlsSection.style.display = 'block';
            textControlsSection.style.display = 'none';
            emptyControlsSection.style.display = 'none';
            // Show linkage preselection in add mode
            if (linkagePreselectionSection) linkagePreselectionSection.style.display = 'block';
            
            // 总是显示 currentSugarConfig 的参数，不管是否有选中元素
            this.updateStyleControlValues();
            
        } else if (this.currentTool === 'select') {
            // 选择模式：根据选中元素显示相应面板
            const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
            const selectedTexts = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'text');
            if (selectedSugars.length > 0) {
                // Show sugar controls panel
                sugarControlsSection.style.display = 'block';
                textControlsSection.style.display = 'none';
                emptyControlsSection.style.display = 'none';
                // HIDE linkage preselection in select mode (only for add mode)
                if (linkagePreselectionSection) linkagePreselectionSection.style.display = 'none';
                
                // Update current values from selected sugar
                this.updateStyleControlValues();
                
            } else if (selectedTexts.length > 0) {
                // Show text controls panel and clear custom sugar selections
                sugarControlsSection.style.display = 'none';
                textControlsSection.style.display = 'block';
                emptyControlsSection.style.display = 'none';
                
                // Clear custom sugar type selections when showing text controls
                this.clearCustomSugarSelections();
                
                // Update current values from selected text
                this.updateTextStyleControlValues();
                
            } else {
                // Show empty state when nothing is selected and clear custom sugar selections
                sugarControlsSection.style.display = 'none';
                textControlsSection.style.display = 'none';
                emptyControlsSection.style.display = 'block';
                
                // Clear custom sugar type selections when showing empty state
                this.clearCustomSugarSelections();
            }
        } else if (this.currentTool === 'text') {
            // Show text controls for text tool and clear custom sugar selections
            sugarControlsSection.style.display = 'none';
            textControlsSection.style.display = 'block';
            emptyControlsSection.style.display = 'none';
            
            // Clear custom sugar type selections when showing text tool
            this.clearCustomSugarSelections();
            
            // Update control values from currentTextConfig
            this.updateTextStyleControlValues();
        } else {
            // Show empty state for other tools and clear custom sugar selections
            sugarControlsSection.style.display = 'none';
            textControlsSection.style.display = 'none';
            emptyControlsSection.style.display = 'block';
            
            // Clear custom sugar type selections when showing other tools
            this.clearCustomSugarSelections();
        }
    }
    
    updateStyleControlValues() {
        const sizeSlider = document.getElementById('sugarSize');
        const sizeValue = document.getElementById('sugarSizeValue');
        const widthSlider = document.getElementById('sugarBorderWidth');
        const widthValue = document.getElementById('sugarBorderWidthValue');
        const colorPicker = document.getElementById('sugarBorderColor');
        const colorHex = document.getElementById('sugarBorderColorHex');
        const opacitySlider = document.getElementById('sugarBorderOpacity');
        const opacityValue = document.getElementById('sugarBorderOpacityValue');
        const customColorPicker = document.getElementById('customSugarColor');
        const customColorHex = document.getElementById('customSugarColorHex');
        const customOpacitySlider = document.getElementById('customSugarOpacity');
        const customOpacityValue = document.getElementById('customSugarOpacityValue');

        if (this.currentTool === 'add') {
            // 添加模式：显示即将添加的新糖分子配置参数
            const config = this.currentSugarConfig || { size: 20, borderWidth: 2, borderColor: '#000000', borderOpacity: 1 };
            
            // Update size slider from config
            if (sizeSlider && sizeValue) {
                const configSize = config.size || 20;
                sizeSlider.value = configSize;
                sizeValue.textContent = configSize;
            }
            
            // Update border width from config
            if (widthSlider && widthValue) {
                const configWidth = config.borderWidth || 2;
                widthSlider.value = configWidth;
                widthValue.textContent = configWidth;
            }
            
            // Update border color from config
            if (colorPicker && colorHex) {
                const configColor = config.borderColor || '#000000';
                const hexColor = this.normalizeColorToHex(configColor);
                colorPicker.value = hexColor;
                colorHex.value = hexColor;
            }
            
            // Update border opacity from config
            if (opacitySlider && opacityValue) {
                const configOpacity = config.borderOpacity !== undefined ? config.borderOpacity : 1;
                opacitySlider.value = configOpacity;
                opacityValue.textContent = Math.round(configOpacity * 100) + '%';
            }
            
            // Update custom sugar color from config
            if (customColorPicker && customColorHex) {
                const configFillColor = config.color || '#0072BC';
                const hexFillColor = this.normalizeColorToHex(configFillColor);
                customColorPicker.value = hexFillColor;
                customColorHex.value = hexFillColor;
            }
            
            // Update custom sugar opacity from config
            if (customOpacitySlider && customOpacityValue) {
                const configFillOpacity = config.fillOpacity !== undefined ? config.fillOpacity : 1;
                customOpacitySlider.value = configFillOpacity;
                customOpacityValue.textContent = Math.round(configFillOpacity * 100) + '%';
            }
            
        } else if (this.currentTool === 'select') {
            // 选择模式：显示选中糖分子的实际参数
            const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
            const referenceSugar = selectedSugars.length > 0 ? selectedSugars[0] : null;
            
            if (referenceSugar) {
                // Update size slider from selected sugar
                const currentSize = this.getSugarSize(referenceSugar);
                if (sizeSlider && sizeValue) {
                    sizeSlider.value = currentSize;
                    sizeValue.textContent = currentSize;
                }
                
                // Update border width and color from selected sugar
                const shape = referenceSugar.querySelector('.sugar-shape');
                if (shape) {
                    const currentWidth = this.getEffectiveBorderWidth(shape);
                    if (widthSlider && widthValue) {
                        widthSlider.value = parseFloat(currentWidth);
                        widthValue.textContent = parseFloat(currentWidth);
                    }
                    
                    const currentColor = this.getEffectiveBorderColor(shape);
                    const hexColor = this.normalizeColorToHex(currentColor);
                    if (colorPicker && colorHex) {
                        colorPicker.value = hexColor;
                        colorHex.value = hexColor;
                    }
                    
                    const currentOpacity = this.getEffectiveBorderOpacity(shape);
                    if (opacitySlider && opacityValue) {
                        opacitySlider.value = currentOpacity;
                        opacityValue.textContent = Math.round(currentOpacity * 100) + '%';
                    }
                    
                    // Update custom sugar color from selected sugar
                    const currentFillColor = this.getEffectiveFillColor(shape);
                    const hexFillColor = this.normalizeColorToHex(currentFillColor);
                    if (customColorPicker && customColorHex) {
                        customColorPicker.value = hexFillColor;
                        customColorHex.value = hexFillColor;
                    }
                    
                    // Update custom sugar opacity from selected sugar
                    const currentFillOpacity = parseFloat(shape.style.fillOpacity || shape.getAttribute('fill-opacity') || '1');
                    if (customOpacitySlider && customOpacityValue) {
                        customOpacitySlider.value = currentFillOpacity;
                        customOpacityValue.textContent = Math.round(currentFillOpacity * 100) + '%';
                    }
                }
            }
            // 如果选择模式下没有选中糖分子，不更新控制值（保持当前显示）
        }
    }
    
    updateTextStyleControlValues() {
        if (this.currentTool === 'text') {
            // 文本工具模式：显示文本配置参数
            this.updateTextControlsFromConfig();
        } else if (this.currentTool === 'select') {
            // 选择模式：显示选中文本元素的参数
            const selectedTexts = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'text');
            const textElement = selectedTexts.length > 0 ? selectedTexts[0] : null;
            
            if (!textElement) return;
            this.updateTextControlsFromElement(textElement);
        }
    }
    
    updateTextControlsFromConfig() {
        // 从 currentTextConfig 更新控件值
        const config = this.currentTextConfig || { fontSize: 16, fontFamily: 'Arial, sans-serif', color: '#000000', bold: false, italic: false, underline: false };
        
        // Update font size
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        if (fontSize && fontSizeValue) {
            fontSize.value = config.fontSize;
            fontSizeValue.textContent = config.fontSize;
        }
        
        // Update font family
        const fontFamily = document.getElementById('fontFamily');
        if (fontFamily) {
            fontFamily.value = config.fontFamily;
        }
        
        // Update text color
        const textColor = document.getElementById('textColor');
        const textColorHex = document.getElementById('textColorHex');
        if (textColor && textColorHex) {
            textColor.value = config.color;
            textColorHex.value = config.color;
        }
        
        // Update style buttons
        const boldBtn = document.getElementById('bold');
        const italicBtn = document.getElementById('italic');
        const underlineBtn = document.getElementById('underline');
        
        if (boldBtn) {
            boldBtn.classList.toggle('active', config.bold);
        }
        if (italicBtn) {
            italicBtn.classList.toggle('active', config.italic);
        }
        if (underlineBtn) {
            underlineBtn.classList.toggle('active', config.underline);
        }
    }
    
    updateTextControlsFromElement(textElement) {
        // 从选中的文本元素更新控件值
        
        // Get current styles
        const computedStyle = window.getComputedStyle(textElement);
        
        // Update font size
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const currentFontSize = parseFloat(textElement.style.fontSize || computedStyle.fontSize || '16');
        if (fontSize && fontSizeValue) {
            fontSize.value = currentFontSize;
            fontSizeValue.textContent = currentFontSize;
        }
        
        // Update font family
        const fontFamily = document.getElementById('fontFamily');
        const currentFontFamily = textElement.style.fontFamily || computedStyle.fontFamily || 'Arial';
        if (fontFamily) {
            // Try to match the font family with available options
            const cleanFontFamily = currentFontFamily.replace(/['"]/g, '').split(',')[0];
            fontFamily.value = cleanFontFamily;
        }
        
        // Update text color
        const textColor = document.getElementById('textColor');
        const textColorHex = document.getElementById('textColorHex');
        const currentColor = textElement.style.fill || textElement.getAttribute('fill') || '#000000';
        const hexColor = this.normalizeColorToHex(currentColor);
        if (textColor && textColorHex) {
            textColor.value = hexColor;
            textColorHex.value = hexColor;
        }
        
        // Update style buttons
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        if (boldBtn) {
            const isBold = textElement.style.fontWeight === 'bold' || 
                          computedStyle.fontWeight === 'bold' || 
                          parseInt(computedStyle.fontWeight) >= 700;
            boldBtn.classList.toggle('active', isBold);
        }
        
        if (italicBtn) {
            const isItalic = textElement.style.fontStyle === 'italic' || 
                            computedStyle.fontStyle === 'italic';
            italicBtn.classList.toggle('active', isItalic);
        }
        
        if (underlineBtn) {
            const isUnderlined = textElement.style.textDecoration === 'underline' || 
                                computedStyle.textDecoration.includes('underline');
            underlineBtn.classList.toggle('active', isUnderlined);
        }
        
        // Update text opacity
        const textOpacity = document.getElementById('textOpacity');
        const textOpacityValue = document.getElementById('textOpacityValue');
        const currentOpacity = parseFloat(textElement.style.fillOpacity || textElement.getAttribute('fill-opacity') || '1');
        if (textOpacity && textOpacityValue) {
            textOpacity.value = currentOpacity;
            textOpacityValue.textContent = Math.round(currentOpacity * 100) + '%';
        }
    }
    
    getSugarSize(sugar) {
        // First try to get size from data attribute (most reliable)
        const dataSize = sugar.getAttribute('data-size');
        if (dataSize) {
            return parseFloat(dataSize);
        }
        
        // Fallback: Get current size from the sugar's shape
        const shape = sugar.querySelector('.sugar-shape');
        if (!shape) return 20; // default size
        
        const shapeType = sugar.getAttribute('data-shape');
        switch (shapeType) {
            case 'circle':
                return parseFloat(shape.getAttribute('r') || '20');
            case 'square':
                const width = parseFloat(shape.getAttribute('width') || '40');
                return width / 2; // return radius equivalent
            default:
                return 20; // default
        }
    }
    
    // Helper method to extract color from gradient reference or direct color
    getEffectiveFillColor(element) {
        const fill = element.style.fill || element.getAttribute('fill');
        if (!fill) return '#0072BC';
        
        // Check if it's a gradient reference
        const gradientMatch = fill.match(/url\(#(.+)\)/);
        if (gradientMatch) {
            const gradientId = gradientMatch[1];
            const gradient = this.canvas.querySelector('#' + gradientId);
            if (gradient) {
                // For divided shapes, get the user color (second stop)
                const stops = gradient.querySelectorAll('stop');
                if (stops.length >= 2) {
                    return stops[1].getAttribute('stop-color') || '#0072BC';
                }
            }
        }
        
        // Return direct color
        return fill;
    }
    
    // Helper method to get border color from shape (handles divided shapes)
    getEffectiveBorderColor(element) {
        // For divided shapes, get color from the polygon child
        if (element.classList && (element.classList.contains('triangle-divided-group') ||
            element.classList.contains('square-divided-group') ||
            element.classList.contains('diamond-divided-top-group') ||
            element.classList.contains('diamond-divided-bottom-group'))) {
            const polygon = element.querySelector('polygon');
            if (polygon) {
                return polygon.style.stroke || polygon.getAttribute('stroke') || '#000000';
            }
        }
        
        // For regular shapes, get from the element itself
        return element.style.stroke || element.getAttribute('stroke') || '#000000';
    }
    
    // Helper method to get border width from shape (handles divided shapes)
    getEffectiveBorderWidth(element) {
        // For divided shapes, get width from the polygon child
        if (element.classList && (element.classList.contains('triangle-divided-group') ||
            element.classList.contains('square-divided-group') ||
            element.classList.contains('diamond-divided-top-group') ||
            element.classList.contains('diamond-divided-bottom-group'))) {
            const polygon = element.querySelector('polygon');
            if (polygon) {
                return parseFloat(polygon.style.strokeWidth || polygon.getAttribute('stroke-width')) || 2;
            }
        }
        
        // For regular shapes, get from the element itself
        return parseFloat(element.style.strokeWidth || element.getAttribute('stroke-width')) || 2;
    }
    
    // Helper method to get border opacity from shape (handles divided shapes)
    getEffectiveBorderOpacity(element) {
        // For divided shapes, get opacity from the polygon child
        if (element.classList && (element.classList.contains('triangle-divided-group') ||
            element.classList.contains('square-divided-group') ||
            element.classList.contains('diamond-divided-top-group') ||
            element.classList.contains('diamond-divided-bottom-group'))) {
            const polygon = element.querySelector('polygon');
            if (polygon) {
                return parseFloat(polygon.style.strokeOpacity || polygon.getAttribute('stroke-opacity')) || 1;
            }
        }
        
        // For regular shapes, get from the element itself
        return parseFloat(element.style.strokeOpacity || element.getAttribute('stroke-opacity')) || 1;
    }
    
    // Helper method to get border dash array from shape (handles divided shapes)
    getEffectiveBorderDashArray(element) {
        // For divided shapes, get dash array from the polygon child
        if (element.classList && (element.classList.contains('triangle-divided-group') ||
            element.classList.contains('square-divided-group') ||
            element.classList.contains('diamond-divided-top-group') ||
            element.classList.contains('diamond-divided-bottom-group'))) {
            const polygon = element.querySelector('polygon');
            if (polygon) {
                return polygon.style.strokeDasharray || polygon.getAttribute('stroke-dasharray');
            }
        }
        
        // For regular shapes, get from the element itself
        return element.style.strokeDasharray || element.getAttribute('stroke-dasharray');
    }
    
    getConnectionsForSelection() {
        const connections = [];
        const allConnections = this.canvas.querySelectorAll('.connection');
        
        // Get selected sugars using unified selection system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 1) {
            // Single sugar selection
            const sugarId = selectedSugars[0].getAttribute('id');
            allConnections.forEach(conn => {
                const startId = conn.getAttribute('data-start');
                const endId = conn.getAttribute('data-end');
                if (startId === sugarId || endId === sugarId) {
                    connections.push(conn);
                }
            });
        } else if (selectedSugars.length > 1) {
            // Multiple sugar selection - find connections between selected sugars
            const selectedIds = selectedSugars.map(sugar => sugar.getAttribute('id'));
            allConnections.forEach(conn => {
                const startId = conn.getAttribute('data-start');
                const endId = conn.getAttribute('data-end');
                if (selectedIds.includes(startId) && selectedIds.includes(endId)) {
                    connections.push(conn);
                }
            });
        }
        
        return connections;
    }
    
    applySugarSize() {
        const size = parseFloat(document.getElementById('sugarSize').value);
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.size = size;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;
        
        // Start recording step for undo/redo
        this.startStep();
        
        this.applySugarSizeToElements(selectedSugars, size, true);
        
        // Finish recording step
        this.finishStep();
    }
    
    // Apply sugar size without creating undo step (used during slider drag)
    applySugarSizeWithoutStep() {
        const size = parseFloat(document.getElementById('sugarSize').value);
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;
        
        this.applySugarSizeToElements(selectedSugars, size, false);
    }
    
    // Helper method to apply size to elements with optional undo recording
    applySugarSizeToElements(selectedSugars, size, recordModifications = true) {
        selectedSugars.forEach(sugar => {
            const shape = sugar.querySelector('.sugar-shape');
            const shapeType = sugar.getAttribute('data-shape');
            const x = parseFloat(sugar.getAttribute('data-x'));
            const y = parseFloat(sugar.getAttribute('data-y'));
            
            if (shape) {
                // Record before state only if we want to record modifications
                let beforeData = null;
                if (recordModifications) {
                    beforeData = this.createObjectData(sugar);
                }
                
                // Update the data-size attribute
                sugar.setAttribute('data-size', size);
                
                this.updateShapeSize(shape, shapeType, size);
                
                // Update selection highlight to match new size
                const highlightId = sugar.getAttribute('data-highlight-id');
                if (highlightId) {
                    const highlight = this.canvas.querySelector('#' + highlightId);
                    if (highlight) {
                        highlight.setAttribute('r', size + 5);
                    }
                }
                
                // Record after state only if we want to record modifications
                if (recordModifications && beforeData) {
                    const afterData = this.createObjectData(sugar);
                    this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
                }
            }
        });
    }
    
    updateShapeSize(shape, shapeType, size) {
        switch (shapeType) {
            case 'circle':
            case 'circle-filled':
                shape.setAttribute('r', size);
                break;
                
            case 'circle-flat':
                // Ellipse with wider width
                shape.setAttribute('rx', size * 1.4);
                shape.setAttribute('ry', size * 0.7);
                break;
                
            case 'circle-narrow':
                // Ellipse with taller height
                shape.setAttribute('rx', size * 0.7);
                shape.setAttribute('ry', size * 1.4);
                break;
                
            case 'square':
            case 'square-divided':
            case 'square-flat':
            case 'square-narrow':
                // Get the center position from the parent sugar element
                const squareSugar = shape.closest('.sugar');
                if (squareSugar) {
                    const centerX = parseFloat(squareSugar.getAttribute('data-x'));
                    const centerY = parseFloat(squareSugar.getAttribute('data-y'));
                    
                    if (shapeType === 'square-divided') {
                        // For divided square, update the polygon and dividing line
                        const polygon = shape.querySelector('polygon');
                        const line = shape.querySelector('.dividing-line');
                        
                        if (polygon) {
                            // Recalculate polygon points for square
                            const p1 = {x: centerX - size, y: centerY - size}; // 左上
                            const p2 = {x: centerX + size, y: centerY - size}; // 右上
                            const p3 = {x: centerX + size, y: centerY + size}; // 右下
                            const p4 = {x: centerX - size, y: centerY + size}; // 左下
                            const squarePoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
                            polygon.setAttribute('points', squarePoints);
                        }
                        
                        if (line) {
                            // Update diagonal line coordinates (left-top to right-bottom)
                            line.setAttribute('x1', centerX - size);
                            line.setAttribute('y1', centerY - size);
                            line.setAttribute('x2', centerX + size);
                            line.setAttribute('y2', centerY + size);
                        }
                    } else if (shapeType === 'square-flat') {
                        // Flat square (wider)
                        shape.setAttribute('x', centerX - size);
                        shape.setAttribute('y', centerY - size * 0.7);
                        shape.setAttribute('width', size * 2);
                        shape.setAttribute('height', size * 1.4);
                    } else if (shapeType === 'square-narrow') {
                        // Narrow square (taller)
                        shape.setAttribute('x', centerX - size * 0.7);
                        shape.setAttribute('y', centerY - size);
                        shape.setAttribute('width', size * 1.4);
                        shape.setAttribute('height', size * 2);
                    } else {
                        // Regular square
                        const squareSize = size * 2;
                        shape.setAttribute('x', centerX - size);
                        shape.setAttribute('y', centerY - size);
                        shape.setAttribute('width', squareSize);
                        shape.setAttribute('height', squareSize);
                    }
                }
                break;
                
            case 'freeend-asterisk':
                // For asterisk, update path and stroke width
                const asteriskSugar = shape.closest('.sugar');
                if (asteriskSugar) {
                    const asteriskX = parseFloat(asteriskSugar.getAttribute('data-x'));
                    const asteriskY = parseFloat(asteriskSugar.getAttribute('data-y'));
                    shape.setAttribute('d', this.createAsteriskPath(asteriskX, asteriskY, size));
                    shape.setAttribute('stroke-width', size * 0.15);
                }
                break;
                
            case 'freeend-wave':
                // For wave, update the path using the helper function
                const waveSugar = shape.closest('.sugar');
                if (waveSugar) {
                    const waveX = parseFloat(waveSugar.getAttribute('data-x'));
                    const waveY = parseFloat(waveSugar.getAttribute('data-y'));
                    this.updateWavePath(shape, waveX, waveY, size);
                }
                break;
                
            case 'bracket-left':
            case 'bracket-right':
            case 'paren-left':
            case 'paren-right':
            case 'brace-left':
            case 'brace-right':
                // For brackets, update path and stroke width
                const bracketSugar = shape.closest('.sugar');
                if (bracketSugar) {
                    const bracketX = parseFloat(bracketSugar.getAttribute('data-x'));
                    const bracketY = parseFloat(bracketSugar.getAttribute('data-y'));
                    const shapeType = bracketSugar.getAttribute('data-shape');
                    
                    // Update path based on shape type
                    if (shapeType === 'bracket-left') {
                        shape.setAttribute('d', this.createBracketPath('left', bracketX, bracketY, size));
                    } else if (shapeType === 'bracket-right') {
                        shape.setAttribute('d', this.createBracketPath('right', bracketX, bracketY, size));
                    } else if (shapeType === 'paren-left') {
                        shape.setAttribute('d', this.createParenPath('left', bracketX, bracketY, size));
                    } else if (shapeType === 'paren-right') {
                        shape.setAttribute('d', this.createParenPath('right', bracketX, bracketY, size));
                    } else if (shapeType === 'brace-left') {
                        shape.setAttribute('d', this.createBracePath('left', bracketX, bracketY, size));
                    } else if (shapeType === 'brace-right') {
                        shape.setAttribute('d', this.createBracePath('right', bracketX, bracketY, size));
                    }
                    
                    // Update stroke width
                    shape.setAttribute('stroke-width', size * 0.15);
                }
                break;
                
            case 'triangle':
            case 'triangle-inverted':
            case 'triangle-divided':
            case 'diamond':
            case 'diamond-flat':
            case 'diamond-narrow':
            case 'diamond-divided-top':
            case 'diamond-divided-bottom':
            case 'star':
            case 'hexagon':
            case 'flat-hexagon':
            case 'hexagon-compressed':
            case 'flat-hexagon-compressed':
            case 'flat-diamond':
            case 'pentagon':
            case 'pentagon-inverted':
                // For polygons, we need to recalculate points
                const sugar = shape.closest('.sugar');
                if (sugar) {
                    const x = parseFloat(sugar.getAttribute('data-x'));
                    const y = parseFloat(sugar.getAttribute('data-y'));
                    const color = sugar.getAttribute('data-color');
                    
                    // Remove old shape and create new one with updated size
                    const newShape = this.createSugarShape(x, y, shapeType, color, size);
                    newShape.classList.add('sugar-shape');
                    
                    // Copy all border styles from the old shape to preserve user settings
                    // For divided shapes, we need to handle both the container and child elements
                    const isOldDivided = (shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) ||
                        (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) ||
                        (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) ||
                        (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group'));
                    
                    const isNewDivided = (shapeType === 'triangle-divided' && newShape.classList.contains('triangle-divided-group')) ||
                        (shapeType === 'square-divided' && newShape.classList.contains('square-divided-group')) ||
                        (shapeType === 'diamond-divided-top' && newShape.classList.contains('diamond-divided-top-group')) ||
                        (shapeType === 'diamond-divided-bottom' && newShape.classList.contains('diamond-divided-bottom-group'));
                    
                    if (isOldDivided && isNewDivided) {
                        // Both old and new are divided shapes - copy from polygon/line to polygon/line
                        const oldPolygon = shape.querySelector('polygon');
                        const oldLine = shape.querySelector('.dividing-line');
                        const newPolygon = newShape.querySelector('polygon');
                        const newLine = newShape.querySelector('.dividing-line');
                        
                        // Copy polygon styles
                        if (oldPolygon && newPolygon) {
                            ['stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'fill-opacity'].forEach(prop => {
                                const value = oldPolygon.style.getPropertyValue(prop);
                                if (value) {
                                    newPolygon.style.setProperty(prop, value, 'important');
                                }
                            });
                        }
                        
                        // Copy line styles
                        if (oldLine && newLine) {
                            ['stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray'].forEach(prop => {
                                const value = oldLine.style.getPropertyValue(prop);
                                if (value) {
                                    newLine.style.setProperty(prop, value, 'important');
                                }
                            });
                        }
                    } else {
                        // Regular shape or mixed case - copy from container level
                        ['stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'fill-opacity'].forEach(prop => {
                            const value = shape.style.getPropertyValue(prop);
                            if (value) {
                                newShape.style.setProperty(prop, value, 'important');
                            }
                        });
                    }
                    
                    // Replace the shape
                    sugar.replaceChild(newShape, shape);
                }
                break;
        }
    }
    
    applySugarBorderStyle() {
        const width = document.getElementById('sugarBorderWidth').value;
        const color = document.getElementById('sugarBorderColor').value;
        const styleBtn = document.querySelector('.border-style-btn.active');
        const style = styleBtn ? styleBtn.dataset.style : 'solid';
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.borderWidth = width;
            this.currentSugarConfig.borderColor = color;
            this.currentSugarConfig.borderStyle = style;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;

        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;

        // Start recording step for undo/redo
        this.startStep('Change sugar border style');
        
        selectedSugars.forEach(sugar => {
            // Record before state
            const beforeData = this.createObjectData(sugar);
            
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                const shapeType = sugar.getAttribute('data-shape');
                
                // Check if this is a divided shape that needs special handling
                if ((shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) ||
                    (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) ||
                    (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) ||
                    (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group'))) {
                    // Handle divided shapes: apply styles to both polygon and dividing line
                    const polygon = shape.querySelector('polygon');
                    const line = shape.querySelector('.dividing-line');
                    
                    if (polygon) {
                        polygon.style.setProperty('stroke-width', width, 'important');
                        const normalizedStrokeColor = this.normalizeColorToHex(color);
                        polygon.style.setProperty('stroke', normalizedStrokeColor, 'important');
                        
                        // Apply dash pattern based on style
                        switch (style) {
                            case 'dashed':
                                polygon.style.setProperty('stroke-dasharray', `${width * 3},${width * 2}`, 'important');
                                break;
                            case 'dotted':
                                polygon.style.setProperty('stroke-dasharray', `${width},${width}`, 'important');
                                break;
                            default: // solid
                                polygon.style.removeProperty('stroke-dasharray');
                        }
                    }
                    
                    if (line) {
                        line.style.setProperty('stroke-width', width, 'important');
                        const normalizedLineStrokeColor = this.normalizeColorToHex(color);
                        line.style.setProperty('stroke', normalizedLineStrokeColor, 'important');
                        
                        // Apply dash pattern based on style
                        switch (style) {
                            case 'dashed':
                                line.style.setProperty('stroke-dasharray', `${width * 3},${width * 2}`, 'important');
                                break;
                            case 'dotted':
                                line.style.setProperty('stroke-dasharray', `${width},${width}`, 'important');
                                break;
                            default: // solid
                                line.style.removeProperty('stroke-dasharray');
                        }
                    }
                } else {
                    // Handle regular shapes
                    shape.style.setProperty('stroke-width', width, 'important');
                    const normalizedShapeStrokeColor = this.normalizeColorToHex(color);
                    shape.style.setProperty('stroke', normalizedShapeStrokeColor, 'important');
                    
                    // Apply dash pattern based on style
                    switch (style) {
                        case 'dashed':
                            shape.style.setProperty('stroke-dasharray', `${width * 3},${width * 2}`, 'important');
                            break;
                        case 'dotted':
                            shape.style.setProperty('stroke-dasharray', `${width},${width}`, 'important');
                            break;
                        default: // solid
                            shape.style.removeProperty('stroke-dasharray');
                    }
                }
            }
            
            // Record after state
            const afterData = this.createObjectData(sugar);
            this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish recording step
        this.finishStep();
    }

    applySugarBorderWidth() {
        // Skip if we're updating UI controls
        if (this.isUpdatingUI) return;
        
        const width = document.getElementById('sugarBorderWidth').value;
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.borderWidth = width;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;
        
        // Start recording step for undo/redo
        this.startStep();
        
        this.applySugarBorderWidthToElements(selectedSugars, width, true);
        
        // Finish recording step
        this.finishStep();
    }
    
    // Apply sugar border width without creating undo step (used during slider drag)
    applySugarBorderWidthWithoutStep() {
        // Skip if we're updating UI controls
        if (this.isUpdatingUI) return;
        
        const width = document.getElementById('sugarBorderWidth').value;
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;
        
        this.applySugarBorderWidthToElements(selectedSugars, width, false);
    }
    
    // Helper method to apply border width to elements with optional undo recording
    applySugarBorderWidthToElements(selectedSugars, width, recordModifications = true) {
        selectedSugars.forEach(sugar => {
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                // Record before state only if we want to record modifications
                let beforeData = null;
                if (recordModifications) {
                    beforeData = this.createObjectData(sugar);
                }
                
                const shapeType = sugar.getAttribute('data-shape');
                
                // Check if this is a divided shape that needs special handling
                if ((shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) ||
                    (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) ||
                    (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) ||
                    (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group'))) {
                    // Handle divided shapes: apply width to both polygon and dividing line
                    const polygon = shape.querySelector('polygon');
                    const line = shape.querySelector('.dividing-line');
                    
                    if (polygon) {
                        polygon.style.setProperty('stroke-width', width, 'important');
                    }
                    if (line) {
                        line.style.setProperty('stroke-width', width, 'important');
                    }
                } else {
                    // Handle regular shapes
                    shape.style.setProperty('stroke-width', width, 'important');
                }
                
                // Record after state only if we want to record modifications
                if (recordModifications && beforeData) {
                    const afterData = this.createObjectData(sugar);
                    this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
                }
            }
        });
    }

    applySugarBorderColor(color) {
        // Skip if we're updating UI controls
        if (this.isUpdatingUI) return;
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.borderColor = color;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;

        // Start recording step for undo/redo
        this.startStep('Change sugar border color');
        
        selectedSugars.forEach(sugar => {
            // Record before state
            const beforeData = this.createObjectData(sugar);
            
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                const shapeType = sugar.getAttribute('data-shape');
                
                // Check if this is a divided shape that needs special handling
                if ((shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) ||
                    (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) ||
                    (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) ||
                    (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group'))) {
                    // Handle divided shapes: apply color to both polygon and dividing line
                    const polygon = shape.querySelector('polygon');
                    const line = shape.querySelector('.dividing-line');
                    
                    if (polygon) {
                        const normalizedPolygonStrokeColor = this.normalizeColorToHex(color);
                        polygon.style.setProperty('stroke', normalizedPolygonStrokeColor, 'important');
                    }
                    if (line) {
                        const normalizedLineStrokeColor = this.normalizeColorToHex(color);
                        line.style.setProperty('stroke', normalizedLineStrokeColor, 'important');
                    }
                } else {
                    // Handle regular shapes
                    const normalizedRegularStrokeColor = this.normalizeColorToHex(color);
                    shape.style.setProperty('stroke', normalizedRegularStrokeColor, 'important');
                }
            }
            
            // Record after state
            const afterData = this.createObjectData(sugar);
            this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish recording step
        this.finishStep();
    }

    applySugarBorderOpacity() {
        // Skip if we're updating UI controls
        if (this.isUpdatingUI) return;
        
        const opacity = document.getElementById('sugarBorderOpacity').value;
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.borderOpacity = opacity;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;

        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;

        // Start recording step for undo/redo
        this.startStep('Change sugar border opacity');
        
        selectedSugars.forEach(sugar => {
            // Record before state
            const beforeData = this.createObjectData(sugar);
            
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                const shapeType = sugar.getAttribute('data-shape');
                
                // Check if this is a divided shape that needs special handling
                if ((shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) ||
                    (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) ||
                    (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) ||
                    (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group'))) {
                    // Handle divided shapes: apply opacity to both polygon and dividing line
                    const polygon = shape.querySelector('polygon');
                    const line = shape.querySelector('.dividing-line');
                    
                    if (polygon) {
                        polygon.style.setProperty('stroke-opacity', opacity, 'important');
                    }
                    if (line) {
                        line.style.setProperty('stroke-opacity', opacity, 'important');
                    }
                } else {
                    // Handle regular shapes
                    shape.style.setProperty('stroke-opacity', opacity, 'important');
                }
            }
            
            // Record after state
            const afterData = this.createObjectData(sugar);
            this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish recording step
        this.finishStep();
    }
    
    applySugarFillOpacity() {
        // Skip if we're updating UI controls
        if (this.isUpdatingUI) return;
        
        const opacity = document.getElementById('customSugarOpacity').value;
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.fillOpacity = opacity;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;

        // Start recording step for undo/redo
        this.startStep('Change sugar fill opacity');
        
        selectedSugars.forEach(sugar => {
            // Record before state
            const beforeData = this.createObjectData(sugar);
            
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                shape.style.setProperty('fill-opacity', opacity, 'important');
            }
            
            // Record after state
            const afterData = this.createObjectData(sugar);
            this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish recording step
        this.finishStep();
    }
    
    applyConnectionStyle() {
        // Prevent applying style during UI updates
        if (this.isUpdatingUI) return;
        
        // Only work in select mode with selected connections
        if (this.currentTool !== 'select') return;
        
        const width = document.getElementById('connectionStrokeWidth')?.value || '2';
        const color = document.getElementById('connectionColor')?.value || '#000000';
        
        const styleBtn = document.querySelector('.connection-style-btn.active');
        const style = styleBtn ? styleBtn.dataset.style : 'solid';
        
        const connections = this.selectedConnections ? Array.from(this.selectedConnections) : [];
        
        if (connections.length === 0) return;

        connections.forEach(conn => {
            // Record before state
            const beforeData = this.createObjectData(conn);
            
            // Use style property with important to override CSS
            conn.style.setProperty('stroke-width', width, 'important');
            const normalizedConnStrokeColor = this.normalizeColorToHex(color);
            conn.style.setProperty('stroke', normalizedConnStrokeColor, 'important');
            
            // Apply dash pattern based on style
            switch (style) {
                case 'dashed':
                    conn.style.setProperty('stroke-dasharray', `${width * 4},${width * 2}`, 'important');
                    break;
                case 'dotted':
                    conn.style.setProperty('stroke-dasharray', `${width},${width}`, 'important');
                    break;
                default: // solid
                    conn.style.removeProperty('stroke-dasharray');
            }
            
            // Record after state
            const afterData = this.createObjectData(conn);
            this.recordObjectModified(conn.getAttribute('id'), beforeData, afterData);
        });
    }
    
    applyConnectionOpacity() {
        // Prevent applying opacity during UI updates
        if (this.isUpdatingUI) return;
        
        // Only work in select mode with selected connections
        if (this.currentTool !== 'select') return;
        
        const opacity = document.getElementById('linkageOpacity')?.value || '1';
        const connections = this.selectedConnections ? Array.from(this.selectedConnections) : [];
        
        if (connections.length === 0) return;

        // Start recording step for undo/redo
        this.startStep('Change connection opacity');

        connections.forEach(conn => {
            // Record before state
            const beforeData = this.createObjectData(conn);
            
            conn.style.setProperty('stroke-opacity', opacity, 'important');
            
            // Record after state
            const afterData = this.createObjectData(conn);
            this.recordObjectModified(conn.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish recording step
        this.finishStep();
    }
    
    applyConnectionOpacityWithoutStep() {
        // Prevent applying opacity during UI updates
        if (this.isUpdatingUI) return;
        
        // Only work in select mode with selected connections
        if (this.currentTool !== 'select') return;
        
        const opacity = document.getElementById('linkageOpacity')?.value || '1';
        const connections = this.selectedConnections ? Array.from(this.selectedConnections) : [];
        
        if (connections.length === 0) return;

        connections.forEach(conn => {
            conn.style.setProperty('stroke-opacity', opacity, 'important');
        });
    }
    
    applyLinkageStyle() {
        // Prevent applying styles during UI updates (e.g., undo/redo operations)
        if (this.isUpdatingUI) {
            console.log('applyLinkageStyle: Skipping during UI update');
            return;
        }
        
        console.log('applyLinkageStyle: Applying linkage styles');
        // Only work in select mode
        if (this.currentTool !== 'select') return;
        
        const textSize = document.getElementById('linkageTextSize')?.value || '12';
        const textColor = document.getElementById('linkageTextColor')?.value || '#000000';
        const textFontFamily = document.getElementById('linkageTextFontFamily')?.value || 'Arial';
        const textOpacity = document.getElementById('linkageTextOpacity')?.value || '1';
        
        console.log('applyLinkageStyle: textColor =', textColor);
        
        // Get text style states
        const textBold = document.getElementById('linkageTextBoldBtn')?.classList.contains('active') || false;
        const textItalic = document.getElementById('linkageTextItalicBtn')?.classList.contains('active') || false;
        const textUnderline = document.getElementById('linkageTextUnderlineBtn')?.classList.contains('active') || false;
        
        // Apply styles to selected connections (use unified selection system)
        if (this.selectedConnections) {
            const connections = Array.from(this.selectedConnections);
            console.log('applyLinkageStyle: selectedConnections count =', connections.length);
            
            if (connections.length === 0) return;

            connections.forEach(conn => {
                console.log('applyLinkageStyle: updating connection', conn.id, 'old data-text-color:', conn.getAttribute('data-text-color'));
                console.log('applyLinkageStyle: setting data-text-color to', textColor);
                // Update linkage text display with new styles
                this.updateLinkageText(conn, textSize, textColor, textFontFamily, textBold, textItalic, textUnderline, textOpacity);

                // Store text style attributes on the connection
                conn.setAttribute('data-text-size', textSize);
                conn.setAttribute('data-text-color', textColor);
                conn.setAttribute('data-text-font-family', textFontFamily);
                conn.setAttribute('data-text-bold', textBold ? 'true' : 'false');
                conn.setAttribute('data-text-italic', textItalic ? 'true' : 'false');
                conn.setAttribute('data-text-underline', textUnderline ? 'true' : 'false');
                conn.setAttribute('data-text-opacity', textOpacity);
                console.log('applyLinkageStyle: updated connection', conn.id, 'new data-text-color:', conn.getAttribute('data-text-color'));

                // If we have initialConnectionStatesForTextColor (started on mousedown), record modification now
                try {
                    // color
                    if (this.initialConnectionStatesForTextColor && Array.isArray(this.initialConnectionStatesForTextColor)) {
                        const state = this.initialConnectionStatesForTextColor.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            const afterData = this.createObjectData(conn);
                            console.log('applyLinkageStyle: immediate recordObjectModified for (color)', conn.id, 'after textColor:', afterData.textColor);
                            this.recordObjectModified(conn.id, state.beforeData, afterData);
                            state._recorded = true;
                        }
                    }
                    // size
                    if (this.initialConnectionStatesForTextSize && Array.isArray(this.initialConnectionStatesForTextSize)) {
                        const state = this.initialConnectionStatesForTextSize.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            const afterData = this.createObjectData(conn);
                            console.log('applyLinkageStyle: immediate recordObjectModified for (size)', conn.id, 'after textSize:', afterData.textSize);
                            this.recordObjectModified(conn.id, state.beforeData, afterData);
                            state._recorded = true;
                        }
                    }
                    // font family
                    if (this.initialConnectionStatesForTextFontFamily && Array.isArray(this.initialConnectionStatesForTextFontFamily)) {
                        const state = this.initialConnectionStatesForTextFontFamily.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            const afterData = this.createObjectData(conn);
                            console.log('applyLinkageStyle: immediate recordObjectModified for (fontFamily)', conn.id, 'after textFontFamily:', afterData.textFontFamily);
                            this.recordObjectModified(conn.id, state.beforeData, afterData);
                            state._recorded = true;
                        }
                    }
                    // opacity
                    if (this.initialConnectionStatesForTextOpacity && Array.isArray(this.initialConnectionStatesForTextOpacity)) {
                        const state = this.initialConnectionStatesForTextOpacity.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            const afterData = this.createObjectData(conn);
                            console.log('applyLinkageStyle: immediate recordObjectModified for (opacity)', conn.id, 'after textOpacity:', afterData.textOpacity);
                            this.recordObjectModified(conn.id, state.beforeData, afterData);
                            state._recorded = true;
                        }
                    }
                    // style (bold/italic/underline) - also handle linked text elements
                    if (this.initialConnectionStatesForTextStyle && Array.isArray(this.initialConnectionStatesForTextStyle)) {
                        const state = this.initialConnectionStatesForTextStyle.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            // Create after snapshot then force authoritative style fields from current UI variables
                            const afterData = this.createObjectData(conn);
                            // Ensure we record the authoritative style values (avoid timing/race where attribute isn't yet visible)
                            try {
                                afterData.textBold = (textBold ? 'true' : 'false');
                                afterData.textItalic = (textItalic ? 'true' : 'false');
                                afterData.textUnderline = (textUnderline ? 'true' : 'false');
                            } catch (e) {}
                            console.log('applyLinkageStyle: immediate recordObjectModified for (style) connection', conn.id, 'after textItalic:', afterData.textItalic, 'textBold:', afterData.textBold, 'textUnderline:', afterData.textUnderline);
                            this.recordObjectModified(conn.id, state.beforeData, afterData);
                            // Also record any associated text elements if present
                            try {
                                if (state.configTextId) {
                                    const configText = document.getElementById(state.configTextId);
                                    if (configText && state.configTextBeforeData) {
                                        const configAfterData = this.createObjectData(configText);
                                        this.recordObjectModified(state.configTextId, state.configTextBeforeData, configAfterData);
                                    }
                                }
                                if (state.positionTextId) {
                                    const positionText = document.getElementById(state.positionTextId);
                                    if (positionText && state.positionTextBeforeData) {
                                        const positionAfterData = this.createObjectData(positionText);
                                        this.recordObjectModified(state.positionTextId, state.positionTextBeforeData, positionAfterData);
                                    }
                                }
                            } catch (e) {}
                            state._recorded = true;
                        }
                    }
                } catch (e) {
                    // ignore
                }
            });
        }
    }

    applyLinkageStyleWithoutStep() {
        // Prevent applying styles during UI updates
        if (this.isUpdatingUI) return;
        if (this.currentTool !== 'select') return;

        const textSize = document.getElementById('linkageTextSize')?.value || '12';
        const textColor = document.getElementById('linkageTextColor')?.value || '#000000';
        const textFontFamily = document.getElementById('linkageTextFontFamily')?.value || 'Arial';
        const textOpacity = document.getElementById('linkageTextOpacity')?.value || '1';
        const textBold = document.getElementById('linkageTextBoldBtn')?.classList.contains('active') || false;
        const textItalic = document.getElementById('linkageTextItalicBtn')?.classList.contains('active') || false;
        const textUnderline = document.getElementById('linkageTextUnderlineBtn')?.classList.contains('active') || false;

        if (!this.selectedConnections) return;
        this.selectedConnections.forEach(conn => {
            this.updateLinkageText(conn, textSize, textColor, textFontFamily, textBold, textItalic, textUnderline, textOpacity);
            conn.setAttribute('data-text-size', textSize);
            conn.setAttribute('data-text-color', textColor);
            conn.setAttribute('data-text-font-family', textFontFamily);
            conn.setAttribute('data-text-bold', textBold ? 'true' : 'false');
            conn.setAttribute('data-text-italic', textItalic ? 'true' : 'false');
            conn.setAttribute('data-text-underline', textUnderline ? 'true' : 'false');
            conn.setAttribute('data-text-opacity', textOpacity);
        });
    }
    
    // Apply linkage text visibility to selected connections
    applyLinkageVisibility() {
        if (this.currentTool !== 'select') return;
        
        const showLinkageText = document.getElementById('showLinkageText')?.checked;
        
        // Apply visibility setting to selected connections
        if (this.selectedConnections) {
            this.selectedConnections.forEach(conn => {
                // Set data attribute to control visibility
                conn.setAttribute('data-linkage-visible', showLinkageText ? 'true' : 'false');
                
                // Update the linkage text display
                this.updateLinkageText(conn);
            });
        }
    }
    
    // Apply linkage information to selected connections
    applyLinkageToConnections(linkage) {
        const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');

        if (selectedConnections.length === 0) {
            return;
        }

        this.startStep('Apply linkage');
        this.updateConnectionLinkage(linkage, selectedConnections);
        this.finishStep();

        // Update UI to show the applied linkage
        const linkageInput = document.getElementById('linkageInput');
        if (linkageInput) {
            linkageInput.value = linkage;
        }
    }
    
    reverseLinkageDirection() {
        const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');

        if (selectedConnections.length === 0) {
            return;
        }

        this.startStep('Reverse linkage direction');

        // Reverse each selected connection
        selectedConnections.forEach(connection => {
            // Record before state
            const beforeData = this.createObjectData(connection);

            // Get current coordinates
            const x1 = parseFloat(connection.getAttribute('x1'));
            const y1 = parseFloat(connection.getAttribute('y1'));
            const x2 = parseFloat(connection.getAttribute('x2'));
            const y2 = parseFloat(connection.getAttribute('y2'));

            // Swap the coordinates
            connection.setAttribute('x1', x2);
            connection.setAttribute('y1', y2);
            connection.setAttribute('x2', x1);
            connection.setAttribute('y2', y1);

            // Update linkage text positions if they exist
            this.updateLinkageText(connection);

            // Record after state
            const afterData = this.createObjectData(connection);
            this.recordObjectModified(connection.getAttribute('id'), beforeData, afterData);
        });

        this.finishStep();
    }
    
    // Initialize the new shape selector system
    initializeShapeSelector() {
        // Shape categories configuration
        this.shapeCategories = {
            circle: {
                name: '圆形',
                shapes: [
                    { id: 'circle-filled', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="6.75" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '正圆形' },
                    { id: 'circle-flat', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="9" cy="9" rx="9.45" ry="4.725" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '扁椭圆形' },
                    { id: 'circle-narrow', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><ellipse cx="9" cy="9" rx="4.725" ry="9.45" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '窄椭圆形' }
                ]
            },
            square: {
                name: '方形',
                shapes: [
                    { id: 'square', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2.7" y="2.7" width="12.6" height="12.6" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '方形' },
                    { id: 'square-filled', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2.7" y="2.7" width="12.6" height="12.6" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '实心方形' },
                    { id: 'square-rounded', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2.7" y="2.7" width="12.6" height="12.6" rx="2" ry="2" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '圆角方形' },
                    { id: 'square-double', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2.7" y="2.7" width="12.6" height="12.6" fill="none" stroke="#888888" stroke-width="2"/></svg>', name: '双线方形' }
                ]
            },
            diamond: {
                name: '菱形',
                shapes: [
                    { id: 'diamond', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9,2.7 15.3,9 9,15.3 2.7,9" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '常规菱形' },
                    { id: 'diamond-flat', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9,4.95 14.175,9 9,13.05 3.825,9" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '扁菱形' },
                    { id: 'diamond-narrow', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9,1.32 13.05,9 9,16.68 4.95,9" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '窄菱形' },
                    { id: 'diamond-divided-top', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="dd-top-main" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="50%" stop-color="#888888"/><stop offset="50%" stop-color="white"/></linearGradient></defs><polygon points="9,2.7 15.3,9 9,15.3 2.7,9" fill="url(#dd-top-main)" stroke="#000000" stroke-width="1"/><line x1="2.7" y1="9" x2="15.3" y2="9" stroke="#000000" stroke-width="1"/></svg>', name: '分割菱形（下白）' },
                    { id: 'diamond-divided-bottom', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="dd-bottom-main" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="50%" stop-color="white"/><stop offset="50%" stop-color="#888888"/></linearGradient></defs><polygon points="9,2.7 15.3,9 9,15.3 2.7,9" fill="url(#dd-bottom-main)" stroke="#000000" stroke-width="1"/><line x1="2.7" y1="9" x2="15.3" y2="9" stroke="#000000" stroke-width="1"/></svg>', name: '分割菱形（上白）' }
                ]
            },
            triangle: {
                name: '三角形',
                shapes: [
                    { id: 'triangle', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9.0,2.8 14.4,12.1 3.6,12.1" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '正三角形' },
                    { id: 'triangle-inverted', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9.0,15.2 3.6,5.9 14.4,5.9" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '倒立三角形' },
                    { id: 'triangle-divided', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="icon-divided-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="50%" stop-color="white" stop-opacity="1"/><stop offset="50%" stop-color="#888888" stop-opacity="1"/></linearGradient></defs><polygon points="9.0,2.8 14.4,12.1 3.6,12.1" fill="url(#icon-divided-gradient)" stroke="#000000" stroke-width="1"/><line x1="9.0" y1="2.8" x2="9.0" y2="12.1" stroke="#000000" stroke-width="1"/></svg>', name: '分割三角形' }
                ]
            },
            star: {
                name: '星形',
                shapes: [
                    { id: 'star-5', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9.0,2.8 10.5,7.0 14.9,7.1 11.4,9.8 12.6,14.0 9.0,11.5 5.4,14.0 6.6,9.8 3.1,7.1 7.5,7.0" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '正五角星' },
                    { id: 'star-5-inverted', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9.0,15.2 7.5,11.0 3.1,10.9 6.6,8.2 5.4,4.0 9.0,6.5 12.6,4.0 11.4,8.2 14.9,10.9 10.5,11.0" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '倒立五角星' },
                    { id: 'star-4', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9.0,2.8 10.8,7.2 15.2,9.0 10.8,10.8 9.0,15.2 7.2,10.8 2.8,9.0 7.2,7.2" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '正四角星' },
                    { id: 'star-4-tilted', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="13.4,4.6 11.5,9.0 13.4,13.4 9.0,11.5 4.6,13.4 6.5,9.0 4.6,4.6 9.0,6.5" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '斜四角星' },
                    { id: 'star-6', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9.0,2.8 10.2,6.9 14.4,5.9 11.5,9.0 14.4,12.1 10.2,11.1 9.0,15.2 7.8,11.1 3.6,12.1 6.5,9.0 3.6,5.9 7.8,6.9" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '正六角星' },
                    { id: 'star-6-tilted', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="12.1,3.6 11.1,7.8 15.2,9.0 11.1,10.2 12.1,14.4 9.0,11.5 5.9,14.4 6.9,10.2 2.8,9.0 6.9,7.8 5.9,3.6 9.0,6.5" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '斜六角星' }
                ]
            },
            pentagon: {
                name: '正五边形',
                shapes: [
                    { id: 'pentagon', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9.0,2.7 15.0,7.1 12.7,14.1 5.3,14.1 3.0,7.1" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '正五边形' },
                    { id: 'pentagon-inverted', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9.0,15.3 3.0,10.9 5.3,3.9 12.7,3.9 15.0,10.9" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '倒立五边形' }
                ]
            },
            hexagon: {
                name: '六边形',
                shapes: [
                    { id: 'hexagon', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="15.3,9.0 12.2,14.4 5.8,14.4 2.7,9.0 5.8,3.6 12.2,3.6" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '正六边形' },
                    { id: 'flat-hexagon', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="14.4,12.2 9.0,15.3 3.6,12.2 3.6,5.8 9.0,2.7 14.4,5.8" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '平躺六边形' },
                    { id: 'hexagon-compressed', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="15.3,9.0 12.2,12.8 5.8,12.8 2.7,9.0 5.8,5.2 12.2,5.2" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '扁的正六边形' },
                    { id: 'flat-hexagon-compressed', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><polygon points="14.4,11.2 9.0,13.3 3.6,11.2 3.6,6.8 9.0,4.7 14.4,6.8" fill="#888888" stroke="#000000" stroke-width="1"/></svg>', name: '扁的平躺六边形' }
                ]
            },
            bracket: {
                name: '括号',
                shapes: [
                    { id: 'bracket-left', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><text x="9" y="14" font-size="18" font-weight="bold" text-anchor="middle" fill="#888888">[</text></svg>', name: '左方括号' },
                    { id: 'bracket-right', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><text x="9" y="14" font-size="18" font-weight="bold" text-anchor="middle" fill="#888888">]</text></svg>', name: '右方括号' },
                    { id: 'paren-left', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><text x="9" y="14" font-size="18" font-weight="bold" text-anchor="middle" fill="#888888">(</text></svg>', name: '左圆括号' },
                    { id: 'paren-right', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><text x="9" y="14" font-size="18" font-weight="bold" text-anchor="middle" fill="#888888">)</text></svg>', name: '右圆括号' },
                    { id: 'brace-left', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><text x="9" y="14" font-size="18" font-weight="bold" text-anchor="middle" fill="#888888">{</text></svg>', name: '左花括号' },
                    { id: 'brace-right', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><text x="9" y="14" font-size="18" font-weight="bold" text-anchor="middle" fill="#888888">}</text></svg>', name: '右花括号' }
                ]
            },
            wave: {
                name: '波浪线',
                shapes: [
                    { id: 'wave', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 9 Q5 6 8 9 T14 9" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round"/></svg>', name: '波浪线' },
                    { id: 'wave-double', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 7 Q5 4 8 7 T14 7" fill="none" stroke="#888888" stroke-width="1.5" stroke-linecap="round"/><path d="M2 11 Q5 8 8 11 T14 11" fill="none" stroke="#888888" stroke-width="1.5" stroke-linecap="round"/></svg>', name: '双波浪线' },
                    { id: 'wave-sine', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M1 9 Q4.5 4 9 9 Q13.5 14 17 9" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round"/></svg>', name: '正弦波' },
                    { id: 'wave-zigzag', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 12 L6 6 L10 12 L14 6" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round"/></svg>', name: '锯齿波' }
                ]
            },
            freeend: {
                name: '自由端',
                shapes: [
                    { id: 'freeend-asterisk', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><text x="9" y="13" font-size="16" font-weight="bold" text-anchor="middle" fill="#888888">*</text></svg>', name: '星号自由端' },
                    { id: 'freeend-wave', icon: '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 9 Q5 6 8 9 T14 9" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round"/></svg>', name: '波浪线（肽链）' }
                ]
            }
        };

        // Current selected shapes for each category (default to first shape)
        this.selectedShapes = {};
        Object.keys(this.shapeCategories).forEach(category => {
            this.selectedShapes[category] = this.shapeCategories[category].shapes[0].id;
        });

        // Initialize event listeners
        this.setupShapeSelectorEventListeners();
    }

    setupShapeSelectorEventListeners() {
        // Main shape button clicks
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectShape(btn.dataset.shape);
            });
        });

        // Dropdown button clicks
        document.querySelectorAll('.shape-dropdown-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(btn.dataset.category);
            });
        });

        // Dropdown item clicks
        document.querySelectorAll('.shape-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectShapeFromDropdown(item.dataset.shape);
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.shape-category')) {
                this.closeAllDropdowns();
            }
        });
    }

    selectShape(shape) {
        // Update visual state
        this.updateShapeSelection(shape);
        
        // Clear SNFG preset selection (manual override)
        this.clearPresetSelection();
        
        // Update configuration for add mode or apply to selected sugars
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.shape = shape;
            this.currentSugarConfig.type = 'custom';
            this.currentSugarConfig.preset = null;
        } else if (this.currentTool === 'select') {
            this.applySugarShape(shape);
        }
    }

    selectShapeFromDropdown(shape) {
        // Find which category this shape belongs to
        let category = null;
        for (const [cat, config] of Object.entries(this.shapeCategories)) {
            if (config.shapes.some(s => s.id === shape)) {
                category = cat;
                break;
            }
        }

        if (category) {
            // Update the selected shape for this category
            this.selectedShapes[category] = shape;
            
            // Update the main button icon
            const categoryElement = document.querySelector(`.shape-category[data-category="${category}"]`);
            const mainBtn = categoryElement?.querySelector('.shape-main-btn');
            if (mainBtn) {
                const shapeConfig = this.shapeCategories[category].shapes.find(s => s.id === shape);
                if (shapeConfig) {
                    mainBtn.querySelector('.shape-icon').innerHTML = shapeConfig.icon;
                    mainBtn.dataset.shape = shape;
                }
            }

            // Update dropdown item active states
            const dropdown = document.querySelector(`.shape-dropdown-menu[data-category="${category}"]`);
            if (dropdown) {
                dropdown.querySelectorAll('.shape-dropdown-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.shape === shape);
                });
            }
        }

        // Close dropdown
        this.closeAllDropdowns();
        
        // Select the shape
        this.selectShape(shape);
    }

    updateShapeSelection(shape) {
        // Find the category for this shape
        let targetCategory = null;
        for (const [category, config] of Object.entries(this.shapeCategories)) {
            if (config.shapes.some(s => s.id === shape)) {
                targetCategory = category;
                break;
            }
        }

        // Clear all active states
        document.querySelectorAll('.shape-category').forEach(cat => {
            cat.classList.remove('active');
        });
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Set active state for the target category
        if (targetCategory) {
            const categoryElement = document.querySelector(`.shape-category[data-category="${targetCategory}"]`);
            const mainBtn = categoryElement?.querySelector('.shape-main-btn');
            
            if (categoryElement && mainBtn) {
                categoryElement.classList.add('active');
                mainBtn.classList.add('active');
            }
        }
    }

    toggleDropdown(category) {
        // Close other dropdowns first
        document.querySelectorAll('.shape-dropdown-menu').forEach(menu => {
            if (menu.dataset.category !== category) {
                menu.classList.remove('show');
            }
        });

        // Toggle the target dropdown
        const dropdown = document.querySelector(`.shape-dropdown-menu[data-category="${category}"]`);
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.shape-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    // Map legacy shape names to current shape IDs for backward compatibility
    mapLegacyShape(shape) {
        const shapeMapping = {
            'circle': 'circle-filled',
            'star': 'star-5'
        };
        return shapeMapping[shape] || shape;
    }

    // Get the base category for a shape (for selection mode compatibility)
    getShapeCategory(shape) {
        // Map legacy shape names first
        const mappedShape = this.mapLegacyShape(shape);
        for (const [category, config] of Object.entries(this.shapeCategories)) {
            if (config.shapes.some(s => s.id === mappedShape)) {
                return category;
            }
        }
        return null;
    }

    // Update shape selector based on selected elements (for selection mode)
    updateShapeSelectorFromSelection(shapes) {
        // Clear all active states first
        document.querySelectorAll('.shape-category').forEach(cat => {
            cat.classList.remove('active');
        });
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // If all selected elements have the same base category, highlight it
        if (shapes.length === 1) {
            const category = this.getShapeCategory(shapes[0]);
            if (category) {
                const categoryElement = document.querySelector(`.shape-category[data-category="${category}"]`);
                const mainBtn = categoryElement?.querySelector('.shape-main-btn');
                
                if (categoryElement && mainBtn) {
                    categoryElement.classList.add('active');
                    mainBtn.classList.add('active');
                }
            }
        } else if (shapes.length > 1) {
            // Check if all shapes belong to the same category
            const categories = shapes.map(shape => this.getShapeCategory(shape));
            const uniqueCategories = [...new Set(categories)];
            
            if (uniqueCategories.length === 1 && uniqueCategories[0]) {
                const category = uniqueCategories[0];
                const categoryElement = document.querySelector(`.shape-category[data-category="${category}"]`);
                const mainBtn = categoryElement?.querySelector('.shape-main-btn');
                
                if (categoryElement && mainBtn) {
                    categoryElement.classList.add('active');
                    mainBtn.classList.add('active');
                }
            }
        }
    }
    
    applySugarShape(shape) {
        if (this.currentTool !== 'select') return;
        
        // Get all selected sugars (avoid duplicates)
        const sugarsToChange = new Set();
        if (this.selectedSugar) {
            sugarsToChange.add(this.selectedSugar);
        }
        if (this.selectedSugars.size > 0) {
            this.selectedSugars.forEach(sugar => sugarsToChange.add(sugar));
        }
        
        if (sugarsToChange.size === 0) return;
        
        // Start recording a step for shape change
        this.startStep('Change sugar shape');
        
        sugarsToChange.forEach(sugar => {
            // Record before state
            const beforeData = this.createObjectData(sugar);
            
            const currentShape = sugar.querySelector('.sugar-shape');
            if (currentShape) {
                const x = parseFloat(sugar.getAttribute('data-x'));
                const y = parseFloat(sugar.getAttribute('data-y'));
                const currentSize = this.getSugarSize(sugar);
                
                // Properly read current styles (including inline styles with !important)
                const currentFill = currentShape.style.getPropertyValue('fill') || 
                                   currentShape.getAttribute('fill') || '#0072BC';
                const currentStroke = currentShape.style.getPropertyValue('stroke') || 
                                     currentShape.getAttribute('stroke') || '#000000';
                const currentStrokeWidth = currentShape.style.getPropertyValue('stroke-width') || 
                                          currentShape.getAttribute('stroke-width') || '2';
                const currentDashArray = currentShape.style.getPropertyValue('stroke-dasharray') || 
                                        currentShape.getAttribute('stroke-dasharray') || '';
                const currentStrokeOpacity = currentShape.style.getPropertyValue('stroke-opacity') || 
                                            currentShape.getAttribute('stroke-opacity') || '1';
                const currentFillOpacity = currentShape.style.getPropertyValue('fill-opacity') || 
                                          currentShape.getAttribute('fill-opacity') || '1';
                
                // Update data attribute
                sugar.setAttribute('data-shape', shape);
                
                // Remove old shape
                currentShape.remove();
                
                // Create new shape element directly (not a group)
                let newShape;
                switch (shape) {
                    case 'circle':
                    case 'circle-filled':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        newShape.setAttribute('cx', x);
                        newShape.setAttribute('cy', y);
                        newShape.setAttribute('r', currentSize);
                        break;
                    case 'circle-flat':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                        newShape.setAttribute('cx', x);
                        newShape.setAttribute('cy', y);
                        newShape.setAttribute('rx', currentSize * 1.4);
                        newShape.setAttribute('ry', currentSize * 0.7);
                        break;
                    case 'circle-narrow':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                        newShape.setAttribute('cx', x);
                        newShape.setAttribute('cy', y);
                        newShape.setAttribute('rx', currentSize * 0.7);
                        newShape.setAttribute('ry', currentSize * 1.4);
                        break;
                    case 'square':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        newShape.setAttribute('x', x - currentSize);
                        newShape.setAttribute('y', y - currentSize);
                        newShape.setAttribute('width', currentSize * 2);
                        newShape.setAttribute('height', currentSize * 2);
                        break;
                    case 'square-flat':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        newShape.setAttribute('x', x - currentSize);
                        newShape.setAttribute('y', y - currentSize * 0.7);
                        newShape.setAttribute('width', currentSize * 2);
                        newShape.setAttribute('height', currentSize * 1.4);
                        break;
                    case 'square-narrow':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        newShape.setAttribute('x', x - currentSize * 0.7);
                        newShape.setAttribute('y', y - currentSize);
                        newShape.setAttribute('width', currentSize * 1.4);
                        newShape.setAttribute('height', currentSize * 2);
                        break;
                    case 'triangle':
                    case 'triangle-filled':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const triPoints = `${x},${y-currentSize} ${x+currentSize*0.866},${y+currentSize*0.5} ${x-currentSize*0.866},${y+currentSize*0.5}`;
                        newShape.setAttribute('points', triPoints);
                        break;
                    case 'triangle-inverted':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const invertedTriPoints = `${x},${y+currentSize} ${x+currentSize*0.866},${y-currentSize*0.5} ${x-currentSize*0.866},${y-currentSize*0.5}`;
                        newShape.setAttribute('points', invertedTriPoints);
                        break;
                    case 'diamond':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const diamondPoints = `${x},${y-currentSize} ${x+currentSize},${y} ${x},${y+currentSize} ${x-currentSize},${y}`;
                        newShape.setAttribute('points', diamondPoints);
                        break;
                    case 'diamond-flat':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const diamondFlatPoints = `${x},${y-currentSize*0.7} ${x+currentSize*1.4},${y} ${x},${y+currentSize*0.7} ${x-currentSize*1.4},${y}`;
                        newShape.setAttribute('points', diamondFlatPoints);
                        break;
                    case 'diamond-narrow':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const diamondNarrowPoints = `${x},${y-currentSize*1.4} ${x+currentSize*0.7},${y} ${x},${y+currentSize*1.4} ${x-currentSize*0.7},${y}`;
                        newShape.setAttribute('points', diamondNarrowPoints);
                        break;
                    case 'diamond-divided-top':
                    case 'diamond-divided-bottom':
                        // 分割菱形需要重新创建完整的形状
                            newShape = this.createSugarShape(x, y, shape, currentFill, currentSize);
                            // 移除sugar-shape类，因为createSugarShape已经添加了
                            if (newShape.classList) {
                                newShape.classList.remove('sugar-shape');
                            }
                            // If the created shape is a group (divided shape), ensure its inner polygon/line inherit previous border styles
                            try {
                                const poly = newShape.querySelector ? newShape.querySelector('polygon') : null;
                                const line = newShape.querySelector ? newShape.querySelector('.dividing-line') : null;
                                if (poly) {
                                    poly.style.setProperty('stroke', currentStroke, 'important');
                                    poly.style.setProperty('stroke-width', currentStrokeWidth, 'important');
                                    if (currentDashArray) poly.style.setProperty('stroke-dasharray', currentDashArray, 'important');
                                    poly.style.setProperty('stroke-opacity', currentStrokeOpacity, 'important');
                                }
                                if (line) {
                                    line.style.setProperty('stroke', currentStroke, 'important');
                                    line.style.setProperty('stroke-width', currentStrokeWidth, 'important');
                                    if (currentDashArray) line.style.setProperty('stroke-dasharray', currentDashArray, 'important');
                                    line.style.setProperty('stroke-opacity', currentStrokeOpacity, 'important');
                                }
                            } catch (e) {
                                // ignore
                            }
                        break;
                    case 'star':
                    case 'star-5':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const starPoints = this.generateStarPoints(x, y, currentSize, 5, 0);
                        newShape.setAttribute('points', starPoints);
                        break;
                    case 'star-5-inverted':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const starInvertedPoints = this.generateStarPoints(x, y, currentSize, 5, Math.PI);
                        newShape.setAttribute('points', starInvertedPoints);
                        break;
                    case 'star-4':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const star4Points = this.generateStarPoints(x, y, currentSize, 4, 0);
                        newShape.setAttribute('points', star4Points);
                        break;
                    case 'star-4-tilted':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const star4TiltedPoints = this.generateStarPoints(x, y, currentSize, 4, Math.PI/4);
                        newShape.setAttribute('points', star4TiltedPoints);
                        break;
                    case 'star-6':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const star6Points = this.generateStarPoints(x, y, currentSize, 6, 0);
                        newShape.setAttribute('points', star6Points);
                        break;
                    case 'star-6-tilted':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const star6TiltedPoints = this.generateStarPoints(x, y, currentSize, 6, Math.PI/6);
                        newShape.setAttribute('points', star6TiltedPoints);
                        break;
                    case 'hexagon':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const hexPoints = this.generatePolygonPoints(x, y, currentSize, 6, 0);
                        newShape.setAttribute('points', hexPoints);
                        break;
                    case 'flat-hexagon':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const flatHexPoints = this.generatePolygonPoints(x, y, currentSize, 6, Math.PI/6);
                        newShape.setAttribute('points', flatHexPoints);
                        break;
                    case 'pentagon':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const pentPoints = this.generatePolygonPoints(x, y, currentSize, 5, -Math.PI/2);
                        newShape.setAttribute('points', pentPoints);
                        break;
                    case 'pentagon-inverted':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const pentInvertedPoints = this.generatePolygonPoints(x, y, currentSize, 5, Math.PI/2);
                        newShape.setAttribute('points', pentInvertedPoints);
                        break;
                    case 'bracket-left':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        newShape.setAttribute('d', this.createBracketPath('left', x, y, currentSize));
                        newShape.classList.add('bracket-shape');
                        break;
                    case 'bracket-right':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        newShape.setAttribute('d', this.createBracketPath('right', x, y, currentSize));
                        newShape.classList.add('bracket-shape');
                        break;
                    case 'paren-left':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        newShape.setAttribute('d', this.createParenPath('left', x, y, currentSize));
                        newShape.classList.add('bracket-shape');
                        break;
                    case 'paren-right':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        newShape.setAttribute('d', this.createParenPath('right', x, y, currentSize));
                        newShape.classList.add('bracket-shape');
                        break;
                    case 'brace-left':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        newShape.setAttribute('d', this.createBracePath('left', x, y, currentSize));
                        newShape.classList.add('bracket-shape');
                        break;
                    case 'brace-right':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        newShape.setAttribute('d', this.createBracePath('right', x, y, currentSize));
                        newShape.classList.add('bracket-shape');
                        break;
                    case 'freeend-asterisk':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        newShape.setAttribute('d', this.createAsteriskPath(x, y, currentSize));
                        newShape.setAttribute('stroke-linecap', 'round');
                        newShape.classList.add('freeend-asterisk');
                        break;
                    case 'freeend-wave':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        newShape.setAttribute('data-x', x);
                        newShape.setAttribute('data-y', y);
                        newShape.setAttribute('data-size', currentSize);
                        this.updateWavePath(newShape, x, y, currentSize);
                        newShape.setAttribute('stroke-linecap', 'round');
                        newShape.classList.add('freeend-wave');
                        break;
                    default:
                        // For certain known complex shapes (divided shapes, complex gradients, etc.)
                        // we intentionally fall back to createSugarShape and this is expected.
                        // Only log a warning for truly unknown shapes that are not in the
                        // knownComplexShapes list to avoid noisy console messages.
                        const knownComplexShapes = new Set([
                            'triangle-divided',
                            'square-divided',
                            'diamond-divided-top',
                            'diamond-divided-bottom',
                            'square-divided',
                            'triangle-divided'
                        ]);

                        if (!knownComplexShapes.has(shape)) {
                            console.warn('Unknown shape type:', shape, '- using createSugarShape for complex shapes');
                        }

                        // For complex shapes, use the full createSugarShape method
                        newShape = this.createSugarShape(x, y, shape, currentFill, currentSize);
                        // Remove duplicate sugar-shape class since createSugarShape already adds it
                        if (newShape && newShape.classList) {
                            newShape.classList.remove('sugar-shape');
                        }
                }
                
                // Apply styles (preserve current border settings) - only if it's a simple element, not a complex group
                if (newShape && newShape.setAttribute) {
                    // Check if this is a line-based shape (no fill, stroke-based)
                    const isLineShape = shape === 'bracket-left' || shape === 'bracket-right' || 
                                       shape === 'paren-left' || shape === 'paren-right' ||
                                       shape === 'brace-left' || shape === 'brace-right' ||
                                       shape === 'freeend-wave' || shape === 'freeend-asterisk';
                    
                    if (isLineShape) {
                        // Line-based shapes: no fill, inherit border color as stroke
                        newShape.setAttribute('fill', 'none');
                        newShape.setAttribute('stroke', currentStroke); // Inherit border color
                        newShape.setAttribute('stroke-width', currentSize * 0.15);
                        newShape.setAttribute('stroke-linecap', 'round');
                        newShape.setAttribute('stroke-linejoin', 'round');
                        newShape.setAttribute('stroke-opacity', currentStrokeOpacity);
                        // Line shapes don't use dash arrays from borders
                    } else {
                        // Filled shapes (including freeend-asterisk): use fill for color, stroke for border
                        newShape.setAttribute('fill', currentFill);
                        newShape.setAttribute('stroke', currentStroke);
                        newShape.setAttribute('stroke-width', currentStrokeWidth);
                        newShape.setAttribute('fill-opacity', currentFillOpacity);
                        newShape.setAttribute('stroke-opacity', currentStrokeOpacity);
                        // Only apply dash array to filled shapes' borders
                        if (currentDashArray) {
                            newShape.setAttribute('stroke-dasharray', currentDashArray);
                        }
                    }
                    newShape.classList.add('sugar-shape');
                    
                    // Update sugar data
                    sugar.setAttribute('data-shape', shape);
                    sugar.appendChild(newShape);
                    
                    // Special handling for freeend-wave: update path when shape changes
                    if (shape === 'freeend-wave') {
                        this.updateWavePath(newShape, x, y, currentSize);
                    }
                } else if (newShape) {
                    // For complex shapes (groups), the shape is already complete
                    sugar.setAttribute('data-shape', shape);
                    sugar.appendChild(newShape);
                    
                    // Special handling for freeend-wave: update path when shape changes
                    if (shape === 'freeend-wave' && newShape.tagName === 'path') {
                        this.updateWavePath(newShape, x, y, currentSize);
                    }
                }
                
                // Ensure drag functionality is preserved after shape update
                // Re-add essential classes and attributes for drag system
                if (!sugar.classList.contains('sugar')) {
                    sugar.classList.add('sugar');
                }
                
                // Ensure the sugar element maintains proper event handling
                // by preserving its structure and attributes
                const currentId = sugar.getAttribute('id');
                if (currentId) {
                    sugar.setAttribute('id', currentId);
                }
                
                // Update highlight if exists
                const highlightId = sugar.getAttribute('data-highlight-id');
                if (highlightId) {
                    const highlight = this.canvas.querySelector('#' + highlightId);
                    if (highlight) {
                        this.removeSelectionHighlight(sugar);
                        this.addSelectionHighlight(sugar);
                    }
                }
                
                // Record after state for undo/redo
                const afterData = this.createObjectData(sugar);
                this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
            }
        });
        
        // Finish recording the step
        this.finishStep();
    };
    
    applySugarColor(color) {
        if (this.currentTool !== 'select') return;
        
        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;
        
        // Start recording a step for color change
        this.startStep('Change sugar color');
        
        selectedSugars.forEach(sugar => {
            // Record before state
            const beforeData = this.createObjectData(sugar);
            
            const shape = sugar.querySelector('.sugar-shape');
            const shapeType = sugar.getAttribute('data-shape');
            
            // Update data attribute
            sugar.setAttribute('data-color', color);
            
            if (shape) {
                if (shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) {
                    // 分割三角形的特殊颜色处理：更新渐变中的右半部分颜色
                    const gradientId = shape.getAttribute('data-gradient-id');
                    console.log('Updating triangle-divided color:', color, 'gradientId:', gradientId); // 调试信息
                    
                    if (gradientId) {
                        const gradient = this.canvas.querySelector(`#${gradientId}`);
                        if (gradient) {
                            const stops = gradient.querySelectorAll('stop');
                            if (stops.length >= 2) {
                                // 左半部分保持白色（stop[0]）
                                stops[0].setAttribute('stop-color', 'white');
                                // 右半部分更新为新颜色（stop[1]）
                                stops[1].setAttribute('stop-color', color);
                                console.log('Updated gradient stops:', stops[0].getAttribute('stop-color'), stops[1].getAttribute('stop-color'));
                            }
                        } else {
                            console.log('Gradient not found:', gradientId);
                        }
                    }
                    
                    // 设置边框样式（对组内的多边形和线条）
                    const polygon = shape.querySelector('polygon');
                    const line = shape.querySelector('.dividing-line');
                    
                    // Preserve existing stroke color/width for divided shapes.
                    if (polygon) {
                        const existingStroke = polygon.style.stroke || polygon.getAttribute('stroke') || null;
                        const existingWidth = polygon.style.strokeWidth || polygon.getAttribute('stroke-width') || null;
                        if (existingStroke) polygon.style.setProperty('stroke', existingStroke, 'important');
                        if (existingWidth) polygon.style.setProperty('stroke-width', existingWidth, 'important');
                    }
                    if (line) {
                        const existingLineStroke = line.style.stroke || line.getAttribute('stroke') || null;
                        const existingLineWidth = line.style.strokeWidth || line.getAttribute('stroke-width') || null;
                        if (existingLineStroke) line.style.setProperty('stroke', existingLineStroke, 'important');
                        if (existingLineWidth) line.style.setProperty('stroke-width', existingLineWidth, 'important');
                    }
                    
                    // 更新data-color属性
                    sugar.setAttribute('data-color', color);
                } else if (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) {
                    // 分割菱形（下白）的特殊颜色处理：更新渐变中的上半部分颜色
                    const gradientId = shape.getAttribute('data-gradient-id');
                    console.log('Updating diamond-divided-top color:', color, 'gradientId:', gradientId);
                    
                    if (gradientId) {
                        const gradient = this.canvas.querySelector(`#${gradientId}`);
                        if (gradient) {
                            const stops = gradient.querySelectorAll('stop');
                            if (stops.length >= 2) {
                                // 上半部分更新为新颜色（stop[0]）
                                stops[0].setAttribute('stop-color', color);
                                // 下半部分保持白色（stop[1]）
                                stops[1].setAttribute('stop-color', 'white');
                                console.log('Updated diamond-divided-top gradient stops:', stops[0].getAttribute('stop-color'), stops[1].getAttribute('stop-color'));
                            }
                        } else {
                            console.log('Gradient not found:', gradientId);
                        }
                    }
                    
                    // 设置边框样式（对组内的多边形和线条）
                    const polygon = shape.querySelector('polygon');
                    const line = shape.querySelector('.dividing-line');
                    
                    // Preserve existing border stroke/color/width for diamond-divided-top
                    if (polygon) {
                        const existingStroke = polygon.style.stroke || polygon.getAttribute('stroke') || null;
                        const existingWidth = polygon.style.strokeWidth || polygon.getAttribute('stroke-width') || null;
                        if (existingStroke) polygon.style.setProperty('stroke', existingStroke, 'important');
                        if (existingWidth) polygon.style.setProperty('stroke-width', existingWidth, 'important');
                    }
                    if (line) {
                        const existingLineStroke = line.style.stroke || line.getAttribute('stroke') || null;
                        const existingLineWidth = line.style.strokeWidth || line.getAttribute('stroke-width') || null;
                        if (existingLineStroke) line.style.setProperty('stroke', existingLineStroke, 'important');
                        if (existingLineWidth) line.style.setProperty('stroke-width', existingLineWidth, 'important');
                    }
                    
                    // 更新data-color属性
                    sugar.setAttribute('data-color', color);
                } else if (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group')) {
                    // 分割菱形（上白）的特殊颜色处理：更新渐变中的下半部分颜色
                    const gradientId = shape.getAttribute('data-gradient-id');
                    console.log('Updating diamond-divided-bottom color:', color, 'gradientId:', gradientId);
                    
                    if (gradientId) {
                        const gradient = this.canvas.querySelector(`#${gradientId}`);
                        if (gradient) {
                            const stops = gradient.querySelectorAll('stop');
                            if (stops.length >= 2) {
                                // 上半部分保持白色（stop[0]）
                                stops[0].setAttribute('stop-color', 'white');
                                // 下半部分更新为新颜色（stop[1]）
                                stops[1].setAttribute('stop-color', color);
                                console.log('Updated diamond-divided-bottom gradient stops:', stops[0].getAttribute('stop-color'), stops[1].getAttribute('stop-color'));
                            }
                        } else {
                            console.log('Gradient not found:', gradientId);
                        }
                    }
                    
                    // 设置边框样式（对组内的多边形和线条）
                    const polygon = shape.querySelector('polygon');
                    const line = shape.querySelector('.dividing-line');
                    
                    // Preserve existing border stroke/color/width for diamond-divided-bottom
                    if (polygon) {
                        const existingStroke = polygon.style.stroke || polygon.getAttribute('stroke') || null;
                        const existingWidth = polygon.style.strokeWidth || polygon.getAttribute('stroke-width') || null;
                        if (existingStroke) polygon.style.setProperty('stroke', existingStroke, 'important');
                        if (existingWidth) polygon.style.setProperty('stroke-width', existingWidth, 'important');
                    }
                    if (line) {
                        const existingLineStroke = line.style.stroke || line.getAttribute('stroke') || null;
                        const existingLineWidth = line.style.strokeWidth || line.getAttribute('stroke-width') || null;
                        if (existingLineStroke) line.style.setProperty('stroke', existingLineStroke, 'important');
                        if (existingLineWidth) line.style.setProperty('stroke-width', existingLineWidth, 'important');
                    }
                    
                    // 更新data-color属性
                    sugar.setAttribute('data-color', color);
                } else if (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) {
                    // 分割正方形颜色处理：更新渐变右上部分颜色
                    const gradientId = shape.getAttribute('data-gradient-id');
                    if (gradientId) {
                        const gradient = this.canvas.querySelector(`#${gradientId}`);
                        if (gradient) {
                            const stops = gradient.querySelectorAll('stop');
                            if (stops.length >= 2) {
                                // 右上部分用户色（stop[0]），左下部分白色（stop[1]）
                                stops[0].setAttribute('stop-color', color);
                                stops[1].setAttribute('stop-color', 'white');
                            }
                        }
                    }
                    // 设置边框样式
                    const polygon = shape.querySelector('polygon');
                    const line = shape.querySelector('.dividing-line');
                    // Preserve existing border stroke/color/width for square-divided
                    if (polygon) {
                        const existingStroke = polygon.style.stroke || polygon.getAttribute('stroke') || null;
                        const existingWidth = polygon.style.strokeWidth || polygon.getAttribute('stroke-width') || null;
                        if (existingStroke) polygon.style.setProperty('stroke', existingStroke, 'important');
                        if (existingWidth) polygon.style.setProperty('stroke-width', existingWidth, 'important');
                    }
                    if (line) {
                        const existingLineStroke = line.style.stroke || line.getAttribute('stroke') || null;
                        const existingLineWidth = line.style.strokeWidth || line.getAttribute('stroke-width') || null;
                        if (existingLineStroke) line.style.setProperty('stroke', existingLineStroke, 'important');
                        if (existingLineWidth) line.style.setProperty('stroke-width', existingLineWidth, 'important');
                    }
                    
                    // 更新data-color属性
                    sugar.setAttribute('data-color', color);
                } else if (shapeType === 'freeend-asterisk') {
                    // Asterisk free-end: change stroke color (line shape), preserve stroke-width
                    const currentWidth = shape.getAttribute('stroke-width') || (sugar.getAttribute('data-size') || 20) * 0.15;
                    shape.style.setProperty('stroke', color, 'important');
                    shape.style.setProperty('stroke-width', currentWidth, 'important');
                    sugar.setAttribute('data-color', color);
                } else if (shapeType === 'freeend-wave') {
                    // Wave free-end: change stroke color, preserve stroke-width
                    const currentWidth = shape.getAttribute('stroke-width') || '2';
                    shape.style.setProperty('stroke', color, 'important');
                    shape.style.setProperty('stroke-width', currentWidth, 'important');
                    sugar.setAttribute('data-color', color);
                } else if (shapeType === 'bracket-left' || shapeType === 'bracket-right' || 
                           shapeType === 'paren-left' || shapeType === 'paren-right' ||
                           shapeType === 'brace-left' || shapeType === 'brace-right') {
                    // Bracket shapes: change stroke color, preserve stroke-width
                    const currentWidth = shape.getAttribute('stroke-width') || (sugar.getAttribute('data-size') || 20) * 0.15;
                    shape.style.setProperty('stroke', color, 'important');
                    shape.style.setProperty('stroke-width', currentWidth, 'important');
                    sugar.setAttribute('data-color', color);
                } else {
                    // 普通形状的颜色处理（包括所有圆形、方形、三角形、菱形、星形等）
                    const normalizedFillColor = this.normalizeColorToHex(color);
                    shape.style.setProperty('fill', normalizedFillColor, 'important');
                    
                    // Only update fill for regular shapes; preserve existing stroke color/width
                    const existingStroke = shape.style.stroke || shape.getAttribute('stroke') || null;
                    const existingWidth = shape.style.strokeWidth || shape.getAttribute('stroke-width') || null;
                    if (existingStroke) shape.style.setProperty('stroke', existingStroke, 'important');
                    if (existingWidth) shape.style.setProperty('stroke-width', existingWidth, 'important');
                }
                
                // 重要：更新sugar元素的data-color属性，确保重新选中时UI状态正确
                sugar.setAttribute('data-color', color);
            }
            
            // Record after state for undo/redo
            const afterData = this.createObjectData(sugar);
            this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish recording the step
        this.finishStep();
    }
    
    // Apply both shape and color changes in a single undo step (for SNFG presets)
    applySugarPreset(shape, color) {
        if (this.currentTool !== 'select') return;
        
        // Get all selected sugars (avoid duplicates)
        const sugarsToChange = new Set();
        if (this.selectedSugar) {
            sugarsToChange.add(this.selectedSugar);
        }
        if (this.selectedSugars.size > 0) {
            this.selectedSugars.forEach(sugar => sugarsToChange.add(sugar));
        }
        
        if (sugarsToChange.size === 0) return;
        
        // Start recording a step for preset change
        this.startStep('Apply SNFG preset');
        
        sugarsToChange.forEach(sugar => {
            // Record before state
            const beforeData = this.createObjectData(sugar);
            
            // Update both shape and color attributes
            sugar.setAttribute('data-shape', shape);
            sugar.setAttribute('data-color', color);
            
            // Update the visual shape to match the new attributes
            const shapeElement = sugar.querySelector('.sugar-shape');
            if (shapeElement) {
                const x = parseFloat(sugar.getAttribute('data-x'));
                const y = parseFloat(sugar.getAttribute('data-y'));
                const size = parseFloat(sugar.getAttribute('data-size')) || 20;
                
                // Capture the current stroke width to preserve it
                const currentStrokeWidth = shapeElement.style.strokeWidth || shapeElement.getAttribute('stroke-width');
                
                this.updateShapeToType(shapeElement, shape, x, y, color, size, currentStrokeWidth);
            }
            
            // Record after state for undo/redo
            const afterData = this.createObjectData(sugar);
            this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish recording the step
        this.finishStep();
    }

    // Helper method to create darker shade of color
    darkenColor(color, factor) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Darken by factor
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    applyTextStyle() {
        if (this.currentTool !== 'select') return;
        
        // Get all selected text elements
        const selectedTextElements = [];
        if (this.selectedText) selectedTextElements.push(this.selectedText);
        if (this.selectedTexts.size > 0) {
            this.selectedTexts.forEach(text => {
                if (!selectedTextElements.includes(text)) {
                    selectedTextElements.push(text);
                }
            });
        }
        
        if (selectedTextElements.length === 0) return;

        // Start recording step for undo/redo
        this.startStep('Change text style');
        
        const fontSize = document.getElementById('fontSize').value;
        const fontFamily = document.getElementById('fontFamily').value;
        const textColor = document.getElementById('textColor').value;
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        // Apply styles to all selected text elements
        selectedTextElements.forEach(textElement => {
            // Record before state
            const beforeData = this.createObjectData(textElement);
            
            // Apply font size (only if not empty/mixed)
            if (fontSize && fontSize !== '') {
                textElement.style.setProperty('font-size', fontSize + 'px', 'important');
            }
            
            // Apply font family (only if not empty/mixed)
            if (fontFamily && fontFamily !== '') {
                textElement.style.setProperty('font-family', fontFamily, 'important');
            }
            
            // Apply color (only if not empty/mixed)
            if (textColor && textColor !== '#ffffff') { // #ffffff indicates mixed state
                const normalizedTextColor = this.normalizeColorToHex(textColor);
                textElement.style.setProperty('fill', normalizedTextColor, 'important');
            }
            
            // Apply font weight (bold) - mixed state now applies the current button state
            if (boldBtn.classList.contains('active')) {
                textElement.style.setProperty('font-weight', 'bold', 'important');
            } else {
                textElement.style.removeProperty('font-weight');
            }
            
            // Apply font style (italic) - mixed state now applies the current button state
            if (italicBtn.classList.contains('active')) {
                textElement.style.setProperty('font-style', 'italic', 'important');
            } else {
                textElement.style.removeProperty('font-style');
            }
            
            // Apply text decoration (underline) - mixed state now applies the current button state
            if (underlineBtn.classList.contains('active')) {
                textElement.style.setProperty('text-decoration', 'underline', 'important');
            } else {
                textElement.style.removeProperty('text-decoration');
            }
            
            // Record after state
            const afterData = this.createObjectData(textElement);
            this.recordObjectModified(textElement.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish recording step
        this.finishStep();
        
        // Update the control values to reflect the new state
        this.updateTextControlsFromSelection();
    }
    
    // Apply text style without creating undo step (used during slider drag)
    applyTextStyleWithoutStep() {
        if (this.currentTool !== 'select') return;
        
        // Get all selected text elements
        const selectedTextElements = [];
        if (this.selectedText) selectedTextElements.push(this.selectedText);
        if (this.selectedTexts.size > 0) {
            this.selectedTexts.forEach(text => {
                if (!selectedTextElements.includes(text)) {
                    selectedTextElements.push(text);
                }
            });
        }
        
        if (selectedTextElements.length === 0) return;

        // Get current control values without creating undo step
        const fontSize = document.getElementById('fontSize').value;
        const fontFamily = document.getElementById('fontFamily').value;
        const textColor = document.getElementById('textColor').value;
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        // Apply styles to all selected text elements WITHOUT recording undo
        selectedTextElements.forEach(textElement => {
            // Apply font size (only if not empty/mixed)
            if (fontSize && fontSize !== '') {
                textElement.style.setProperty('font-size', fontSize + 'px', 'important');
            }
            
            // Apply font family (only if not empty/mixed)
            if (fontFamily && fontFamily !== '') {
                textElement.style.setProperty('font-family', fontFamily, 'important');
            }
            
            // Apply color (only if not empty/mixed)
            if (textColor && textColor !== '#ffffff') { // #ffffff indicates mixed state
                const normalizedTextColor = this.normalizeColorToHex(textColor);
                textElement.style.setProperty('fill', normalizedTextColor, 'important');
            }
            
            // Apply font weight (bold) - mixed state now applies the current button state
            if (boldBtn.classList.contains('active')) {
                textElement.style.setProperty('font-weight', 'bold', 'important');
            } else {
                textElement.style.removeProperty('font-weight');
            }
            
            // Apply font style (italic) - mixed state now applies the current button state
            if (italicBtn.classList.contains('active')) {
                textElement.style.setProperty('font-style', 'italic', 'important');
            } else {
                textElement.style.removeProperty('font-style');
            }
            
            // Apply text decoration (underline) - mixed state now applies the current button state
            if (underlineBtn.classList.contains('active')) {
                textElement.style.setProperty('text-decoration', 'underline', 'important');
            } else {
                textElement.style.removeProperty('text-decoration');
            }
        });
        
        // Update the control values to reflect the new state (no undo recording)
        this.updateTextControlsFromSelection();
    }
    
    applyFontSize(size) {
        // Update current configuration for text mode
        if (this.currentTool === 'text') {
            // Update current text config (for new text elements)
            return;
        }
        
        // Apply to selected text elements in select mode
        if (this.currentTool !== 'select') return;
        
        const selectedTextElements = [];
        if (this.selectedText) selectedTextElements.push(this.selectedText);
        if (this.selectedTexts.size > 0) {
            this.selectedTexts.forEach(text => {
                if (!selectedTextElements.includes(text)) {
                    selectedTextElements.push(text);
                }
            });
        }
        
        selectedTextElements.forEach(textElement => {
            textElement.style.setProperty('font-size', size + 'px', 'important');
        });
    }
    
    applyFontFamily(family) {
        // Update current configuration for text mode
        if (this.currentTool === 'text') {
            // Update current text config (for new text elements)
            return;
        }
        
        // Apply to selected text elements in select mode
        if (this.currentTool !== 'select') return;
        
        const selectedTextElements = [];
        if (this.selectedText) selectedTextElements.push(this.selectedText);
        if (this.selectedTexts.size > 0) {
            this.selectedTexts.forEach(text => {
                if (!selectedTextElements.includes(text)) {
                    selectedTextElements.push(text);
                }
            });
        }
        
        selectedTextElements.forEach(textElement => {
            textElement.style.setProperty('font-family', family, 'important');
        });
    }
    
    applyTextColor(color) {
        // Update current configuration for text mode
        if (this.currentTool === 'text') {
            // Update current text config (for new text elements)
            return;
        }
        
        // Apply to selected text elements in select mode
        if (this.currentTool !== 'select') return;
        
        const selectedTextElements = [];
        if (this.selectedText) selectedTextElements.push(this.selectedText);
        if (this.selectedTexts.size > 0) {
            this.selectedTexts.forEach(text => {
                if (!selectedTextElements.includes(text)) {
                    selectedTextElements.push(text);
                }
            });
        }
        
        selectedTextElements.forEach(textElement => {
            const normalizedColor = this.normalizeColorToHex(color);
            textElement.style.setProperty('fill', normalizedColor, 'important');
        });
    }
    
    applyTextOpacity() {
        const opacity = document.getElementById('textOpacity').value;
        
        // Update current configuration for text mode
        if (this.currentTool === 'text') {
            // Update current text config (for new text elements)
            this.currentTextConfig.opacity = opacity;
            return;
        }
        
        // Apply to selected text elements in select mode
        if (this.currentTool !== 'select') return;
        
        const selectedTextElements = [];
        if (this.selectedText) selectedTextElements.push(this.selectedText);
        if (this.selectedTexts.size > 0) {
            this.selectedTexts.forEach(text => {
                if (!selectedTextElements.includes(text)) {
                    selectedTextElements.push(text);
                }
            });
        }
        
        selectedTextElements.forEach(textElement => {
            textElement.style.setProperty('fill-opacity', opacity, 'important');
        });
    }
    
    // Lasso selection methods
    startLassoSelection(x, y) {
        this.isLassoDrawing = true;
        this.lassoPath = [{x, y}];
        
        // Create lasso path element
        this.lassoElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.lassoElement.classList.add('lasso-path');
        this.canvas.appendChild(this.lassoElement);
        
        this.updateLassoPath();
    }
    
    updateLassoSelection(x, y) {
        if (!this.isLassoDrawing) return;
        
        this.lassoPath.push({x, y});
        this.updateLassoPath();
    }
    
    updateLassoPath() {
        if (!this.lassoElement || this.lassoPath.length === 0) return;
        
        let pathData = `M ${this.lassoPath[0].x} ${this.lassoPath[0].y}`;
        for (let i = 1; i < this.lassoPath.length; i++) {
            pathData += ` L ${this.lassoPath[i].x} ${this.lassoPath[i].y}`;
        }
        
        this.lassoElement.setAttribute('d', pathData);
    }
    
    finishLassoSelection() {
        if (!this.isLassoDrawing) return;
        
        // Close the path and perform selection
        if (this.lassoPath.length > 2) {
            this.selectElementsInLasso();
        }
        
        this.clearLasso();
    }
    
    selectElementsInLasso() {
        const sugars = document.querySelectorAll('.sugar');
        
        sugars.forEach(sugar => {
            const x = parseFloat(sugar.getAttribute('data-x'));
            const y = parseFloat(sugar.getAttribute('data-y'));
            
            if (this.isPointInLasso(x, y)) {
                this.selectedSugars.add(sugar);
                sugar.classList.add('selected');
                this.addSelectionHighlight(sugar);
            }
        });
        
        // Update style panel if any sugars were selected
        if (this.selectedSugars.size > 0) {
            this.updateStylePanel();
        }
    }
    
    isPointInLasso(x, y) {
        if (this.lassoPath.length < 3) return false;
        
        // Ray casting algorithm for point-in-polygon test
        let inside = false;
        const path = this.lassoPath;
        
        for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
            if (((path[i].y > y) !== (path[j].y > y)) &&
                (x < (path[j].x - path[i].x) * (y - path[i].y) / (path[j].y - path[i].y) + path[i].x)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    clearLasso() {
        this.isLassoDrawing = false;
        this.lassoPath = [];
        
        if (this.lassoElement) {
            this.lassoElement.remove();
            this.lassoElement = null;
        }
    }
    
    // Zoom Control Setup
    setupZoomControl() {
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        const zoomReset = document.getElementById('zoomReset');
        
        if (!zoomSlider || !zoomValue || !zoomReset) {
            console.error('Zoom control elements not found', {
                slider: !!zoomSlider,
                value: !!zoomValue,
                reset: !!zoomReset
            });
            return;
        }
        
        console.log('Setting up zoom controls');
        
        // Update zoom when slider changes
        zoomSlider.addEventListener('input', (e) => {
            const zoomPercent = parseInt(e.target.value);
            console.log('Slider changed to:', zoomPercent);
            this.setZoomLevel(zoomPercent / 100);
            zoomValue.textContent = zoomPercent + '%';
        });
        
        // Reset zoom to 100% when reset button clicked
        zoomReset.addEventListener('click', () => {
            console.log('Reset zoom to 100%');
            zoomSlider.value = 100;
            this.setZoomLevel(1.0);
            zoomValue.textContent = '100%';
        });
        
        // Initialize zoom display
        zoomValue.textContent = '100%';
        console.log('Zoom controls initialized');
    }
    
    // Set zoom level and apply to canvas content only
    setZoomLevel(zoom) {
        // Clamp zoom level
        this.zoomLevel = Math.max(0.5, Math.min(3.0, zoom));
        
        console.log(`Setting zoom level to: ${this.zoomLevel}`);
        
        // Find canvas and export area elements
        const canvas = document.getElementById('canvas');
        const exportArea = document.getElementById('exportArea');
        const workspace = document.getElementById('workspace');
        
        if (canvas) {
            // Apply zoom to canvas only
            canvas.style.transform = `scale(${this.zoomLevel})`;
            canvas.style.transformOrigin = 'center center';
            console.log(`Canvas zoom applied: scale(${this.zoomLevel})`);
        }
        
        if (exportArea) {
            // Apply zoom to export area as well, but keep the existing margin-based centering
            exportArea.style.transform = `scale(${this.zoomLevel})`;
            exportArea.style.transformOrigin = '50% 50%'; // Center the scaling
            console.log(`Export area zoom applied: scale(${this.zoomLevel})`);
        }
        
        if (workspace) {
            // Update stored reference but don't transform workspace
            this.workspace = workspace;
            
            // Update grid background to match zoom
            this.updateGridBackground();
        } else {
            console.error('Workspace element not found!');
        }
    }
    
    // Workspace Management
    initializeWorkspace() {
        this.workspace = document.getElementById('workspace');
        this.exportArea = document.getElementById('exportArea');
        
        if (!this.workspace || !this.exportArea) {
            console.error('Workspace elements not found');
            console.log('workspace:', this.workspace);
            console.log('exportArea:', this.exportArea);
            return;
        }
        
        console.log('Workspace elements found successfully');
        console.log('Export area element:', this.exportArea);
        
        // Set initial export area size (medium)
        this.setExportAreaSize('medium');
        
        // Initialize grid background
        this.updateGridBackground();
        
        // Add wheel event listener for zoom
        this.workspace.addEventListener('wheel', (e) => {
            // Handle Alt+wheel zoom
            this.handleWheelZoom(e);
        });
        
        
        // Center the viewport and hide loading cover
        const startTime = Date.now();
        const minLoadingTime = 1000; // Minimum 1000ms loading time to show Dolly.gif animation
        
        setTimeout(() => {
            console.log('Before centering - scroll position:', this.workspace.scrollLeft, this.workspace.scrollTop);
            this.centerWorkspaceView();
            console.log('After centering - scroll position:', this.workspace.scrollLeft, this.workspace.scrollTop);
            
            // Hide loading cover after minimum time has passed
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
            
            setTimeout(() => {
                const loadingCover = document.getElementById('loadingCover');
                if (loadingCover) {
                    loadingCover.classList.add('hidden');
                    // Remove from DOM after transition
                    setTimeout(() => {
                        loadingCover.remove();
                    }, 300);
                }
            }, remainingTime);
        }, 300);
        
        console.log('Workspace initialized');
    }
    
    setExportAreaSize(size) {
        console.log(`setExportAreaSize called with size: ${size}`);
        if (!this.exportSizes[size]) {
            console.error(`Invalid size: ${size}`);
            return;
        }
        
        const { width, height } = this.exportSizes[size];
        this.currentExportSize = size;
        
        console.log(`Setting export area size to ${width}x${height}`);
        
        // Note: We do NOT change canvas dimensions here!
        // Canvas should remain fixed size, only export area (white background) changes
        // Canvas dimensions should only be changed during actual export
        
        // Update export area size - find element fresh each time
        const exportArea = document.getElementById('exportArea');
        if (exportArea) {
            exportArea.style.width = width + 'px';
            exportArea.style.height = height + 'px';
            // Update margins for centering (half of width/height)
            exportArea.style.marginLeft = -(width / 2) + 'px';
            exportArea.style.marginTop = -(height / 2) + 'px';
            console.log(`Export area DOM updated: ${width}x${height}`);
            console.log('Export area computed style:', window.getComputedStyle(exportArea).width, window.getComputedStyle(exportArea).height);
            
            // Update stored reference
            this.exportArea = exportArea;
        } else {
            console.error('Export area element not found!');
            console.log('DOM ready state:', document.readyState);
            console.log('All elements with id exportArea:', document.querySelectorAll('#exportArea'));
            console.log('All elements with class export-area:', document.querySelectorAll('.export-area'));
        }
        
        // Update button states
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
        
        console.log(`Export area size changed to ${size}: ${width}×${height}`);
    }
    
    // Center the workspace view (scroll to middle of canvas)
    centerWorkspaceView() {
        if (!this.workspace) return;
        
        // The canvas is positioned with CSS: top:50%, left:50%, margin-top:-1400px, margin-left:-2000px
        // This means the canvas center aligns with the workspace center
        // To center the view, we need to scroll so the workspace viewport shows the canvas center
        
        // Calculate the total scrollable area
        const totalScrollWidth = this.workspace.scrollWidth;
        const totalScrollHeight = this.workspace.scrollHeight;
        
        // Get workspace viewport dimensions
        const viewportWidth = this.workspace.clientWidth;
        const viewportHeight = this.workspace.clientHeight;
        
        // Center the scroll position
        const scrollLeft = (totalScrollWidth - viewportWidth) / 2;
        const scrollTop = (totalScrollHeight - viewportHeight) / 2;
        
        this.expectingScrollChange = true;
        this.workspace.scrollLeft = scrollLeft;
        this.workspace.scrollTop = scrollTop;
        setTimeout(() => this.expectingScrollChange = false, 100);
        
        // Verify the setting took effect
        setTimeout(() => {
            const actualScrollLeft = this.workspace.scrollLeft;
            const actualScrollTop = this.workspace.scrollTop;
            console.log(`Centering attempt: expected(${scrollLeft}, ${scrollTop}), actual(${actualScrollLeft}, ${actualScrollTop})`);
            
            // Only show warning if the difference is significant (more than 2px)
            const leftDiff = Math.abs(actualScrollLeft - scrollLeft);
            const topDiff = Math.abs(actualScrollTop - scrollTop);
            
            if (leftDiff > 2 || topDiff > 2) {
                console.warn('Scroll position was reset by something else!');
                // Try again
                this.expectingScrollChange = true;
                this.workspace.scrollLeft = scrollLeft;
                this.workspace.scrollTop = scrollTop;
                setTimeout(() => this.expectingScrollChange = false, 100);
            }
            
            // Reset the expecting flag
            this.expectingScrollChange = false;
        }, 100);
        
        console.log(`Workspace centered: scrollLeft=${scrollLeft}, scrollTop=${scrollTop}`);
        console.log(`Scroll area: ${totalScrollWidth}x${totalScrollHeight}, Viewport: ${viewportWidth}x${viewportHeight}`);
    }
    
    // Handle Alt+wheel zoom
    handleWheelZoom(e) {
        // Only zoom when Alt is pressed
        if (!e.altKey) return;
        
        e.preventDefault();
        
        // Determine zoom direction (up = zoom in, down = zoom out)
        const zoomStep = 10; // 10% increment
        const currentPercent = Math.round(this.zoomLevel * 100);
        const deltaPercent = e.deltaY < 0 ? zoomStep : -zoomStep;
        const newPercent = Math.max(50, Math.min(300, currentPercent + deltaPercent));
        
        console.log(`Wheel zoom: ${currentPercent}% -> ${newPercent}%`);
        
        // Update zoom level
        this.setZoomLevel(newPercent / 100);
        
        // Update slider and display
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider) zoomSlider.value = newPercent;
        if (zoomValue) zoomValue.textContent = newPercent + '%';
    }
    
    // Update grid background size to match zoom level
    updateGridBackground() {
        // Calculate grid size based on zoom level (inverse scaling for visual consistency)
        const gridSize = 20 / this.zoomLevel;
        
        // Find workspace element if not already available
        const workspace = this.workspace || document.getElementById('workspace');
        if (workspace) {
            // Apply to workspace pseudo-element via CSS custom property
            workspace.style.setProperty('--grid-size', `${gridSize}px`);
            // Update stored reference
            this.workspace = workspace;
        } else {
            console.warn('Workspace not available for grid background update');
        }
    }
    
    // Removed handleWorkspaceWheel - now using zoom slider instead
    
    // Legacy canvas size adjustment (kept for compatibility)
    changeCanvasSize(sizeValue) {
        const [width, height] = sizeValue.split(',').map(Number);
        
        // Update canvas dimensions
        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);
        this.canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        console.log(`Canvas size changed to ${width}×${height}`);
    }
    
    // Undo system methods
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        // Calculate distance from point (px, py) to line segment (x1, y1) to (x2, y2)
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getConnectionAtPoint(x, y) {
        // Find the closest connection line to the point
        const connections = this.canvas.querySelectorAll('.connection');
        let closestConnection = null;
        let minDistance = Infinity;
        const threshold = 10; // pixels
        
        for (const connection of connections) {
            const x1 = parseFloat(connection.getAttribute('x1'));
            const y1 = parseFloat(connection.getAttribute('y1'));
            const x2 = parseFloat(connection.getAttribute('x2'));
            const y2 = parseFloat(connection.getAttribute('y2'));
            
            // Calculate distance from point to line segment
            const distance = this.pointToLineDistance(x, y, x1, y1, x2, y2);
            
            if (distance < threshold && distance < minDistance) {
                minDistance = distance;
                closestConnection = connection;
            }
        }
        
        return closestConnection;
    }
    
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        // Calculate the distance from point (px, py) to line segment from (x1,y1) to (x2,y2)
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            // Line segment is actually a point
            return Math.sqrt(A * A + B * B);
        }
        
        let param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    selectConnection(connection, multiSelect = false) {
        if (!multiSelect) {
            // Clear all selections (sugars, texts, AND connections) when doing single selection
            // This ensures text selection highlights are cleared when clicking a linkage
            this.clearAllSelectionsQuiet();
        }
        
        // Add to both unified and legacy selection sets
        this.selectedElements.add(connection);
        this.selectedConnections.add(connection);
        connection.classList.add('selected');
        
        // Update right panel to show linkage controls
        this.updateRightPanel();
    }
    
    updateLinkageInput() {
        const linkageInput = document.getElementById('linkageInput');
        if (!linkageInput) return;
        
        if (this.selectedConnections.size === 1) {
            // Single selection - show current linkage
            const connection = Array.from(this.selectedConnections)[0];
            const linkage = connection.getAttribute('data-linkage') || '??-?';
            linkageInput.value = linkage;
        } else if (this.selectedConnections.size > 1) {
            // Multi-selection - check if all have same linkage
            const linkages = Array.from(this.selectedConnections).map(conn => 
                conn.getAttribute('data-linkage') || '??-?'
            );
            const allSame = linkages.every(l => l === linkages[0]);
            linkageInput.value = allSame ? linkages[0] : '';
            linkageInput.placeholder = allSame ? '' : '(多个键连)';
        } else {
            linkageInput.value = '';
            linkageInput.placeholder = '输入键连信息 (如: α1-2, B14)';
        }
        
        // Update connection style controls
        this.updateConnectionControlValues();
    }

    updateConnectionControlValues() {
        if (this.currentTool !== 'linkage') return;
        
        // Set flag to prevent style application during UI update
        this.isUpdatingUI = true;
        
        const strokeWidthSlider = document.getElementById('connectionStrokeWidth');
        const strokeWidthValue = document.getElementById('connectionStrokeWidthValue');
        const connectionColor = document.getElementById('connectionColor');
        const connectionColorHex = document.getElementById('connectionColorHex');
        const textSizeSlider = document.getElementById('linkageTextSize');
        const textSizeValue = document.getElementById('linkageTextSizeValue');
        const textColorPicker = document.getElementById('linkageTextColor');
        const textColorHex = document.getElementById('linkageTextColorHex');
        const opacitySlider = document.getElementById('linkageOpacity');
        const opacityValue = document.getElementById('linkageOpacityValue');
        const styleButtons = document.querySelectorAll('.connection-style-btn');
        
        if (this.selectedConnections.size === 0) {
            // No selection - clear mixed states
            this.clearConnectionMixedStates();
            return;
        }
        
        if (this.selectedConnections.size === 1) {
            // Single selection - show current values
            const connection = Array.from(this.selectedConnections)[0];
            
            const currentWidth = parseFloat(connection.style.strokeWidth || connection.getAttribute('stroke-width') || '2');
            const currentColor = connection.style.stroke || connection.getAttribute('stroke') || '#000000';
            const currentOpacity = parseFloat(connection.style.strokeOpacity || connection.getAttribute('stroke-opacity') || '1');
            const currentDashArray = connection.style.strokeDasharray || connection.getAttribute('stroke-dasharray') || '';
            
            if (strokeWidthSlider && strokeWidthValue) {
                strokeWidthSlider.value = currentWidth;
                strokeWidthValue.textContent = currentWidth;
                strokeWidthSlider.classList.remove('mixed');
                strokeWidthValue.classList.remove('mixed');
            }
            
            if (connectionColor && connectionColorHex) {
                const hexColor = this.normalizeColorToHex(currentColor);
                connectionColor.value = hexColor;
                connectionColorHex.value = hexColor;
                connectionColor.classList.remove('mixed');
                connectionColorHex.classList.remove('mixed');
                
                // Update active state on connection color buttons
                const connectionColorButtons = document.querySelectorAll('[data-target="connectionColor"]');
                connectionColorButtons.forEach(btn => {
                    const btnColor = this.normalizeColorToHex(btn.getAttribute('data-color'));
                    if (btnColor.toLowerCase() === hexColor.toLowerCase()) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
            
            // Update opacity control
            if (opacitySlider && opacityValue) {
                opacitySlider.value = currentOpacity;
                opacityValue.textContent = Math.round(currentOpacity * 100) + '%';
                opacitySlider.classList.remove('mixed');
                opacityValue.classList.remove('mixed');
            }
            
            // Update style buttons based on dash array
            if (styleButtons.length > 0) {
                styleButtons.forEach(btn => btn.classList.remove('active', 'mixed'));
                
                let activeStyle = 'solid';
                if (currentDashArray.includes('5,5') || currentDashArray.includes('5, 5')) {
                    activeStyle = 'dashed';
                } else if (currentDashArray.includes('2,2') || currentDashArray.includes('2, 2')) {
                    activeStyle = 'dotted';
                }
                
                const activeBtn = document.querySelector(`.connection-style-btn[data-style="${activeStyle}"]`);
                if (activeBtn) activeBtn.classList.add('active');
            }
            
            // Handle text size and text color for linkage labels
            const linkageId = connection.getAttribute('data-linkage-id');
            if (linkageId) {
                const labelElement = document.querySelector(`[data-linkage-for="${linkageId}"]`);
                if (labelElement) {
                    // Update text size
                    if (textSizeSlider && textSizeValue) {
                        const currentTextSize = parseFloat(labelElement.style.fontSize || '12');
                        textSizeSlider.value = currentTextSize;
                        textSizeValue.textContent = currentTextSize;
                        textSizeSlider.classList.remove('mixed');
                        textSizeValue.classList.remove('mixed');
                    }
                    
                    // Update text color
                    if (textColorPicker && textColorHex) {
                        const currentTextColor = labelElement.style.fill || '#000000';
                        const hexTextColor = this.normalizeColorToHex(currentTextColor);
                        textColorPicker.value = hexTextColor;
                        textColorHex.value = hexTextColor;
                        textColorPicker.classList.remove('mixed');
                        textColorHex.classList.remove('mixed');
                        
                        // Update active state on color buttons
                        const textColorButtons = document.querySelectorAll('.color-btn-compact[data-target="linkageTextColor"]');
                        textColorButtons.forEach(btn => {
                            const btnColor = this.normalizeColorToHex(btn.getAttribute('data-color'));
                            if (btnColor.toLowerCase() === hexTextColor.toLowerCase()) {
                                btn.classList.add('active');
                            } else {
                                btn.classList.remove('active');
                            }
                        });
                    }
                }
            }
            
            // Update linkage visibility checkbox
            const showLinkageTextCheckbox = document.getElementById('showLinkageText');
            if (showLinkageTextCheckbox) {
                const currentVisible = connection.getAttribute('data-linkage-visible') !== 'false';
                showLinkageTextCheckbox.checked = currentVisible;
            }
        } else {
            // Multi-selection - check for mixed values
            const connections = Array.from(this.selectedConnections);
            
            // Get first connection values for comparison
            const firstConnection = connections[0];
            const firstWidth = parseFloat(firstConnection.style.strokeWidth || firstConnection.getAttribute('stroke-width') || '2');
            const firstColor = firstConnection.style.stroke || firstConnection.getAttribute('stroke') || '#000000';
            const firstOpacity = parseFloat(firstConnection.style.strokeOpacity || firstConnection.getAttribute('stroke-opacity') || '1');
            const firstDashArray = firstConnection.style.strokeDasharray || firstConnection.getAttribute('stroke-dasharray') || '';
            
            // Check if all connections have same values
            let mixedWidth = false, mixedColor = false, mixedTextSize = false, mixedTextColor = false, mixedOpacity = false, mixedStyle = false, mixedVisible = false;
            let firstTextSize = 12;
            let firstTextColor = '#000000';
            let firstVisible = firstConnection.getAttribute('data-linkage-visible') !== 'false';
            
            const firstLinkageId = firstConnection.getAttribute('data-linkage-id');
            if (firstLinkageId) {
                const firstLabelElement = document.querySelector(`[data-linkage-for="${firstLinkageId}"]`);
                if (firstLabelElement) {
                    firstTextSize = parseFloat(firstLabelElement.style.fontSize || '12');
                    firstTextColor = firstLabelElement.style.fill || '#000000';
                }
            }
            
            for (let i = 1; i < connections.length; i++) {
                const conn = connections[i];
                const width = parseFloat(conn.style.strokeWidth || conn.getAttribute('stroke-width') || '2');
                const color = conn.style.stroke || conn.getAttribute('stroke') || '#000000';
                const opacity = parseFloat(conn.style.strokeOpacity || conn.getAttribute('stroke-opacity') || '1');
                const dashArray = conn.style.strokeDasharray || conn.getAttribute('stroke-dasharray') || '';
                const visible = conn.getAttribute('data-linkage-visible') !== 'false';
                
                if (width !== firstWidth) mixedWidth = true;
                if (color !== firstColor) mixedColor = true;
                if (opacity !== firstOpacity) mixedOpacity = true;
                if (dashArray !== firstDashArray) mixedStyle = true;
                if (visible !== firstVisible) mixedVisible = true;
                
                const linkageId = conn.getAttribute('data-linkage-id');
                if (linkageId) {
                    const labelElement = document.querySelector(`[data-linkage-for="${linkageId}"]`);
                    if (labelElement) {
                        const textSize = parseFloat(labelElement.style.fontSize || '12');
                        const textColor = labelElement.style.fill || '#000000';
                        if (textSize !== firstTextSize) mixedTextSize = true;
                        if (textColor !== firstTextColor) mixedTextColor = true;
                    }
                }
            }
            
            // Update stroke width controls
            if (strokeWidthSlider && strokeWidthValue) {
                if (mixedWidth) {
                    strokeWidthSlider.value = '';
                    strokeWidthValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                    strokeWidthSlider.classList.add('mixed');
                    strokeWidthValue.classList.add('mixed');
                } else {
                    strokeWidthSlider.value = firstWidth;
                    strokeWidthValue.textContent = firstWidth;
                    strokeWidthSlider.classList.remove('mixed');
                    strokeWidthValue.classList.remove('mixed');
                }
            }
            
            // Update color controls
            if (connectionColor && connectionColorHex) {
                if (mixedColor) {
                    connectionColor.value = '#ffffff';
                    connectionColorHex.value = '';
                    connectionColor.classList.add('mixed');
                    connectionColorHex.classList.add('mixed');
                    
                    // Clear all active states for mixed colors
                    const connectionColorButtons = document.querySelectorAll('[data-target="connectionColor"]');
                    connectionColorButtons.forEach(btn => btn.classList.remove('active'));
                } else {
                    const hexColor = this.normalizeColorToHex(firstColor);
                    connectionColor.value = hexColor;
                    connectionColorHex.value = hexColor;
                    connectionColor.classList.remove('mixed');
                    connectionColorHex.classList.remove('mixed');
                    
                    // Update active state on connection color buttons
                    const connectionColorButtons = document.querySelectorAll('[data-target="connectionColor"]');
                    connectionColorButtons.forEach(btn => {
                        const btnColor = this.normalizeColorToHex(btn.getAttribute('data-color'));
                        if (btnColor.toLowerCase() === hexColor.toLowerCase()) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }
            }
            
            // Update opacity controls
            if (opacitySlider && opacityValue) {
                if (mixedOpacity) {
                    opacitySlider.value = '';
                    opacityValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                    opacitySlider.classList.add('mixed');
                    opacityValue.classList.add('mixed');
                } else {
                    opacitySlider.value = firstOpacity;
                    opacityValue.textContent = Math.round(firstOpacity * 100) + '%';
                    opacitySlider.classList.remove('mixed');
                    opacityValue.classList.remove('mixed');
                }
            }
            
            // Update style buttons
            if (styleButtons.length > 0) {
                styleButtons.forEach(btn => btn.classList.remove('active'));
                
                if (mixedStyle) {
                    // Show mixed state for all buttons
                    styleButtons.forEach(btn => btn.classList.add('mixed'));
                } else {
                    // Show the common style
                    styleButtons.forEach(btn => btn.classList.remove('mixed'));
                    
                    let activeStyle = 'solid';
                    if (firstDashArray.includes('5,5') || firstDashArray.includes('5, 5')) {
                        activeStyle = 'dashed';
                    } else if (firstDashArray.includes('2,2') || firstDashArray.includes('2, 2')) {
                        activeStyle = 'dotted';
                    }
                    
                    const activeBtn = document.querySelector(`.connection-style-btn[data-style="${activeStyle}"]`);
                    if (activeBtn) activeBtn.classList.add('active');
                }
            }
            
            // Update text size controls
            if (textSizeSlider && textSizeValue) {
                if (mixedTextSize) {
                    textSizeSlider.value = '';
                    textSizeValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                    textSizeSlider.classList.add('mixed');
                    textSizeValue.classList.add('mixed');
                } else {
                    textSizeSlider.value = firstTextSize;
                    textSizeValue.textContent = firstTextSize;
                    textSizeSlider.classList.remove('mixed');
                    textSizeValue.classList.remove('mixed');
                }
            }
            
            // Update text color controls
            if (textColorPicker && textColorHex) {
                if (mixedTextColor) {
                    textColorPicker.value = '#ffffff';
                    textColorHex.value = '';
                    textColorPicker.classList.add('mixed');
                    textColorHex.classList.add('mixed');
                    
                    // Clear all active states for mixed colors
                    const textColorButtons = document.querySelectorAll('.color-btn-compact[data-target="linkageTextColor"]');
                    textColorButtons.forEach(btn => btn.classList.remove('active'));
                } else {
                    const hexTextColor = this.normalizeColorToHex(firstTextColor);
                    textColorPicker.value = hexTextColor;
                    textColorHex.value = hexTextColor;
                    textColorPicker.classList.remove('mixed');
                    textColorHex.classList.remove('mixed');
                    
                    // Update active state on color buttons
                    const textColorButtons = document.querySelectorAll('.color-btn-compact[data-target="linkageTextColor"]');
                    textColorButtons.forEach(btn => {
                        const btnColor = this.normalizeColorToHex(btn.getAttribute('data-color'));
                        if (btnColor.toLowerCase() === hexTextColor.toLowerCase()) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }
            }
            
            // Update linkage visibility checkbox
            const showLinkageTextCheckbox = document.getElementById('showLinkageText');
            if (showLinkageTextCheckbox) {
                if (mixedVisible) {
                    // Mixed state - set to indeterminate
                    showLinkageTextCheckbox.indeterminate = true;
                } else {
                    showLinkageTextCheckbox.indeterminate = false;
                    showLinkageTextCheckbox.checked = firstVisible;
                }
            }
        }
        
        // Clear flag after UI update is complete
        this.isUpdatingUI = false;
    }

    clearConnectionMixedStates() {
        const controls = [
            'connectionStrokeWidth', 'connectionStrokeWidthValue',
            'connectionColor', 'connectionColorHex',
            'linkageTextSize', 'linkageTextSizeValue',
            'linkageOpacity', 'linkageOpacityValue',
            'linkageOpacity', 'linkageOpacityValue'
        ];
        
        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('mixed');
            }
        });
        
        // Clear mixed state from style buttons
        const styleButtons = document.querySelectorAll('.connection-style-btn');
        styleButtons.forEach(btn => btn.classList.remove('mixed'));
    }

    deselectConnection(connection) {
        // Remove from both unified and legacy selection sets
        this.selectedElements.delete(connection);
        this.selectedConnections.delete(connection);
        connection.classList.remove('selected');
        
        // Update linkage input field and controls
        this.updateLinkageInput();
        
        // Update right panel to show/hide linkage controls
        this.updateRightPanel();
    }
    
    toggleConnectionSelection(connection, multiSelect = false) {
        if (this.selectedConnections.has(connection)) {
            this.deselectConnection(connection);
        } else {
            this.selectConnection(connection, multiSelect);
        }
    }

    clearConnectionSelections() {
        // Clear from legacy set
        this.selectedConnections.clear();
        
        // Remove from unified selection set and visual highlighting
        document.querySelectorAll('.connection.selected').forEach(conn => {
            this.selectedElements.delete(conn);
            conn.classList.remove('selected');
        });
        
        // Update right panel to hide linkage controls
        this.updateRightPanel();
    }

    // Keyboard event handlers
    handleKeyDown(e) {
        // Track modifier keys (primary modifier: Ctrl on Windows/Linux, Command(meta) on macOS)
        this.isCtrlPressed = e.ctrlKey; // backward-compatible
        this.isPrimaryModifierPressed = e.ctrlKey || e.metaKey;
        this.isShiftPressed = e.shiftKey;
        
        // Don't handle shortcuts when editing text
        if (this.isEditingText) {
            // Allow text formatting shortcuts even when editing
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.toggleTextStyle('boldBtn');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.toggleTextStyle('italicBtn');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.toggleTextStyle('underlineBtn');
                        break;
                    case '=':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.toggleSuperscript();
                        } else {
                            this.toggleSubscript();
                        }
                        break;
                }
            }
            return;
        }
        
    // Handle keyboard shortcuts (use primary modifier)
    if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    this.copySelection();
                    break;
                case 'v':
                    e.preventDefault();
                    this.pasteFromClipboard();
                    break;
                case 'x':
                    e.preventDefault();
                    this.cutSelection();
                    break;
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                    case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
                case 'b':
                    e.preventDefault();
                    // If a connection is selected, apply to its linkage text instead
                    const selConnsB = this.getSelectedElementsByType('connection') || [];
                    if (selConnsB.length > 0) {
                        // Dispatch a real click so the existing linkage button handlers run
                        const lbtn = document.getElementById('linkageTextBoldBtn');
                        if (lbtn) {
                            // simulate full user interaction so mousedown/mouseup handlers run
                            lbtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                        }
                    } else {
                        this.toggleTextStyle('boldBtn');
                    }
                    break;
                case 'i':
                    e.preventDefault();
                    // If a connection is selected, apply to its linkage text instead
                    const selConnsI = this.getSelectedElementsByType('connection') || [];
                    if (selConnsI.length > 0) {
                        // Dispatch a real click so the existing linkage button handlers run
                        const lbtn = document.getElementById('linkageTextItalicBtn');
                        if (lbtn) {
                            // simulate full user interaction so mousedown/mouseup handlers run
                            lbtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                        }
                    } else {
                        this.toggleTextStyle('italicBtn');
                    }
                    break;
                case 'u':
                    e.preventDefault();
                    // If a connection is selected, apply to its linkage text instead
                    const selConnsU = this.getSelectedElementsByType('connection') || [];
                    if (selConnsU.length > 0) {
                        // Dispatch a real click so the existing linkage button handlers run
                        const lbtn = document.getElementById('linkageTextUnderlineBtn');
                        if (lbtn) {
                            // simulate full user interaction so mousedown/mouseup handlers run
                            lbtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                        }
                    } else {
                        this.toggleTextStyle('underlineBtn');
                    }
                    break;
                case '=':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.toggleSuperscript();
                    } else {
                        this.toggleSubscript();
                    }
                    break;
            }
        } else {
            // Don't handle Delete/Backspace when focus is in an input field
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.contentEditable === 'true'
            );
            
            if (!isInputFocused) {
                switch (e.key) {
                    case 'Escape':
                        e.preventDefault();
                        this.clearSelection();
                        break;
                    case 'Delete':
                    case 'Backspace':
                        e.preventDefault();
                        this.deleteSelection();
                        break;
                }
            }
        }
    }
    
    handleKeyUp(e) {
        // Update modifier key states (primary modifier included)
        this.isCtrlPressed = e.ctrlKey;
        this.isPrimaryModifierPressed = e.ctrlKey || e.metaKey;
        this.isShiftPressed = e.shiftKey;
    }
    
    // Removed handleWheel - now using zoom slider instead
    
    // ===== UNIFIED ELEMENT SYSTEM =====
    
    // Element type detection
    getElementType(element) {
        if (element.classList.contains('sugar')) return 'sugar';
        if (element.classList.contains('text-element')) return 'text';
        if (element.classList.contains('connection')) return 'connection';
        return null;
    }
    
    // Check if element is selectable
    isSelectableElement(element) {
        return this.getElementType(element) !== null;
    }
    
    // Unified element selection
    selectElement(element, multiSelect = false) {
        if (!this.isSelectableElement(element)) return;
        
        // Only force complete operations if we're switching between different elements during styling
        // Don't force complete for simple selection changes or when selecting newly created elements
        if (this.pendingOperation && this.operationContext === 'styling') {
            const elementIds = new Set([element.id || element.getAttribute('id')]);
            const currentIds = new Set(Array.from(this.operationTargetElements).map(el => el.id || el.getAttribute('id')));
            
            // Only force complete if we're switching to a different element during styling
            if (!this.setsEqual(elementIds, currentIds)) {
                console.log('🔄 Switching elements during styling - completing operation');
            }
        }
        
        if (!multiSelect) {
            this.clearAllSelectionsQuiet(); // 使用不触发循环的版本
        }
        
        this.selectedElements.add(element);
        element.classList.add('selected');
        this.showSelectionHighlight(element);
        
        // Update legacy selection states for backward compatibility
        this.updateLegacySelectionStates();
        
        // Update right panel to show appropriate controls (including linkage)
        this.updateRightPanel();
    }
    
    // Unified element deselection
    deselectElement(element) {
        if (!this.selectedElements.has(element)) return;
        
        this.selectedElements.delete(element);
        element.classList.remove('selected');
        this.hideSelectionHighlight(element);
        
        // Update legacy selection states
        this.updateLegacySelectionStates();
        
        // Update right panel to hide controls if needed
        this.updateRightPanel();
    }
    
    // Toggle element selection
    toggleElementSelection(element, multiSelect = false) {
        if (this.selectedElements.has(element)) {
            this.deselectElement(element);
        } else {
            this.selectElement(element, multiSelect);
        }
        
        // Update right panel (redundant but ensures it's called)
        this.updateRightPanel();
    }
    
    // Show hover preview
    showHoverPreview(element) {
        if (!this.isSelectableElement(element)) return;
        if (this.selectedElements.has(element)) return; // Already selected
        
        this.hoveredElement = element;
        element.classList.add('hover-preview');
    }
    
    // Hide hover preview
    hideHoverPreview(element = null) {
        if (element) {
            element.classList.remove('hover-preview');
            if (this.hoveredElement === element) {
                this.hoveredElement = null;
            }
        } else if (this.hoveredElement) {
            this.hoveredElement.classList.remove('hover-preview');
            this.hoveredElement = null;
        }
    }
    
    // Clear all hover previews
    clearAllHoverPreviews() {
        document.querySelectorAll('.hover-preview').forEach(el => {
            el.classList.remove('hover-preview');
        });
        this.hoveredElements.clear();
        this.hoveredElement = null;
    }
    
    // Unified selection highlight
    showSelectionHighlight(element) {
        const type = this.getElementType(element);
        switch (type) {
            case 'sugar':
                this.addSelectionHighlight(element);
                break;
            case 'text':
                this.addTextSelectionHighlight(element);
                break;
            case 'connection':
                // Connection selection highlight (if needed)
                break;
        }
    }
    
    // Unified selection highlight removal
    hideSelectionHighlight(element) {
        const type = this.getElementType(element);
        switch (type) {
            case 'sugar':
                this.removeSelectionHighlight(element);
                break;
            case 'text':
                this.removeTextSelectionHighlight(element);
                break;
            case 'connection':
                // Connection selection highlight removal (if needed)
                break;
        }
    }
    
    // Clear all selections
    clearAllSelections() {
        // Only force complete operations if there's actually a meaningful styling operation pending
        // AND the operation has made actual changes to the canvas
        if (this.pendingOperation && this.operationContext === 'styling' && 
            this.operationStartState && 
            this.operationStartState.canvasContent !== this.canvas.innerHTML) {
            console.log('🔄 Clearing selection during styling with changes - completing operation');
        } else if (this.pendingOperation) {
            // Clear any pending operation without saving if no meaningful changes were made
            console.log('🔄 Clearing pending operation without saving (no meaningful changes)');
            this.pendingOperation = false;
            this.operationStartState = null;
            this.operationTargetElements.clear();
            this.operationContext = null;
            if (this.operationTimer) {
                clearTimeout(this.operationTimer);
                this.operationTimer = null;
            }
        }
        
        this.selectedElements.forEach(element => {
            element.classList.remove('selected');
            this.hideSelectionHighlight(element);
        });
        this.selectedElements.clear();
        this.clearAllHoverPreviews();
        
        // Update legacy selection states
        this.updateLegacySelectionStates();
        this.updateStylePanel();
    }
    
    // 不触发UI更新的清除选择（用于避免循环调用）
    clearAllSelectionsQuiet() {
        this.selectedElements.forEach(element => {
            element.classList.remove('selected');
            this.hideSelectionHighlight(element);
        });
        this.selectedElements.clear();
        this.clearAllHoverPreviews();
        
        // 只更新legacy状态，不触发UI更新
        this.selectedSugar = null;
        this.selectedText = null;
        this.selectedSugars.clear();
        this.selectedTexts.clear();
        this.selectedConnections.clear();
        
        this.updateStylePanel();
    }
    
    // Update legacy selection states for backward compatibility
    updateLegacySelectionStates() {
        // Clear legacy states
        this.selectedSugar = null;
        this.selectedText = null;
        this.selectedSugars.clear();
        this.selectedTexts.clear();
        this.selectedConnections.clear();
        
        // Update from unified selection
        this.selectedElements.forEach(element => {
            const type = this.getElementType(element);
            switch (type) {
                case 'sugar':
                    this.selectedSugars.add(element);
                    if (!this.selectedSugar) this.selectedSugar = element;
                    break;
                case 'text':
                    this.selectedTexts.add(element);
                    if (!this.selectedText) this.selectedText = element;
                    break;
                case 'connection':
                    this.selectedConnections.add(element);
                    break;
            }
        });
        
        // 更新选择UI - 使用新的统一逻辑，但只在有糖选择时调用
        if (this.currentTool === 'select' && this.selectedSugars.size > 0) {
            this.updateSelectionUI();
        } else if (this.currentTool === 'select' && this.selectedElements.size === 0) {
            // 如果没有任何选择，只清除UI状态，不触发递归
            this.clearUISelections();
        }
    }
    
    // Get all selected elements by type
    getSelectedElementsByType(type) {
        return Array.from(this.selectedElements).filter(element => 
            this.getElementType(element) === type
        );
    }
    
    // Check if any elements are selected
    hasSelectedElements() {
        return this.selectedElements.size > 0;
    }
    
    // Get element at point (unified)
    getElementAtPoint(x, y) {
        // Check for sugars first
        const clickedSugar = this.getSugarAtPoint(x, y);
        if (clickedSugar) return clickedSugar;
        
        // Then check for text
        const clickedText = this.getTextAtPoint(x, y);
        if (clickedText) return clickedText;
        
        // Could add connections here in the future
        return null;
    }
    
    // Start dragging selected elements
    startDragging(x, y, multipleElements = false) {
        // Start recording a step for drag operation
        this.startStep('Move objects');
        
        // Store before state for all selected elements
        this.selectedElements.forEach(element => {
            const beforeData = this.createObjectData(element);
            if (beforeData) {
                element.setAttribute('data-before-move', JSON.stringify(beforeData));
            }
        });
        
        this.isDragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        
        // Disable workspace transitions during dragging
        const workspace = document.querySelector('.workspace');
        if (workspace) {
            workspace.classList.add('dragging-active');
        }
        
        // Add global dragging class to body to disable all transitions
        document.body.classList.add('global-dragging');
        
        // Add global event listeners for dragging outside canvas
        document.addEventListener('mousemove', this.globalDragMouseMove);
        document.addEventListener('mouseup', this.globalDragMouseUp);
        
        if (multipleElements) {
            this.isDraggingMultiple = true;
            this.isDraggingMultipleTexts = false;
            
            // Store initial positions for all selected elements
            this.selectedElements.forEach(element => {
                const elementX = parseFloat(element.getAttribute('data-x'));
                const elementY = parseFloat(element.getAttribute('data-y'));
                element.setAttribute('data-initial-x', elementX);
                element.setAttribute('data-initial-y', elementY);
                element.classList.add('dragging');
            });
        } else {
            this.isDraggingMultiple = false;
            
            // For single element, set drag offset
            const element = Array.from(this.selectedElements)[0];
            if (element) {
                const elementX = parseFloat(element.getAttribute('data-x'));
                const elementY = parseFloat(element.getAttribute('data-y'));
                
                element.setAttribute('data-initial-x', elementX);
                element.setAttribute('data-initial-y', elementY);
                element.classList.add('dragging');
                
                this.dragOffset = {
                    x: x - elementX,
                    y: y - elementY
                };
                
                // Set type-specific dragging flags for backward compatibility
                const type = this.getElementType(element);
                if (type === 'text') {
                    this.isDraggingMultipleTexts = false;
                }
            }
        }
    }
    
    // ===== END UNIFIED ELEMENT SYSTEM =====
    
    // Keyboard shortcut implementations
    clearSelection() {
        this.clearAllSelections();
    }
    
    deleteSelection() {
        // Start recording a step for multiple deletions
        this.startStep('Delete selection');

        // Collect elements to delete using unified system
        const sugarsToDelete = this.getSelectedElementsByType('sugar');
        const textsToDelete = this.getSelectedElementsByType('text');
        const connectionsToDelete = this.getSelectedElementsByType('connection');
        
        // Collect all connections to delete (including those connected to deleted sugars)
        const allConnectionsToDelete = new Set(connectionsToDelete);
        
        // Find connections that are connected to sugars being deleted
        document.querySelectorAll('.connection').forEach(connection => {
            const startId = connection.getAttribute('data-start');
            const endId = connection.getAttribute('data-end');
            
            const startSugar = document.getElementById(startId);
            const endSugar = document.getElementById(endId);
            
            // Delete connection if either end is being deleted
            if ((startSugar && sugarsToDelete.includes(startSugar)) || 
                (endSugar && sugarsToDelete.includes(endSugar))) {
                allConnectionsToDelete.add(connection);
            }
        });
        
        // Record deletions for undo/redo
        allConnectionsToDelete.forEach(connection => {
            const connectionId = connection.getAttribute('id');
            if (connectionId) {
                this.recordObjectRemoved(connectionId);
            }
        });
        
        sugarsToDelete.forEach(sugar => {
            const sugarId = sugar.getAttribute('id');
            this.recordObjectRemoved(sugarId);
        });
        
        textsToDelete.forEach(text => {
            const textId = text.getAttribute('id');
            this.recordObjectRemoved(textId);
        });
        
        // Delete all connections and their linkage texts
        allConnectionsToDelete.forEach(connection => {
            const connectionId = connection.getAttribute('id');
            if (connectionId) {
                // Remove both config and position text elements
                const configText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="config"]`);
                const positionText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="position"]`);
                if (configText) configText.remove();
                if (positionText) positionText.remove();
                
                // Also remove any old-style single linkage text (for backward compatibility)
                const oldLinkageText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"]:not([data-linkage-part])`);
                if (oldLinkageText) oldLinkageText.remove();
            }
            connection.remove();
        });
        
        // Delete selected sugars and texts
        sugarsToDelete.forEach(sugar => {
            this.hideSelectionHighlight(sugar);
            sugar.remove();
        });
        
        textsToDelete.forEach(text => {
            this.hideSelectionHighlight(text);
            text.remove();
        });

        this.clearAllSelections();
        
        // Finish recording the step
        this.finishStep();
    }    copySelection() {
        this.clipboard = {
            sugars: [],
            texts: [],
            connections: [],
            linkageLabels: []
        };
        
        // Use unified selectedElements system
        this.selectedElements.forEach(element => {
            const type = this.getElementType(element);
            
            if (type === 'sugar') {
                this.clipboard.sugars.push({
                    id: element.id,
                    x: parseFloat(element.getAttribute('data-x')),
                    y: parseFloat(element.getAttribute('data-y')),
                    shape: element.getAttribute('data-shape'),
                    color: element.getAttribute('data-color'),
                    preset: element.getAttribute('data-preset'),
                    innerHTML: element.innerHTML
                });
            } else if (type === 'text') {
                const content = element.textContent || 'Text'; // Ensure we have content
                this.clipboard.texts.push({
                    x: parseFloat(element.getAttribute('data-x')),
                    y: parseFloat(element.getAttribute('data-y')),
                    content: content,
                    style: element.getAttribute('style'),
                    className: element.className
                });
            }
        });
        
        // Copy connections between selected sugars
        const connectionsToCopy = [];
        const linkageLabelsToCopy = [];
        const selectedSugarElements = this.getSelectedElementsByType('sugar');
        
        document.querySelectorAll('.connection').forEach(connection => {
            const startId = connection.getAttribute('data-start');
            const endId = connection.getAttribute('data-end');
            
            const startSugar = document.getElementById(startId);
            const endSugar = document.getElementById(endId);
            
            // Only copy connections where both sugars are selected
            if (startSugar && endSugar && 
                selectedSugarElements.includes(startSugar) && 
                selectedSugarElements.includes(endSugar)) {
                
                // Preserve all important style properties
                const connectionCopy = {
                    startId: startId,
                    endId: endId,
                    style: connection.getAttribute('style'),
                    className: connection.className.baseVal || connection.className, // Handle SVG className properly
                    // Preserve inline style properties, fallback to computed styles for defaults
                    strokeWidth: connection.style.strokeWidth || connection.getAttribute('stroke-width') || getComputedStyle(connection).strokeWidth,
                    stroke: connection.style.stroke || connection.getAttribute('stroke') || this.normalizeColorToHex(getComputedStyle(connection).stroke),
                    strokeOpacity: connection.style.strokeOpacity || connection.getAttribute('stroke-opacity') || getComputedStyle(connection).strokeOpacity,
                    strokeDasharray: connection.style.strokeDasharray || connection.getAttribute('stroke-dasharray') || getComputedStyle(connection).strokeDasharray,
                    // Preserve linkage-specific attributes
                    linkageId: connection.getAttribute('data-linkage-id'),
                    linkageType: connection.getAttribute('data-linkage'),
                    // Preserve linkage text appearance and visibility
                    textSize: connection.getAttribute('data-text-size'),
                    textColor: connection.getAttribute('data-text-color'),
                    textFontFamily: connection.getAttribute('data-text-font-family'),
                    textBold: connection.getAttribute('data-text-bold'),
                    textItalic: connection.getAttribute('data-text-italic'),
                    textUnderline: connection.getAttribute('data-text-underline'),
                    textOpacity: connection.getAttribute('data-text-opacity'),
                    linkageVisible: connection.getAttribute('data-linkage-visible'),
                    reversed: connection.getAttribute('data-reversed')
                };
                
                connectionsToCopy.push(connectionCopy);
                
                // Also copy associated linkage label if it exists
                const linkageId = connection.getAttribute('data-linkage-id');
                if (linkageId) {
                    const labelElement = document.querySelector(`[data-linkage-for="${linkageId}"]`);
                    if (labelElement) {
                        linkageLabelsToCopy.push({
                            linkageId: linkageId,
                            x: parseFloat(labelElement.getAttribute('data-x')) || parseFloat(labelElement.getAttribute('x')),
                            y: parseFloat(labelElement.getAttribute('data-y')) || parseFloat(labelElement.getAttribute('y')),
                            content: labelElement.textContent,
                            style: labelElement.getAttribute('style'),
                            className: labelElement.className,
                            fill: this.normalizeColorToHex(labelElement.style.fill || labelElement.getAttribute('fill')),
                            fontSize: labelElement.style.fontSize || labelElement.getAttribute('font-size')
                        });
                    }
                }
            }
        });
        
        this.clipboard.connections = connectionsToCopy;
        this.clipboard.linkageLabels = linkageLabelsToCopy;
        
        // Show copy confirmation
        const totalCopied = this.clipboard.sugars.length + this.clipboard.texts.length + this.clipboard.connections.length + this.clipboard.linkageLabels.length;
        if (totalCopied > 0) {
            this.showTemporaryNotification(`已复制 ${totalCopied} 个元素 (保持选择)`);
        }
    }
    
    cutSelection() {
        const totalToCut = this.selectedElements.size;
        
        this.copySelection();
        this.deleteSelection();
        // Selection is already cleared by deleteSelection
        
        if (totalToCut > 0) {
            this.showTemporaryNotification(`已剪切 ${totalToCut} 个元素`);
        }
    }
    
    pasteFromClipboard() {
        if (this.clipboard.sugars.length === 0 && this.clipboard.texts.length === 0) {
            return; // Nothing to paste
        }
        
        // Start recording a step for paste operation
        this.startStep('Paste');
        
        // Clear current selection first (use unified system)
        this.clearAllSelections();
        
        // Calculate dynamic offset to avoid overlapping with previous pastes
        // Each paste moves items 30 pixels to the right and down
        this.pasteCount = (this.pasteCount || 0) + 1;
        const offsetX = 30 * this.pasteCount; // Dynamic offset
        const offsetY = 30 * this.pasteCount;
        
        const pastedSugars = [];
        const pastedTexts = [];
    const pastedConnections = [];
        
        // Paste sugars
        this.clipboard.sugars.forEach(sugarData => {
            const config = {
                shape: sugarData.shape,
                color: sugarData.color,
                type: sugarData.preset ? 'preset' : 'custom',
                preset: sugarData.preset
            };
            
            const newSugar = this.createSugar(
                sugarData.x + offsetX,
                sugarData.y + offsetY,
                config,
                false // Don't save state for each individual sugar during paste
            );
            if (newSugar) {
                pastedSugars.push(newSugar);
            }
        });
        
        // Paste texts
        this.clipboard.texts.forEach(textData => {
            const newText = this.createText(
                textData.x + offsetX,
                textData.y + offsetY,
                textData.content,
                false, // Don't save state for each individual text during paste
                false  // Don't auto-edit pasted text
            );
            if (newText) {
                if (textData.style) {
                    newText.setAttribute('style', textData.style);
                }
                pastedTexts.push(newText);
            }
        });
        
        // Select all pasted items using unified selection system
        const allPastedElements = [...pastedSugars, ...pastedTexts];
        allPastedElements.forEach(element => {
            this.selectElement(element, true); // Use multiSelect=true to keep all selected
        });
        
        // Create mapping from old sugar IDs to new sugars for connections
        const sugarIdMapping = {};
        for (let i = 0; i < this.clipboard.sugars.length; i++) {
            const oldId = this.clipboard.sugars[i].id;
            const newId = pastedSugars[i].id;
            sugarIdMapping[oldId] = newId;
        }
        
        // Paste connections with preserved styles
        this.clipboard.connections.forEach(connectionData => {
            const newStartId = sugarIdMapping[connectionData.startId];
            const newEndId = sugarIdMapping[connectionData.endId];
            
            if (newStartId && newEndId) {
                const startSugar = document.getElementById(newStartId);
                const endSugar = document.getElementById(newEndId);
                
                if (startSugar && endSugar) {
                    // Create connection without default styling to preserve copied styles
                    const newConnection = this.createConnection(startSugar, endSugar, true);
                    
                    // Apply saved styling properties with !important to override any CSS rules
                    if (newConnection && connectionData) {
                        // Apply individual style properties with !important to ensure they stick
                        if (connectionData.strokeWidth) {
                            newConnection.style.setProperty('stroke-width', connectionData.strokeWidth, 'important');
                        }
                        if (connectionData.stroke) {
                            newConnection.style.setProperty('stroke', connectionData.stroke, 'important');
                        }
                        if (connectionData.strokeOpacity) {
                            newConnection.style.setProperty('stroke-opacity', connectionData.strokeOpacity, 'important');
                        }
                        if (connectionData.strokeDasharray) {
                            newConnection.style.setProperty('stroke-dasharray', connectionData.strokeDasharray, 'important');
                        }
                        
                        // Apply basic style attribute as fallback (for any properties not covered above)
                        if (connectionData.style) {
                            // Parse and reapply individual style properties to ensure !important is used
                            const styleString = connectionData.style;
                            const styleRules = styleString.split(';').filter(rule => rule.trim());
                            styleRules.forEach(rule => {
                                const [property, value] = rule.split(':').map(s => s.trim());
                                if (property && value) {
                                    newConnection.style.setProperty(property, value, 'important');
                                }
                            });
                        }
                        
                        // Apply linkage-specific attributes
                        if (connectionData.linkageId) {
                            newConnection.setAttribute('data-linkage-id', connectionData.linkageId);
                        }
                        if (connectionData.linkageType) {
                            newConnection.setAttribute('data-linkage', connectionData.linkageType);
                        }

                        // Restore linkage text appearance and visibility attributes so updateLinkageText can use them
                        if (connectionData.textSize) newConnection.setAttribute('data-text-size', connectionData.textSize);
                        if (connectionData.textColor) newConnection.setAttribute('data-text-color', connectionData.textColor);
                        if (connectionData.textFontFamily) newConnection.setAttribute('data-text-font-family', connectionData.textFontFamily);
                        if (connectionData.textBold !== undefined && connectionData.textBold !== null) newConnection.setAttribute('data-text-bold', connectionData.textBold);
                        if (connectionData.textItalic !== undefined && connectionData.textItalic !== null) newConnection.setAttribute('data-text-italic', connectionData.textItalic);
                        if (connectionData.textUnderline !== undefined && connectionData.textUnderline !== null) newConnection.setAttribute('data-text-underline', connectionData.textUnderline);
                        if (connectionData.textOpacity) newConnection.setAttribute('data-text-opacity', connectionData.textOpacity);
                        if (connectionData.linkageVisible !== undefined && connectionData.linkageVisible !== null) newConnection.setAttribute('data-linkage-visible', connectionData.linkageVisible);
                        if (connectionData.reversed !== undefined && connectionData.reversed !== null) newConnection.setAttribute('data-reversed', connectionData.reversed);

                        // NOTE: Do not auto-create linkage text here; linkage labels are
                        // recreated below from clipboard.linkageLabels. We restore the
                        // connection's data-text-* attributes so the pasted labels can
                        // pick them up when created.
                        
                        // Apply className (SVG elements require className.baseVal)
                        if (connectionData.className) {
                            if (typeof connectionData.className === 'string') {
                                newConnection.className.baseVal = connectionData.className;
                            } else if (connectionData.className.baseVal) {
                                newConnection.className.baseVal = connectionData.className.baseVal;
                            }
                        }
                        
                        // Ensure connection has proper styling - apply defaults if any key style is missing or invalid
                        const hasValidStrokeWidth = connectionData.strokeWidth && connectionData.strokeWidth !== 'none' && connectionData.strokeWidth !== '';
                        const hasValidStroke = connectionData.stroke && connectionData.stroke !== 'none' && connectionData.stroke !== '';
                        const hasValidStyle = connectionData.style && connectionData.style.trim() !== '';
                        
                        if (!hasValidStrokeWidth) {
                            newConnection.style.setProperty('stroke-width', '2', 'important');
                        }
                        if (!hasValidStroke) {
                            newConnection.style.setProperty('stroke', '#333', 'important');
                        }
                        if (!connectionData.strokeOpacity || connectionData.strokeOpacity === '' || connectionData.strokeOpacity === 'none') {
                            newConnection.style.setProperty('stroke-opacity', '1', 'important');
                        }
                        // Track pasted connection so we can ensure linkage text is updated
                        pastedConnections.push(newConnection);
                    }
                }
            }
        });
        
        // Paste linkage labels for the new connections
        this.clipboard.linkageLabels.forEach(labelData => {
            // Find the new connection that corresponds to this label
            const newConnection = document.querySelector(`[data-linkage-id="${labelData.linkageId}"]`);
            if (newConnection) {
                // If the newer linkage text (config/position) already exists for the
                // connection, skip creating a legacy single label to avoid duplicates.
                const connId = newConnection.getAttribute('id');
                if (connId && this.canvas.querySelector(`text[data-connection-id="${connId}"]`)) {
                    // There are already linkage label(s) for this connection; skip
                    return;
                }

                // Create new legacy-style linkage label and apply restored styles.
                const newLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                const finalX = (labelData.x || 0) + offsetX;
                const finalY = (labelData.y || 0) + offsetY;
                newLabel.setAttribute('x', finalX);
                newLabel.setAttribute('y', finalY);
                newLabel.setAttribute('data-x', finalX);
                newLabel.setAttribute('data-y', finalY);
                newLabel.setAttribute('data-linkage-for', labelData.linkageId);
                newLabel.textContent = labelData.content;

                // Apply saved styling from labelData first
                if (labelData.style) {
                    newLabel.setAttribute('style', labelData.style);
                }
                if (labelData.className) {
                    newLabel.className = labelData.className;
                }

                // Prefer connection-level saved attributes for final appearance if present
                const connTextSize = newConnection.getAttribute('data-text-size') || labelData.fontSize;
                const connTextColor = newConnection.getAttribute('data-text-color') || labelData.fill || labelData.style && (labelData.style.match(/fill:\s*([^;]+);?/) || [])[1];
                const connFontFamily = newConnection.getAttribute('data-text-font-family') || labelData.style && (labelData.style.match(/font-family:\s*([^;]+);?/) || [])[1];
                const connTextOpacity = newConnection.getAttribute('data-text-opacity') || null;
                const connBold = newConnection.getAttribute('data-text-bold');
                const connItalic = newConnection.getAttribute('data-text-italic');
                const connUnderline = newConnection.getAttribute('data-text-underline');

                if (connTextColor) {
                    const normalizedFill = this.normalizeColorToHex(connTextColor);
                    newLabel.style.setProperty('fill', normalizedFill, 'important');
                } else if (labelData.fill) {
                    newLabel.style.setProperty('fill', this.normalizeColorToHex(labelData.fill), 'important');
                }

                if (connTextSize) {
                    // Ensure value ends with px if numeric
                    const sizeStr = String(connTextSize).match(/\d+/) ? `${connTextSize}px` : connTextSize;
                    newLabel.style.setProperty('font-size', sizeStr, 'important');
                } else if (labelData.fontSize) {
                    newLabel.style.setProperty('font-size', labelData.fontSize, 'important');
                }

                if (connFontFamily) {
                    newLabel.style.setProperty('font-family', connFontFamily, 'important');
                }

                if (connTextOpacity) {
                    newLabel.style.setProperty('fill-opacity', connTextOpacity, 'important');
                }

                if (connBold === 'true') {
                    newLabel.style.setProperty('font-weight', 'bold', 'important');
                }
                if (connItalic === 'true') {
                    newLabel.style.setProperty('font-style', 'italic', 'important');
                }
                if (connUnderline === 'true') {
                    newLabel.style.setProperty('text-decoration', 'underline', 'important');
                }

                // Add to canvas
                this.canvas.appendChild(newLabel);
            }
        });

        // Ensure linkage text (config/position) is created for pasted connections
        // Some pasted connections may rely on connection-level data-* attributes
        // to render linkage text; call updateLinkageText to force creation.
        try {
            pastedConnections.forEach(conn => {
                try { this.updateLinkageText(conn); } catch (e) { /* ignore */ }
            });
        } catch (e) {}
        
        // Update the style panel to reflect new selection
        this.updateStylePanel();
        
        // Show paste confirmation
        const totalPasted = pastedSugars.length + pastedTexts.length + this.clipboard.connections.length + this.clipboard.linkageLabels.length;
        if (totalPasted > 0) {
            this.showTemporaryNotification(`已粘贴 ${totalPasted} 个元素 (已选中新元素)`);
        }
        
        // Finish recording the step
        this.finishStep();
    }
    
    // Reset paste counter when user performs other actions
    resetPasteCounter() {
        this.pasteCount = 0;
    }
    
    selectAll() {
        // Clear all existing selections using unified system
        this.clearAllSelections();
        
        // Select all elements using unified system
        const allElements = [
            ...document.querySelectorAll('.sugar'),
            ...document.querySelectorAll('.text-element'),
            ...document.querySelectorAll('.connection')
        ];
        
        allElements.forEach(element => {
            this.selectElement(element, true); // Use multiSelect=true
        });
        
        // Show selection summary using unified system
        const totalSelected = this.selectedElements.size;
        if (totalSelected > 0) {
            const sugars = this.getSelectedElementsByType('sugar').length;
            const texts = this.getSelectedElementsByType('text').length;
            const connections = this.getSelectedElementsByType('connection').length;
            
            console.log(`全选完成: 选中了 ${sugars} 个糖类, ${texts} 个文字, ${connections} 条连接线 (共 ${totalSelected} 个元素)`);
            this.showTemporaryNotification(`已选中 ${totalSelected} 个元素`);
        } else {
            console.log('画布为空，没有可选择的内容');
            this.showTemporaryNotification('画布为空');
        }
        
        this.updateStylePanel();
    }
    
    toggleTextStyle(styleId) {
        const btn = document.getElementById(styleId);
        if (!btn) return;
        
        btn.classList.toggle('active');
        
        // Apply to selected texts or current text being edited
        if (this.isEditingText && this.selectedText) {
            // Start undo step for editing text
            this.startStep('Change text style');
            const beforeData = this.createObjectData(this.selectedText);
            this.applyTextStyleToElement(this.selectedText, styleId, btn.classList.contains('active'));
            const afterData = this.createObjectData(this.selectedText);
            this.recordObjectModified(this.selectedText.getAttribute('id'), beforeData, afterData);
            this.finishStep();
        } else if (this.selectedText || this.selectedTexts.size > 0) {
            this.applySpecificTextStyle(styleId, btn.classList.contains('active'));
        }
    }
    
    applyTextStyleToElement(textElement, styleId, isActive) {
        switch (styleId) {
            case 'boldBtn':
                if (isActive) {
                    textElement.style.setProperty('font-weight', 'bold', 'important');
                } else {
                    textElement.style.removeProperty('font-weight');
                }
                break;
            case 'italicBtn':
                if (isActive) {
                    textElement.style.setProperty('font-style', 'italic', 'important');
                } else {
                    textElement.style.removeProperty('font-style');
                }
                break;
            case 'underlineBtn':
                if (isActive) {
                    textElement.style.setProperty('text-decoration', 'underline', 'important');
                } else {
                    textElement.style.removeProperty('text-decoration');
                }
                break;
        }
    }

    // Remove the duplicate applySpecificTextStyle method and replace with proper undo recording
    applySpecificTextStyle(styleId, isActive) {
        // Get all selected text elements
        const selectedTextElements = [];
        if (this.selectedText) selectedTextElements.push(this.selectedText);
        if (this.selectedTexts.size > 0) {
            this.selectedTexts.forEach(text => {
                if (!selectedTextElements.includes(text)) {
                    selectedTextElements.push(text);
                }
            });
        }
        
        if (selectedTextElements.length === 0) return;
        
        // Start undo recording
        this.startStep('Change text style');
        
        // Apply the specific style to all selected texts
        selectedTextElements.forEach(textElement => {
            const beforeData = this.createObjectData(textElement);
            this.applyTextStyleToElement(textElement, styleId, isActive);
            const afterData = this.createObjectData(textElement);
            this.recordObjectModified(textElement.getAttribute('id'), beforeData, afterData);
        });
        
        // Finish undo recording
        this.finishStep();
    }
    
    toggleSuperscript() {
        // Temporarily disabled: superscript toggling causes inconsistent
        // text transformations and interferes with undo/redo in some cases.
        // The original implementation is kept in version history. To
        // re-enable, restore the original body (call applyTextTransform)
        // or remove this early return.
        return;
    }
    
    toggleSubscript() {
        // Temporarily disabled: subscript toggling causes inconsistent
        // text transformations and interferes with undo/redo in some cases.
        // The original implementation is kept in version history. To
        // re-enable, restore the original body (call applyTextTransform)
        // or remove this early return.
        return;
    }
    
    applyTextTransform(type) {
        const selectedTextElements = [];
        if (this.selectedText) selectedTextElements.push(this.selectedText);
        if (this.selectedTexts.size > 0) {
            this.selectedTexts.forEach(text => {
                if (!selectedTextElements.includes(text)) {
                    selectedTextElements.push(text);
                }
            });
        }
        
        selectedTextElements.forEach(textElement => {
            const currentTransform = textElement.style.verticalAlign;
            
            if (type === 'superscript') {
                if (currentTransform === 'super') {
                    textElement.style.removeProperty('vertical-align');
                    textElement.style.removeProperty('font-size');
                } else {
                    textElement.style.setProperty('vertical-align', 'super', 'important');
                    textElement.style.setProperty('font-size', '0.8em', 'important');
                }
            } else if (type === 'subscript') {
                if (currentTransform === 'sub') {
                    textElement.style.removeProperty('vertical-align');
                    textElement.style.removeProperty('font-size');
                } else {
                    textElement.style.setProperty('vertical-align', 'sub', 'important');
                    textElement.style.setProperty('font-size', '0.8em', 'important');
                }
            }
        });
    }
    
    zoomCanvas(scaleFactor, centerX, centerY) {
        const canvas = this.canvas;
        const rect = canvas.getBoundingClientRect();
        const viewBox = canvas.viewBox.baseVal;
        
        // Calculate zoom
        const newWidth = viewBox.width * scaleFactor;
        const newHeight = viewBox.height * scaleFactor;
        
        // Calculate new viewBox position to zoom towards cursor
        const scaleChange = scaleFactor - 1;
        const newX = viewBox.x - (centerX - rect.left) * scaleChange;
        const newY = viewBox.y - (centerY - rect.top) * scaleChange;
        
        // Apply new viewBox
        canvas.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
    }
    
    // Copy helper methods
    copySugar(originalSugar) {
        const x = parseFloat(originalSugar.getAttribute('data-x'));
        const y = parseFloat(originalSugar.getAttribute('data-y'));
        const shape = originalSugar.getAttribute('data-shape');
        const color = originalSugar.getAttribute('data-color');
        const preset = originalSugar.getAttribute('data-preset');
        
        const config = {
            shape: shape,
            color: color,
            type: preset ? 'preset' : 'custom',
            preset: preset
        };
        
        return this.createSugar(x, y, config, false); // Don't save state during copy
    }
    
    copyText(originalText) {
        const x = parseFloat(originalText.getAttribute('x'));
        const y = parseFloat(originalText.getAttribute('y'));
        const content = originalText.textContent;
        
        const newText = this.createText(x, y, content, false, false); // Don't save state during copy, don't auto-edit
        
        // Copy all styles
        if (originalText.getAttribute('style')) {
            newText.setAttribute('style', originalText.getAttribute('style'));
        }
        
        return newText;
    }
    
    showTemporaryNotification(message, duration = 2000) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.temp-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'temp-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #000000CC;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Fade out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // ===== UNDO/REDO SYSTEM =====
    
    // Start recording a new step
    startStep(description = '') {
        if (this.isRecordingStep) {
            console.warn('Already recording a step, finishing current step first');
            this.finishStep();
        }
        
        this.currentStep = {
            description: description,
            added: [],      // Objects added in this step
            removed: [],    // Objects removed in this step  
            modified: []    // Array of {before, after} for modified objects
        };
        this.isRecordingStep = true;
        // Debug: log when a step begins
        try {
            console.log(`startStep: "${description}" | undoStack=${this.undoStack ? this.undoStack.length : 0} redoStack=${this.redoStack ? this.redoStack.length : 0}`);
        } catch (e) {
            // ignore
        }
    }
    
    // Record an object addition
    recordObjectAdded(objectData) {
        if (!this.isRecordingStep) {
            this.startStep('Auto-created step');
        }
        // Deep-clone objectData to freeze snapshot
        let cloned = null;
        try {
            cloned = JSON.parse(JSON.stringify(objectData));
        } catch (e) {
            cloned = objectData;
        }

        // Add to objectList
        this.objectList.set(cloned.id, cloned);

        // Record in current step (clone)
        this.currentStep.added.push(cloned);
    }
    
    // Record an object removal
    recordObjectRemoved(objectId) {
        if (!this.isRecordingStep) {
            this.startStep('Auto-created step');
        }
        // Get object data before removal
        const objectData = this.objectList.get(objectId);
        if (objectData) {
            // Deep clone to freeze snapshot
            let cloned = null;
            try {
                cloned = JSON.parse(JSON.stringify(objectData));
            } catch (e) {
                cloned = objectData;
            }
            // Record in current step
            this.currentStep.removed.push(cloned);
            
            // Remove from objectList
            this.objectList.delete(objectId);
        }
    }
    
    // Record an object modification
    recordObjectModified(objectId, beforeData, afterData) {
        if (!this.isRecordingStep) {
            this.startStep('Auto-created step');
        }
        // Debug: log key before/after fields for connections (helps trace color/style steps)
        try {
            const beforeSummary = beforeData && beforeData.type === 'connection' ?
                `conn(before) id=${objectId} textColor=${beforeData.textColor} textBold=${beforeData.textBold} textItalic=${beforeData.textItalic} textUnderline=${beforeData.textUnderline} textSize=${beforeData.textSize}` :
                (beforeData ? `obj(before) id=${objectId} type=${beforeData.type}` : `obj(before) id=${objectId} <null>`);
            const afterSummary = afterData && afterData.type === 'connection' ?
                `conn(after) id=${objectId} textColor=${afterData.textColor} textBold=${afterData.textBold} textItalic=${afterData.textItalic} textUnderline=${afterData.textUnderline} textSize=${afterData.textSize}` :
                (afterData ? `obj(after) id=${objectId} type=${afterData.type}` : `obj(after) id=${objectId} <null>`);
            console.log('recordObjectModified:', this.currentStep ? `step="${this.currentStep.description}"` : '', beforeSummary, '->', afterSummary);
            // Additional tracing for puzzling cases where before/after look identical
            if (beforeData && afterData && beforeData.type === 'connection') {
                // Log current objectList state for this id before update
                try {
                    const existing = this.objectList.get(objectId);
                    console.log('recordObjectModified: objectList currently has for', objectId, existing && existing.textColor);
                } catch (e) {}
                // Log if currentStep already contains a modification for this id
                try {
                    if (this.currentStep && Array.isArray(this.currentStep.modified)) {
                        const prior = this.currentStep.modified.find(m => m.id === objectId);
                        if (prior) {
                            console.log('recordObjectModified: WARNING - prior modification recorded in this step for', objectId, prior.before && prior.before.textColor, '->', prior.after && prior.after.textColor);
                        }
                    }
                } catch (e) {}
                // Print a short stack trace to see caller
                try {
                    const stack = (new Error()).stack.split('\n').slice(1,6).join('\n');
                    console.log('recordObjectModified: call stack (top 5):\n', stack);
                } catch (e) {}
            }
        } catch (e) {
            // ignore logging errors
        }

        // Deep-clone before/after to freeze snapshots
        let beforeClone = null;
        let afterClone = null;
        try {
            beforeClone = beforeData ? JSON.parse(JSON.stringify(beforeData)) : beforeData;
        } catch (e) {
            beforeClone = beforeData;
        }
        try {
            afterClone = afterData ? JSON.parse(JSON.stringify(afterData)) : afterData;
        } catch (e) {
            afterClone = afterData;
        }

        // Update objectList with cloned data
        this.objectList.set(objectId, afterClone);

        // If this object was already modified earlier in this step, merge by keeping the original 'before'
        // and updating the 'after' to the latest snapshot. This prevents duplicate modification entries.
        try {
            if (this.currentStep && Array.isArray(this.currentStep.modified)) {
                const existingIndex = this.currentStep.modified.findIndex(m => m.id === objectId);
                if (existingIndex !== -1) {
                    // Preserve original 'before', update 'after'
                    this.currentStep.modified[existingIndex].after = afterClone;
                } else {
                    this.currentStep.modified.push({
                        id: objectId,
                        before: beforeClone,
                        after: afterClone
                    });
                }
            } else {
                // Fallback: push normally
                this.currentStep.modified.push({
                    id: objectId,
                    before: beforeClone,
                    after: afterClone
                });
            }
        } catch (e) {
            // On any error, fall back to pushing the record
            try { this.currentStep.modified.push({ id: objectId, before: beforeClone, after: afterClone }); } catch (e) {}
        }
    }
    
    // Finish recording current step and add to undo stack
    finishStep() {
        if (!this.isRecordingStep || !this.currentStep) {
            return;
        }
        
        // Only save step if it has actual changes
        if (this.currentStep.added.length > 0 || 
            this.currentStep.removed.length > 0 || 
            this.currentStep.modified.length > 0) {
            
            // Debug: log modified entries summary before saving
            try {
                const modSummary = this.currentStep.modified.map(m => ({ id: m.id, beforeTextColor: m.before && m.before.textColor, afterTextColor: m.after && m.after.textColor }));
                console.log('finishStep: modified summary ->', modSummary);
            } catch (e) {}

            // Debug: log modified entries summary before saving
            try {
                const modSummary = this.currentStep.modified.map(m => ({ id: m.id, beforeTextColor: m.before && m.before.textColor, afterTextColor: m.after && m.after.textColor }));
                console.log('finishStep: modified summary ->', modSummary);
            } catch (e) {}

            // Add to undo stack (deep clone step to prevent later mutation)
            try {
                this.undoStack.push(JSON.parse(JSON.stringify(this.currentStep)));
            } catch (e) {
                this.undoStack.push(this.currentStep);
            }

            // Clear redo stack when new action is performed
            this.redoStack = [];
            
            // Limit stack size
            if (this.undoStack.length > this.maxHistorySize) {
                this.undoStack.shift();
            }
            
            console.log('Step recorded:', this.currentStep.description, this.currentStep);
        }
        
        this.currentStep = null;
        this.isRecordingStep = false;
        // Update undo/redo buttons state
        try { this.updateUndoRedoButtons(); } catch (e) {}
    }

    // Update the disabled state of undo/redo buttons
    updateUndoRedoButtons() {
        if (this.undoBtn) this.undoBtn.disabled = this.undoStack.length === 0;
        if (this.redoBtn) this.redoBtn.disabled = this.redoStack.length === 0;
    }
    
    // Create object data from DOM element
    createObjectData(element) {
        const type = this.getElementType(element);
        const id = element.getAttribute('id');
        
        if (type === 'sugar') {
            const shape = element.querySelector('.sugar-shape');
            const polygon = element.querySelector('polygon');
            const line = element.querySelector('line');
            
            return {
                id: id,
                type: 'sugar',
                x: parseFloat(element.getAttribute('data-x')),
                y: parseFloat(element.getAttribute('data-y')),
                shape: element.getAttribute('data-shape'),
                color: element.getAttribute('data-color'),
                size: parseFloat(element.getAttribute('data-size')) || 20,
                preset: element.getAttribute('data-preset'),
                // Store CSS style properties from the shape element (used with !important)
                shapeStyleStroke: shape ? shape.style.stroke : null,
                shapeStyleStrokeWidth: shape ? shape.style.strokeWidth : null,
                shapeStyleStrokeOpacity: shape ? shape.style.strokeOpacity : null,
                shapeStyleStrokeDasharray: shape ? shape.style.strokeDasharray : null,
                shapeStyleFillOpacity: shape ? shape.style.fillOpacity : null,
                // Store CSS style properties for divided shapes (polygon and line)
                polygonStyleStroke: polygon ? polygon.style.stroke : null,
                polygonStyleStrokeWidth: polygon ? polygon.style.strokeWidth : null,
                polygonStyleStrokeOpacity: polygon ? polygon.style.strokeOpacity : null,
                polygonStyleStrokeDasharray: polygon ? polygon.style.strokeDasharray : null,
                lineStyleStroke: line ? line.style.stroke : null,
                lineStyleStrokeWidth: line ? line.style.strokeWidth : null,
                lineStyleStrokeOpacity: line ? line.style.strokeOpacity : null,
                lineStyleStrokeDasharray: line ? line.style.strokeDasharray : null,
                // Store the complete SVG structure
                svg: element.outerHTML
            };
        } else if (type === 'text') {
            return {
                id: id,
                type: 'text',
                x: parseFloat(element.getAttribute('x')),
                y: parseFloat(element.getAttribute('y')),
                content: element.textContent,
                fontSize: element.getAttribute('font-size'),
                fontFamily: element.getAttribute('font-family'),
                fill: element.getAttribute('fill'),
                opacity: element.getAttribute('opacity'),
                fontWeight: element.getAttribute('font-weight'),
                fontStyle: element.getAttribute('font-style'),
                textDecoration: element.getAttribute('text-decoration'),
                // Also store CSS style properties (used with !important)
                styleFontSize: element.style.fontSize,
                styleFontFamily: element.style.fontFamily,
                styleFill: element.style.fill,
                styleFontWeight: element.style.fontWeight,
                styleFontStyle: element.style.fontStyle,
                styleTextDecoration: element.style.textDecoration,
                // Store the complete SVG structure
                svg: element.outerHTML
            };
        } else if (type === 'connection') {
            return {
                id: id,
                type: 'connection',
                x1: parseFloat(element.getAttribute('x1')),
                y1: parseFloat(element.getAttribute('y1')),
                x2: parseFloat(element.getAttribute('x2')),
                y2: parseFloat(element.getAttribute('y2')),
                parentId: element.getAttribute('data-start'),
                childId: element.getAttribute('data-end'),
                strokeWidth: element.getAttribute('stroke-width'),
                stroke: element.getAttribute('stroke'),
                strokeOpacity: element.getAttribute('stroke-opacity'),
                strokeDasharray: element.getAttribute('stroke-dasharray'),
                // Also store CSS style properties (used with !important)
                styleStroke: element.style.stroke,
                styleStrokeWidth: element.style.strokeWidth,
                styleStrokeOpacity: element.style.strokeOpacity,
                styleStrokeDasharray: element.style.strokeDasharray,
                linkage: element.getAttribute('data-linkage'),
                reversed: element.getAttribute('data-reversed') === 'true',
                linkageVisible: element.getAttribute('data-linkage-visible'),
                // Linkage text style properties
                textSize: element.getAttribute('data-text-size'),
                textColor: element.getAttribute('data-text-color'),
                textFontFamily: element.getAttribute('data-text-font-family'),
                // Normalize boolean-style linkage text attributes to explicit 'true'/'false' strings
                textBold: element.getAttribute('data-text-bold') !== null ? element.getAttribute('data-text-bold') : 'false',
                textItalic: element.getAttribute('data-text-italic') !== null ? element.getAttribute('data-text-italic') : 'false',
                textUnderline: element.getAttribute('data-text-underline') !== null ? element.getAttribute('data-text-underline') : 'false',
                textOpacity: element.getAttribute('data-text-opacity'),
                // Store the complete SVG structure
                svg: element.outerHTML
            };
        }
        
        return null;
    }
    
    // Restore object from data to DOM
    restoreObjectFromData(objectData) {
        console.log('restoreObjectFromData called with:', objectData);
        
        // Check if element already exists (for modifications)
        const existingElement = document.getElementById(objectData.id);
        console.log('Existing element found:', existingElement);
        
        if (existingElement) {
            // Update existing element in place
            this.updateElementFromData(existingElement, objectData);
            this.objectList.set(objectData.id, objectData);
            return existingElement;
        } else {
            // Create new element using the normal creation methods
            console.log('Creating new element using creation methods');
            
            let newElement;
            
            if (objectData.type === 'sugar') {
                // Use the normal createSugar method to ensure proper setup
                const config = {
                    shape: objectData.shape,
                    color: objectData.color,
                    size: objectData.size,
                    type: objectData.preset ? 'preset' : 'custom',
                    preset: objectData.preset
                };
                
                // Temporarily store the current count to restore the correct ID
                const originalCount = this.sugarCount;
                const targetNum = parseInt(objectData.id.replace('sugar-', ''));
                this.sugarCount = targetNum - 1; // Will be incremented in createSugar
                
                // Temporarily disable step recording during restoration
                const wasRecording = this.isRecordingStep;
                this.isRecordingStep = false;
                
                newElement = this.createSugar(objectData.x, objectData.y, config);
                
                // Restore recording state
                this.isRecordingStep = wasRecording;
                
                // Restore the count if it was higher
                if (originalCount > this.sugarCount) {
                    this.sugarCount = originalCount;
                }
                
                // CRITICAL: Restore CSS style properties for the newly created sugar
                if (newElement) {
                    const shape = newElement.querySelector('.sugar-shape');
                    if (shape) {
                        if (objectData.shapeStyleStroke) shape.style.setProperty('stroke', objectData.shapeStyleStroke, 'important');
                        if (objectData.shapeStyleStrokeWidth) shape.style.setProperty('stroke-width', objectData.shapeStyleStrokeWidth, 'important');
                        if (objectData.shapeStyleStrokeOpacity) shape.style.setProperty('stroke-opacity', objectData.shapeStyleStrokeOpacity, 'important');
                        if (objectData.shapeStyleStrokeDasharray) shape.style.setProperty('stroke-dasharray', objectData.shapeStyleStrokeDasharray, 'important');
                        if (objectData.shapeStyleFillOpacity) shape.style.setProperty('fill-opacity', objectData.shapeStyleFillOpacity, 'important');
                    }
                    
                    // Restore CSS style properties for divided shapes (polygon and line)
                    const polygon = newElement.querySelector('polygon');
                    if (polygon) {
                        if (objectData.polygonStyleStroke) polygon.style.setProperty('stroke', objectData.polygonStyleStroke, 'important');
                        if (objectData.polygonStyleStrokeWidth) polygon.style.setProperty('stroke-width', objectData.polygonStyleStrokeWidth, 'important');
                        if (objectData.polygonStyleStrokeOpacity) polygon.style.setProperty('stroke-opacity', objectData.polygonStyleStrokeOpacity, 'important');
                        if (objectData.polygonStyleStrokeDasharray) polygon.style.setProperty('stroke-dasharray', objectData.polygonStyleStrokeDasharray, 'important');
                    }
                    
                    const line = newElement.querySelector('line');
                    if (line) {
                        if (objectData.lineStyleStroke) line.style.setProperty('stroke', objectData.lineStyleStroke, 'important');
                        if (objectData.lineStyleStrokeWidth) line.style.setProperty('stroke-width', objectData.lineStyleStrokeWidth, 'important');
                        if (objectData.lineStyleStrokeOpacity) line.style.setProperty('stroke-opacity', objectData.lineStyleStrokeOpacity, 'important');
                        if (objectData.lineStyleStrokeDasharray) line.style.setProperty('stroke-dasharray', objectData.lineStyleStrokeDasharray, 'important');
                    }
                }
                
            } else if (objectData.type === 'text') {
                // Temporarily store the current count to restore the correct ID
                const originalCount = this.textCount;
                const targetNum = parseInt(objectData.id.replace('text-', ''));
                this.textCount = targetNum - 1; // Will be incremented in createText
                
                // Temporarily disable step recording during restoration
                const wasRecording = this.isRecordingStep;
                this.isRecordingStep = false;
                
                // Use the normal createText method with autoEdit=false to prevent editing mode during undo/redo
                newElement = this.createText(objectData.x, objectData.y, objectData.content, false);
                
                // Restore recording state
                this.isRecordingStep = wasRecording;
                
                // Restore the count if it was higher
                if (originalCount > this.textCount) {
                    this.textCount = originalCount;
                }
                
                // CRITICAL: Set the correct ID to match the stored data (should already be correct now)
                if (newElement && objectData.id) {
                    newElement.setAttribute('id', objectData.id);
                }
                
                // Update text attributes
                if (objectData.fontSize) newElement.setAttribute('font-size', objectData.fontSize);
                if (objectData.fontFamily) newElement.setAttribute('font-family', objectData.fontFamily);
                if (objectData.fill) newElement.setAttribute('fill', objectData.fill);
                if (objectData.opacity) newElement.setAttribute('opacity', objectData.opacity);
                if (objectData.fontWeight) newElement.setAttribute('font-weight', objectData.fontWeight);
                if (objectData.fontStyle) newElement.setAttribute('font-style', objectData.fontStyle);
                if (objectData.textDecoration) newElement.setAttribute('text-decoration', objectData.textDecoration);
                
                // CRITICAL: Restore CSS style properties with proper empty handling
                if (objectData.styleFontSize) {
                    newElement.style.setProperty('font-size', objectData.styleFontSize, 'important');
                } else if (objectData.hasOwnProperty('styleFontSize')) {
                    newElement.style.removeProperty('font-size');
                }
                
                if (objectData.styleFontFamily) {
                    newElement.style.setProperty('font-family', objectData.styleFontFamily, 'important');
                } else if (objectData.hasOwnProperty('styleFontFamily')) {
                    newElement.style.removeProperty('font-family');
                }
                
                if (objectData.styleFill) {
                    const normalizedFill = this.normalizeColorToHex(objectData.styleFill);
                    newElement.style.setProperty('fill', normalizedFill, 'important');
                } else if (objectData.hasOwnProperty('styleFill')) {
                    newElement.style.removeProperty('fill');
                }
                
                if (objectData.styleFontWeight) {
                    newElement.style.setProperty('font-weight', objectData.styleFontWeight, 'important');
                } else if (objectData.hasOwnProperty('styleFontWeight')) {
                    newElement.style.removeProperty('font-weight');
                }
                
                if (objectData.styleFontStyle) {
                    newElement.style.setProperty('font-style', objectData.styleFontStyle, 'important');
                } else if (objectData.hasOwnProperty('styleFontStyle')) {
                    newElement.style.removeProperty('font-style');
                }
                
                if (objectData.styleTextDecoration) {
                    newElement.style.setProperty('text-decoration', objectData.styleTextDecoration, 'important');
                } else if (objectData.hasOwnProperty('styleTextDecoration')) {
                    newElement.style.removeProperty('text-decoration');
                }
                
            } else if (objectData.type === 'connection') {
                // For connections, we need to find the actual sugar elements
                const parentSugar = document.getElementById(objectData.parentId);
                const childSugar = document.getElementById(objectData.childId);
                
                if (parentSugar && childSugar) {
                    // Temporarily disable step recording during restoration
                    const wasRecording = this.isRecordingStep;
                    this.isRecordingStep = false;
                    
                    // Use the normal createConnection method
                    newElement = this.createConnection(parentSugar, childSugar, true); // Skip default styling
                    
                    // IMPORTANT: Set the correct ID to match the stored data
                    if (newElement && objectData.id) {
                        newElement.setAttribute('id', objectData.id);
                    }
                    
                    // Restore recording state
                    this.isRecordingStep = wasRecording;
                    
                    // Update connection properties if they exist
                    if (newElement) {
                        if (objectData.strokeWidth) newElement.setAttribute('stroke-width', objectData.strokeWidth);
                        if (objectData.stroke) newElement.setAttribute('stroke', objectData.stroke);
                        if (objectData.strokeOpacity) newElement.setAttribute('stroke-opacity', objectData.strokeOpacity);
                        if (objectData.strokeDasharray) newElement.setAttribute('stroke-dasharray', objectData.strokeDasharray);
                        
                        // Restore CSS style properties (used with !important)
                        if (objectData.styleStroke) newElement.style.setProperty('stroke', objectData.styleStroke, 'important');
                        if (objectData.styleStrokeWidth) newElement.style.setProperty('stroke-width', objectData.styleStrokeWidth, 'important');
                        if (objectData.styleStrokeOpacity) newElement.style.setProperty('stroke-opacity', objectData.styleStrokeOpacity, 'important');
                        if (objectData.styleStrokeDasharray) newElement.style.setProperty('stroke-dasharray', objectData.styleStrokeDasharray, 'important');
                        
                        if (objectData.linkage) newElement.setAttribute('data-linkage', objectData.linkage);
                        if (objectData.reversed !== undefined) newElement.setAttribute('data-reversed', objectData.reversed.toString());
                        // IMPORTANT: Set linkage visibility BEFORE updating linkage text
                        if (objectData.linkageVisible !== null && objectData.linkageVisible !== undefined) {
                            newElement.setAttribute('data-linkage-visible', objectData.linkageVisible);
                        }
                        
                        // Update linkage text display based on the restored visibility setting
                        this.updateLinkageText(newElement);
                    }
                } else {
                    console.error('Cannot restore connection: parent or child sugar not found', objectData.parentId, objectData.childId);
                    return null;
                }
            }
            
            console.log('New element created:', newElement);
            
            // Update objectList
            this.objectList.set(objectData.id, objectData);
            
            // Handle post-restoration updates based on type
            if (objectData.type === 'sugar') {
                // Update counters if needed
                const sugarNum = parseInt(objectData.id.replace('sugar-', ''));
                if (sugarNum >= this.sugarCount) {
                    this.sugarCount = sugarNum;
                }
            } else if (objectData.type === 'text') {
                // Update counters if needed  
                const textNum = parseInt(objectData.id.replace('text-', ''));
                if (textNum >= this.textCount) {
                    this.textCount = textNum;
                }
            }
            
            return newElement;
            
            // Handle post-restoration updates based on type
            if (objectData.type === 'sugar') {
                // Update counters if needed
                const sugarNum = parseInt(objectData.id.replace('sugar-', ''));
                if (sugarNum >= this.sugarCount) {
                    this.sugarCount = sugarNum;
                }
            } else if (objectData.type === 'text') {
                // Update counters if needed  
                const textNum = parseInt(objectData.id.replace('text-', ''));
                if (textNum >= this.textCount) {
                    this.textCount = textNum;
                }
            }
            
            return importedElement;
        }
    }
    
    // Update existing element from object data
    updateElementFromData(element, objectData) {
        if (objectData.type === 'sugar') {
            // Get current position before updating
            const oldX = parseFloat(element.getAttribute('data-x'));
            const oldY = parseFloat(element.getAttribute('data-y'));
            
            // Update sugar position and attributes
            element.setAttribute('data-x', objectData.x);
            element.setAttribute('data-y', objectData.y);
            element.setAttribute('data-shape', objectData.shape);
            element.setAttribute('data-color', objectData.color);
            element.setAttribute('data-size', objectData.size);
            if (objectData.preset) {
                element.setAttribute('data-preset', objectData.preset);
            } else {
                element.removeAttribute('data-preset');
            }
            
            // Update the visual shape to match the new attributes
            const shape = element.querySelector('.sugar-shape');
            if (shape) {
                this.updateShapeToType(shape, objectData.shape, objectData.x, objectData.y, objectData.color, objectData.size);
            }
            
            // CRITICAL: Restore CSS style properties for the shape (used with !important)
            if (shape) {
                if (objectData.shapeStyleStroke) shape.style.setProperty('stroke', objectData.shapeStyleStroke, 'important');
                if (objectData.shapeStyleStrokeWidth) shape.style.setProperty('stroke-width', objectData.shapeStyleStrokeWidth, 'important');
                if (objectData.shapeStyleStrokeOpacity) shape.style.setProperty('stroke-opacity', objectData.shapeStyleStrokeOpacity, 'important');
                if (objectData.shapeStyleStrokeDasharray) shape.style.setProperty('stroke-dasharray', objectData.shapeStyleStrokeDasharray, 'important');
                if (objectData.shapeStyleFillOpacity) shape.style.setProperty('fill-opacity', objectData.shapeStyleFillOpacity, 'important');
            }
            
            // CRITICAL: Restore CSS style properties for divided shapes (polygon and line)
            const polygon = element.querySelector('polygon');
            if (polygon) {
                if (objectData.polygonStyleStroke) polygon.style.setProperty('stroke', objectData.polygonStyleStroke, 'important');
                if (objectData.polygonStyleStrokeWidth) polygon.style.setProperty('stroke-width', objectData.polygonStyleStrokeWidth, 'important');
                if (objectData.polygonStyleStrokeOpacity) polygon.style.setProperty('stroke-opacity', objectData.polygonStyleStrokeOpacity, 'important');
                if (objectData.polygonStyleStrokeDasharray) polygon.style.setProperty('stroke-dasharray', objectData.polygonStyleStrokeDasharray, 'important');
            }
            
            const line = element.querySelector('line');
            if (line) {
                if (objectData.lineStyleStroke) line.style.setProperty('stroke', objectData.lineStyleStroke, 'important');
                if (objectData.lineStyleStrokeWidth) line.style.setProperty('stroke-width', objectData.lineStyleStrokeWidth, 'important');
                if (objectData.lineStyleStrokeOpacity) line.style.setProperty('stroke-opacity', objectData.lineStyleStrokeOpacity, 'important');
                if (objectData.lineStyleStrokeDasharray) line.style.setProperty('stroke-dasharray', objectData.lineStyleStrokeDasharray, 'important');
            }
            
            // Update connected lines with correct old and new positions
            this.updateConnectedLines(element, oldX, oldY, objectData.x, objectData.y);
            
        } else if (objectData.type === 'text') {
            // Update text position and content
            element.setAttribute('x', objectData.x);
            element.setAttribute('y', objectData.y);
            element.setAttribute('data-x', objectData.x);
            element.setAttribute('data-y', objectData.y);
            element.textContent = objectData.content;
            
            // Update text styles (attributes)
            if (objectData.fontSize) element.setAttribute('font-size', objectData.fontSize);
            if (objectData.fontFamily) element.setAttribute('font-family', objectData.fontFamily);
            if (objectData.fill) element.setAttribute('fill', objectData.fill);
            if (objectData.opacity) element.setAttribute('opacity', objectData.opacity);
            if (objectData.fontWeight) element.setAttribute('font-weight', objectData.fontWeight);
            if (objectData.fontStyle) element.setAttribute('font-style', objectData.fontStyle);
            if (objectData.textDecoration) element.setAttribute('text-decoration', objectData.textDecoration);
            
            // CRITICAL: Also restore CSS style properties (used with !important)
            if (objectData.styleFontSize) {
                element.style.setProperty('font-size', objectData.styleFontSize, 'important');
            } else if (objectData.hasOwnProperty('styleFontSize')) {
                element.style.removeProperty('font-size');
            }
            
            if (objectData.styleFontFamily) {
                element.style.setProperty('font-family', objectData.styleFontFamily, 'important');
            } else if (objectData.hasOwnProperty('styleFontFamily')) {
                element.style.removeProperty('font-family');
            }
            
            if (objectData.styleFill) {
                const normalizedFill = this.normalizeColorToHex(objectData.styleFill);
                element.style.setProperty('fill', normalizedFill, 'important');
            } else if (objectData.hasOwnProperty('styleFill')) {
                element.style.removeProperty('fill');
            }
            
            if (objectData.styleFontWeight) {
                element.style.setProperty('font-weight', objectData.styleFontWeight, 'important');
            } else if (objectData.hasOwnProperty('styleFontWeight')) {
                element.style.removeProperty('font-weight');
            }
            
            if (objectData.styleFontStyle) {
                element.style.setProperty('font-style', objectData.styleFontStyle, 'important');
            } else if (objectData.hasOwnProperty('styleFontStyle')) {
                element.style.removeProperty('font-style');
            }
            
            if (objectData.styleTextDecoration) {
                element.style.setProperty('text-decoration', objectData.styleTextDecoration, 'important');
            } else if (objectData.hasOwnProperty('styleTextDecoration')) {
                element.style.removeProperty('text-decoration');
            }
            
        } else if (objectData.type === 'connection') {
            // Update connection position and attributes
            element.setAttribute('x1', objectData.x1);
            element.setAttribute('y1', objectData.y1);
            element.setAttribute('x2', objectData.x2);
            element.setAttribute('y2', objectData.y2);
            element.setAttribute('data-parent', objectData.parentId);
            element.setAttribute('data-child', objectData.childId);
            
            // Update connection styles (attributes)
            if (objectData.strokeWidth) element.setAttribute('stroke-width', objectData.strokeWidth);
            if (objectData.stroke) element.setAttribute('stroke', objectData.stroke);
            if (objectData.strokeOpacity) element.setAttribute('stroke-opacity', objectData.strokeOpacity);
            if (objectData.strokeDasharray) element.setAttribute('stroke-dasharray', objectData.strokeDasharray);
            
            // CRITICAL: Also restore CSS style properties (used with !important)
            if (objectData.styleStroke) element.style.setProperty('stroke', objectData.styleStroke, 'important');
            if (objectData.styleStrokeWidth) element.style.setProperty('stroke-width', objectData.styleStrokeWidth, 'important');
            if (objectData.styleStrokeOpacity) element.style.setProperty('stroke-opacity', objectData.styleStrokeOpacity, 'important');
            if (objectData.styleStrokeDasharray) {
                element.style.setProperty('stroke-dasharray', objectData.styleStrokeDasharray, 'important');
            } else if (objectData.hasOwnProperty('styleStrokeDasharray')) {
                element.style.removeProperty('stroke-dasharray');
            }
            
            if (objectData.linkage) element.setAttribute('data-linkage', objectData.linkage);
            element.setAttribute('data-reversed', objectData.reversed ? 'true' : 'false');
            if (objectData.linkageVisible !== null && objectData.linkageVisible !== undefined) {
                element.setAttribute('data-linkage-visible', objectData.linkageVisible);
            }
            
            // Restore linkage text style attributes (handle explicit false/null and removal)
            if (objectData.textSize !== null && objectData.textSize !== undefined) {
                element.setAttribute('data-text-size', objectData.textSize);
            } else {
                element.removeAttribute('data-text-size');
            }
            if (objectData.textColor !== null && objectData.textColor !== undefined) {
                element.setAttribute('data-text-color', objectData.textColor);
            } else {
                element.removeAttribute('data-text-color');
            }
            if (objectData.textFontFamily !== null && objectData.textFontFamily !== undefined) {
                element.setAttribute('data-text-font-family', objectData.textFontFamily);
            } else {
                element.removeAttribute('data-text-font-family');
            }
            if (objectData.textBold !== null && objectData.textBold !== undefined) {
                element.setAttribute('data-text-bold', objectData.textBold);
            } else {
                element.removeAttribute('data-text-bold');
            }
            if (objectData.textItalic !== null && objectData.textItalic !== undefined) {
                element.setAttribute('data-text-italic', objectData.textItalic);
            } else {
                element.removeAttribute('data-text-italic');
            }
            if (objectData.textUnderline !== null && objectData.textUnderline !== undefined) {
                element.setAttribute('data-text-underline', objectData.textUnderline);
            } else {
                element.removeAttribute('data-text-underline');
            }
            if (objectData.textOpacity !== null && objectData.textOpacity !== undefined) {
                element.setAttribute('data-text-opacity', objectData.textOpacity);
            } else {
                element.removeAttribute('data-text-opacity');
            }

            // Update linkage text display after restoring attributes so visual <text> elements reflect restored values
            this.updateLinkageText(element);

            // If this connection is currently selected, ensure the linkage controls/buttons sync to the restored data
            try {
                if (this.selectedConnections && this.selectedConnections.has(element)) {
                    this.updateLinkageControlsFromSelection();
                }
            } catch (e) {
                // ignore UI sync errors
            }
        }
    }
    
    // Remove object from DOM
    removeObjectFromDOM(objectId) {
        const element = document.getElementById(objectId);
        if (element) {
        // If removing a connection, also remove its linkage text elements
        if (element.tagName.toLowerCase() === 'line' && 
            ((element.getAttribute('data-parent') && element.getAttribute('data-child')) ||
             (element.getAttribute('data-start') && element.getAttribute('data-end')))) {
            // Remove linkage text for this specific connection
            const linkageTexts = this.canvas.querySelectorAll(`text[data-connection-id="${objectId}"]`);
            linkageTexts.forEach(text => text.remove());
            
            // Also clean up any orphaned linkage text (text elements with linkage-label class that reference non-existent connections)
            const allLinkageTexts = this.canvas.querySelectorAll('text.linkage-label');
            allLinkageTexts.forEach(text => {
                const connId = text.getAttribute('data-connection-id');
                if (connId && !document.getElementById(connId)) {
                    text.remove();
                }
            });
        }            element.remove();
        }
        
        // Also remove any related elements (highlights, etc.)
        const highlights = this.canvas.querySelectorAll(`[id*="${objectId}"]`);
        highlights.forEach(highlight => {
            if (highlight.id !== objectId) {
                highlight.remove();
            }
        });
        
        this.objectList.delete(objectId);
    }
    
    // Undo last step
    undo() {
        if (this.undoStack.length === 0) {
            console.log('Nothing to undo');
            return;
        }
        
        // Finish any current step first
        if (this.isRecordingStep) {
            this.finishStep();
        }
        
        const step = this.undoStack.pop();
        console.log('Undoing step:', step.description, step);
        console.log('Step details - added:', step.added.length, 'removed:', step.removed.length, 'modified:', step.modified.length);
        try {
            const modSummary = step.modified.map(m => ({ id: m.id, beforeTextColor: m.before && m.before.textColor, afterTextColor: m.after && m.after.textColor }));
            console.log('Undo step modified summary ->', modSummary);
        } catch (e) {}
        
    // Preserve current selection so we can restore it after undo
    const previouslySelectedIds = Array.from(this.selectedElements || []).map(el => el.getAttribute ? el.getAttribute('id') : null).filter(id => id);
    // Clear all selections to avoid issues while restoring
    this.clearAllSelections();
        
        // Process removals (re-add removed objects) - sort by dependency order
        // Sugars must be restored before connections that depend on them
        const sortedRemoved = step.removed.sort((a, b) => {
            // Sugars first (type === 'sugar')
            if (a.type === 'sugar' && b.type !== 'sugar') return -1;
            if (a.type !== 'sugar' && b.type === 'sugar') return 1;
            // Then connections (type === 'connection') 
            if (a.type === 'connection' && b.type !== 'connection') return -1;
            if (a.type !== 'connection' && b.type === 'connection') return 1;
            // Text elements last
            return 0;
        });
        
        sortedRemoved.forEach(objectData => {
            this.restoreObjectFromData(objectData);
        });
        
        // Process modifications (revert to before state)
        step.modified.forEach(modification => {
            // For modifications, just update the existing element in place
            this.restoreObjectFromData(modification.before);
        });
        
        // Process additions (remove added objects)
        step.added.forEach(objectData => {
            this.removeObjectFromDOM(objectData.id);
        });
        
        // Add step to redo stack
        this.redoStack.push(step);
        
    // Update UI
        this.updateStylePanel();
        console.log('undo: Setting isUpdatingUI = true before updateRightPanel');
        this.isUpdatingUI = true;
        this.updateRightPanel();
        this.isUpdatingUI = false;
        console.log('undo: Setting isUpdatingUI = false after updateRightPanel');

        // Restore previous selection (if those elements still exist) so UI controls reflect restored object states
        if (previouslySelectedIds && previouslySelectedIds.length > 0) {
            previouslySelectedIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    try {
                        // Re-select element without clearing others
                        this.selectElement(el, true);
                    } catch (e) {
                        // Fallback: directly add to selectedElements if selectElement fails
                        if (!this.selectedElements) this.selectedElements = new Set();
                        this.selectedElements.add(el);
                    }
                }
            });

            // Ensure legacy selection sets are in sync (so selectedConnections is populated)
            try {
                if (typeof this.updateLegacySelectionStates === 'function') {
                    this.updateLegacySelectionStates();
                }
            } catch (e) {
                // ignore
            }

            // If any selected connections exist, refresh linkage controls so buttons/checkboxes match restored attributes
            if (this.selectedConnections && this.selectedConnections.size > 0) {
                try {
                    this.updateLinkageControlsFromSelection();
                } catch (e) {
                    // Fallback to general right panel update
                    this.updateRightPanel();
                }
            } else {
                // Ensure right panel syncs if selection contains other element types
                this.updateRightPanel();
            }
        }
        
        // Update undo/redo button states
        try { this.updateUndoRedoButtons(); } catch (e) {}

        console.log('Undo completed');
    }
    
    // Redo last undone step
    redo() {
        if (this.redoStack.length === 0) {
            console.log('Nothing to redo');
            return;
        }
        
        // Finish any current step first
        if (this.isRecordingStep) {
            this.finishStep();
        }
        
        const step = this.redoStack.pop();
        if (!step) {
            console.error('Invalid step in redo stack:', step);
            return;
        }
        
        console.log('Redoing step:', step.description, step);
        console.log('Step details - added:', step.added.length, 'removed:', step.removed.length, 'modified:', step.modified.length);
        try {
            const modSummary = step.modified.map(m => ({ id: m.id, beforeTextColor: m.before && m.before.textColor, afterTextColor: m.after && m.after.textColor }));
            console.log('Redo step modified summary ->', modSummary);
        } catch (e) {}
        
        // Clear all selections to avoid issues
        this.clearAllSelections();
        
        // Process additions (re-add added objects) - sort by dependency order
        // Sugars must be restored before connections that depend on them
        const sortedAdded = step.added.sort((a, b) => {
            // Sugars first (type === 'sugar')
            if (a.type === 'sugar' && b.type !== 'sugar') return -1;
            if (a.type !== 'sugar' && b.type === 'sugar') return 1;
            // Then connections (type === 'connection') 
            if (a.type === 'connection' && b.type !== 'connection') return -1;
            if (a.type !== 'connection' && b.type === 'connection') return 1;
            // Text elements last
            return 0;
        });
        
        sortedAdded.forEach(objectData => {
            console.log('Redoing addition of:', objectData);
            const restored = this.restoreObjectFromData(objectData);
            console.log('Restored element:', restored);
        });
        
        // Process modifications (revert to after state)
        step.modified.forEach(modification => {
            // For modifications, just update the existing element in place
            this.restoreObjectFromData(modification.after);
        });
        
        // Process removals (remove objects again)
        step.removed.forEach(objectData => {
            this.removeObjectFromDOM(objectData.id);
        });
        
        // Add step back to undo stack
        this.undoStack.push(step);
        
        // Update UI
        this.updateStylePanel();
        console.log('redo: Setting isUpdatingUI = true before updateRightPanel');
        this.isUpdatingUI = true;
        this.updateRightPanel();
        this.isUpdatingUI = false;
        console.log('redo: Setting isUpdatingUI = false after updateRightPanel');
        
        // Update undo/redo button states
        try { this.updateUndoRedoButtons(); } catch (e) {}

        console.log('Redo completed');
    }
    
    // Initialize objectList with existing canvas objects
    initializeObjectList() {
        this.objectList.clear();
        
        // Add all existing sugars
        const sugars = this.canvas.querySelectorAll('.sugar');
        sugars.forEach(sugar => {
            const objectData = this.createObjectData(sugar);
            if (objectData) {
                this.objectList.set(objectData.id, objectData);
            }
        });
        
        // Add all existing texts
        const texts = this.canvas.querySelectorAll('.text-element');
        texts.forEach(text => {
            const objectData = this.createObjectData(text);
            if (objectData) {
                this.objectList.set(objectData.id, objectData);
            }
        });
        
        // Add all existing connections
        const connections = this.canvas.querySelectorAll('.connection');
        connections.forEach(connection => {
            const objectData = this.createObjectData(connection);
            if (objectData) {
                this.objectList.set(objectData.id, objectData);
            }
        });
        
        console.log('Object list initialized with', this.objectList.size, 'objects');
    }
    



}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.glycanApp = new GlycanDrawer();
});