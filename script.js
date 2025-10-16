class GlycanDrawer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        this.sugarCount = 0;
        this.textCount = 0;
        this.sugarRadius = 20;
        this.connectionDistance = 80;
        
        // Tool states
        this.currentTool = 'add';
        this.currentSugarConfig = {
            type: 'custom',
            shape: 'circle',
            color: '#3498db',
            size: 20,
            borderWidth: 2,
            borderColor: '#333333',
            preset: null
        };
        
        this.currentTextConfig = {
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            color: '#000000',
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
        
        // UI update flag to prevent style application during UI updates
        this.isUpdatingUI = false;
        
        // Undo/Redo system
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50; // Maximum number of undo steps
        
        // Eraser states for continuous deletion
        this.isErasing = false;
        this.eraserTimer = null;
        this.eraserDelay = 100; // 100ms delay between continuous deletions
        this.isDraggingMultiple = false;
        this.isDraggingMultipleTexts = false;
        
        // Keyboard state tracking
        this.isCtrlPressed = false;
        this.isShiftPressed = false;
        this.clipboard = {
            sugars: [],
            texts: [],
            connections: []
        };
        
        // SNFG Presets Configuration
        this.snfgPresets = {
            'glc': { shape: 'circle', color: '#3498db', name: 'Glucose' },
            'gal': { shape: 'circle', color: '#e74c3c', name: 'Galactose' },
            'man': { shape: 'circle', color: '#2ecc71', name: 'Mannose' },
            'fuc': { shape: 'diamond', color: '#f39c12', name: 'Fucose' },
            'xyl': { shape: 'triangle', color: '#9b59b6', name: 'Xylose' },
            'glcnac': { shape: 'square', color: '#3498db', name: 'GlcNAc' }
        };
        
        // 8 directional positions around a sugar (N, NE, E, SE, S, SW, W, NW)
        this.directions = [
            { name: 'N', dx: 0, dy: -1 },
            { name: 'NE', dx: 0.707, dy: -0.707 },
            { name: 'E', dx: 1, dy: 0 },
            { name: 'SE', dx: 0.707, dy: 0.707 },
            { name: 'S', dx: 0, dy: 1 },
            { name: 'SW', dx: -0.707, dy: 0.707 },
            { name: 'W', dx: -1, dy: 0 },
            { name: 'NW', dx: -0.707, dy: -0.707 }
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
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Setup global drag event listeners (will be added/removed as needed)
        this.globalDragMouseMove = (e) => this.handleGlobalDragMove(e);
        this.globalDragMouseUp = (e) => this.handleGlobalDragUp(e);
        
        // Add action button listeners
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        
        // Add export option listeners
        const exportOptions = document.querySelectorAll('.export-option');
        exportOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.target.getAttribute('data-format');
                this.exportCanvas(format);
            });
        });
        
        // Add canvas size control listener
        const canvasSizeSelect = document.getElementById('canvasSizeSelect');
        if (canvasSizeSelect) {
            canvasSizeSelect.addEventListener('change', (e) => this.changeCanvasSize(e.target.value));
        }
        
        // Set default tool
        this.setTool('add');
        
        // Initialize style panels (should be hidden by default)
        this.updateStylePanel();
        
        // Initialize left panel visibility
        this.updateLeftPanel();
        
        // Initialize undo/redo button states
        this.updateUndoRedoButtons();
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
                const preset = item.dataset.preset;
                this.selectPreset(preset);
            });
        });
    }
    
    setupCustomization() {
        // Shape and color buttons are now handled in setupStyleControls()
        // This prevents double event listeners
        
        // Custom color input
        const customColorInput = document.getElementById('customColorInput');
        const applyCustomColorBtn = document.getElementById('applyCustomColor');
        
        applyCustomColorBtn.addEventListener('click', () => {
            const color = customColorInput.value;
            if (this.isValidHexColor(color)) {
                this.selectColor(color);
                customColorInput.value = '';
            } else {
                alert('请输入有效的十六进制颜色代码（如：#FF0000）');
            }
        });
        
        customColorInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyCustomColorBtn.click();
            }
        });
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
                this.applySugarSize();
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
                this.applySugarBorderWidth();
            }
        });
        
        borderStyleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                borderStyleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applySugarBorderStyle();
            });
        });
        
        // Connection line style controls
        const connectionWidth = document.getElementById('connectionWidth');
        const connectionWidthValue = document.getElementById('connectionWidthValue');
        const connectionStyleButtons = document.querySelectorAll('.connection-style-btn');
        
        connectionWidth.addEventListener('input', (e) => {
            const value = e.target.value;
            connectionWidthValue.textContent = value;
            this.applyConnectionStyle();
        });
        
        connectionStyleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                connectionStyleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applyConnectionStyle();
            });
        });
        
        // Text style controls
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const fontFamily = document.getElementById('fontFamily');
        const textColor = document.getElementById('textColor');
        const textColorHex = document.getElementById('textColorHex');
        const textStyleButtons = document.querySelectorAll('.text-style-btn');
        
        // Font size control
        fontSize.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            fontSizeValue.textContent = value;
            
            if (this.currentTool === 'text') {
                // 文本工具模式：只更新配置，不应用到任何元素
                this.currentTextConfig.fontSize = value;
            } else if (this.currentTool === 'select') {
                // 选择模式：只应用到选中元素，不更新配置
                this.applyFontSize(value);
            }
        });
        
        // Font family control
        fontFamily.addEventListener('change', (e) => {
            const value = e.target.value;
            
            if (this.currentTool === 'text') {
                // 文本工具模式：只更新配置，不应用到任何元素
                this.currentTextConfig.fontFamily = value;
            } else if (this.currentTool === 'select') {
                // 选择模式：只应用到选中元素，不更新配置
                this.applyFontFamily(value);
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
                // 选择模式：只应用到选中元素，不更新配置
                this.applyTextColor(color);
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
                    // 选择模式：只应用到选中元素，不更新配置
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
                    if (btn.id === 'bold') {
                        this.currentTextConfig.bold = isActive;
                    } else if (btn.id === 'italic') {
                        this.currentTextConfig.italic = isActive;
                    } else if (btn.id === 'underline') {
                        this.currentTextConfig.underline = isActive;
                    }
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applySpecificTextStyle(btn.id, isActive);
                }
            });
        });
        
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
            this.applyConnectionStyle();
        });
        
        connectionColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                connectionColor.value = color;
                this.applyConnectionStyle();
            }
        });
        
        // Shape selection buttons
        const shapeButtons = document.querySelectorAll('.shape-btn');
        shapeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Only activate one shape at a time
                shapeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update configuration for add mode or apply to selected sugars
                if (this.currentTool === 'add') {
                    if (!this.currentSugarConfig) {
                        this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#3498db' };
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
                // Only activate one color at a time
                colorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update configuration for add mode or apply to selected sugars
                if (this.currentTool === 'add') {
                    if (!this.currentSugarConfig) {
                        this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#3498db' };
                    }
                    this.currentSugarConfig.color = btn.dataset.color;
                    this.currentSugarConfig.type = 'custom';
                    this.currentSugarConfig.preset = null;
                } else if (this.currentTool === 'select') {
                    this.applySugarColor(btn.dataset.color);
                }
            });
        });
        
        // Custom color picker
        const customColorPicker = document.getElementById('customColor');
        if (customColorPicker) {
            customColorPicker.addEventListener('input', (e) => {
                // Deactivate preset color buttons
                colorButtons.forEach(b => b.classList.remove('active'));
                
                // Update configuration for add mode or apply to selected sugars
                if (this.currentTool === 'add') {
                    if (!this.currentSugarConfig) {
                        this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#3498db' };
                    }
                    this.currentSugarConfig.color = e.target.value;
                    this.currentSugarConfig.type = 'custom';
                    this.currentSugarConfig.preset = null;
                } else if (this.currentTool === 'select') {
                    this.applySugarColor(e.target.value);
                }
            });
        }
    }
    
    setTool(tool) {
        // Don't switch tools if currently editing text (let the edit finish first)
        if (this.isEditingText && this.currentTool !== tool) {
            return;
        }
        
        this.currentTool = tool;
        
        // If switching away from select tool, deselect any selected elements
        if (tool !== 'select') {
            this.deselectAll();
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
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#3498db' };
            }
            
            // Only update type, preset, shape, and color - keep other settings
            this.currentSugarConfig.type = 'preset';
            this.currentSugarConfig.preset = preset;
            this.currentSugarConfig.shape = this.snfgPresets[preset].shape;
            this.currentSugarConfig.color = this.snfgPresets[preset].color;
            
            // Update preset button states
            document.querySelectorAll('.preset-item').forEach(item => {
                item.classList.toggle('active', item.dataset.preset === preset);
            });
            
            // Clear custom selections
            document.querySelectorAll('.shape-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.color-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // If in select mode, only apply shape and color from preset (not size/border)
            if (this.currentTool === 'select') {
                const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
                if (selectedSugars.length > 0) {
                    this.applySugarShape(this.snfgPresets[preset].shape);
                    this.applySugarColor(this.snfgPresets[preset].color);
                }
            } else {
                // In add mode, apply full preset configuration
                this.setTool('add');
            }
        }
    }
    
    selectShape(shape) {
        // This method is kept for compatibility but shape selection is now handled in setupStyleControls
        console.warn('selectShape called - this should now be handled by button event listeners');
    }
    
    selectColor(color) {
        // This method is kept for compatibility but color selection is now handled in setupStyleControls  
        console.warn('selectColor called - this should now be handled by button event listeners');
    }
    
    isValidHexColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }
    
    updateCanvasCursor() {
        this.canvas.className = '';
        if (this.currentTool === 'select') {
            this.canvas.classList.add('select-mode');
        } else if (this.currentTool === 'delete') {
            this.canvas.classList.add('delete-mode');
        } else if (this.currentTool === 'text') {
            this.canvas.classList.add('text-mode');
        }
        // Default cursor (crosshair) for add mode
    }
    
    // Helper method to get SVG coordinates
    getSVGCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleMouseDown(e) {
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        // Store modifier keys state for dragging
        this.dragWithCtrl = e.ctrlKey;
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
        } else if (this.currentTool === 'add') {
            this.resetPasteCounter();
            if (clickedSugar) {
                // Start long press detection for connection dragging
                this.startLongPress(clickedSugar, e);
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
            } else {
                this.connectionTargetSugar = null;
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
                this.createConnection(this.connectionStartSugar, this.connectionTargetSugar);
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
        if (this.isDragging && this.dragWithCtrl && this.currentTool === 'select') {
            this.saveState(); // Save state before copying
            
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
            element.removeAttribute('data-initial-x');
            element.removeAttribute('data-initial-y');
            element.classList.remove('dragging');
        });
        
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
            if (clickedSugar) {
                // Add sugar connected to existing sugar
                this.addConnectedSugar(clickedSugar, x, y);
            } else {
                // Place sugar on empty canvas
                this.createSugar(x, y, this.currentSugarConfig);
            }
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
                this.createText(x, y, 'Text');
            }
        } else if (this.currentTool === 'delete') {
            if (clickedSugar) {
                this.deleteSugar(clickedSugar);
            } else if (clickedText) {
                this.deleteText(clickedText);
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
                const childSugar = this.createSugar(altPosition.x, altPosition.y, sugarConfig);
                this.createConnection(parentSugar, childSugar);
            }
        } else {
            const childSugar = this.createSugar(newX, newY, sugarConfig);
            this.createConnection(parentSugar, childSugar);
        }
    }
    
    findBestDirection(parentX, parentY, clickX, clickY) {
        const dx = clickX - parentX;
        const dy = clickY - parentY;
        
        // Normalize the direction vector
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return this.directions[4]; // Default to South
        
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
    
    createSugar(x, y, config, saveState = true) {
        // Save state before creating sugar (unless explicitly disabled)
        if (saveState) {
            this.saveState();
        }
        
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
        const shape = this.createSugarShape(x, y, config.shape, config.color, size);
        shape.classList.add('sugar-shape');
        
        // Apply border settings from config
        if (config.borderWidth) {
            shape.style.setProperty('stroke-width', config.borderWidth, 'important');
        }
        if (config.borderColor) {
            shape.style.setProperty('stroke', config.borderColor, 'important');
        }
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
        
        sugarGroup.appendChild(shape);
        
        // Add to canvas
        this.canvas.appendChild(sugarGroup);
        
        return sugarGroup;
    }
    
    createSugarShape(x, y, shape, color, size = null) {
        const actualSize = size !== null ? size : this.sugarRadius;
        const strokeColor = '#000000'; // Default black border
        
        let element;
        
        switch (shape) {
            case 'circle':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                element.setAttribute('cx', x);
                element.setAttribute('cy', y);
                element.setAttribute('r', actualSize);
                break;
                
            case 'square':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', x - actualSize);
                element.setAttribute('y', y - actualSize);
                element.setAttribute('width', actualSize * 2);
                element.setAttribute('height', actualSize * 2);
                break;
                
            case 'triangle':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const triPoints = `${x},${y-actualSize} ${x+actualSize*0.866},${y+actualSize*0.5} ${x-actualSize*0.866},${y+actualSize*0.5}`;
                element.setAttribute('points', triPoints);
                break;
                
            case 'diamond':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                element.setAttribute('points', diamondPoints);
                break;
                
            case 'star':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const starPoints = this.generateStarPoints(x, y, actualSize, 5);
                element.setAttribute('points', starPoints);
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
                
            default:
                return this.createSugarShape(x, y, 'circle', color);
        }
        
        // Set fill and stroke
        element.setAttribute('fill', color);
        element.setAttribute('stroke', strokeColor);
        element.setAttribute('stroke-width', '2');
        
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
    
    generateStarPoints(centerX, centerY, radius, points) {
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        const pointsArray = [];
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI * i / points) - Math.PI / 2;
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
        highlight.setAttribute('stroke', '#3498db');
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
        highlight.setAttribute('fill', 'rgba(52, 152, 219, 0.2)');
        highlight.setAttribute('stroke', '#3498db');
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
        this.updateShapePosition(shape, shapeType, newX, newY);
        
        // Update selection highlight position directly without recreating
        if (sugar.classList.contains('selected') || this.selectedSugars.has(sugar)) {
            this.updateSelectionHighlightPosition(sugar, newX, newY);
        }
        
        // Update connected lines
        this.updateConnectedLines(sugar, oldX, oldY, newX, newY);
    }
    
    updateShapePosition(shape, shapeType, x, y) {
        const size = this.sugarRadius;
        
        switch (shapeType) {
            case 'circle':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                break;
                
            case 'square':
                shape.setAttribute('x', x - size);
                shape.setAttribute('y', y - size);
                break;
                
            case 'triangle':
                const triPoints = `${x},${y-size} ${x+size*0.866},${y+size*0.5} ${x-size*0.866},${y+size*0.5}`;
                shape.setAttribute('points', triPoints);
                break;
                
            case 'diamond':
                const diamondPoints = `${x},${y-size} ${x+size},${y} ${x},${y+size} ${x-size},${y}`;
                shape.setAttribute('points', diamondPoints);
                break;
                
            case 'star':
                const starPoints = this.generateStarPoints(x, y, size, 5);
                shape.setAttribute('points', starPoints);
                break;
                
            case 'hexagon':
                const hexPoints = this.generatePolygonPoints(x, y, size, 6, 0);
                shape.setAttribute('points', hexPoints);
                break;
                
            case 'flat-hexagon':
                const flatHexPoints = this.generatePolygonPoints(x, y, size, 6, Math.PI/6);
                shape.setAttribute('points', flatHexPoints);
                break;
                
            case 'flat-diamond':
                const flatDiamondPoints = `${x-size*0.7},${y} ${x},${y-size*0.7} ${x+size*0.7},${y} ${x},${y+size*0.7}`;
                shape.setAttribute('points', flatDiamondPoints);
                break;
                
            case 'pentagon':
                const pentPoints = this.generatePolygonPoints(x, y, size, 5, -Math.PI/2);
                shape.setAttribute('points', pentPoints);
                break;
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
            if (Math.abs(x1 - oldX) < 1 && Math.abs(y1 - oldY) < 1) {
                // This line starts from the moved sugar
                line.setAttribute('x1', newX);
                line.setAttribute('y1', newY);
            } else if (Math.abs(x2 - oldX) < 1 && Math.abs(y2 - oldY) < 1) {
                // This line ends at the moved sugar
                line.setAttribute('x2', newX);
                line.setAttribute('y2', newY);
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
    
    updateUIForSelectedSugar(sugar) {
        const shape = sugar.getAttribute('data-shape');
        const color = sugar.getAttribute('data-color');
        const preset = sugar.getAttribute('data-preset');
        
        // Clear all selections first
        document.querySelectorAll('.preset-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // If it's a preset sugar, highlight the preset
        if (preset && this.snfgPresets[preset]) {
            document.querySelector(`[data-preset="${preset}"]`)?.classList.add('active');
            this.currentSugarConfig = {
                type: 'preset',
                preset: preset,
                shape: shape,
                color: color
            };
        } else {
            // It's a custom sugar, highlight shape and color
            document.querySelector(`[data-shape="${shape}"]`)?.classList.add('active');
            document.querySelector(`[data-color="${color}"]`)?.classList.add('active');
            this.currentSugarConfig = {
                type: 'custom',
                shape: shape,
                color: color,
                preset: null
            };
        }
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
    
    createText(x, y, content = 'Text', saveState = true, autoEdit = true) {
        // Save state before creating text (unless explicitly disabled)
        if (saveState) {
            this.saveState();
        }
        
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
        let textConfig = { fontSize: 16, fontFamily: 'Arial', color: '#2c3e50', bold: false, italic: false, underline: false };
        if (this.currentTool === 'text') {
            textConfig = this.getCurrentTextConfig();
        }
        
        // Set styles from configuration
        textElement.style.setProperty('font-family', textConfig.fontFamily, 'important');
        textElement.style.setProperty('font-size', `${textConfig.fontSize}px`, 'important');
        textElement.style.setProperty('fill', textConfig.color, 'important');
        
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
        
        const rect = this.canvas.getBoundingClientRect();
        const x = parseFloat(textElement.getAttribute('data-x'));
        const y = parseFloat(textElement.getAttribute('data-y'));
        
        // Create input box
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-input-box';
        input.value = textElement.textContent;
        input.style.left = (rect.left + x) + 'px';
        input.style.top = (rect.top + y - 20) + 'px';
        
        // Add to document
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        // Handle input completion
        const finishEdit = () => {
            const newText = input.value.trim();
            if (newText) {
                textElement.textContent = newText;
            } else {
                // If empty, delete the text element
                this.deleteText(textElement);
            }
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
        highlight.setAttribute('stroke', '#2ecc71');
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
        highlight.setAttribute('stroke', '#f39c12');
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
    
    createConnection(parentSugar, childSugar) {
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
        line.setAttribute('stroke', '#333');
        line.setAttribute('stroke-width', '2');
        
        // Store sugar IDs for style management
        line.setAttribute('data-start', parentSugar.getAttribute('id'));
        line.setAttribute('data-end', childSugar.getAttribute('id'));
        
        // Insert line before sugars so it appears behind them
        this.canvas.insertBefore(line, this.canvas.firstChild);
    }
    
    deleteSugar(sugar) {
        // Save state before deleting sugar
        this.saveState();
        
        // Remove from selection if selected
        if (this.selectedSugar === sugar) {
            this.selectedSugar = null;
        }
        this.selectedSugars.delete(sugar);
        
        // Remove connections involving this sugar
        const sugarX = parseFloat(sugar.getAttribute('data-x'));
        const sugarY = parseFloat(sugar.getAttribute('data-y'));
        
        const connections = this.canvas.querySelectorAll('.connection');
        connections.forEach(connection => {
            const x1 = parseFloat(connection.getAttribute('x1'));
            const y1 = parseFloat(connection.getAttribute('y1'));
            const x2 = parseFloat(connection.getAttribute('x2'));
            const y2 = parseFloat(connection.getAttribute('y2'));
            
            if ((x1 === sugarX && y1 === sugarY) || (x2 === sugarX && y2 === sugarY)) {
                connection.remove();
            }
        });
        
        // Remove selection highlight before deleting the sugar
        this.removeSelectionHighlight(sugar);
        
        // Remove the sugar
        sugar.remove();
    }
    
    downloadSVG() {
        // Clone the SVG to avoid modifying the original
        const svgClone = this.canvas.cloneNode(true);
        
        // Add XML namespace and other necessary attributes
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        
        // Get the SVG string
        const svgString = new XMLSerializer().serializeToString(svgClone);
        
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
    
    addInlineStyles(svgString) {
        // Add basic styles inline for better compatibility with external programs
        const styleString = `
            <style>
                .sugar .sugar-shape {
                    stroke-width: 2;
                }
                .connection {
                    stroke: #34495e;
                    stroke-width: 2;
                    fill: none;
                }
                .text-element {
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    fill: #2c3e50;
                }
            </style>
        `;
        
        // Insert styles after the opening svg tag
        return svgString.replace('>', '>' + styleString);
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
        const svgClone = this.canvas.cloneNode(true);
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        const svgString = new XMLSerializer().serializeToString(svgClone);
        const styledSVG = this.addInlineStyles(svgString);
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Get SVG dimensions
        const svgRect = this.canvas.getBoundingClientRect();
        const svgWidth = parseInt(this.canvas.getAttribute('width')) || svgRect.width;
        const svgHeight = parseInt(this.canvas.getAttribute('height')) || svgRect.height;
        
        // Set canvas size with higher resolution for better quality
        const scale = 2;
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        
        // Scale context for high resolution
        ctx.scale(scale, scale);
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            
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
        const svgClone = this.canvas.cloneNode(true);
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        const svgString = new XMLSerializer().serializeToString(svgClone);
        const styledSVG = this.addInlineStyles(svgString);
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Get SVG dimensions
        const svgRect = this.canvas.getBoundingClientRect();
        const svgWidth = parseInt(this.canvas.getAttribute('width')) || svgRect.width;
        const svgHeight = parseInt(this.canvas.getAttribute('height')) || svgRect.height;
        
        // Set canvas size with higher resolution for better quality
        const scale = 2;
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        
        // Scale context for high resolution
        ctx.scale(scale, scale);
        
        // Fill with white background for JPG
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
        // Save state before clearing canvas
        this.saveState();
        
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
    }
    
    // Box selection methods
    startBoxSelection(x, y) {
        this.isBoxSelecting = true;
        this.boxSelectionStart = { x, y };
        
        // Create selection box element
        this.selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.selectionBox.classList.add('selection-box');
        this.selectionBox.setAttribute('x', x);
        this.selectionBox.setAttribute('y', y);
        this.selectionBox.setAttribute('width', 0);
        this.selectionBox.setAttribute('height', 0);
        
        this.canvas.appendChild(this.selectionBox);
        
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
        
        // Get canvas dimensions for boundary limiting
        const canvasRect = this.canvas.getBoundingClientRect();
        const canvasWidth = canvasRect.width;
        const canvasHeight = canvasRect.height;
        
        // Calculate rectangle bounds (unclamped for selection logic)
        const selectionX = Math.min(startX, currentX);
        const selectionY = Math.min(startY, currentY);
        const selectionWidth = Math.abs(currentX - startX);
        const selectionHeight = Math.abs(currentY - startY);
        
        // Clamp the visual box to canvas boundaries
        const clampedX = Math.max(0, Math.min(selectionX, canvasWidth));
        const clampedY = Math.max(0, Math.min(selectionY, canvasHeight));
        const clampedWidth = Math.max(0, Math.min(selectionWidth, canvasWidth - clampedX));
        const clampedHeight = Math.max(0, Math.min(selectionHeight, canvasHeight - clampedY));
        
        // Update visual selection box (clamped to canvas)
        this.selectionBox.setAttribute('x', clampedX);
        this.selectionBox.setAttribute('y', clampedY);
        this.selectionBox.setAttribute('width', clampedWidth);
        this.selectionBox.setAttribute('height', clampedHeight);
        
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
        
        // Convert global coordinates to canvas-relative coordinates
        const canvasRect = this.canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        
        this.updateBoxSelection(x, y);
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
        
        // Convert global coordinates to canvas-relative coordinates
        const canvasRect = this.canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        
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
        
        // Find all elements within the selection box
        const sugars = this.canvas.querySelectorAll('.sugar');
        const texts = this.canvas.querySelectorAll('.text-element');
        
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
    }
    
    clearBoxSelectionPreviews() {
        const previews = this.canvas.querySelectorAll('.box-selection-preview');
        previews.forEach(element => element.classList.remove('box-selection-preview'));
    }
    
    clearSelectionBox() {
        if (this.selectionBox) {
            this.canvas.removeChild(this.selectionBox);
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
                    this.deselectElement(element);
                });
            } else {
                // Some elements are not selected - add all unselected to selection
                elementsInBox.forEach(element => {
                    if (!this.selectedElements.has(element)) {
                        this.selectElement(element, true);
                    }
                });
            }
        } else {
            // Normal selection - select all elements in box
            elementsInBox.forEach(element => {
                this.selectElement(element, true);
            });
        }
        
        // Clean up
        this.clearBoxSelectionPreviews();
        this.hoveredElements.clear();
        if (this.selectionBox) {
            this.canvas.removeChild(this.selectionBox);
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
    
    // Left panel control methods (now controls right panel in new layout)
    updateLeftPanel() {
        // Left panel only contains tools now, no dynamic content
        // This method is kept for compatibility but doesn't need to do anything
        return;
    }
    
    updateRightPanel() {
        const sugarControlsSection = document.getElementById('sugarControlsSection');
        const textControlsSection = document.getElementById('textControlsSection');
        const emptyControlsSection = document.getElementById('emptyControlsSection');
        
        // Determine what to show based on current tool and selections
        const showSugarControls = this.shouldShowSugarControls();
        const showTextControls = this.shouldShowTextControls();
        
        // Hide all sections first
        if (sugarControlsSection) sugarControlsSection.style.display = 'none';
        if (textControlsSection) textControlsSection.style.display = 'none';
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
        if (!showSugarControls && !showTextControls && emptyControlsSection) {
            emptyControlsSection.style.display = 'block';
        }
        
        // Update connection status
        this.updateConnectionStatus();
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
        
        // Check for mixed values across selected sugars
        const selectedSugars = Array.from(this.selectedSugars);
        if (this.selectedSugar) selectedSugars.push(this.selectedSugar);
        
        if (selectedSugars.length === 0) return;
        
        // Get values from first sugar
        const firstSugar = selectedSugars[0];
        const firstType = firstSugar.getAttribute('data-shape');
        const firstSize = this.getSugarSize(firstSugar);
        const firstShape = firstSugar.querySelector('.sugar-shape');
        const firstBorderWidth = firstShape ? (parseFloat(firstShape.style.strokeWidth || firstShape.getAttribute('stroke-width')) || 2) : 2;
        const firstBorderColor = firstShape ? (firstShape.style.stroke || firstShape.getAttribute('stroke') || '#333333') : '#333333';
        
        // Check if all selected sugars have same values
        let mixedType = false, mixedSize = false, mixedBorderWidth = false, mixedBorderColor = false;
        
        for (let i = 1; i < selectedSugars.length; i++) {
            const sugar = selectedSugars[i];
            const shape = sugar.querySelector('.sugar-shape');
            
            if (sugar.getAttribute('data-shape') !== firstType) mixedType = true;
            if (this.getSugarSize(sugar) !== firstSize) mixedSize = true;
            if (shape) {
                const borderWidth = parseFloat(shape.style.strokeWidth || shape.getAttribute('stroke-width')) || 2;
                const borderColor = shape.style.stroke || shape.getAttribute('stroke') || '#333333';
                if (borderWidth !== firstBorderWidth) mixedBorderWidth = true;
                if (borderColor !== firstBorderColor) mixedBorderColor = true;
            }
        }
        
        // Update controls
        const sugarType = document.getElementById('sugarType');
        const sugarSize = document.getElementById('sugarSize');
        const sugarSizeValue = document.getElementById('sugarSizeValue');
        const sugarBorderWidth = document.getElementById('sugarBorderWidth');
        const sugarBorderWidthValue = document.getElementById('sugarBorderWidthValue');
        const sugarBorderColor = document.getElementById('sugarBorderColor');
        const sugarBorderColorHex = document.getElementById('sugarBorderColorHex');
        
        if (sugarType) {
            sugarType.value = mixedType ? '' : firstType;
        }
        if (sugarSize && sugarSizeValue) {
            if (mixedSize) {
                sugarSize.value = '';
                sugarSizeValue.textContent = '混合';
            } else {
                sugarSize.value = firstSize;
                sugarSizeValue.textContent = firstSize;
            }
        }
        if (sugarBorderWidth && sugarBorderWidthValue) {
            if (mixedBorderWidth) {
                sugarBorderWidth.value = '';
                sugarBorderWidthValue.textContent = '混合';
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
                sugarBorderColor.value = firstBorderColor;
                sugarBorderColorHex.value = firstBorderColor;
                sugarBorderColor.classList.remove('mixed');
                sugarBorderColorHex.classList.remove('mixed');
            }
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
                fontSizeValue.textContent = '混合';
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
                textColor.value = firstColor;
                textColorHex.value = firstColor;
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
    
    // Style control methods
    updateStylePanel() {
        // Use the correct panel IDs from the main index.html
        const sugarControlsSection = document.getElementById('sugarControlsSection');
        const textControlsSection = document.getElementById('textControlsSection');
        const emptyControlsSection = document.getElementById('emptyControlsSection');
        
        if (!sugarControlsSection || !textControlsSection || !emptyControlsSection) return;
        
        if (this.currentTool === 'add') {
            // 添加模式：总是显示糖分子控制面板并显示添加配置参数
            sugarControlsSection.style.display = 'block';
            textControlsSection.style.display = 'none';
            emptyControlsSection.style.display = 'none';
            
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
                
                // Update current values from selected sugar
                this.updateStyleControlValues();
                
            } else if (selectedTexts.length > 0) {
                // Show text controls panel
                sugarControlsSection.style.display = 'none';
                textControlsSection.style.display = 'block';
                emptyControlsSection.style.display = 'none';
                
                // Update current values from selected text
                this.updateTextStyleControlValues();
                
            } else {
                // Show empty state when nothing is selected
                sugarControlsSection.style.display = 'none';
                textControlsSection.style.display = 'none';
                emptyControlsSection.style.display = 'block';
            }
        } else if (this.currentTool === 'text') {
            // Show text controls for text tool
            sugarControlsSection.style.display = 'none';
            textControlsSection.style.display = 'block';
            emptyControlsSection.style.display = 'none';
            
            // Update control values from currentTextConfig
            this.updateTextStyleControlValues();
        } else {
            // Show empty state for other tools
            sugarControlsSection.style.display = 'none';
            textControlsSection.style.display = 'none';
            emptyControlsSection.style.display = 'block';
        }
    }
    
    updateStyleControlValues() {
        const sizeSlider = document.getElementById('sugarSize');
        const sizeValue = document.getElementById('sugarSizeValue');
        const widthSlider = document.getElementById('sugarBorderWidth');
        const widthValue = document.getElementById('sugarBorderWidthValue');
        const colorPicker = document.getElementById('sugarBorderColor');
        const colorHex = document.getElementById('sugarBorderColorHex');

        if (this.currentTool === 'add') {
            // 添加模式：显示即将添加的新糖分子配置参数
            const config = this.currentSugarConfig || { size: 20, borderWidth: 2, borderColor: '#333333' };
            
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
                const configColor = config.borderColor || '#333333';
                colorPicker.value = configColor;
                colorHex.value = configColor;
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
                    const currentWidth = shape.style.strokeWidth || shape.getAttribute('stroke-width') || '2';
                    if (widthSlider && widthValue) {
                        widthSlider.value = parseFloat(currentWidth);
                        widthValue.textContent = parseFloat(currentWidth);
                    }
                    
                    const currentColor = shape.style.stroke || shape.getAttribute('stroke') || '#333333';
                    if (colorPicker && colorHex) {
                        colorPicker.value = currentColor;
                        colorHex.value = currentColor;
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
        if (textColor && textColorHex) {
            textColor.value = currentColor;
            textColorHex.value = currentColor;
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
    }
    
    getSugarSize(sugar) {
        // Get current size from the sugar's shape
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
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#3498db' };
            }
            this.currentSugarConfig.size = size;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Apply to selected sugar(s)
        const sugarsToResize = [];
        if (this.selectedSugar) {
            sugarsToResize.push(this.selectedSugar);
        }
        if (this.selectedSugars.size > 0) {
            sugarsToResize.push(...Array.from(this.selectedSugars));
        }
        
        sugarsToResize.forEach(sugar => {
            const shape = sugar.querySelector('.sugar-shape');
            const shapeType = sugar.getAttribute('data-shape');
            const x = parseFloat(sugar.getAttribute('data-x'));
            const y = parseFloat(sugar.getAttribute('data-y'));
            
            if (shape) {
                this.updateShapeSize(shape, shapeType, size);
                
                // Update selection highlight to match new size
                const highlightId = sugar.getAttribute('data-highlight-id');
                if (highlightId) {
                    const highlight = this.canvas.querySelector('#' + highlightId);
                    if (highlight) {
                        highlight.setAttribute('r', size + 5);
                    }
                }
            }
        });
    }
    
    updateShapeSize(shape, shapeType, size) {
        switch (shapeType) {
            case 'circle':
                shape.setAttribute('r', size);
                break;
                
            case 'square':
                const squareSize = size * 2;
                const x = parseFloat(shape.getAttribute('x'));
                const y = parseFloat(shape.getAttribute('y'));
                const centerX = x + parseFloat(shape.getAttribute('width')) / 2;
                const centerY = y + parseFloat(shape.getAttribute('height')) / 2;
                shape.setAttribute('x', centerX - size);
                shape.setAttribute('y', centerY - size);
                shape.setAttribute('width', squareSize);
                shape.setAttribute('height', squareSize);
                break;
                
            case 'triangle':
            case 'diamond':
            case 'star':
            case 'hexagon':
            case 'flat-hexagon':
            case 'flat-diamond':
            case 'pentagon':
                // For polygons, we need to recalculate points
                const sugar = shape.closest('.sugar');
                if (sugar) {
                    const x = parseFloat(sugar.getAttribute('data-x'));
                    const y = parseFloat(sugar.getAttribute('data-y'));
                    const color = sugar.getAttribute('data-color');
                    
                    // Remove old shape and create new one with updated size
                    const newShape = this.createSugarShape(x, y, shapeType, color, size);
                    newShape.classList.add('sugar-shape');
                    
                    // Copy any custom styles
                    if (shape.style.strokeWidth) {
                        newShape.style.setProperty('stroke-width', shape.style.strokeWidth, 'important');
                    }
                    if (shape.style.strokeDasharray) {
                        newShape.style.setProperty('stroke-dasharray', shape.style.strokeDasharray, 'important');
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
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#3498db' };
            }
            this.currentSugarConfig.borderWidth = width;
            this.currentSugarConfig.borderColor = color;
            this.currentSugarConfig.borderStyle = style;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Apply to selected sugar(s)
        const sugarsToStyle = [];
        if (this.selectedSugar) {
            sugarsToStyle.push(this.selectedSugar);
        }
        if (this.selectedSugars.size > 0) {
            sugarsToStyle.push(...Array.from(this.selectedSugars));
        }
        
        sugarsToStyle.forEach(sugar => {
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                // Use style property with important to override CSS
                shape.style.setProperty('stroke-width', width, 'important');
                shape.style.setProperty('stroke', color, 'important');
                
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
        });
    }

    applySugarBorderWidth() {
        // Skip if we're updating UI controls
        if (this.isUpdatingUI) return;
        
        const width = document.getElementById('sugarBorderWidth').value;
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#3498db' };
            }
            this.currentSugarConfig.borderWidth = width;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        const sugarsToStyle = [];
        if (this.selectedSugar) {
            sugarsToStyle.push(this.selectedSugar);
        }
        if (this.selectedSugars.size > 0) {
            sugarsToStyle.push(...Array.from(this.selectedSugars));
        }
        
        sugarsToStyle.forEach(sugar => {
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                shape.style.setProperty('stroke-width', width, 'important');
            }
        });
    }

    applySugarBorderColor(color) {
        // Skip if we're updating UI controls
        if (this.isUpdatingUI) return;
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#3498db' };
            }
            this.currentSugarConfig.borderColor = color;
            return;
        }
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        const sugarsToStyle = [];
        if (this.selectedSugar) {
            sugarsToStyle.push(this.selectedSugar);
        }
        if (this.selectedSugars.size > 0) {
            sugarsToStyle.push(...Array.from(this.selectedSugars));
        }
        
        sugarsToStyle.forEach(sugar => {
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                shape.style.setProperty('stroke', color, 'important');
            }
        });
    }
    
    applyConnectionStyle() {
        if (this.currentTool !== 'select') return;
        
        const width = document.getElementById('connectionWidth').value;
        const color = document.getElementById('connectionColor').value;
        const styleBtn = document.querySelector('.connection-style-btn.active');
        const style = styleBtn ? styleBtn.dataset.style : 'solid';
        
        const connections = this.getConnectionsForSelection();

        connections.forEach(conn => {
            // Use style property with important to override CSS
            conn.style.setProperty('stroke-width', width, 'important');
            conn.style.setProperty('stroke', color, 'important');
            
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
        });
    }
    
    applySugarShape(shape) {
        if (this.currentTool !== 'select') return;
        
        // Get all selected sugars
        const sugarsToChange = [];
        if (this.selectedSugar) {
            sugarsToChange.push(this.selectedSugar);
        }
        if (this.selectedSugars.size > 0) {
            sugarsToChange.push(...Array.from(this.selectedSugars));
        }
        
        sugarsToChange.forEach(sugar => {
            const currentShape = sugar.querySelector('.sugar-shape');
            if (currentShape) {
                const x = parseFloat(sugar.getAttribute('data-x'));
                const y = parseFloat(sugar.getAttribute('data-y'));
                const currentSize = this.getSugarSize(sugar);
                const currentFill = currentShape.style.fill || currentShape.getAttribute('fill') || '#3498db';
                const currentStroke = currentShape.style.stroke || currentShape.getAttribute('stroke') || '#000000';
                const currentStrokeWidth = currentShape.style.strokeWidth || currentShape.getAttribute('stroke-width') || '2';
                const currentDashArray = currentShape.style.strokeDasharray || currentShape.getAttribute('stroke-dasharray') || '';
                
                // Remove old shape
                currentShape.remove();
                
                // Create new shape element directly (not a group)
                let newShape;
                switch (shape) {
                    case 'circle':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        newShape.setAttribute('cx', x);
                        newShape.setAttribute('cy', y);
                        newShape.setAttribute('r', currentSize);
                        break;
                    case 'square':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        newShape.setAttribute('x', x - currentSize);
                        newShape.setAttribute('y', y - currentSize);
                        newShape.setAttribute('width', currentSize * 2);
                        newShape.setAttribute('height', currentSize * 2);
                        break;
                    case 'triangle':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const triPoints = `${x},${y-currentSize} ${x+currentSize*0.866},${y+currentSize*0.5} ${x-currentSize*0.866},${y+currentSize*0.5}`;
                        newShape.setAttribute('points', triPoints);
                        break;
                    case 'diamond':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const diamondPoints = `${x},${y-currentSize} ${x+currentSize},${y} ${x},${y+currentSize} ${x-currentSize},${y}`;
                        newShape.setAttribute('points', diamondPoints);
                        break;
                    case 'star':
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const starPoints = this.generateStarPoints(x, y, currentSize, 5);
                        newShape.setAttribute('points', starPoints);
                        break;
                    default:
                        newShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        newShape.setAttribute('cx', x);
                        newShape.setAttribute('cy', y);
                        newShape.setAttribute('r', currentSize);
                }
                
                // Apply styles (preserve current border settings)
                newShape.setAttribute('fill', currentFill);
                newShape.setAttribute('stroke', currentStroke);
                newShape.setAttribute('stroke-width', currentStrokeWidth);
                if (currentDashArray) {
                    newShape.setAttribute('stroke-dasharray', currentDashArray);
                }
                newShape.classList.add('sugar-shape');
                
                // Update sugar data
                sugar.setAttribute('data-shape', shape);
                sugar.appendChild(newShape);
                
                // Update highlight if exists
                const highlightId = sugar.getAttribute('data-highlight-id');
                if (highlightId) {
                    const highlight = this.canvas.querySelector('#' + highlightId);
                    if (highlight) {
                        this.removeSelectionHighlight(sugar);
                        this.addSelectionHighlight(sugar);
                    }
                }
            }
        });
    }
    
    applySugarColor(color) {
        if (this.currentTool !== 'select') return;
        
        // Get all selected sugars
        const sugarsToChange = [];
        if (this.selectedSugar) {
            sugarsToChange.push(this.selectedSugar);
        }
        if (this.selectedSugars.size > 0) {
            sugarsToChange.push(...Array.from(this.selectedSugars));
        }
        
        sugarsToChange.forEach(sugar => {
            const shape = sugar.querySelector('.sugar-shape');
            if (shape) {
                // Apply new color (fill)
                shape.style.setProperty('fill', color, 'important');
                
                // Keep black border (don't change stroke color)
                shape.style.setProperty('stroke', '#000000', 'important');
                shape.style.setProperty('stroke-width', '2', 'important');
            }
        });
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
        
        const fontSize = document.getElementById('fontSize').value;
        const fontFamily = document.getElementById('fontFamily').value;
        const textColor = document.getElementById('textColor').value;
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        // Apply styles to all selected text elements
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
                textElement.style.setProperty('fill', textColor, 'important');
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
        
        // Update the control values to reflect the new state
        this.updateTextControlsFromSelection();
    }
    
    applySpecificTextStyle(styleId, isActive) {
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
        
        // Apply only the specific style that was clicked
        selectedTextElements.forEach(textElement => {
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
        });
        
        // Update the control values to reflect the new state
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
            textElement.style.setProperty('fill', color, 'important');
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
    
    // Canvas size adjustment
    changeCanvasSize(sizeValue) {
        const [width, height] = sizeValue.split(',').map(Number);
        
        // Update canvas dimensions
        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);
        this.canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        console.log(`Canvas size changed to ${width}×${height}`);
    }
    
    // Undo system methods
    saveState() {
        // Save current canvas state for undo
        const state = {
            canvasContent: this.canvas.innerHTML,
            timestamp: Date.now()
        };
        
        this.undoStack.push(state);
        
        // Clear redo stack when a new action is performed
        this.redoStack = [];
        
        // Limit undo stack size
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.undoStack.length === 0) {
            console.log('Nothing to undo');
            return;
        }
        
        // Save current state to redo stack before undoing
        const currentState = {
            canvasContent: this.canvas.innerHTML,
            timestamp: Date.now()
        };
        this.redoStack.push(currentState);
        
        // Limit redo stack size
        if (this.redoStack.length > this.maxUndoSteps) {
            this.redoStack.shift();
        }
        
        // Get the last saved state
        const lastState = this.undoStack.pop();
        
        // Restore canvas content
        this.canvas.innerHTML = lastState.canvasContent;
        
        // Clear current selections since elements may have changed
        this.deselectAll();
        
        // Update UI
        this.updateRightPanel();
        this.updateLeftPanel();
        this.updateUndoRedoButtons();
        
        console.log('Undo completed');
    }
    
    redo() {
        if (this.redoStack.length === 0) {
            console.log('Nothing to redo');
            return;
        }
        
        // Save current state to undo stack before redoing
        const currentState = {
            canvasContent: this.canvas.innerHTML,
            timestamp: Date.now()
        };
        this.undoStack.push(currentState);
        
        // Get the last redo state
        const nextState = this.redoStack.pop();
        
        // Restore canvas content
        this.canvas.innerHTML = nextState.canvasContent;
        
        // Clear current selections since elements may have changed
        this.deselectAll();
        
        // Update UI
        this.updateRightPanel();
        this.updateLeftPanel();
        this.updateUndoRedoButtons();
        
        console.log('Redo completed');
    }
    
    updateUndoRedoButtons() {
        if (this.undoBtn) {
            this.undoBtn.disabled = this.undoStack.length === 0;
        }
        if (this.redoBtn) {
            this.redoBtn.disabled = this.redoStack.length === 0;
        }
    }
    
    // Keep old method for compatibility
    updateUndoButton() {
        this.updateUndoRedoButtons();
    }
    
    // Keyboard event handlers
    handleKeyDown(e) {
        // Track modifier keys
        this.isCtrlPressed = e.ctrlKey;
        this.isShiftPressed = e.shiftKey;
        
        // Don't handle shortcuts when editing text
        if (this.isEditingText) {
            // Allow text formatting shortcuts even when editing
            if (e.ctrlKey) {
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
        
        // Handle keyboard shortcuts
        if (e.ctrlKey) {
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
        } else {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.clearSelection();
                    break;
                case 'Delete':
                    e.preventDefault();
                    this.deleteSelection();
                    break;
            }
        }
    }
    
    handleKeyUp(e) {
        // Update modifier key states
        this.isCtrlPressed = e.ctrlKey;
        this.isShiftPressed = e.shiftKey;
    }
    
    handleWheel(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            // Zoom functionality
            const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoomCanvas(scaleFactor, e.offsetX, e.offsetY);
        }
    }
    
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
        
        if (!multiSelect) {
            this.clearAllSelections();
        }
        
        this.selectedElements.add(element);
        element.classList.add('selected');
        this.showSelectionHighlight(element);
        
        // Update legacy selection states for backward compatibility
        this.updateLegacySelectionStates();
    }
    
    // Unified element deselection
    deselectElement(element) {
        if (!this.selectedElements.has(element)) return;
        
        this.selectedElements.delete(element);
        element.classList.remove('selected');
        this.hideSelectionHighlight(element);
        
        // Update legacy selection states
        this.updateLegacySelectionStates();
    }
    
    // Toggle element selection
    toggleElementSelection(element, multiSelect = false) {
        if (this.selectedElements.has(element)) {
            this.deselectElement(element);
        } else {
            this.selectElement(element, multiSelect);
        }
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
        this.isDragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        
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
        this.saveState(); // Save state before deletion
        
        // Collect elements to delete using unified system
        const sugarsToDelete = this.getSelectedElementsByType('sugar');
        const textsToDelete = this.getSelectedElementsByType('text');
        const connectionsToDelete = this.getSelectedElementsByType('connection');
        
        // Delete connections that are connected to sugars being deleted
        document.querySelectorAll('.connection').forEach(connection => {
            const startId = connection.getAttribute('data-start');
            const endId = connection.getAttribute('data-end');
            
            const startSugar = document.getElementById(startId);
            const endSugar = document.getElementById(endId);
            
            // Delete connection if either end is being deleted (and not already in connectionsToDelete)
            if ((startSugar && sugarsToDelete.includes(startSugar)) || 
                (endSugar && sugarsToDelete.includes(endSugar))) {
                if (!connectionsToDelete.includes(connection)) {
                    connection.remove();
                }
            }
        });
        
        // Delete selected elements
        this.selectedElements.forEach(element => {
            this.hideSelectionHighlight(element);
            element.remove();
        });
        
        this.clearAllSelections();
    }
    
    copySelection() {
        this.clipboard = {
            sugars: [],
            texts: [],
            connections: []
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
                connectionsToCopy.push({
                    startId: startId,
                    endId: endId,
                    style: connection.getAttribute('style'),
                    className: connection.className
                });
            }
        });
        
        this.clipboard.connections = connectionsToCopy;
        
        // Show copy confirmation
        const totalCopied = this.clipboard.sugars.length + this.clipboard.texts.length + this.clipboard.connections.length;
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
        
        this.saveState(); // Save state before pasting
        
        // Clear current selection first (use unified system)
        this.clearAllSelections();
        
        // Calculate dynamic offset to avoid overlapping with previous pastes
        // Each paste moves items 30 pixels to the right and down
        this.pasteCount = (this.pasteCount || 0) + 1;
        const offsetX = 30 * this.pasteCount; // Dynamic offset
        const offsetY = 30 * this.pasteCount;
        
        const pastedSugars = [];
        const pastedTexts = [];
        
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
        
        // Paste connections
        this.clipboard.connections.forEach(connectionData => {
            const newStartId = sugarIdMapping[connectionData.startId];
            const newEndId = sugarIdMapping[connectionData.endId];
            
            if (newStartId && newEndId) {
                const startSugar = document.getElementById(newStartId);
                const endSugar = document.getElementById(newEndId);
                
                if (startSugar && endSugar) {
                    this.createConnection(startSugar, endSugar);
                }
            }
        });
        
        // Update the style panel to reflect new selection
        this.updateStylePanel();
        
        // Show paste confirmation
        const totalPasted = pastedSugars.length + pastedTexts.length + this.clipboard.connections.length;
        if (totalPasted > 0) {
            this.showTemporaryNotification(`已粘贴 ${totalPasted} 个元素 (已选中新元素)`);
        }
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
            this.applyTextStyleToElement(this.selectedText, styleId, btn.classList.contains('active'));
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
        
        // Apply the specific style to all selected texts
        selectedTextElements.forEach(textElement => {
            this.applyTextStyleToElement(textElement, styleId, isActive);
        });
    }
    
    toggleSuperscript() {
        if (this.selectedText || this.selectedTexts.size > 0) {
            this.applyTextTransform('superscript');
        }
    }
    
    toggleSubscript() {
        if (this.selectedText || this.selectedTexts.size > 0) {
            this.applyTextTransform('subscript');
        }
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
            background: rgba(0, 0, 0, 0.8);
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
    


}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.glycanApp = new GlycanDrawer();
});