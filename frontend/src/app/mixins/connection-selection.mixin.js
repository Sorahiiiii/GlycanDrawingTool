// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 10914, 10930, 10956, 11280, 11301, 11314, 11322.
export const connectionSelectionMixin = {
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
        this.refreshLinkageArrows();
    },
    

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
            linkageInput.placeholder = '';
        } else {
            linkageInput.value = '';
            linkageInput.placeholder = '';
        }
        
        // Update connection style controls
        this.updateConnectionControlValues();
    },


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
    },


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
    },


    deselectConnection(connection) {
        // Remove from both unified and legacy selection sets
        this.selectedElements.delete(connection);
        this.selectedConnections.delete(connection);
        connection.classList.remove('selected');
        
        // Update linkage input field and controls
        this.updateLinkageInput();
        
        // Update right panel to show/hide linkage controls
        this.updateRightPanel();
    },
    

    toggleConnectionSelection(connection, multiSelect = false) {
        if (this.selectedConnections.has(connection)) {
            this.deselectConnection(connection);
        } else {
            this.selectConnection(connection, multiSelect);
        }
    },


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
    },

    // Keyboard event handlers
};
