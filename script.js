class GlycanDrawer {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.downloadBtn = document.getElementById('downloadBtn');
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
            preset: null
        };
        

        
        // Selection and drag states
        this.selectedSugar = null;
        this.selectedText = null;
        this.selectedTexts = new Set(); // Multiple text selection
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
        this.selectedSugars = new Set(); // Multiple sugar selection
        
        // UI update flag to prevent style application during UI updates
        this.isUpdatingUI = false;
        
        // Eraser states for continuous deletion
        this.isErasing = false;
        this.eraserTimer = null;
        this.eraserDelay = 100; // 100ms delay between continuous deletions
        this.isDraggingMultiple = false;
        this.isDraggingMultipleTexts = false;
        
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
        
        // Add action button listeners
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        
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
            const value = e.target.value;
            sugarSizeValue.textContent = value;
            this.applySugarSize();
        });
        
        // Sugar border style controls
        const sugarBorderWidth = document.getElementById('sugarBorderWidth');
        const sugarBorderWidthValue = document.getElementById('sugarBorderWidthValue');
        const borderStyleButtons = document.querySelectorAll('.border-style-btn');
        
        sugarBorderWidth.addEventListener('input', (e) => {
            const value = e.target.value;
            sugarBorderWidthValue.textContent = value;
            // Clear mixed state when user manually changes value
            const sugarBorderWidthValue = document.getElementById('sugarBorderWidthValue');
            e.target.classList.remove('mixed');
            if (sugarBorderWidthValue) sugarBorderWidthValue.classList.remove('mixed');
            this.applySugarBorderWidth();
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
            const value = e.target.value;
            fontSizeValue.textContent = value;
            this.applyFontSize(value);
        });
        
        // Font family control
        fontFamily.addEventListener('change', (e) => {
            this.applyFontFamily(e.target.value);
        });
        
        // Text color controls
        textColor.addEventListener('input', (e) => {
            const color = e.target.value;
            textColorHex.value = color;
            this.applyTextColor(color);
        });
        
        textColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                textColor.value = color;
                this.applyTextStyle();
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
                // Apply only this specific style, not all styles
                this.applySpecificTextStyle(btn.id, btn.classList.contains('active'));
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
            this.applySugarBorderColor(color);
        });
        
        sugarBorderColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                sugarBorderColor.value = color;
                // Clear mixed state when user manually changes value
                sugarBorderColor.classList.remove('mixed');
                sugarBorderColorHex.classList.remove('mixed');
                this.applySugarBorderColor(color);
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
                if (this.selectedSugar || this.selectedSugars.size > 0) {
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
        
        const clickedSugar = this.getSugarAtPoint(x, y);
        const clickedText = this.getTextAtPoint(x, y);
        
        if (this.currentTool === 'select') {
            if (clickedSugar) {
                // Get SVG-relative coordinates
                const svgX = x;
                const svgY = y;
                
                // Check if clicked sugar is part of multiple selection
                if (this.selectedSugars.has(clickedSugar)) {
                    // Dragging multiple selected sugars
                    this.isDragging = true;
                    this.isDraggingMultiple = true;
                    this.dragStartX = svgX;
                    this.dragStartY = svgY;
                    
                    // Store initial positions and add dragging class for all selected sugars
                    this.selectedSugars.forEach(sugar => {
                        sugar.setAttribute('data-initial-x', sugar.getAttribute('data-x'));
                        sugar.setAttribute('data-initial-y', sugar.getAttribute('data-y'));
                        sugar.classList.add('dragging');
                    });
                } else {
                    // Select single sugar first
                    this.selectSugar(clickedSugar);
                    
                    // Initialize single sugar dragging with SVG coordinates
                    this.isDragging = true;
                    this.isDraggingMultiple = false;
                    
                    const sugarX = parseFloat(clickedSugar.getAttribute('data-x'));
                    const sugarY = parseFloat(clickedSugar.getAttribute('data-y'));
                    this.dragOffset = {
                        x: svgX - sugarX,
                        y: svgY - sugarY
                    };
                    
                    this.selectedSugar.classList.add('dragging');
                }
                
                e.preventDefault();
            } else if (clickedText) {
                // Get SVG-relative coordinates
                const svgX = x;
                const svgY = y;
                
                // Handle text selection (single or multiple)
                if (this.selectedTexts.has(clickedText)) {
                    // Already selected, prepare for multiple text dragging
                    this.isDraggingMultipleTexts = true;
                    this.isDragging = true;
                    
                    // Store initial positions for all selected texts
                    this.selectedTexts.forEach(text => {
                        const textX = parseFloat(text.getAttribute('data-x'));
                        const textY = parseFloat(text.getAttribute('data-y'));
                        text.setAttribute('data-initial-x', textX);
                        text.setAttribute('data-initial-y', textY);
                    });
                    
                    this.dragStartX = svgX;
                    this.dragStartY = svgY;
                } else {
                    // Select the text if not already selected
                    if (this.selectedText !== clickedText) {
                        this.selectText(clickedText);
                    }
                    
                    // Initialize single text dragging with SVG coordinates
                    this.isDragging = true;
                    const textX = parseFloat(clickedText.getAttribute('data-x'));
                    const textY = parseFloat(clickedText.getAttribute('data-y'));
                    this.dragOffset = {
                        x: svgX - textX,
                        y: svgY - textY
                    };
                }
                
                e.preventDefault();
            } else {
                // Clicked on empty space - start box selection
                this.deselectAll();
                this.startBoxSelection(x, y);
                e.preventDefault();
            }
        } else if (this.currentTool === 'add') {
            if (clickedSugar) {
                // Start long press detection for connection dragging
                this.startLongPress(clickedSugar, e);
                e.preventDefault();
            }
        } else if (this.currentTool === 'delete') {
            // Start erasing on mouse down
            this.startErasing(x, y);
            e.preventDefault();
        }
    }
    
    handleMouseMove(e) {
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        

        // Handle box selection
        if (this.isBoxSelecting && this.currentTool === 'select') {
            this.updateBoxSelection(x, y);
            e.preventDefault();
        }
        
        // Handle select mode dragging
        if (this.isDragging && this.currentTool === 'select') {
            if (this.isDraggingMultiple && this.selectedSugars.size > 0) {
                // Calculate movement delta from initial drag position
                const deltaX = x - this.dragStartX;  
                const deltaY = y - this.dragStartY;
                
                this.selectedSugars.forEach(sugar => {
                    const initialX = parseFloat(sugar.getAttribute('data-initial-x'));
                    const initialY = parseFloat(sugar.getAttribute('data-initial-y'));
                    
                    this.moveSugar(sugar, initialX + deltaX, initialY + deltaY);
                });
                
                e.preventDefault();
            } else if (this.isDraggingMultipleTexts && this.selectedTexts.size > 0) {
                // Calculate movement delta from initial drag position for texts
                const deltaX = x - this.dragStartX;  
                const deltaY = y - this.dragStartY;
                
                this.selectedTexts.forEach(text => {
                    const initialX = parseFloat(text.getAttribute('data-initial-x'));
                    const initialY = parseFloat(text.getAttribute('data-initial-y'));
                    
                    this.moveText(text, initialX + deltaX, initialY + deltaY);
                });
                
                e.preventDefault();
            } else if (this.selectedSugar) {
                const newX = x - this.dragOffset.x;
                const newY = y - this.dragOffset.y;
                
                // Update sugar position
                this.moveSugar(this.selectedSugar, newX, newY);
                
                e.preventDefault();
            } else if (this.selectedText) {
                const newX = x - this.dragOffset.x;
                const newY = y - this.dragOffset.y;
                
                // Update text position
                this.moveText(this.selectedText, newX, newY);
                
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
            this.finishBoxSelection();
        }
        
        // Clean up multiple drag state
        if (this.isDraggingMultiple) {
            this.selectedSugars.forEach(sugar => {
                sugar.removeAttribute('data-initial-x');
                sugar.removeAttribute('data-initial-y');
                sugar.classList.remove('dragging');
            });
            this.isDraggingMultiple = false;
        }
        
        // Clean up multiple text drag state
        if (this.isDraggingMultipleTexts) {
            this.selectedTexts.forEach(text => {
                text.removeAttribute('data-initial-x');
                text.removeAttribute('data-initial-y');
                text.classList.remove('dragging');
            });
            this.isDraggingMultipleTexts = false;
        }
        
        // Remove dragging class from single selected sugar
        if (this.selectedSugar) {
            this.selectedSugar.classList.remove('dragging');
        }
        
        // Stop erasing
        if (this.isErasing) {
            this.stopErasing();
        }
        
        this.isDragging = false;
    }
    
    handleMouseLeave(e) {
        // Clean up any UI artifacts when mouse leaves canvas
        
        // Clear selection box if active
        if (this.isBoxSelecting) {
            this.clearSelectionBox();
            this.isBoxSelecting = false;
        }
        
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
            this.selectSugar(clickedSugar);
            // Update UI to show current sugar properties
            this.updateUIForSelectedSugar(clickedSugar);
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
            if (distance <= this.sugarRadius + 5) {
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
    
    selectSugar(sugar) {
        // Deselect all previous selections (both single and multiple)
        this.deselectAll();
        
        // Select new sugar
        this.selectedSugar = sugar;
        sugar.classList.add('selected');
        
        // Add selection highlight
        this.addSelectionHighlight(sugar);
        
        // Update style panel for single selection
        this.updateStylePanel();
        
        // Update left panel visibility
        this.updateLeftPanel();
        
        // Update right panel content
        this.updateRightPanel();
    }
    
    deselectSugar() {
        if (this.selectedSugar) {
            this.selectedSugar.classList.remove('selected');
            this.removeSelectionHighlight(this.selectedSugar);
            this.selectedSugar = null;
        }
    }
    
    selectText(text) {
        // Deselect previous selections
        this.deselectAll();
        
        // Select new text
        this.selectedText = text;
        this.selectedTexts.add(text);
        text.classList.add('selected');
        
        // Add text selection highlight
        this.addTextSelectionHighlight(text);
        
        // Update style panel for text selection
        this.updateStylePanel();
        
        // Update right panel content
        this.updateRightPanel();
    }
    
    deselectText() {
        if (this.selectedText) {
            this.selectedText.classList.remove('selected');
            this.removeTextSelectionHighlight(this.selectedText);
            this.selectedTexts.delete(this.selectedText);
            this.selectedText = null;
        }
    }
    
    deselectAll() {
        this.deselectSugar();
        this.deselectText();
        this.deselectMultipleSugars();
        this.deselectMultipleTexts();
        
        // Always update style panel when deselecting (regardless of current tool)
        this.updateStylePanel();
        this.updateLeftPanel();
        
        // Update right panel content
        this.updateRightPanel();
    }
    
    deselectMultipleSugars() {
        this.selectedSugars.forEach(sugar => {
            sugar.classList.remove('selected');
            this.removeSelectionHighlight(sugar);
        });
        this.selectedSugars.clear();
    }
    
    deselectMultipleTexts() {
        this.selectedTexts.forEach(text => {
            text.classList.remove('selected');
            this.removeTextSelectionHighlight(text);
        });
        this.selectedTexts.clear();
    }
    
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
        highlight.setAttribute('r', this.sugarRadius + 5);
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
        if (sugar.classList.contains('selected')) {
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
    
    createText(x, y, content = 'Text') {
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
        
        // If content is default, immediately edit it
        if (content === 'Text') {
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
    
    moveText(textElement, newX, newY) {
        textElement.setAttribute('x', newX);
        textElement.setAttribute('y', newY);
        textElement.setAttribute('data-x', newX);
        textElement.setAttribute('data-y', newY);
        
        // Update highlight position if this text is selected
        if (textElement.classList.contains('selected')) {
            this.removeTextSelectionHighlight(textElement);
            this.addTextSelectionHighlight(textElement);
        }
    }
    
    deleteText(textElement) {
        if (this.selectedText === textElement) {
            this.selectedText = null;
        }
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
        highlight.setAttribute('r', this.sugarRadius + 8);
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
        highlight.setAttribute('r', this.sugarRadius + 6);
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
    
    clearCanvas() {
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
    }
    
    updateBoxSelection(currentX, currentY) {
        if (!this.selectionBox) return;
        
        const startX = this.boxSelectionStart.x;
        const startY = this.boxSelectionStart.y;
        
        // Calculate rectangle bounds
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        // Update selection box
        this.selectionBox.setAttribute('x', x);
        this.selectionBox.setAttribute('y', y);
        this.selectionBox.setAttribute('width', width);
        this.selectionBox.setAttribute('height', height);
        
        // Preview selection by highlighting sugars in the box
        this.previewBoxSelection(x, y, width, height);
    }
    
    previewBoxSelection(boxX, boxY, boxWidth, boxHeight) {
        // Clear previous previews
        this.clearBoxSelectionPreviews();
        
        // Find sugars within the selection box
        const sugars = this.canvas.querySelectorAll('.sugar');
        sugars.forEach(sugar => {
            const sugarX = parseFloat(sugar.getAttribute('data-x'));
            const sugarY = parseFloat(sugar.getAttribute('data-y'));
            
            // Check if sugar center is within the selection box
            if (sugarX >= boxX && sugarX <= boxX + boxWidth &&
                sugarY >= boxY && sugarY <= boxY + boxHeight) {
                sugar.classList.add('box-selection-preview');
            }
        });
    }
    
    clearBoxSelectionPreviews() {
        const previews = this.canvas.querySelectorAll('.box-selection-preview');
        previews.forEach(sugar => sugar.classList.remove('box-selection-preview'));
    }
    
    finishBoxSelection() {
        if (!this.isBoxSelecting || !this.selectionBox) return;
        
        // Get final selection box bounds
        const boxX = parseFloat(this.selectionBox.getAttribute('x'));
        const boxY = parseFloat(this.selectionBox.getAttribute('y'));
        const boxWidth = parseFloat(this.selectionBox.getAttribute('width'));
        const boxHeight = parseFloat(this.selectionBox.getAttribute('height'));
        
        // Clear previous selections
        this.deselectAll();
        this.selectedSugars.clear();
        this.selectedTexts.clear();
        
        // Select all sugars within the box
        const sugars = this.canvas.querySelectorAll('.sugar');
        sugars.forEach(sugar => {
            const sugarX = parseFloat(sugar.getAttribute('data-x'));
            const sugarY = parseFloat(sugar.getAttribute('data-y'));
            
            // Check if sugar center is within the selection box
            if (sugarX >= boxX && sugarX <= boxX + boxWidth &&
                sugarY >= boxY && sugarY <= boxY + boxHeight) {
                this.selectedSugars.add(sugar);
                sugar.classList.add('selected');
                this.addSelectionHighlight(sugar);
            }
        });
        
        // Select all text elements within the box
        const textElements = this.canvas.querySelectorAll('.text-element');
        textElements.forEach(text => {
            const textX = parseFloat(text.getAttribute('x'));
            const textY = parseFloat(text.getAttribute('y'));
            
            // Check if text position is within the selection box
            if (textX >= boxX && textX <= boxX + boxWidth &&
                textY >= boxY && textY <= boxY + boxHeight) {
                this.selectedTexts.add(text);
                text.classList.add('selected');
                this.addTextSelectionHighlight(text);
                // Keep selectedText for backward compatibility (use first selected)
                if (!this.selectedText) {
                    this.selectedText = text;
                }
            }
        });
        
        // Clean up
        this.clearBoxSelectionPreviews();
        if (this.selectionBox) {
            this.canvas.removeChild(this.selectionBox);
            this.selectionBox = null;
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
        // Get current text configuration from right panel
        const fontSize = document.getElementById('fontSize');
        const fontFamily = document.getElementById('fontFamily');
        const textColor = document.getElementById('textColor');
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        return {
            fontSize: fontSize ? parseInt(fontSize.value) : 16,
            fontFamily: fontFamily ? fontFamily.value : 'Arial',
            color: textColor ? textColor.value : '#000000',
            bold: boldBtn ? boldBtn.classList.contains('active') : false,
            italic: italicBtn ? italicBtn.classList.contains('active') : false,
            underline: underlineBtn ? underlineBtn.classList.contains('active') : false
        };
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
        const stylePanel = document.getElementById('stylePanel');
        const sugarStyleSection = document.getElementById('sugarStyleSection');
        const connectionStyleSection = document.getElementById('connectionStyleSection');
        const textStyleSection = document.getElementById('textStyleSection');
        const connectionStatus = document.getElementById('connectionStatus');
        
        if (!stylePanel || !sugarStyleSection || !connectionStyleSection || !textStyleSection || !connectionStatus) return;
        
        // If not in select mode, hide entire bottom style panel
        if (this.currentTool !== 'select') {
            stylePanel.style.display = 'none';
            return;
        }
        
        // Check if any sugars are selected
        const hasSugarsSelected = this.selectedSugar || this.selectedSugars.size > 0;
        const hasTextSelected = this.selectedText;
        
        if (hasSugarsSelected) {
            // Show bottom style panel
            stylePanel.style.display = 'block';
            
            // Show sugar style section
            sugarStyleSection.style.display = 'block';
            textStyleSection.style.display = 'none';
            
            // Update current values from selected sugar
            this.updateStyleControlValues();
            
            // Check for connections
            const connections = this.getConnectionsForSelection();
            if (connections.length > 0) {
                // Show connection style section
                connectionStyleSection.style.display = 'block';
                connectionStatus.className = 'connection-status has-connections';
                connectionStatus.querySelector('.status-text').textContent = 
                    `发现 ${connections.length} 条连接线`;
            } else {
                // Show connection section but indicate no connections
                connectionStyleSection.style.display = 'block';
                connectionStatus.className = 'connection-status no-connections';
                connectionStatus.querySelector('.status-text').textContent = '所选糖之间无连接线';
            }
        } else if (hasTextSelected) {
            // Show bottom style panel
            stylePanel.style.display = 'block';
            
            // Show text style section
            textStyleSection.style.display = 'block';
            sugarStyleSection.style.display = 'none';
            connectionStyleSection.style.display = 'none';
            
            // Update current values from selected text
            this.updateTextStyleControlValues();
        } else {
            // Hide entire bottom style panel when nothing is selected
            stylePanel.style.display = 'none';
        }
    }
    
    updateStyleControlValues() {
        // Update control values based on the first selected sugar
        let referenceSugar = this.selectedSugar;
        if (!referenceSugar && this.selectedSugars.size > 0) {
            referenceSugar = Array.from(this.selectedSugars)[0];
        }
        
        if (referenceSugar) {
            // Update size slider
            const currentSize = this.getSugarSize(referenceSugar);
            const sizeSlider = document.getElementById('sugarSize');
            const sizeValue = document.getElementById('sugarSizeValue');
            if (sizeSlider && sizeValue) {
                sizeSlider.value = currentSize;
                sizeValue.textContent = currentSize;
            }
            
            // Update border width slider and color
            const shape = referenceSugar.querySelector('.sugar-shape');
            if (shape) {
                const currentWidth = shape.style.strokeWidth || shape.getAttribute('stroke-width') || '2';
                const widthSlider = document.getElementById('sugarBorderWidth');
                const widthValue = document.getElementById('sugarBorderWidthValue');
                if (widthSlider && widthValue) {
                    widthSlider.value = parseFloat(currentWidth);
                    widthValue.textContent = parseFloat(currentWidth);
                }
                
                // Update border color
                const currentColor = shape.style.stroke || shape.getAttribute('stroke') || '#333333';
                const colorPicker = document.getElementById('sugarBorderColor');
                const colorHex = document.getElementById('sugarBorderColorHex');
                if (colorPicker && colorHex) {
                    colorPicker.value = currentColor;
                    colorHex.value = currentColor;
                }
            }
        }
    }
    
    updateTextStyleControlValues() {
        if (!this.selectedText) return;
        
        // selectedText is already the text element
        const textElement = this.selectedText;
        
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
        
        if (this.selectedSugar) {
            // Single sugar selection
            const sugarId = this.selectedSugar.getAttribute('id');
            allConnections.forEach(conn => {
                const startId = conn.getAttribute('data-start');
                const endId = conn.getAttribute('data-end');
                if (startId === sugarId || endId === sugarId) {
                    connections.push(conn);
                }
            });
        } else if (this.selectedSugars.size > 1) {
            // Multiple sugar selection - find connections between selected sugars
            const selectedIds = Array.from(this.selectedSugars).map(sugar => sugar.getAttribute('id'));
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
    

}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GlycanDrawer();
});