import { loadPreferences, savePreference } from "../../core/preferences.js";

// Feature mixin extracted mechanically from js/script.js.
// setupStyleControls() was split into focused setup helpers while preserving
// the original handler code and event ordering.
export const styleControlsMixin = {
    setupStyleControls() {
        this.setupSugarStyleControls();
        this.setupConnectionStyleControls();
        this.setupTextStyleControls();
        this.setupSelectionColorAndLinkageControls();
        this.setupLinkageSelectionControls();
        this.setupAddModeLinkageControls();
        this.setupLegacyShapeAndColorControls();

        const renderPresetButtons = document.querySelectorAll("[data-render-preset]");
        renderPresetButtons.forEach((button) => {
            button.addEventListener("click", () => {
                savePreference("renderPreset", button.dataset.renderPreset);
                renderPresetButtons.forEach((candidate) => {
                    candidate.classList.toggle("active", candidate === button);
                });
            });
        });

        const preferences = loadPreferences();
        const gridVisibleToggle = document.getElementById("gridVisibleToggle");
        const snapEnabledToggle = document.getElementById("snapEnabledToggle");

        if (gridVisibleToggle) {
            gridVisibleToggle.checked = preferences.gridVisible;
            gridVisibleToggle.addEventListener("change", () => {
                savePreference("gridVisible", gridVisibleToggle.checked);
                this.updateGridBackground();
            });
        }

        if (snapEnabledToggle) {
            snapEnabledToggle.checked = preferences.snapEnabled;
            snapEnabledToggle.addEventListener("change", () => {
                savePreference("snapEnabled", snapEnabledToggle.checked);
            });
        }
    },

    setupSugarStyleControls() {
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
        
    },

    setupConnectionStyleControls() {
        // Connection line style controls
        const connectionWidth = document.getElementById('connectionStrokeWidth');
        const connectionWidthValue = document.getElementById('connectionStrokeWidthValue');
        const connectionStyleButtons = document.querySelectorAll('#linkageControlsSection .connection-style-btn:not([data-display-mode])');
        
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
        
    },

    setupTextStyleControls() {
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
            // Ensure hex input shows normalized uppercase #RRGGBB when picker changes
            if (textColorHex) textColorHex.value = this.normalizeColorToHex(color);
            
            if (this.currentTool === 'text') {
                // 文本工具模式：只更新配置，不应用到任何元素
                this.currentTextConfig.color = this.normalizeColorToHex(color);
            } else if (this.currentTool === 'select') {
                // 选择模式：使用统一的样式应用方法，确保为一个undo步骤
                this.applyTextStyle();
            }
        });
        
        textColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            // If the user typed a syntactically valid hex (3 or 6 digits, with or without '#'),
            // update the color picker to preview but do NOT apply or record undo here.
            if (this.isValidHexColor(color)) {
                const normalized = this.normalizeColorToHex(color);
                if (textColor) textColor.value = normalized;
                // Do not call applyTextStyle() here; finalization happens on blur/Enter
            }
        });
        // Finalize text hex input on blur or Enter: normalize, write uppercase #RRGGBB, and dispatch picker input
        textColorHex.addEventListener('blur', (e) => {
            const normalized = this.normalizeColorToHex(e.target.value);
            e.target.value = normalized;
            if (textColor) {
                textColor.value = normalized;
                try { textColor.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
            }
        });
        textColorHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
        
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
        
    },

    setupSelectionColorAndLinkageControls() {
        // Sugar border color controls
        const sugarBorderColor = document.getElementById('sugarBorderColor');
        const sugarBorderColorHex = document.getElementById('sugarBorderColorHex');
        
        sugarBorderColor.addEventListener('input', (e) => {
            const color = e.target.value;
            // Use normalized color when picker changes
            const normalized = this.normalizeColorToHex(color);
            if (sugarBorderColorHex) sugarBorderColorHex.value = normalized;
            sugarBorderColor.classList.remove('mixed');
            sugarBorderColorHex.classList.remove('mixed');
            if (this.currentTool === 'add') {
                this.currentSugarConfig.borderColor = normalized;
            } else if (this.currentTool === 'select') {
                this.applySugarBorderColor(normalized);
            }
        });
        
        sugarBorderColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            if (this.isValidHexColor(color)) {
                const normalized = this.normalizeColorToHex(color);
                if (sugarBorderColor) sugarBorderColor.value = normalized;
                // Do not apply here; blur/Enter will finalize and trigger picker input
            }
        });
        sugarBorderColorHex.addEventListener('blur', (e) => {
            const normalized = this.normalizeColorToHex(e.target.value);
            e.target.value = normalized;
            const picker = document.getElementById('sugarBorderColor');
            if (picker) {
                picker.value = normalized;
                try { picker.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
            }
        });
        sugarBorderColorHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
        
        // Connection color controls
        const connectionColor = document.getElementById('connectionColor');
        const connectionColorHex = document.getElementById('connectionColorHex');
        
        connectionColor.addEventListener('input', (e) => {
            const color = e.target.value;
            // Ensure hex field displays normalized uppercase hex when picker changes
            if (connectionColorHex) connectionColorHex.value = this.normalizeColorToHex(color);
            
            if (this.currentTool === 'add') {
                // 添加模式：只更新配置，不应用到任何元素
                // Store normalized hex in config
                this.currentLinkageConfig.strokeColor = this.normalizeColorToHex(color);
            } else if (this.currentTool === 'select') {
                // 选择模式：只应用到选中元素，不更新配置
                this.startStep('Change connection color');
                this.applyConnectionStyle();
                this.finishStep();
            }
        });
        
        connectionColorHex.addEventListener('input', (e) => {
            const color = e.target.value;
            // Preview only while typing: accept 3- or 6-digit hex (with/without #)
            if (this.isValidHexColor(color)) {
                const normalized = this.normalizeColorToHex(color);
                if (connectionColor) connectionColor.value = normalized;
                // Do NOT apply styles or record undo here; finalization occurs on blur/Enter
            }
        });
        connectionColorHex.addEventListener('blur', (e) => {
            const normalized = this.normalizeColorToHex(e.target.value);
            e.target.value = normalized;
            const picker = document.getElementById('connectionColor');
            if (picker) {
                picker.value = normalized;
                try { picker.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
            }
        });
        connectionColorHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
        
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
                if (this.currentTool === 'select') {
                    this.startStep('Change linkage text color');
                    this.linkageTextColorDragging = true;
                    const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                    this.initialConnectionStatesForTextColor = selectedConnections.map(conn => {
                        const beforeData = this.createObjectData(conn);
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
                if (linkageTextColor) {
                    linkageTextColor.value = this.normalizeColorToHex(color);
                    if (linkageTextColorHex) linkageTextColorHex.value = this.normalizeColorToHex(color);
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
                if (linkageTextColorHex) linkageTextColorHex.value = this.normalizeColorToHex(color);
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
            // Preview-only while typing: update the picker for live preview but do not apply or record undo here.
            linkageTextColorHex.addEventListener('input', (e) => {
                const color = e.target.value;
                if (this.isValidHexColor(color)) {
                    const normalized = this.normalizeColorToHex(color);
                    if (linkageTextColor) linkageTextColor.value = normalized;
                    linkageTextColorButtons.forEach(b => b.classList.remove('active'));
                    // Do not call applyLinkageStyle() here; finalization on blur/Enter will apply and record a step
                }
            });

            // Finalize on blur: normalize, apply via the picker, and record a single undo step
            linkageTextColorHex.addEventListener('blur', (e) => {
                const raw = e.target.value;
                const normalized = this.normalizeColorToHex(raw);
                e.target.value = normalized;

                // If not in select mode, just update the add-mode config via picker and return
                if (this.currentTool === 'add') {
                    // update config
                    this.currentLinkageConfig.textColor = normalized;
                    if (linkageTextColor) {
                        linkageTextColor.value = normalized;
                        try { linkageTextColor.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
                    }
                    return;
                }

                // In select mode, record a single undo step for the change
                const selectedConnections = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'connection');
                if (selectedConnections.length === 0) return;

                // Capture before snapshots
                const beforeStates = selectedConnections.map(conn => ({ id: conn.id, beforeData: this.createObjectData(conn) }));

                // Start step, apply via picker input (picker handler will update DOM)
                this.startStep('Change linkage text color');
                if (linkageTextColor) {
                    linkageTextColor.value = normalized;
                    try { linkageTextColor.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
                }

                // Capture after snapshots and record modifications
                beforeStates.forEach(state => {
                    const conn = document.getElementById(state.id);
                    if (conn) {
                        const afterData = this.createObjectData(conn);
                        this.recordObjectModified(state.id, state.beforeData, afterData);
                    }
                });
                this.finishStep();
            });

            // Enter confirms (same as blur)
            linkageTextColorHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
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
        
    },

    setupLinkageSelectionControls() {
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

        const displayModeButtons = document.querySelectorAll("#linkageControlsSection [data-display-mode]");
        displayModeButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const connections = this.getEffectiveSelectedConnections();
                if (connections.length === 0) {
                    return;
                }

                this.startStep("Change linkage display mode");
                connections.forEach((connection) => {
                    const beforeData = this.createObjectData(connection);
                    connection.setAttribute("data-linkage-display-mode", button.dataset.displayMode);
                    this.updateLinkageText(connection);
                    const afterData = this.createObjectData(connection);
                    this.recordObjectModified(connection.getAttribute("id"), beforeData, afterData);
                });
                this.finishStep();
                displayModeButtons.forEach((b) => b.classList.toggle("active", b === button));
            });
        });
    },

    setupAddModeLinkageControls() {
        const linkageInputAdd = document.getElementById('linkageInputAdd');
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
        const connectionStyleButtonsAdd = document.querySelectorAll('#linkagePreselectionSection .connection-style-buttons .connection-style-btn:not([data-display-mode])');
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
                const color = e.target.value;
                if (this.isValidHexColor(color)) {
                    const normalized = this.normalizeColorToHex(color);
                    if (connectionColorAdd) connectionColorAdd.value = normalized;
                    // Do not set config here; finalize on blur/Enter
                }
            });
            connectionColorAddHex.addEventListener('blur', (e) => {
                const normalized = this.normalizeColorToHex(e.target.value);
                e.target.value = normalized;
                this.currentLinkageConfig.strokeColor = normalized;
                const picker = document.getElementById('connectionColorAdd');
                if (picker) {
                    picker.value = normalized;
                    try { picker.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
                }
                connectionColorAddButtons.forEach(btn => { btn.classList.toggle('active', btn.dataset.color === normalized); });
            });
            connectionColorAddHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
        }
        
        connectionColorAddButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                const normalized = this.normalizeColorToHex(color);
                this.currentLinkageConfig.strokeColor = normalized;
                if (connectionColorAdd) connectionColorAdd.value = normalized;
                if (connectionColorAddHex) connectionColorAddHex.value = normalized;
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
                const normalized = this.normalizeColorToHex(e.target.value);
                this.currentLinkageConfig.textColor = normalized;
                if (linkageTextColorAddHex) linkageTextColorAddHex.value = normalized;
                // Update active state
                linkageTextColorAddButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.color === normalized);
                });
            });
        }
        
        if (linkageTextColorAddHex) {
            linkageTextColorAddHex.addEventListener('input', (e) => {
                const color = e.target.value;
                if (this.isValidHexColor(color)) {
                    const normalized = this.normalizeColorToHex(color);
                    if (linkageTextColorAdd) linkageTextColorAdd.value = normalized;
                    // Do not set config here; finalize on blur/Enter
                }
            });
            linkageTextColorAddHex.addEventListener('blur', (e) => {
                const normalized = this.normalizeColorToHex(e.target.value);
                e.target.value = normalized;
                this.currentLinkageConfig.textColor = normalized;
                const picker = document.getElementById('linkageTextColorAdd');
                if (picker) {
                    picker.value = normalized;
                    try { picker.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
                }
                linkageTextColorAddButtons.forEach(btn => { btn.classList.toggle('active', btn.dataset.color === normalized); });
            });
            linkageTextColorAddHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
        }
        
        linkageTextColorAddButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                const normalized = this.normalizeColorToHex(color);
                this.currentLinkageConfig.textColor = normalized;
                if (linkageTextColorAdd) linkageTextColorAdd.value = normalized;
                if (linkageTextColorAddHex) linkageTextColorAddHex.value = normalized;
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

        const displayModeButtonsAdd = document.querySelectorAll("#linkagePreselectionSection [data-display-mode]");
        displayModeButtonsAdd.forEach((button) => {
            button.addEventListener("click", () => {
                this.currentLinkageConfig.displayMode = button.dataset.displayMode;
                displayModeButtonsAdd.forEach((b) => b.classList.toggle("active", b === button));
            });
        });
        
        // ===== End Add Mode Linkage Controls =====
    },

    setupLegacyShapeAndColorControls() {
        const linkageConnectionColor = document.getElementById('connectionColor');
        // Color buttons for linkage mode
        const linkageColorButtons = document.querySelectorAll('[data-target="connectionColor"]');
        linkageColorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (linkageConnectionColor) {
                    linkageConnectionColor.value = color;
                    const connectionColorHex = document.getElementById('connectionColorHex');
                    if (connectionColorHex) connectionColorHex.value = this.normalizeColorToHex(color);
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
                    const normalized = this.normalizeColorToHex(color);
                    colorPicker.value = normalized;
                    // Clear mixed state
                    colorPicker.classList.remove('mixed');
                    
                    // Trigger change event to update the application
                    colorPicker.dispatchEvent(new Event('input'));
                }
                
                if (colorHex) {
                    colorHex.value = this.normalizeColorToHex(color);
                    colorHex.classList.remove('mixed');
                }
            });
        });
    },
};
