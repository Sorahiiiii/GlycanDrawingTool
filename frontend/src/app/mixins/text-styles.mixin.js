// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 10317, 10398, 10466, 10491, 10516, 10542.
export const textStylesMixin = {
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
    },
    
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
    },
    

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
    },
    

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
    },
    

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
    },
    

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
    },
    
    // Lasso selection methods (removed) --- IGNORE ---
    
    // Zoom Control Setup
};
