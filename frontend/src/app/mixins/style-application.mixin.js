// Feature mixin extracted mechanically from js/script.js.
import { getMixedRenderPreset } from "../../core/render-presets.js";

// Original line ranges: 7903, 7927, 8005, 8122, 8136, 8178, 8246, 8270, 8293, 8310, 8327, 8344, 8360, 8392, 8422, 8437, 8474, 8684, 8793, 8826, 8844, 8885, 8950, 9014, 9072, 9116, 9146, 9163, 9277, 9304, 9322, 9340.
export const styleApplicationMixin = {
    getEffectiveSelectedConnections() {
        const set = new Set(this.getSelectedElementsByType("connection"));
        this.getSelectedElementsByType("sugar").forEach((sugar) => {
            document.querySelectorAll(".connection").forEach((connection) => {
                const startId = connection.getAttribute("data-start");
                const endId = connection.getAttribute("data-end");
                if (startId === sugar.getAttribute("id") || endId === sugar.getAttribute("id")) {
                    set.add(connection);
                }
            });
        });
        return Array.from(set);
    },

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
    },

    // Style control methods

    updateStylePanel() {
        if (!this.renderPresetButtonsWired) {
            const renderPresetButtons = document.querySelectorAll("[data-render-preset]");
            renderPresetButtons.forEach((button) => {
                button.addEventListener("click", () => {
                    this.applyRenderPresetToSelection(button.dataset.renderPreset);
                });
            });
            this.renderPresetButtonsWired = true;
        }
        this.updateRightPanel();
    },

    applyRenderPresetToSelection(preset) {
        if (this.currentTool === "add") {
            this.currentSugarConfig.renderPreset = preset;
            return;
        }

        const selectedSugars = this.getSelectedElementsByType("sugar");
        if (selectedSugars.length === 0) return;

        this.startStep("Change sugar render");
        selectedSugars.forEach((sugar) => {
            const beforeData = this.createObjectData(sugar);
            sugar.setAttribute("data-render-preset", preset);
            this.applyRenderPreset(sugar.querySelector(".sugar-shape"), sugar.getAttribute("data-shape"), sugar.getAttribute("data-color"), preset);
            const afterData = this.createObjectData(sugar);
            this.recordObjectModified(sugar.getAttribute("id"), beforeData, afterData);
        });
        this.finishStep();
    },

    syncRenderButtonsForSelection(selectedSugars) {
        if (!selectedSugars || selectedSugars.length === 0) return;

        const values = selectedSugars.map((sugar) => sugar.getAttribute("data-render-preset") || "flat");
        const state = getMixedRenderPreset(values);
        document.querySelectorAll("[data-render-preset]").forEach((button) => {
            const isActive = state !== "mixed" && button.dataset.renderPreset === state;
            button.classList.toggle("active", isActive);
            button.classList.remove("mixed");
        });
    },
    

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

            this.syncAddModeSugarUI(config);
            
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
    },

    syncAddModeSugarUI(config = this.currentSugarConfig || {}) {
        const shape = this.mapLegacyShape?.(config.shape) || config.shape || 'circle-filled';
        const fillColor = this.normalizeColorToHex(config.color || '#0072BC');
        const borderColor = this.normalizeColorToHex(config.borderColor || '#000000');
        const borderStyle = config.borderStyle || 'solid';

        document.querySelectorAll('.shape-main-btn').forEach((button) => {
            button.classList.toggle('active', button.dataset.shape === shape);
        });
        document.querySelectorAll('.shape-dropdown-item').forEach((item) => {
            const active = item.dataset.shape === shape;
            item.classList.toggle('active', active);
            const category = item.closest('.shape-category');
            if (category) {
                category.classList.toggle('active', active);
                const mainButton = category.querySelector('.shape-main-btn');
                if (mainButton) mainButton.classList.toggle('active', active);
            }
        });
        document.querySelectorAll('.color-btn').forEach((button) => {
            button.classList.toggle('active', button.dataset.color === fillColor);
        });
        document.querySelectorAll('.preset-item').forEach((item) => {
            item.classList.toggle('active', item.dataset.preset === config.preset);
        });
        document.querySelectorAll('.border-style-btn').forEach((button) => {
            button.classList.toggle('active', button.dataset.style === borderStyle);
        });
        document.querySelectorAll('.color-btn-compact[data-target="sugarBorderColor"]').forEach((button) => {
            button.classList.toggle('active', button.dataset.color === borderColor);
        });
    },
    

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
    },
    

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
    },
    

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
    },
    

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
    },
    
    // Helper method to extract color from gradient reference or direct color

    getEffectiveFillColor(element) {
        const fill = element.style.fill || element.getAttribute('fill');
        if (!fill) return '#0072BC';
        
        // Check if it's a gradient reference
        const gradientMatch = fill.match(/url\(["']?#([^"')]+)["']?\)/);
        if (gradientMatch) {
            const gradientId = gradientMatch[1];
            const gradient = this.canvas.querySelector('#' + gradientId);
            if (gradient) {
                // Return the last non-white stop, which is the actual user color
                // for regular render gradients and divided-shape gradients alike.
                const stops = gradient.querySelectorAll('stop');
                const coloredStops = Array.from(stops).filter((stop) => {
                    const stopColor = this.normalizeColorToHex(stop.getAttribute('stop-color'));
                    return stopColor !== '#FFFFFF';
                });
                if (coloredStops.length > 0) {
                    return coloredStops[coloredStops.length - 1].getAttribute('stop-color') || '#0072BC';
                }
            }
        }
        
        // Return direct color
        return fill;
    },
    
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
    },
    
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
    },
    
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
    },
    
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
    },
    

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
    },
    

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
    },
    
    // Apply sugar size without creating undo step (used during slider drag)

    applySugarSizeWithoutStep() {
        const size = parseFloat(document.getElementById('sugarSize').value);
        
        // Apply to selected sugar(s) in select mode
        if (this.currentTool !== 'select') return;
        
        // Get selected sugars from the unified selectedElements system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) return;
        
        this.applySugarSizeToElements(selectedSugars, size, false);
    },
    
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
        selectedSugars.forEach((sugar) => this.reapplySugarRender(sugar));
    },
    

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
    },
    

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
    },


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
    },
    
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
    },
    
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
        selectedSugars.forEach((sugar) => this.reapplySugarRender(sugar));
    },


    applySugarBorderColor(color) {
        // Skip if we're updating UI controls
        if (this.isUpdatingUI) return;
        
        // Update current configuration for add mode
        if (this.currentTool === 'add') {
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.borderColor = this.normalizeColorToHex(color);
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
        selectedSugars.forEach((sugar) => this.reapplySugarRender(sugar));
        
        // Finish recording step
        this.finishStep();
    },


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
        selectedSugars.forEach((sugar) => this.reapplySugarRender(sugar));
        
        // Finish recording step
        this.finishStep();
    },
    

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
                const shapeType = sugar.getAttribute('data-shape');

                // If this is a divided/grouped shape, apply fill-opacity to the polygon child
                if ((shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) ||
                    (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) ||
                    (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) ||
                    (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group'))) {
                    const polygon = shape.querySelector('polygon');
                    if (polygon) {
                        polygon.style.setProperty('fill-opacity', opacity, 'important');
                    }
                } else {
                    // Regular shapes: apply directly
                    shape.style.setProperty('fill-opacity', opacity, 'important');
                }
            }
            
            // Record after state
            const afterData = this.createObjectData(sugar);
            this.recordObjectModified(sugar.getAttribute('id'), beforeData, afterData);
        });
        selectedSugars.forEach((sugar) => this.reapplySugarRender(sugar));
        
        // Finish recording step
        this.finishStep();
    },
    

    applyConnectionStyle() {
        // Prevent applying style during UI updates
        if (this.isUpdatingUI) return;
        
        // Only work in select mode with selected connections
        if (this.currentTool !== 'select') return;
        
        const width = document.getElementById('connectionStrokeWidth')?.value || '2';
        const color = document.getElementById('connectionColor')?.value || '#000000';
        
        const styleBtn = document.querySelector('.connection-style-btn.active');
        const style = styleBtn ? styleBtn.dataset.style : 'solid';
        
        const connections = this.getEffectiveSelectedConnections();
        
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
    },
    

    applyConnectionOpacity() {
        // Prevent applying opacity during UI updates
        if (this.isUpdatingUI) return;
        
        // Only work in select mode with selected connections
        if (this.currentTool !== 'select') return;
        
        const opacity = document.getElementById('linkageOpacity')?.value || '1';
        const connections = this.getEffectiveSelectedConnections();
        
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
    },
    

    applyConnectionOpacityWithoutStep() {
        // Prevent applying opacity during UI updates
        if (this.isUpdatingUI) return;
        
        // Only work in select mode with selected connections
        if (this.currentTool !== 'select') return;
        
        const opacity = document.getElementById('linkageOpacity')?.value || '1';
        const connections = this.getEffectiveSelectedConnections();
        
        if (connections.length === 0) return;

        connections.forEach(conn => {
            conn.style.setProperty('stroke-opacity', opacity, 'important');
        });
    },
    

    applyLinkageStyle() {
        // Prevent applying styles during UI updates (e.g., undo/redo operations)
        if (this.isUpdatingUI) {
            return;
        }
        
        // Only work in select mode
        if (this.currentTool !== 'select') return;
        
        const textSize = document.getElementById('linkageTextSize')?.value || '12';
        const textColor = document.getElementById('linkageTextColor')?.value || '#000000';
        const textFontFamily = document.getElementById('linkageTextFontFamily')?.value || 'Arial';
        const textOpacity = document.getElementById('linkageTextOpacity')?.value || '1';
        
        // Get text style states
        const textBold = document.getElementById('linkageTextBoldBtn')?.classList.contains('active') || false;
        const textItalic = document.getElementById('linkageTextItalicBtn')?.classList.contains('active') || false;
        const textUnderline = document.getElementById('linkageTextUnderlineBtn')?.classList.contains('active') || false;
        
        // Apply styles to selected connections (use unified selection system)
        const connections = this.getEffectiveSelectedConnections();
            if (connections.length === 0) return;

            connections.forEach(conn => {
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
                // If we have initialConnectionStatesForTextColor (started on mousedown), record modification now
                try {
                    // color
                    if (this.initialConnectionStatesForTextColor && Array.isArray(this.initialConnectionStatesForTextColor)) {
                        const state = this.initialConnectionStatesForTextColor.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            const afterData = this.createObjectData(conn);
                            this.recordObjectModified(conn.id, state.beforeData, afterData);
                            state._recorded = true;
                        }
                    }
                    // size
                    if (this.initialConnectionStatesForTextSize && Array.isArray(this.initialConnectionStatesForTextSize)) {
                        const state = this.initialConnectionStatesForTextSize.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            const afterData = this.createObjectData(conn);
                            this.recordObjectModified(conn.id, state.beforeData, afterData);
                            state._recorded = true;
                        }
                    }
                    // font family
                    if (this.initialConnectionStatesForTextFontFamily && Array.isArray(this.initialConnectionStatesForTextFontFamily)) {
                        const state = this.initialConnectionStatesForTextFontFamily.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            const afterData = this.createObjectData(conn);
                            this.recordObjectModified(conn.id, state.beforeData, afterData);
                            state._recorded = true;
                        }
                    }
                    // opacity
                    if (this.initialConnectionStatesForTextOpacity && Array.isArray(this.initialConnectionStatesForTextOpacity)) {
                        const state = this.initialConnectionStatesForTextOpacity.find(s => s.id === conn.id);
                        if (state && !state._recorded) {
                            const afterData = this.createObjectData(conn);
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
    },


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

        const connections = this.getEffectiveSelectedConnections();
        connections.forEach(conn => {
            this.updateLinkageText(conn, textSize, textColor, textFontFamily, textBold, textItalic, textUnderline, textOpacity);
            conn.setAttribute('data-text-size', textSize);
            conn.setAttribute('data-text-color', textColor);
            conn.setAttribute('data-text-font-family', textFontFamily);
            conn.setAttribute('data-text-bold', textBold ? 'true' : 'false');
            conn.setAttribute('data-text-italic', textItalic ? 'true' : 'false');
            conn.setAttribute('data-text-underline', textUnderline ? 'true' : 'false');
            conn.setAttribute('data-text-opacity', textOpacity);
        });
    },
    
    // Apply linkage text visibility to selected connections

    applyLinkageVisibility() {
        if (this.currentTool !== 'select') return;
        
        const showLinkageText = document.getElementById('showLinkageText')?.checked;
        
        // Apply visibility setting to selected connections
        const connections = this.getEffectiveSelectedConnections();
        connections.forEach(conn => {
                // Set data attribute to control visibility
                conn.setAttribute('data-linkage-visible', showLinkageText ? 'true' : 'false');
                
                // Update the linkage text display
                this.updateLinkageText(conn);
            });
    },
    
    // Apply linkage information to selected connections

    applyLinkageToConnections(linkage) {
        const selectedConnections = this.getEffectiveSelectedConnections();

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
    },
    

    reverseLinkageDirection() {
        const selectedConnections = this.getEffectiveSelectedConnections();

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
    },
    
    // Initialize the new shape selector system
};
