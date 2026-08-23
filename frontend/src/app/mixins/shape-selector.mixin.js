// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 9378, 9482, 9515, 9535, 9576, 9606, 9621, 9628, 9637, 9649, 9688, 10039, 10253, 10301.
export const shapeSelectorMixin = {
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
    },


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
    },


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
    },


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
    },


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
    },


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
    },


    closeAllDropdowns() {
        document.querySelectorAll('.shape-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    },

    // Map legacy shape names to current shape IDs for backward compatibility

    mapLegacyShape(shape) {
        const shapeMapping = {
            'circle': 'circle-filled',
            'star': 'star-5'
        };
        return shapeMapping[shape] || shape;
    },

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
    },

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
    },
    

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
        
        sugarsToChange.forEach((sugar) => this.reapplySugarRender(sugar));

        // Finish recording the step
        this.finishStep();
    },
    

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
                    // 调试信息
                    
                    if (gradientId) {
                        const gradient = this.canvas.querySelector(`#${gradientId}`);
                        if (gradient) {
                            const stops = gradient.querySelectorAll('stop');
                            if (stops.length >= 2) {
                                // 左半部分保持白色（stop[0]）
                                stops[0].setAttribute('stop-color', 'white');
                                // 右半部分更新为新颜色（stop[1]）
                                stops[1].setAttribute('stop-color', color);
                                }
                        } else {
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
                    if (gradientId) {
                        const gradient = this.canvas.querySelector(`#${gradientId}`);
                        if (gradient) {
                            const stops = gradient.querySelectorAll('stop');
                            if (stops.length >= 2) {
                                // 上半部分更新为新颜色（stop[0]）
                                stops[0].setAttribute('stop-color', color);
                                // 下半部分保持白色（stop[1]）
                                stops[1].setAttribute('stop-color', 'white');
                                }
                        } else {
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
                    if (gradientId) {
                        const gradient = this.canvas.querySelector(`#${gradientId}`);
                        if (gradient) {
                            const stops = gradient.querySelectorAll('stop');
                            if (stops.length >= 2) {
                                // 上半部分保持白色（stop[0]）
                                stops[0].setAttribute('stop-color', 'white');
                                // 下半部分更新为新颜色（stop[1]）
                                stops[1].setAttribute('stop-color', color);
                                }
                        } else {
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
        
        selectedSugars.forEach((sugar) => this.reapplySugarRender(sugar));

        // Finish recording the step
        this.finishStep();
    },
    
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
        
        sugarsToChange.forEach((sugar) => this.reapplySugarRender(sugar));

        // Finish recording the step
        this.finishStep();
    },

    reapplySugarRender(sugar) {
        const preset = sugar.getAttribute("data-render-preset") || "flat";
        const shapeElement = sugar.querySelector(".sugar-shape");
        if (shapeElement) {
            this.applyRenderPreset(
                shapeElement,
                sugar.getAttribute("data-shape"),
                sugar.getAttribute("data-color"),
                preset,
            );
        }
    },

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
    },
    
};
