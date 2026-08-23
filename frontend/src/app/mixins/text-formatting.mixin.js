// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 12329, 12349, 12376, 12405, 12414, 12423, 12457.
export const textFormattingMixin = {
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
    },
    

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
    },

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
    },
    

    toggleSuperscript() {
        // Temporarily disabled: superscript toggling causes inconsistent
        // text transformations and interferes with undo/redo in some cases.
        // The original implementation is kept in version history. To
        // re-enable, restore the original body (call applyTextTransform)
        // or remove this early return.
        return;
    },
    

    toggleSubscript() {
        // Temporarily disabled: subscript toggling causes inconsistent
        // text transformations and interferes with undo/redo in some cases.
        // The original implementation is kept in version history. To
        // re-enable, restore the original body (call applyTextTransform)
        // or remove this early return.
        return;
    },
    

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
    },
    

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
    },
    
    // Copy helper methods
};
