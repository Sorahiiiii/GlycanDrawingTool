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
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.lastClickTime = 0;
        this.doubleClickDelay = 300;
        
        // Connection drag states
        this.isConnectionDragging = false;
        this.connectionStartSugar = null;
        this.connectionTargetSugar = null;
        this.longPressTimer = null;
        this.longPressDelay = 500; // 500ms for long press
        this.preventNextClick = false;
        this.isEditingText = false;
        
        // Box selection states
        this.isBoxSelecting = false;
        this.boxSelectionStart = { x: 0, y: 0 };
        this.selectionBox = null;
        this.selectedSugars = new Set(); // Multiple sugar selection
        
        // Eraser states for continuous deletion
        this.isErasing = false;
        this.eraserTimer = null;
        this.eraserDelay = 100; // 100ms delay between continuous deletions
        this.isDraggingMultiple = false;
        
        // SFNG Presets Configuration
        this.sfngPresets = {
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
        
        // Add action button listeners
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        
        // Set default tool
        this.setTool('add');
        
        // Initially hide style panel since default tool is 'add'
        const stylePanel = document.getElementById('stylePanel');
        if (stylePanel) {
            stylePanel.style.display = 'none';
        }
        
        // Initialize style panels (should be hidden by default)
        this.updateStylePanel();
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
        // SFNG preset buttons
        const presetItems = document.querySelectorAll('.preset-item');
        presetItems.forEach(item => {
            item.addEventListener('click', () => {
                const preset = item.dataset.preset;
                this.selectPreset(preset);
            });
        });
    }
    
    setupCustomization() {
        // Shape buttons
        const shapeButtons = document.querySelectorAll('.shape-btn');
        shapeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const shape = btn.dataset.shape;
                this.selectShape(shape);
            });
        });
        
        // Color buttons
        const colorButtons = document.querySelectorAll('.color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.dataset.color;
                this.selectColor(color);
            });
        });
        
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
            this.applySugarBorderStyle();
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
            this.applyTextStyle();
        });
        
        // Font family control
        fontFamily.addEventListener('change', () => {
            this.applyTextStyle();
        });
        
        // Text color controls
        textColor.addEventListener('input', (e) => {
            const color = e.target.value;
            textColorHex.value = color;
            this.applyTextStyle();
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
                btn.classList.toggle('active');
                this.applyTextStyle();
            });
        });
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
        
        // Show/hide style panel based on tool
        const stylePanel = document.getElementById('stylePanel');
        if (stylePanel) {
            if (tool === 'select') {
                stylePanel.style.display = 'block';
            } else {
                stylePanel.style.display = 'none';
            }
        }
        
        // Update style panels visibility
        this.updateStylePanel();
    }
    
    selectPreset(preset) {
        if (this.sfngPresets[preset]) {
            this.currentSugarConfig = {
                type: 'preset',
                preset: preset,
                shape: this.sfngPresets[preset].shape,
                color: this.sfngPresets[preset].color
            };
            
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
            
            // If a sugar is selected, apply the preset to it
            if (this.selectedSugar && this.currentTool === 'select') {
                this.applySugarConfig(this.selectedSugar, this.currentSugarConfig);
            } else if (this.currentTool !== 'select') {
                // Only switch to add tool if not currently in select mode
                this.setTool('add');
            }
            // If in select mode but no sugar selected, just update the config without switching tools
        }
    }
    
    selectShape(shape) {
        this.currentSugarConfig = {
            type: 'custom',
            shape: shape,
            color: this.currentSugarConfig.color,
            preset: null
        };
        
        // Update shape button states
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.shape === shape);
        });
        
        // Clear preset selections
        document.querySelectorAll('.preset-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // If a sugar is selected, apply the shape to it
        if (this.selectedSugar && this.currentTool === 'select') {
            this.applySugarConfig(this.selectedSugar, this.currentSugarConfig);
        } else if (this.currentTool !== 'select') {
            // Only switch to add tool if not currently in select mode
            this.setTool('add');
        }
        // If in select mode but no sugar selected, just update the config without switching tools
    }
    
    selectColor(color) {
        this.currentSugarConfig.color = color;
        
        // Update color button states
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
        
        // If using custom shape, keep it selected
        if (this.currentSugarConfig.type === 'custom') {
            // Clear preset selections
            document.querySelectorAll('.preset-item').forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // If a sugar is selected, apply the color to it
        if (this.selectedSugar && this.currentTool === 'select') {
            this.applySugarConfig(this.selectedSugar, this.currentSugarConfig);
        } else if (this.currentTool !== 'select') {
            // Only switch to add tool if not currently in select mode
            this.setTool('add');
        }
        // If in select mode but no sugar selected, just update the config without switching tools
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
        }
        // Default cursor (crosshair) for add mode
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedSugar = this.getSugarAtPoint(x, y);
        const clickedText = this.getTextAtPoint(x, y);
        
        if (this.currentTool === 'select') {
            if (clickedSugar) {
                this.isDragging = true;
                const sugarX = parseFloat(clickedSugar.getAttribute('data-x'));
                const sugarY = parseFloat(clickedSugar.getAttribute('data-y'));
                this.dragOffset = {
                    x: x - sugarX,
                    y: y - sugarY
                };
                
                // Check if clicked sugar is part of multiple selection
                if (this.selectedSugars.has(clickedSugar)) {
                    // Dragging multiple selected sugars
                    this.isDraggingMultiple = true;
                    this.dragStartX = x;
                    this.dragStartY = y;
                    
                    // Store initial positions and add dragging class for all selected sugars
                    this.selectedSugars.forEach(sugar => {
                        sugar.setAttribute('data-initial-x', sugar.getAttribute('data-x'));
                        sugar.setAttribute('data-initial-y', sugar.getAttribute('data-y'));
                        sugar.classList.add('dragging');
                    });
                } else {
                    // Select single sugar and clear multiple selection
                    this.selectSugar(clickedSugar);
                    this.isDraggingMultiple = false;
                    this.selectedSugar.classList.add('dragging');
                }
                
                e.preventDefault();
            } else if (clickedText) {
                this.isDragging = true;
                const textX = parseFloat(clickedText.getAttribute('data-x'));
                const textY = parseFloat(clickedText.getAttribute('data-y'));
                this.dragOffset = {
                    x: x - textX,
                    y: y - textY
                };
                
                // Select the text if not already selected
                if (this.selectedText !== clickedText) {
                    this.selectText(clickedText);
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
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
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
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
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
                this.createText(x, y);
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
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
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
    
    addConnectedSugar(parentSugar, clickX, clickY) {
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
                const childSugar = this.createSugar(altPosition.x, altPosition.y, this.currentSugarConfig);
                this.createConnection(parentSugar, childSugar);
            }
        } else {
            const childSugar = this.createSugar(newX, newY, this.currentSugarConfig);
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
        const shape = this.createSugarShape(x, y, config.shape, config.color);
        shape.classList.add('sugar-shape');
        sugarGroup.appendChild(shape);
        
        // Add to canvas
        this.canvas.appendChild(sugarGroup);
        
        return sugarGroup;
    }
    
    createSugarShape(x, y, shape, color, size = null) {
        const actualSize = size !== null ? size : this.sugarRadius;
        const strokeColor = this.darkenColor(color, 20);
        
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
        text.classList.add('selected');
        
        // Update style panel for text selection
        this.updateStylePanel();
    }
    
    deselectText() {
        if (this.selectedText) {
            this.selectedText.classList.remove('selected');
            this.selectedText = null;
        }
    }
    
    deselectAll() {
        this.deselectSugar();
        this.deselectText();
        this.deselectMultipleSugars();
        
        // Update style panel when deselecting
        if (this.currentTool === 'select') {
            this.updateStylePanel();
        }
    }
    
    deselectMultipleSugars() {
        this.selectedSugars.forEach(sugar => {
            sugar.classList.remove('selected');
            this.removeSelectionHighlight(sugar);
        });
        this.selectedSugars.clear();
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
        if (preset && this.sfngPresets[preset]) {
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
        
        // Set default styles with !important to override CSS
        textElement.style.setProperty('font-family', 'Arial, sans-serif', 'important');
        textElement.style.setProperty('font-size', '16px', 'important');
        textElement.style.setProperty('fill', '#2c3e50', 'important');
        
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
        
        // Clean up
        this.clearBoxSelectionPreviews();
        if (this.selectionBox) {
            this.canvas.removeChild(this.selectionBox);
            this.selectionBox = null;
        }
        this.isBoxSelecting = false;
        
        // Update style panel for multiple selection
        this.updateStylePanel();
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
        const sugarStyleSection = document.getElementById('sugarStyleSection');
        const connectionStyleSection = document.getElementById('connectionStyleSection');
        const textStyleSection = document.getElementById('textStyleSection');
        const connectionStatus = document.getElementById('connectionStatus');
        
        // If not in select mode, hide all style panels
        if (this.currentTool !== 'select') {
            sugarStyleSection.style.display = 'none';
            connectionStyleSection.style.display = 'none';
            textStyleSection.style.display = 'none';
            return;
        }
        
        if (!sugarStyleSection || !connectionStyleSection || !textStyleSection || !connectionStatus) return;
        
        // Check if any sugars are selected
        const hasSugarsSelected = this.selectedSugar || this.selectedSugars.size > 0;
        const hasTextSelected = this.selectedText;
        
        if (hasSugarsSelected) {
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
            // Show text style section
            textStyleSection.style.display = 'block';
            sugarStyleSection.style.display = 'none';
            connectionStyleSection.style.display = 'none';
            
            // Update current values from selected text
            this.updateTextStyleControlValues();
        } else {
            // Hide all sections when nothing is selected
            sugarStyleSection.style.display = 'none';
            connectionStyleSection.style.display = 'none';
            textStyleSection.style.display = 'none';
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
            
            // Update border width slider
            const shape = referenceSugar.querySelector('.sugar-shape');
            if (shape) {
                const currentWidth = shape.style.strokeWidth || shape.getAttribute('stroke-width') || '2';
                const widthSlider = document.getElementById('sugarBorderWidth');
                const widthValue = document.getElementById('sugarBorderWidthValue');
                if (widthSlider && widthValue) {
                    widthSlider.value = parseFloat(currentWidth);
                    widthValue.textContent = parseFloat(currentWidth);
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
        if (this.currentTool !== 'select') return;
        
        const size = parseFloat(document.getElementById('sugarSize').value);
        
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
        if (this.currentTool !== 'select') return;
        
        const width = document.getElementById('sugarBorderWidth').value;
        const styleBtn = document.querySelector('.border-style-btn.active');
        const style = styleBtn ? styleBtn.dataset.style : 'solid';
        
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
    
    applyConnectionStyle() {
        if (this.currentTool !== 'select') return;
        
        const width = document.getElementById('connectionWidth').value;
        const styleBtn = document.querySelector('.connection-style-btn.active');
        const style = styleBtn ? styleBtn.dataset.style : 'solid';
        
        const connections = this.getConnectionsForSelection();

        connections.forEach(conn => {
            // Use style property with important to override CSS
            conn.style.setProperty('stroke-width', width, 'important');
            
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
    
    applyTextStyle() {
        if (this.currentTool !== 'select') return;
        
        // Only apply to selected text
        if (!this.selectedText) return;
        
        const fontSize = document.getElementById('fontSize').value;
        const fontFamily = document.getElementById('fontFamily').value;
        const textColor = document.getElementById('textColor').value;
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        // Get the text element (selectedText is already the text element)
        const textElement = this.selectedText;
        
        // Apply font size
        textElement.style.setProperty('font-size', fontSize + 'px', 'important');
        
        // Apply font family
        textElement.style.setProperty('font-family', fontFamily, 'important');
        
        // Apply color
        textElement.style.setProperty('fill', textColor, 'important');
        
        // Apply font weight (bold)
        if (boldBtn.classList.contains('active')) {
            textElement.style.setProperty('font-weight', 'bold', 'important');
        } else {
            textElement.style.removeProperty('font-weight');
        }
        
        // Apply font style (italic)
        if (italicBtn.classList.contains('active')) {
            textElement.style.setProperty('font-style', 'italic', 'important');
        } else {
            textElement.style.removeProperty('font-style');
        }
        
        // Apply text decoration (underline)
        if (underlineBtn.classList.contains('active')) {
            textElement.style.setProperty('text-decoration', 'underline', 'important');
        } else {
            textElement.style.removeProperty('text-decoration');
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GlycanDrawer();
});