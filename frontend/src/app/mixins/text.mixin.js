// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 5299, 5314, 5370, 5450, 5459, 5472.
export const textMixin = {
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
    },
    

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
        let textConfig = { fontSize: 16, fontFamily: 'SimHei, Arial, sans-serif', color: '#2c3e50', opacity: 1, bold: false, italic: false, underline: false };
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
    },
    

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
    },
    

    finishTextEditing() {
        // Find any active text input boxes and finish their editing
        const textInputs = document.querySelectorAll('.text-input-box');
        textInputs.forEach(input => {
            // Trigger blur event to save the text
            input.blur();
        });
    },
    

    moveText(textElement, newX, newY) {
        textElement.setAttribute('x', newX);
        textElement.setAttribute('y', newY);
        textElement.setAttribute('data-x', newX);
        textElement.setAttribute('data-y', newY);
        const rotation = parseFloat(textElement.getAttribute("data-rotation") || "0");
        if (rotation !== 0) {
            this.applyTextRotation?.(textElement, rotation);
        }
        
        // Update highlight position if this text is selected
        if (textElement.classList.contains('selected') || this.selectedTexts.has(textElement)) {
            this.removeTextSelectionHighlight(textElement);
            this.addTextSelectionHighlight(textElement);
        }
    },
    

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
    },
    
};
