// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 12476, 12493, 12508, 12548, 12569, 12589, 12612, 12694, 12738, 12744, 12844, 13077, 13268, 13302, 13403, 13468.
export const historyMixin = {
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
    },
    

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
    },
    

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
            background: #000000CC;
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
    },
    
    // ===== UNDO/REDO SYSTEM =====
    
    // Start recording a new step

    startStep(description = '') {
        if (this.isRecordingStep) {
            console.warn('Already recording a step, finishing current step first');
            this.finishStep();
        }
        
        this.currentStep = {
            description: description,
            added: [],      // Objects added in this step
            removed: [],    // Objects removed in this step  
            modified: []    // Array of {before, after} for modified objects
        };
        this.isRecordingStep = true;
        // Debug: log when a step begins
        try {
            } catch (e) {
            // ignore
        }
    },
    
    // Record an object addition

    recordObjectAdded(objectData) {
        if (!this.isRecordingStep) {
            this.startStep('Auto-created step');
        }
        // Deep-clone objectData to freeze snapshot
        let cloned = null;
        try {
            cloned = JSON.parse(JSON.stringify(objectData));
        } catch (e) {
            cloned = objectData;
        }

        // Add to objectList
        this.objectList.set(cloned.id, cloned);

        // Record in current step (clone)
        this.currentStep.added.push(cloned);
    },
    
    // Record an object removal

    recordObjectRemoved(objectId) {
        if (!this.isRecordingStep) {
            this.startStep('Auto-created step');
        }
        // Get object data before removal
        const objectData = this.objectList.get(objectId);
        if (objectData) {
            // Deep clone to freeze snapshot
            let cloned = null;
            try {
                cloned = JSON.parse(JSON.stringify(objectData));
            } catch (e) {
                cloned = objectData;
            }
            // Record in current step
            this.currentStep.removed.push(cloned);
            
            // Remove from objectList
            this.objectList.delete(objectId);
        }
    },
    
    // Record an object modification

    recordObjectModified(objectId, beforeData, afterData) {
        if (!this.isRecordingStep) {
            this.startStep('Auto-created step');
        }
        // Debug: log key before/after fields for connections (helps trace color/style steps)
        try {
            const beforeSummary = beforeData && beforeData.type === 'connection' ?
                `conn(before) id=${objectId} textColor=${beforeData.textColor} textBold=${beforeData.textBold} textItalic=${beforeData.textItalic} textUnderline=${beforeData.textUnderline} textSize=${beforeData.textSize}` :
                (beforeData ? `obj(before) id=${objectId} type=${beforeData.type}` : `obj(before) id=${objectId} <null>`);
            const afterSummary = afterData && afterData.type === 'connection' ?
                `conn(after) id=${objectId} textColor=${afterData.textColor} textBold=${afterData.textBold} textItalic=${afterData.textItalic} textUnderline=${afterData.textUnderline} textSize=${afterData.textSize}` :
                (afterData ? `obj(after) id=${objectId} type=${afterData.type}` : `obj(after) id=${objectId} <null>`);
            // Additional tracing for puzzling cases where before/after look identical
            if (beforeData && afterData && beforeData.type === 'connection') {
                // Log current objectList state for this id before update
                try {
                    const existing = this.objectList.get(objectId);
                    } catch (e) {}
                // Log if currentStep already contains a modification for this id
                try {
                    if (this.currentStep && Array.isArray(this.currentStep.modified)) {
                        const prior = this.currentStep.modified.find(m => m.id === objectId);
                        if (prior) {
                            }
                    }
                } catch (e) {}
                // Print a short stack trace to see caller
                try {
                    const stack = (new Error()).stack.split('\n').slice(1,6).join('\n');
                    } catch (e) {}
            }
        } catch (e) {
            // ignore logging errors
        }

        // Deep-clone before/after to freeze snapshots
        let beforeClone = null;
        let afterClone = null;
        try {
            beforeClone = beforeData ? JSON.parse(JSON.stringify(beforeData)) : beforeData;
        } catch (e) {
            beforeClone = beforeData;
        }
        try {
            afterClone = afterData ? JSON.parse(JSON.stringify(afterData)) : afterData;
        } catch (e) {
            afterClone = afterData;
        }

        // Update objectList with cloned data
        this.objectList.set(objectId, afterClone);

        // If this object was already modified earlier in this step, merge by keeping the original 'before'
        // and updating the 'after' to the latest snapshot. This prevents duplicate modification entries.
        try {
            if (this.currentStep && Array.isArray(this.currentStep.modified)) {
                const existingIndex = this.currentStep.modified.findIndex(m => m.id === objectId);
                if (existingIndex !== -1) {
                    // Preserve original 'before', update 'after'
                    this.currentStep.modified[existingIndex].after = afterClone;
                } else {
                    this.currentStep.modified.push({
                        id: objectId,
                        before: beforeClone,
                        after: afterClone
                    });
                }
            } else {
                // Fallback: push normally
                this.currentStep.modified.push({
                    id: objectId,
                    before: beforeClone,
                    after: afterClone
                });
            }
        } catch (e) {
            // On any error, fall back to pushing the record
            try { this.currentStep.modified.push({ id: objectId, before: beforeClone, after: afterClone }); } catch (e) {}
        }
    },
    
    // Finish recording current step and add to undo stack

    finishStep() {
        if (!this.isRecordingStep || !this.currentStep) {
            return;
        }
        
        // Only save step if it has actual changes
        if (this.currentStep.added.length > 0 || 
            this.currentStep.removed.length > 0 || 
            this.currentStep.modified.length > 0) {
            
            // Debug: log modified entries summary before saving
            try {
                const modSummary = this.currentStep.modified.map(m => ({ id: m.id, beforeTextColor: m.before && m.before.textColor, afterTextColor: m.after && m.after.textColor }));
                } catch (e) {}

            // Debug: log modified entries summary before saving
            try {
                const modSummary = this.currentStep.modified.map(m => ({ id: m.id, beforeTextColor: m.before && m.before.textColor, afterTextColor: m.after && m.after.textColor }));
                } catch (e) {}

            // Add to undo stack (deep clone step to prevent later mutation)
            this.undoStack.push(this.currentStep);

            // Clear redo stack when new action is performed
            this.redoStack = [];
            
            // Limit stack size
            if (this.undoStack.length > this.maxHistorySize) {
                this.undoStack.shift();
            }
            
            }
        
        this.currentStep = null;
        this.isRecordingStep = false;
        // Update undo/redo buttons state
        try { this.updateUndoRedoButtons(); } catch (e) {}
    },

    // Update the disabled state of undo/redo buttons

    updateUndoRedoButtons() {
        if (this.undoBtn) this.undoBtn.disabled = this.undoStack.length === 0;
        if (this.redoBtn) this.redoBtn.disabled = this.redoStack.length === 0;
    },
    
    // Create object data from DOM element

    createObjectData(element) {
        const type = this.getElementType(element);
        const id = element.getAttribute('id');
        
        if (type === 'sugar') {
            const shape = element.querySelector('.sugar-shape');
            const polygon = element.querySelector('polygon');
            const line = element.querySelector('line');
            
            return {
                id: id,
                type: 'sugar',
                x: parseFloat(element.getAttribute('data-x')),
                y: parseFloat(element.getAttribute('data-y')),
                shape: element.getAttribute('data-shape'),
                color: element.getAttribute('data-color'),
                size: parseFloat(element.getAttribute('data-size')) || 20,
                preset: element.getAttribute('data-preset'),
                renderPreset: element.getAttribute("data-render-preset"),
                rotation: element.getAttribute("data-rotation") || "0",
                // Store CSS style properties from the shape element (used with !important)
                shapeStyleStroke: shape ? shape.style.stroke : null,
                shapeStyleStrokeWidth: shape ? shape.style.strokeWidth : null,
                shapeStyleStrokeOpacity: shape ? shape.style.strokeOpacity : null,
                shapeStyleStrokeDasharray: shape ? shape.style.strokeDasharray : null,
                shapeStyleFillOpacity: shape ? shape.style.fillOpacity : null,
                // Store CSS style properties for divided shapes (polygon and line)
                polygonStyleStroke: polygon ? polygon.style.stroke : null,
                polygonStyleStrokeWidth: polygon ? polygon.style.strokeWidth : null,
                polygonStyleStrokeOpacity: polygon ? polygon.style.strokeOpacity : null,
                polygonStyleStrokeDasharray: polygon ? polygon.style.strokeDasharray : null,
                lineStyleStroke: line ? line.style.stroke : null,
                lineStyleStrokeWidth: line ? line.style.strokeWidth : null,
                lineStyleStrokeOpacity: line ? line.style.strokeOpacity : null,
                lineStyleStrokeDasharray: line ? line.style.strokeDasharray : null,
                // Store the complete SVG structure
                svg: element.outerHTML
            };
        } else if (type === 'text') {
            return {
                id: id,
                type: 'text',
                x: parseFloat(element.getAttribute('x')),
                y: parseFloat(element.getAttribute('y')),
                content: element.textContent,
                fontSize: element.getAttribute('font-size'),
                fontFamily: element.getAttribute('font-family'),
                fill: element.getAttribute('fill'),
                opacity: element.getAttribute('opacity'),
                rotation: element.getAttribute("data-rotation") || "0",
                fontWeight: element.getAttribute('font-weight'),
                fontStyle: element.getAttribute('font-style'),
                textDecoration: element.getAttribute('text-decoration'),
                // Also store CSS style properties (used with !important)
                styleFontSize: element.style.fontSize,
                styleFontFamily: element.style.fontFamily,
                styleFill: element.style.fill,
                styleFontWeight: element.style.fontWeight,
                styleFontStyle: element.style.fontStyle,
                styleTextDecoration: element.style.textDecoration,
                // Store the complete SVG structure
                svg: element.outerHTML
            };
        } else if (type === 'connection') {
            return {
                id: id,
                type: 'connection',
                x1: parseFloat(element.getAttribute('x1')),
                y1: parseFloat(element.getAttribute('y1')),
                x2: parseFloat(element.getAttribute('x2')),
                y2: parseFloat(element.getAttribute('y2')),
                parentId: element.getAttribute('data-start'),
                childId: element.getAttribute('data-end'),
                strokeWidth: element.getAttribute('stroke-width'),
                stroke: element.getAttribute('stroke'),
                strokeOpacity: element.getAttribute('stroke-opacity'),
                strokeDasharray: element.getAttribute('stroke-dasharray'),
                // Also store CSS style properties (used with !important)
                styleStroke: element.style.stroke,
                styleStrokeWidth: element.style.strokeWidth,
                styleStrokeOpacity: element.style.strokeOpacity,
                styleStrokeDasharray: element.style.strokeDasharray,
                linkage: element.getAttribute('data-linkage'),
                reversed: element.getAttribute('data-reversed') === 'true',
                linkageVisible: element.getAttribute('data-linkage-visible'),
                // Linkage text style properties
                textSize: element.getAttribute('data-text-size'),
                textColor: element.getAttribute('data-text-color'),
                textFontFamily: element.getAttribute('data-text-font-family'),
                // Normalize boolean-style linkage text attributes to explicit 'true'/'false' strings
                textBold: element.getAttribute('data-text-bold') !== null ? element.getAttribute('data-text-bold') : 'false',
                textItalic: element.getAttribute('data-text-italic') !== null ? element.getAttribute('data-text-italic') : 'false',
                textUnderline: element.getAttribute('data-text-underline') !== null ? element.getAttribute('data-text-underline') : 'false',
                textOpacity: element.getAttribute('data-text-opacity'),
                // Store the complete SVG structure
                svg: element.outerHTML
            };
        }
        
        return null;
    },
    
    // Restore object from data to DOM

    restoreObjectFromData(objectData) {
        // Check if element already exists (for modifications)
        const existingElement = document.getElementById(objectData.id);
        if (existingElement) {
            // Update existing element in place
            this.updateElementFromData(existingElement, objectData);
            this.objectList.set(objectData.id, objectData);
            return existingElement;
        } else {
            // Create new element using the normal creation methods
            let newElement;
            
            if (objectData.type === 'sugar') {
                // Use the normal createSugar method to ensure proper setup
                const config = {
                    shape: objectData.shape,
                    color: objectData.color,
                    size: objectData.size,
                    type: objectData.preset ? 'preset' : 'custom',
                    preset: objectData.preset,
                    renderPreset: objectData.renderPreset || "flat",
                    rotation: objectData.rotation || "0",
                };
                
                // Temporarily store the current count to restore the correct ID
                const originalCount = this.sugarCount;
                const targetNum = parseInt(objectData.id.replace('sugar-', ''));
                this.sugarCount = targetNum - 1; // Will be incremented in createSugar
                
                // Temporarily disable step recording during restoration
                const wasRecording = this.isRecordingStep;
                this.isRecordingStep = false;
                
                newElement = this.createSugar(objectData.x, objectData.y, config);
                
                // Restore recording state
                this.isRecordingStep = wasRecording;
                
                // Restore the count if it was higher
                if (originalCount > this.sugarCount) {
                    this.sugarCount = originalCount;
                }
                
                // CRITICAL: Restore CSS style properties for the newly created sugar
                if (newElement) {
                    const shape = newElement.querySelector('.sugar-shape');
                    if (shape) {
                        if (objectData.shapeStyleStroke) shape.style.setProperty('stroke', objectData.shapeStyleStroke, 'important');
                        if (objectData.shapeStyleStrokeWidth) shape.style.setProperty('stroke-width', objectData.shapeStyleStrokeWidth, 'important');
                        if (objectData.shapeStyleStrokeOpacity) shape.style.setProperty('stroke-opacity', objectData.shapeStyleStrokeOpacity, 'important');
                        if (objectData.shapeStyleStrokeDasharray) shape.style.setProperty('stroke-dasharray', objectData.shapeStyleStrokeDasharray, 'important');
                        if (objectData.shapeStyleFillOpacity) shape.style.setProperty('fill-opacity', objectData.shapeStyleFillOpacity, 'important');
                    }
                    
                    // Restore CSS style properties for divided shapes (polygon and line)
                    const polygon = newElement.querySelector('polygon');
                    if (polygon) {
                        if (objectData.polygonStyleStroke) polygon.style.setProperty('stroke', objectData.polygonStyleStroke, 'important');
                        if (objectData.polygonStyleStrokeWidth) polygon.style.setProperty('stroke-width', objectData.polygonStyleStrokeWidth, 'important');
                        if (objectData.polygonStyleStrokeOpacity) polygon.style.setProperty('stroke-opacity', objectData.polygonStyleStrokeOpacity, 'important');
                        if (objectData.polygonStyleStrokeDasharray) polygon.style.setProperty('stroke-dasharray', objectData.polygonStyleStrokeDasharray, 'important');
                    }
                    
                    const line = newElement.querySelector('line');
                    if (line) {
                        if (objectData.lineStyleStroke) line.style.setProperty('stroke', objectData.lineStyleStroke, 'important');
                        if (objectData.lineStyleStrokeWidth) line.style.setProperty('stroke-width', objectData.lineStyleStrokeWidth, 'important');
                        if (objectData.lineStyleStrokeOpacity) line.style.setProperty('stroke-opacity', objectData.lineStyleStrokeOpacity, 'important');
                        if (objectData.lineStyleStrokeDasharray) line.style.setProperty('stroke-dasharray', objectData.lineStyleStrokeDasharray, 'important');
                    }
                }
                
            } else if (objectData.type === 'text') {
                // Temporarily store the current count to restore the correct ID
                const originalCount = this.textCount;
                const targetNum = parseInt(objectData.id.replace('text-', ''));
                this.textCount = targetNum - 1; // Will be incremented in createText
                
                // Temporarily disable step recording during restoration
                const wasRecording = this.isRecordingStep;
                this.isRecordingStep = false;
                
                // Use the normal createText method with autoEdit=false to prevent editing mode during undo/redo
                newElement = this.createText(objectData.x, objectData.y, objectData.content, false);
                
                // Restore recording state
                this.isRecordingStep = wasRecording;
                
                // Restore the count if it was higher
                if (originalCount > this.textCount) {
                    this.textCount = originalCount;
                }
                
                // CRITICAL: Set the correct ID to match the stored data (should already be correct now)
                if (newElement && objectData.id) {
                    newElement.setAttribute('id', objectData.id);
                }
                
                // Update text attributes
                if (objectData.fontSize) newElement.setAttribute('font-size', objectData.fontSize);
                if (objectData.fontFamily) newElement.setAttribute('font-family', objectData.fontFamily);
                if (objectData.fill) newElement.setAttribute('fill', objectData.fill);
                if (objectData.opacity) newElement.setAttribute('opacity', objectData.opacity);
                if (objectData.fontWeight) newElement.setAttribute('font-weight', objectData.fontWeight);
                if (objectData.fontStyle) newElement.setAttribute('font-style', objectData.fontStyle);
                if (objectData.textDecoration) newElement.setAttribute('text-decoration', objectData.textDecoration);
                
                // CRITICAL: Restore CSS style properties with proper empty handling
                if (objectData.styleFontSize) {
                    newElement.style.setProperty('font-size', objectData.styleFontSize, 'important');
                } else if (objectData.hasOwnProperty('styleFontSize')) {
                    newElement.style.removeProperty('font-size');
                }
                
                if (objectData.styleFontFamily) {
                    newElement.style.setProperty('font-family', objectData.styleFontFamily, 'important');
                } else if (objectData.hasOwnProperty('styleFontFamily')) {
                    newElement.style.removeProperty('font-family');
                }
                
                if (objectData.styleFill) {
                    const normalizedFill = this.normalizeColorToHex(objectData.styleFill);
                    newElement.style.setProperty('fill', normalizedFill, 'important');
                } else if (objectData.hasOwnProperty('styleFill')) {
                    newElement.style.removeProperty('fill');
                }
                
                if (objectData.styleFontWeight) {
                    newElement.style.setProperty('font-weight', objectData.styleFontWeight, 'important');
                } else if (objectData.hasOwnProperty('styleFontWeight')) {
                    newElement.style.removeProperty('font-weight');
                }
                
                if (objectData.styleFontStyle) {
                    newElement.style.setProperty('font-style', objectData.styleFontStyle, 'important');
                } else if (objectData.hasOwnProperty('styleFontStyle')) {
                    newElement.style.removeProperty('font-style');
                }
                
                if (objectData.styleTextDecoration) {
                    newElement.style.setProperty('text-decoration', objectData.styleTextDecoration, 'important');
                } else if (objectData.hasOwnProperty('styleTextDecoration')) {
                    newElement.style.removeProperty('text-decoration');
                }
                
            } else if (objectData.type === 'connection') {
                // For connections, we need to find the actual sugar elements
                const parentSugar = document.getElementById(objectData.parentId);
                const childSugar = document.getElementById(objectData.childId);
                
                if (parentSugar && childSugar) {
                    // Temporarily disable step recording during restoration
                    const wasRecording = this.isRecordingStep;
                    this.isRecordingStep = false;
                    
                    // Use the normal createConnection method
                    newElement = this.createConnection(parentSugar, childSugar, true); // Skip default styling
                    
                    // IMPORTANT: Set the correct ID to match the stored data
                    if (newElement && objectData.id) {
                        newElement.setAttribute('id', objectData.id);
                    }
                    
                    // Restore recording state
                    this.isRecordingStep = wasRecording;
                    
                    // Update connection properties if they exist
                    if (newElement) {
                        if (objectData.strokeWidth) newElement.setAttribute('stroke-width', objectData.strokeWidth);
                        if (objectData.stroke) newElement.setAttribute('stroke', objectData.stroke);
                        if (objectData.strokeOpacity) newElement.setAttribute('stroke-opacity', objectData.strokeOpacity);
                        if (objectData.strokeDasharray) newElement.setAttribute('stroke-dasharray', objectData.strokeDasharray);
                        
                        // Restore CSS style properties (used with !important)
                        if (objectData.styleStroke) newElement.style.setProperty('stroke', objectData.styleStroke, 'important');
                        if (objectData.styleStrokeWidth) newElement.style.setProperty('stroke-width', objectData.styleStrokeWidth, 'important');
                        if (objectData.styleStrokeOpacity) newElement.style.setProperty('stroke-opacity', objectData.styleStrokeOpacity, 'important');
                        if (objectData.styleStrokeDasharray) newElement.style.setProperty('stroke-dasharray', objectData.styleStrokeDasharray, 'important');
                        
                        if (objectData.linkage) newElement.setAttribute('data-linkage', objectData.linkage);
                        if (objectData.reversed !== undefined) newElement.setAttribute('data-reversed', objectData.reversed.toString());
                        // IMPORTANT: Set linkage visibility BEFORE updating linkage text
                        if (objectData.linkageVisible !== null && objectData.linkageVisible !== undefined) {
                            newElement.setAttribute('data-linkage-visible', objectData.linkageVisible);
                        }
                        
                        // Update linkage text display based on the restored visibility setting
                        this.updateLinkageText(newElement);
                    }
                } else {
                    console.error('Cannot restore connection: parent or child sugar not found', objectData.parentId, objectData.childId);
                    return null;
                }
            }
            
            // Update objectList
            this.objectList.set(objectData.id, objectData);
            
            // Handle post-restoration updates based on type
            if (objectData.type === 'sugar') {
                // Update counters if needed
                const sugarNum = parseInt(objectData.id.replace('sugar-', ''));
                if (sugarNum >= this.sugarCount) {
                    this.sugarCount = sugarNum;
                }
            } else if (objectData.type === 'text') {
                // Update counters if needed  
                const textNum = parseInt(objectData.id.replace('text-', ''));
                if (textNum >= this.textCount) {
                    this.textCount = textNum;
                }
            }
            
            return newElement;
            
            // Handle post-restoration updates based on type
            if (objectData.type === 'sugar') {
                // Update counters if needed
                const sugarNum = parseInt(objectData.id.replace('sugar-', ''));
                if (sugarNum >= this.sugarCount) {
                    this.sugarCount = sugarNum;
                }
            } else if (objectData.type === 'text') {
                // Update counters if needed  
                const textNum = parseInt(objectData.id.replace('text-', ''));
                if (textNum >= this.textCount) {
                    this.textCount = textNum;
                }
            }
            
            return importedElement;
        }
    },
    
    // Update existing element from object data

    updateElementFromData(element, objectData) {
        if (objectData.type === 'sugar') {
            // Get current position before updating
            const oldX = parseFloat(element.getAttribute('data-x'));
            const oldY = parseFloat(element.getAttribute('data-y'));
            
            // Update sugar position and attributes
            element.setAttribute('data-x', objectData.x);
            element.setAttribute('data-y', objectData.y);
            element.setAttribute('data-shape', objectData.shape);
            element.setAttribute('data-color', objectData.color);
            element.setAttribute('data-size', objectData.size);
            if (objectData.preset) {
                element.setAttribute('data-preset', objectData.preset);
            } else {
                element.removeAttribute('data-preset');
            }
            
            // Update the visual shape to match the new attributes
            const shape = element.querySelector('.sugar-shape');
            if (shape) {
                this.updateShapeToType(shape, objectData.shape, objectData.x, objectData.y, objectData.color, objectData.size);
            }
            
            // CRITICAL: Restore CSS style properties for the shape (used with !important)
            if (shape) {
                if (objectData.shapeStyleStroke) shape.style.setProperty('stroke', objectData.shapeStyleStroke, 'important');
                if (objectData.shapeStyleStrokeWidth) shape.style.setProperty('stroke-width', objectData.shapeStyleStrokeWidth, 'important');
                if (objectData.shapeStyleStrokeOpacity) shape.style.setProperty('stroke-opacity', objectData.shapeStyleStrokeOpacity, 'important');
                if (objectData.shapeStyleStrokeDasharray) shape.style.setProperty('stroke-dasharray', objectData.shapeStyleStrokeDasharray, 'important');
                if (objectData.shapeStyleFillOpacity) shape.style.setProperty('fill-opacity', objectData.shapeStyleFillOpacity, 'important');
            }
            
            // CRITICAL: Restore CSS style properties for divided shapes (polygon and line)
            const polygon = element.querySelector('polygon');
            if (polygon) {
                if (objectData.polygonStyleStroke) polygon.style.setProperty('stroke', objectData.polygonStyleStroke, 'important');
                if (objectData.polygonStyleStrokeWidth) polygon.style.setProperty('stroke-width', objectData.polygonStyleStrokeWidth, 'important');
                if (objectData.polygonStyleStrokeOpacity) polygon.style.setProperty('stroke-opacity', objectData.polygonStyleStrokeOpacity, 'important');
                if (objectData.polygonStyleStrokeDasharray) polygon.style.setProperty('stroke-dasharray', objectData.polygonStyleStrokeDasharray, 'important');
            }
            
            const line = element.querySelector('line');
            if (line) {
                if (objectData.lineStyleStroke) line.style.setProperty('stroke', objectData.lineStyleStroke, 'important');
                if (objectData.lineStyleStrokeWidth) line.style.setProperty('stroke-width', objectData.lineStyleStrokeWidth, 'important');
                if (objectData.lineStyleStrokeOpacity) line.style.setProperty('stroke-opacity', objectData.lineStyleStrokeOpacity, 'important');
                if (objectData.lineStyleStrokeDasharray) line.style.setProperty('stroke-dasharray', objectData.lineStyleStrokeDasharray, 'important');
            }

            if (shape) {
                element.setAttribute("data-render-preset", objectData.renderPreset || "flat");
                this.applyRenderPreset(shape, objectData.shape, objectData.color, objectData.renderPreset || "flat");
            }

            element.setAttribute("data-rotation", objectData.rotation || "0");
            if (shape) {
                this.applyShapeRotation?.(element, parseFloat(objectData.rotation || "0"));
            }
            
            // Update connected lines with correct old and new positions
            this.updateConnectedLines(element, oldX, oldY, objectData.x, objectData.y);
            
        } else if (objectData.type === 'text') {
            // Update text position and content
            element.setAttribute('x', objectData.x);
            element.setAttribute('y', objectData.y);
            element.setAttribute('data-x', objectData.x);
            element.setAttribute('data-y', objectData.y);
            element.textContent = objectData.content;
            element.setAttribute("data-rotation", objectData.rotation || "0");
            if (parseFloat(objectData.rotation || "0") !== 0) {
                this.applyTextRotation?.(element, parseFloat(objectData.rotation));
            } else {
                element.removeAttribute("transform");
            }
            
            // Update text styles (attributes)
            if (objectData.fontSize) element.setAttribute('font-size', objectData.fontSize);
            if (objectData.fontFamily) element.setAttribute('font-family', objectData.fontFamily);
            if (objectData.fill) element.setAttribute('fill', objectData.fill);
            if (objectData.opacity) element.setAttribute('opacity', objectData.opacity);
            if (objectData.fontWeight) element.setAttribute('font-weight', objectData.fontWeight);
            if (objectData.fontStyle) element.setAttribute('font-style', objectData.fontStyle);
            if (objectData.textDecoration) element.setAttribute('text-decoration', objectData.textDecoration);
            
            // CRITICAL: Also restore CSS style properties (used with !important)
            if (objectData.styleFontSize) {
                element.style.setProperty('font-size', objectData.styleFontSize, 'important');
            } else if (objectData.hasOwnProperty('styleFontSize')) {
                element.style.removeProperty('font-size');
            }
            
            if (objectData.styleFontFamily) {
                element.style.setProperty('font-family', objectData.styleFontFamily, 'important');
            } else if (objectData.hasOwnProperty('styleFontFamily')) {
                element.style.removeProperty('font-family');
            }
            
            if (objectData.styleFill) {
                const normalizedFill = this.normalizeColorToHex(objectData.styleFill);
                element.style.setProperty('fill', normalizedFill, 'important');
            } else if (objectData.hasOwnProperty('styleFill')) {
                element.style.removeProperty('fill');
            }
            
            if (objectData.styleFontWeight) {
                element.style.setProperty('font-weight', objectData.styleFontWeight, 'important');
            } else if (objectData.hasOwnProperty('styleFontWeight')) {
                element.style.removeProperty('font-weight');
            }
            
            if (objectData.styleFontStyle) {
                element.style.setProperty('font-style', objectData.styleFontStyle, 'important');
            } else if (objectData.hasOwnProperty('styleFontStyle')) {
                element.style.removeProperty('font-style');
            }
            
            if (objectData.styleTextDecoration) {
                element.style.setProperty('text-decoration', objectData.styleTextDecoration, 'important');
            } else if (objectData.hasOwnProperty('styleTextDecoration')) {
                element.style.removeProperty('text-decoration');
            }
            
        } else if (objectData.type === 'connection') {
            // Update connection position and attributes
            element.setAttribute('x1', objectData.x1);
            element.setAttribute('y1', objectData.y1);
            element.setAttribute('x2', objectData.x2);
            element.setAttribute('y2', objectData.y2);
            element.setAttribute('data-parent', objectData.parentId);
            element.setAttribute('data-child', objectData.childId);
            
            // Update connection styles (attributes)
            if (objectData.strokeWidth) element.setAttribute('stroke-width', objectData.strokeWidth);
            if (objectData.stroke) element.setAttribute('stroke', objectData.stroke);
            if (objectData.strokeOpacity) element.setAttribute('stroke-opacity', objectData.strokeOpacity);
            if (objectData.strokeDasharray) element.setAttribute('stroke-dasharray', objectData.strokeDasharray);
            
            // CRITICAL: Also restore CSS style properties (used with !important)
            if (objectData.styleStroke) element.style.setProperty('stroke', objectData.styleStroke, 'important');
            if (objectData.styleStrokeWidth) element.style.setProperty('stroke-width', objectData.styleStrokeWidth, 'important');
            if (objectData.styleStrokeOpacity) element.style.setProperty('stroke-opacity', objectData.styleStrokeOpacity, 'important');
            if (objectData.styleStrokeDasharray) {
                element.style.setProperty('stroke-dasharray', objectData.styleStrokeDasharray, 'important');
            } else if (objectData.hasOwnProperty('styleStrokeDasharray')) {
                element.style.removeProperty('stroke-dasharray');
            }
            
            if (objectData.linkage) element.setAttribute('data-linkage', objectData.linkage);
            element.setAttribute('data-reversed', objectData.reversed ? 'true' : 'false');
            if (objectData.linkageVisible !== null && objectData.linkageVisible !== undefined) {
                element.setAttribute('data-linkage-visible', objectData.linkageVisible);
            }
            
            // Restore linkage text style attributes (handle explicit false/null and removal)
            if (objectData.textSize !== null && objectData.textSize !== undefined) {
                element.setAttribute('data-text-size', objectData.textSize);
            } else {
                element.removeAttribute('data-text-size');
            }
            if (objectData.textColor !== null && objectData.textColor !== undefined) {
                element.setAttribute('data-text-color', objectData.textColor);
            } else {
                element.removeAttribute('data-text-color');
            }
            if (objectData.textFontFamily !== null && objectData.textFontFamily !== undefined) {
                element.setAttribute('data-text-font-family', objectData.textFontFamily);
            } else {
                element.removeAttribute('data-text-font-family');
            }
            if (objectData.textBold !== null && objectData.textBold !== undefined) {
                element.setAttribute('data-text-bold', objectData.textBold);
            } else {
                element.removeAttribute('data-text-bold');
            }
            if (objectData.textItalic !== null && objectData.textItalic !== undefined) {
                element.setAttribute('data-text-italic', objectData.textItalic);
            } else {
                element.removeAttribute('data-text-italic');
            }
            if (objectData.textUnderline !== null && objectData.textUnderline !== undefined) {
                element.setAttribute('data-text-underline', objectData.textUnderline);
            } else {
                element.removeAttribute('data-text-underline');
            }
            if (objectData.textOpacity !== null && objectData.textOpacity !== undefined) {
                element.setAttribute('data-text-opacity', objectData.textOpacity);
            } else {
                element.removeAttribute('data-text-opacity');
            }

            // Update linkage text display after restoring attributes so visual <text> elements reflect restored values
            this.updateLinkageText(element);

            // If this connection is currently selected, ensure the linkage controls/buttons sync to the restored data
            try {
                if (this.selectedConnections && this.selectedConnections.has(element)) {
                    this.updateLinkageControlsFromSelection();
                }
            } catch (e) {
                // ignore UI sync errors
            }
        }
    },
    
    // Remove object from DOM

    removeObjectFromDOM(objectId) {
        const element = document.getElementById(objectId);
        if (element) {
        // If removing a connection, also remove its linkage text elements
        if (element.tagName.toLowerCase() === 'line' && 
            ((element.getAttribute('data-parent') && element.getAttribute('data-child')) ||
             (element.getAttribute('data-start') && element.getAttribute('data-end')))) {
            // Remove linkage text for this specific connection
            const linkageTexts = this.canvas.querySelectorAll(`text[data-connection-id="${objectId}"]`);
            linkageTexts.forEach(text => text.remove());
            
            // Also clean up any orphaned linkage text (text elements with linkage-label class that reference non-existent connections)
            const allLinkageTexts = this.canvas.querySelectorAll('text.linkage-label');
            allLinkageTexts.forEach(text => {
                const connId = text.getAttribute('data-connection-id');
                if (connId && !document.getElementById(connId)) {
                    text.remove();
                }
            });
        }            element.remove();
        }
        
        // Also remove any related elements (highlights, etc.)
        const highlights = this.canvas.querySelectorAll(`[id*="${objectId}"]`);
        highlights.forEach(highlight => {
            if (highlight.id !== objectId) {
                highlight.remove();
            }
        });
        
        this.objectList.delete(objectId);
    },
    
    // Undo last step

    undo() {
        if (this.undoStack.length === 0) {
            return;
        }
        
        // Finish any current step first
        if (this.isRecordingStep) {
            this.finishStep();
        }
        
        const step = this.undoStack.pop();
        try {
            const modSummary = step.modified.map(m => ({ id: m.id, beforeTextColor: m.before && m.before.textColor, afterTextColor: m.after && m.after.textColor }));
            } catch (e) {}
        
    // Preserve current selection so we can restore it after undo
    const previouslySelectedIds = Array.from(this.selectedElements || []).map(el => el.getAttribute ? el.getAttribute('id') : null).filter(id => id);
    // Clear all selections to avoid issues while restoring
    this.clearAllSelections();
        
        // Process removals (re-add removed objects) - sort by dependency order
        // Sugars must be restored before connections that depend on them
        const sortedRemoved = step.removed.sort((a, b) => {
            // Sugars first (type === 'sugar')
            if (a.type === 'sugar' && b.type !== 'sugar') return -1;
            if (a.type !== 'sugar' && b.type === 'sugar') return 1;
            // Then connections (type === 'connection') 
            if (a.type === 'connection' && b.type !== 'connection') return -1;
            if (a.type !== 'connection' && b.type === 'connection') return 1;
            // Text elements last
            return 0;
        });
        
        sortedRemoved.forEach(objectData => {
            this.restoreObjectFromData(objectData);
        });
        
        // Process modifications (revert to before state)
        step.modified.forEach(modification => {
            // For modifications, just update the existing element in place
            this.restoreObjectFromData(modification.before);
        });
        
        // Process additions (remove added objects)
        step.added.forEach(objectData => {
            this.removeObjectFromDOM(objectData.id);
        });
        
        // Add step to redo stack
        this.redoStack.push(step);
        
    // Update UI
        this.updateStylePanel();
        this.isUpdatingUI = true;
        this.updateRightPanel();
        this.isUpdatingUI = false;
        // Restore previous selection (if those elements still exist) so UI controls reflect restored object states
        if (previouslySelectedIds && previouslySelectedIds.length > 0) {
            previouslySelectedIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    try {
                        // Re-select element without clearing others
                        this.selectElement(el, true);
                    } catch (e) {
                        // Fallback: directly add to selectedElements if selectElement fails
                        if (!this.selectedElements) this.selectedElements = new Set();
                        this.selectedElements.add(el);
                    }
                }
            });

            // Ensure legacy selection sets are in sync (so selectedConnections is populated)
            try {
                if (typeof this.updateLegacySelectionStates === 'function') {
                    this.updateLegacySelectionStates();
                }
            } catch (e) {
                // ignore
            }

            // If any selected connections exist, refresh linkage controls so buttons/checkboxes match restored attributes
            if (this.selectedConnections && this.selectedConnections.size > 0) {
                try {
                    this.updateLinkageControlsFromSelection();
                } catch (e) {
                    // Fallback to general right panel update
                    this.updateRightPanel();
                }
            } else {
                // Ensure right panel syncs if selection contains other element types
                this.updateRightPanel();
            }
        }
        
        // Update undo/redo button states
        try { this.updateUndoRedoButtons(); } catch (e) {}

        },
    
    // Redo last undone step

    redo() {
        if (this.redoStack.length === 0) {
            return;
        }
        
        // Finish any current step first
        if (this.isRecordingStep) {
            this.finishStep();
        }
        
        const step = this.redoStack.pop();
        if (!step) {
            console.error('Invalid step in redo stack:', step);
            return;
        }
        
        try {
            const modSummary = step.modified.map(m => ({ id: m.id, beforeTextColor: m.before && m.before.textColor, afterTextColor: m.after && m.after.textColor }));
            } catch (e) {}
        
        // Clear all selections to avoid issues
        this.clearAllSelections();
        
        // Process additions (re-add added objects) - sort by dependency order
        // Sugars must be restored before connections that depend on them
        const sortedAdded = step.added.sort((a, b) => {
            // Sugars first (type === 'sugar')
            if (a.type === 'sugar' && b.type !== 'sugar') return -1;
            if (a.type !== 'sugar' && b.type === 'sugar') return 1;
            // Then connections (type === 'connection') 
            if (a.type === 'connection' && b.type !== 'connection') return -1;
            if (a.type !== 'connection' && b.type === 'connection') return 1;
            // Text elements last
            return 0;
        });
        
        sortedAdded.forEach(objectData => {
            const restored = this.restoreObjectFromData(objectData);
            });
        
        // Process modifications (revert to after state)
        step.modified.forEach(modification => {
            // For modifications, just update the existing element in place
            this.restoreObjectFromData(modification.after);
        });
        
        // Process removals (remove objects again)
        step.removed.forEach(objectData => {
            this.removeObjectFromDOM(objectData.id);
        });
        
        // Add step back to undo stack
        this.undoStack.push(step);
        
        // Update UI
        this.updateStylePanel();
        this.isUpdatingUI = true;
        this.updateRightPanel();
        this.isUpdatingUI = false;
        // Update undo/redo button states
        try { this.updateUndoRedoButtons(); } catch (e) {}

        },
    
    // Initialize objectList with existing canvas objects

    initializeObjectList() {
        this.objectList.clear();
        
        // Add all existing sugars
        const sugars = this.canvas.querySelectorAll('.sugar');
        sugars.forEach(sugar => {
            const objectData = this.createObjectData(sugar);
            if (objectData) {
                this.objectList.set(objectData.id, objectData);
            }
        });
        
        // Add all existing texts
        const texts = this.canvas.querySelectorAll('.text-element');
        texts.forEach(text => {
            const objectData = this.createObjectData(text);
            if (objectData) {
                this.objectList.set(objectData.id, objectData);
            }
        });
        
        // Add all existing connections
        const connections = this.canvas.querySelectorAll('.connection');
        connections.forEach(connection => {
            const objectData = this.createObjectData(connection);
            if (objectData) {
                this.objectList.set(objectData.id, objectData);
            }
        });
        
        },
    



};
