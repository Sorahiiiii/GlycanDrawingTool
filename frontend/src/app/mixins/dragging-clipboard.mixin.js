// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 11752, 11823, 11827, 11904, 12013, 12025, 12295, 12299.
export const draggingClipboardMixin = {
    startDragging(x, y, multipleElements = false) {
        // Start recording a step for drag operation
        this.startStep('Move objects');
        
        // Store before state for all selected elements
        this.selectedElements.forEach(element => {
            const beforeData = this.createObjectData(element);
            if (beforeData) {
                element.setAttribute('data-before-move', JSON.stringify(beforeData));
            }
        });
        
        this.isDragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        
        // Disable workspace transitions during dragging
        const workspace = document.querySelector('.workspace');
        if (workspace) {
            workspace.classList.add('dragging-active');
        }
        
        // Add global dragging class to body to disable all transitions
        document.body.classList.add('global-dragging');
        
        // Add global event listeners for dragging outside canvas
        document.addEventListener('mousemove', this.globalDragMouseMove);
        document.addEventListener('mouseup', this.globalDragMouseUp);
        
        if (multipleElements) {
            this.isDraggingMultiple = true;
            this.isDraggingMultipleTexts = false;
            this.dragPrimaryElement = this.getElementAtPoint(x, y);
            
            // Store initial positions for all selected elements
            this.selectedElements.forEach(element => {
                const elementX = parseFloat(element.getAttribute('data-x'));
                const elementY = parseFloat(element.getAttribute('data-y'));
                element.setAttribute('data-initial-x', elementX);
                element.setAttribute('data-initial-y', elementY);
                element.classList.add('dragging');
            });
        } else {
            this.isDraggingMultiple = false;
            
            // For single element, set drag offset
            const element = Array.from(this.selectedElements)[0];
            if (element) {
                this.dragPrimaryElement = element;
                const elementX = parseFloat(element.getAttribute('data-x'));
                const elementY = parseFloat(element.getAttribute('data-y'));
                
                element.setAttribute('data-initial-x', elementX);
                element.setAttribute('data-initial-y', elementY);
                element.classList.add('dragging');
                
                this.dragOffset = {
                    x: x - elementX,
                    y: y - elementY
                };
                
                // Set type-specific dragging flags for backward compatibility
                const type = this.getElementType(element);
                if (type === 'text') {
                    this.isDraggingMultipleTexts = false;
                }
            }
        }
    },
    
    // ===== END UNIFIED ELEMENT SYSTEM =====
    
    // Keyboard shortcut implementations

    clearSelection() {
        this.clearAllSelections();
    },
    

    deleteSelection() {
        // Start recording a step for multiple deletions
        this.startStep('Delete selection');

        // Collect elements to delete using unified system
        const sugarsToDelete = this.getSelectedElementsByType('sugar');
        const textsToDelete = this.getSelectedElementsByType('text');
        const connectionsToDelete = this.getSelectedElementsByType('connection');
        
        // Collect all connections to delete (including those connected to deleted sugars)
        const allConnectionsToDelete = new Set(connectionsToDelete);
        
        // Find connections that are connected to sugars being deleted
        document.querySelectorAll('.connection').forEach(connection => {
            const startId = connection.getAttribute('data-start');
            const endId = connection.getAttribute('data-end');
            
            const startSugar = document.getElementById(startId);
            const endSugar = document.getElementById(endId);
            
            // Delete connection if either end is being deleted
            if ((startSugar && sugarsToDelete.includes(startSugar)) || 
                (endSugar && sugarsToDelete.includes(endSugar))) {
                allConnectionsToDelete.add(connection);
            }
        });
        
        // Record deletions for undo/redo
        allConnectionsToDelete.forEach(connection => {
            const connectionId = connection.getAttribute('id');
            if (connectionId) {
                this.recordObjectRemoved(connectionId);
            }
        });
        
        sugarsToDelete.forEach(sugar => {
            const sugarId = sugar.getAttribute('id');
            this.recordObjectRemoved(sugarId);
        });
        
        textsToDelete.forEach(text => {
            const textId = text.getAttribute('id');
            this.recordObjectRemoved(textId);
        });
        
        // Delete all connections and their linkage texts
        allConnectionsToDelete.forEach(connection => {
            const connectionId = connection.getAttribute('id');
            if (connectionId) {
                // Remove both config and position text elements
                const configText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="config"]`);
                const positionText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="position"]`);
                if (configText) configText.remove();
                if (positionText) positionText.remove();
                
                // Also remove any old-style single linkage text (for backward compatibility)
                const oldLinkageText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"]:not([data-linkage-part])`);
                if (oldLinkageText) oldLinkageText.remove();
            }
            connection.remove();
        });
        
        // Delete selected sugars and texts
        sugarsToDelete.forEach(sugar => {
            this.hideSelectionHighlight(sugar);
            sugar.remove();
        });
        
        textsToDelete.forEach(text => {
            this.hideSelectionHighlight(text);
            text.remove();
        });

        this.clearAllSelections();
        
        // Finish recording the step
        this.finishStep();
    },

    copySelection() {
        this.clipboard = {
            sugars: [],
            texts: [],
            connections: [],
            linkageLabels: []
        };
        
        // Use unified selectedElements system
        this.selectedElements.forEach(element => {
            const type = this.getElementType(element);
            
            if (type === 'sugar') {
                this.clipboard.sugars.push({
                    id: element.id,
                    x: parseFloat(element.getAttribute('data-x')),
                    y: parseFloat(element.getAttribute('data-y')),
                    shape: element.getAttribute('data-shape'),
                    color: element.getAttribute('data-color'),
                    preset: element.getAttribute('data-preset'),
                    innerHTML: element.innerHTML
                });
            } else if (type === 'text') {
                const content = element.textContent || 'Text'; // Ensure we have content
                this.clipboard.texts.push({
                    x: parseFloat(element.getAttribute('data-x')),
                    y: parseFloat(element.getAttribute('data-y')),
                    content: content,
                    style: element.getAttribute('style'),
                    className: element.className
                });
            }
        });
        
        // Copy connections between selected sugars
        const connectionsToCopy = [];
        const linkageLabelsToCopy = [];
        const selectedSugarElements = this.getSelectedElementsByType('sugar');
        
        document.querySelectorAll('.connection').forEach(connection => {
            const startId = connection.getAttribute('data-start');
            const endId = connection.getAttribute('data-end');
            
            const startSugar = document.getElementById(startId);
            const endSugar = document.getElementById(endId);
            
            // Only copy connections where both sugars are selected
            if (startSugar && endSugar && 
                selectedSugarElements.includes(startSugar) && 
                selectedSugarElements.includes(endSugar)) {
                
                // Preserve all important style properties
                const connectionCopy = {
                    startId: startId,
                    endId: endId,
                    style: connection.getAttribute('style'),
                    className: connection.className.baseVal || connection.className, // Handle SVG className properly
                    // Preserve inline style properties, fallback to computed styles for defaults
                    strokeWidth: connection.style.strokeWidth || connection.getAttribute('stroke-width') || getComputedStyle(connection).strokeWidth,
                    stroke: connection.style.stroke || connection.getAttribute('stroke') || this.normalizeColorToHex(getComputedStyle(connection).stroke),
                    strokeOpacity: connection.style.strokeOpacity || connection.getAttribute('stroke-opacity') || getComputedStyle(connection).strokeOpacity,
                    strokeDasharray: connection.style.strokeDasharray || connection.getAttribute('stroke-dasharray') || getComputedStyle(connection).strokeDasharray,
                    // Preserve linkage-specific attributes
                    linkageId: connection.getAttribute('data-linkage-id'),
                    linkageType: connection.getAttribute('data-linkage'),
                    // Preserve linkage text appearance and visibility
                    textSize: connection.getAttribute('data-text-size'),
                    textColor: connection.getAttribute('data-text-color'),
                    textFontFamily: connection.getAttribute('data-text-font-family'),
                    textBold: connection.getAttribute('data-text-bold'),
                    textItalic: connection.getAttribute('data-text-italic'),
                    textUnderline: connection.getAttribute('data-text-underline'),
                    textOpacity: connection.getAttribute('data-text-opacity'),
                    linkageVisible: connection.getAttribute('data-linkage-visible'),
                    reversed: connection.getAttribute('data-reversed')
                };
                
                connectionsToCopy.push(connectionCopy);
                
                // Also copy associated linkage label if it exists
                const linkageId = connection.getAttribute('data-linkage-id');
                if (linkageId) {
                    const labelElement = document.querySelector(`[data-linkage-for="${linkageId}"]`);
                    if (labelElement) {
                        linkageLabelsToCopy.push({
                            linkageId: linkageId,
                            x: parseFloat(labelElement.getAttribute('data-x')) || parseFloat(labelElement.getAttribute('x')),
                            y: parseFloat(labelElement.getAttribute('data-y')) || parseFloat(labelElement.getAttribute('y')),
                            content: labelElement.textContent,
                            style: labelElement.getAttribute('style'),
                            className: labelElement.className,
                            fill: this.normalizeColorToHex(labelElement.style.fill || labelElement.getAttribute('fill')),
                            fontSize: labelElement.style.fontSize || labelElement.getAttribute('font-size')
                        });
                    }
                }
            }
        });
        
        this.clipboard.connections = connectionsToCopy;
        this.clipboard.linkageLabels = linkageLabelsToCopy;
        
        // Show copy confirmation
        const totalCopied = this.clipboard.sugars.length + this.clipboard.texts.length + this.clipboard.connections.length + this.clipboard.linkageLabels.length;
        if (totalCopied > 0) {
            this.showTemporaryNotification(`已复制 ${totalCopied} 个元素 (保持选择)`);
        }
    },
    

    cutSelection() {
        const totalToCut = this.selectedElements.size;
        
        this.copySelection();
        this.deleteSelection();
        // Selection is already cleared by deleteSelection
        
        if (totalToCut > 0) {
            this.showTemporaryNotification(`已剪切 ${totalToCut} 个元素`);
        }
    },
    

    pasteFromClipboard() {
        if (this.clipboard.sugars.length === 0 && this.clipboard.texts.length === 0) {
            return; // Nothing to paste
        }
        
        // Start recording a step for paste operation
        this.startStep('Paste');
        
        // Clear current selection first (use unified system)
        this.clearAllSelections();
        
        // Calculate dynamic offset to avoid overlapping with previous pastes
        // Each paste moves items 30 pixels to the right and down
        this.pasteCount = (this.pasteCount || 0) + 1;
        const offsetX = 30 * this.pasteCount; // Dynamic offset
        const offsetY = 30 * this.pasteCount;
        
        const pastedSugars = [];
        const pastedTexts = [];
    const pastedConnections = [];
        
        // Paste sugars
        this.clipboard.sugars.forEach(sugarData => {
            const config = {
                shape: sugarData.shape,
                color: sugarData.color,
                type: sugarData.preset ? 'preset' : 'custom',
                preset: sugarData.preset
            };
            
            const newSugar = this.createSugar(
                sugarData.x + offsetX,
                sugarData.y + offsetY,
                config,
                false // Don't save state for each individual sugar during paste
            );
            if (newSugar) {
                pastedSugars.push(newSugar);
            }
        });
        
        // Paste texts
        this.clipboard.texts.forEach(textData => {
            const newText = this.createText(
                textData.x + offsetX,
                textData.y + offsetY,
                textData.content,
                false, // Don't save state for each individual text during paste
                false  // Don't auto-edit pasted text
            );
            if (newText) {
                if (textData.style) {
                    newText.setAttribute('style', textData.style);
                }
                pastedTexts.push(newText);
            }
        });
        
        // Select all pasted items using unified selection system
        const allPastedElements = [...pastedSugars, ...pastedTexts];
        allPastedElements.forEach(element => {
            this.selectElement(element, true); // Use multiSelect=true to keep all selected
        });
        
        // Create mapping from old sugar IDs to new sugars for connections
        const sugarIdMapping = {};
        for (let i = 0; i < this.clipboard.sugars.length; i++) {
            const oldId = this.clipboard.sugars[i].id;
            const newId = pastedSugars[i].id;
            sugarIdMapping[oldId] = newId;
        }
        
        // Paste connections with preserved styles
        this.clipboard.connections.forEach(connectionData => {
            const newStartId = sugarIdMapping[connectionData.startId];
            const newEndId = sugarIdMapping[connectionData.endId];
            
            if (newStartId && newEndId) {
                const startSugar = document.getElementById(newStartId);
                const endSugar = document.getElementById(newEndId);
                
                if (startSugar && endSugar) {
                    // Create connection without default styling to preserve copied styles
                    const newConnection = this.createConnection(startSugar, endSugar, true);
                    
                    // Apply saved styling properties with !important to override any CSS rules
                    if (newConnection && connectionData) {
                        // Apply individual style properties with !important to ensure they stick
                        if (connectionData.strokeWidth) {
                            newConnection.style.setProperty('stroke-width', connectionData.strokeWidth, 'important');
                        }
                        if (connectionData.stroke) {
                            newConnection.style.setProperty('stroke', connectionData.stroke, 'important');
                        }
                        if (connectionData.strokeOpacity) {
                            newConnection.style.setProperty('stroke-opacity', connectionData.strokeOpacity, 'important');
                        }
                        if (connectionData.strokeDasharray) {
                            newConnection.style.setProperty('stroke-dasharray', connectionData.strokeDasharray, 'important');
                        }
                        
                        // Apply basic style attribute as fallback (for any properties not covered above)
                        if (connectionData.style) {
                            // Parse and reapply individual style properties to ensure !important is used
                            const styleString = connectionData.style;
                            const styleRules = styleString.split(';').filter(rule => rule.trim());
                            styleRules.forEach(rule => {
                                const [property, value] = rule.split(':').map(s => s.trim());
                                if (property && value) {
                                    newConnection.style.setProperty(property, value, 'important');
                                }
                            });
                        }
                        
                        // Apply linkage-specific attributes
                        if (connectionData.linkageId) {
                            newConnection.setAttribute('data-linkage-id', connectionData.linkageId);
                        }
                        if (connectionData.linkageType) {
                            newConnection.setAttribute('data-linkage', connectionData.linkageType);
                        }

                        // Restore linkage text appearance and visibility attributes so updateLinkageText can use them
                        if (connectionData.textSize) newConnection.setAttribute('data-text-size', connectionData.textSize);
                        if (connectionData.textColor) newConnection.setAttribute('data-text-color', connectionData.textColor);
                        if (connectionData.textFontFamily) newConnection.setAttribute('data-text-font-family', connectionData.textFontFamily);
                        if (connectionData.textBold !== undefined && connectionData.textBold !== null) newConnection.setAttribute('data-text-bold', connectionData.textBold);
                        if (connectionData.textItalic !== undefined && connectionData.textItalic !== null) newConnection.setAttribute('data-text-italic', connectionData.textItalic);
                        if (connectionData.textUnderline !== undefined && connectionData.textUnderline !== null) newConnection.setAttribute('data-text-underline', connectionData.textUnderline);
                        if (connectionData.textOpacity) newConnection.setAttribute('data-text-opacity', connectionData.textOpacity);
                        if (connectionData.linkageVisible !== undefined && connectionData.linkageVisible !== null) newConnection.setAttribute('data-linkage-visible', connectionData.linkageVisible);
                        if (connectionData.reversed !== undefined && connectionData.reversed !== null) newConnection.setAttribute('data-reversed', connectionData.reversed);

                        // NOTE: Do not auto-create linkage text here; linkage labels are
                        // recreated below from clipboard.linkageLabels. We restore the
                        // connection's data-text-* attributes so the pasted labels can
                        // pick them up when created.
                        
                        // Apply className (SVG elements require className.baseVal)
                        if (connectionData.className) {
                            if (typeof connectionData.className === 'string') {
                                newConnection.className.baseVal = connectionData.className;
                            } else if (connectionData.className.baseVal) {
                                newConnection.className.baseVal = connectionData.className.baseVal;
                            }
                        }
                        
                        // Ensure connection has proper styling - apply defaults if any key style is missing or invalid
                        const hasValidStrokeWidth = connectionData.strokeWidth && connectionData.strokeWidth !== 'none' && connectionData.strokeWidth !== '';
                        const hasValidStroke = connectionData.stroke && connectionData.stroke !== 'none' && connectionData.stroke !== '';
                        const hasValidStyle = connectionData.style && connectionData.style.trim() !== '';
                        
                        if (!hasValidStrokeWidth) {
                            newConnection.style.setProperty('stroke-width', '2', 'important');
                        }
                        if (!hasValidStroke) {
                            newConnection.style.setProperty('stroke', '#333', 'important');
                        }
                        if (!connectionData.strokeOpacity || connectionData.strokeOpacity === '' || connectionData.strokeOpacity === 'none') {
                            newConnection.style.setProperty('stroke-opacity', '1', 'important');
                        }
                        // Track pasted connection so we can ensure linkage text is updated
                        pastedConnections.push(newConnection);
                    }
                }
            }
        });
        
        // Paste linkage labels for the new connections
        this.clipboard.linkageLabels.forEach(labelData => {
            // Find the new connection that corresponds to this label
            const newConnection = document.querySelector(`[data-linkage-id="${labelData.linkageId}"]`);
            if (newConnection) {
                // If the newer linkage text (config/position) already exists for the
                // connection, skip creating a legacy single label to avoid duplicates.
                const connId = newConnection.getAttribute('id');
                if (connId && this.canvas.querySelector(`text[data-connection-id="${connId}"]`)) {
                    // There are already linkage label(s) for this connection; skip
                    return;
                }

                // Create new legacy-style linkage label and apply restored styles.
                const newLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                const finalX = (labelData.x || 0) + offsetX;
                const finalY = (labelData.y || 0) + offsetY;
                newLabel.setAttribute('x', finalX);
                newLabel.setAttribute('y', finalY);
                newLabel.setAttribute('data-x', finalX);
                newLabel.setAttribute('data-y', finalY);
                newLabel.setAttribute('data-linkage-for', labelData.linkageId);
                newLabel.textContent = labelData.content;

                // Apply saved styling from labelData first
                if (labelData.style) {
                    newLabel.setAttribute('style', labelData.style);
                }
                if (labelData.className) {
                    newLabel.className = labelData.className;
                }

                // Prefer connection-level saved attributes for final appearance if present
                const connTextSize = newConnection.getAttribute('data-text-size') || labelData.fontSize;
                const connTextColor = newConnection.getAttribute('data-text-color') || labelData.fill || labelData.style && (labelData.style.match(/fill:\s*([^;]+);?/) || [])[1];
                const connFontFamily = newConnection.getAttribute('data-text-font-family') || labelData.style && (labelData.style.match(/font-family:\s*([^;]+);?/) || [])[1];
                const connTextOpacity = newConnection.getAttribute('data-text-opacity') || null;
                const connBold = newConnection.getAttribute('data-text-bold');
                const connItalic = newConnection.getAttribute('data-text-italic');
                const connUnderline = newConnection.getAttribute('data-text-underline');

                if (connTextColor) {
                    const normalizedFill = this.normalizeColorToHex(connTextColor);
                    newLabel.style.setProperty('fill', normalizedFill, 'important');
                } else if (labelData.fill) {
                    newLabel.style.setProperty('fill', this.normalizeColorToHex(labelData.fill), 'important');
                }

                if (connTextSize) {
                    // Ensure value ends with px if numeric
                    const sizeStr = String(connTextSize).match(/\d+/) ? `${connTextSize}px` : connTextSize;
                    newLabel.style.setProperty('font-size', sizeStr, 'important');
                } else if (labelData.fontSize) {
                    newLabel.style.setProperty('font-size', labelData.fontSize, 'important');
                }

                if (connFontFamily) {
                    newLabel.style.setProperty('font-family', connFontFamily, 'important');
                }

                if (connTextOpacity) {
                    newLabel.style.setProperty('fill-opacity', connTextOpacity, 'important');
                }

                if (connBold === 'true') {
                    newLabel.style.setProperty('font-weight', 'bold', 'important');
                }
                if (connItalic === 'true') {
                    newLabel.style.setProperty('font-style', 'italic', 'important');
                }
                if (connUnderline === 'true') {
                    newLabel.style.setProperty('text-decoration', 'underline', 'important');
                }

                // Add to canvas
                this.canvas.appendChild(newLabel);
            }
        });

        // Ensure linkage text (config/position) is created for pasted connections
        // Some pasted connections may rely on connection-level data-* attributes
        // to render linkage text; call updateLinkageText to force creation.
        try {
            pastedConnections.forEach(conn => {
                try { this.updateLinkageText(conn); } catch (e) { /* ignore */ }
            });
        } catch (e) {}
        
        // Update the style panel to reflect new selection
        this.updateStylePanel();
        
        // Show paste confirmation
        const totalPasted = pastedSugars.length + pastedTexts.length + this.clipboard.connections.length + this.clipboard.linkageLabels.length;
        if (totalPasted > 0) {
            this.showTemporaryNotification(`已粘贴 ${totalPasted} 个元素 (已选中新元素)`);
        }
        
        // Finish recording the step
        this.finishStep();
    },
    
    // Reset paste counter when user performs other actions

    resetPasteCounter() {
        this.pasteCount = 0;
    },
    

    selectAll() {
        // Clear all existing selections using unified system
        this.clearAllSelections();
        
        // Select all elements using unified system
        const allElements = [
            ...document.querySelectorAll('.sugar'),
            ...document.querySelectorAll('.text-element'),
            ...document.querySelectorAll('.connection')
        ];
        
        allElements.forEach(element => {
            this.selectElement(element, true); // Use multiSelect=true
        });
        
        // Show selection summary using unified system
        const totalSelected = this.selectedElements.size;
        if (totalSelected > 0) {
            const sugars = this.getSelectedElementsByType('sugar').length;
            const texts = this.getSelectedElementsByType('text').length;
            const connections = this.getSelectedElementsByType('connection').length;
            
            this.showTemporaryNotification(`已选中 ${totalSelected} 个元素`);
        } else {
            this.showTemporaryNotification('画布为空');
        }
        
        this.updateStylePanel();
    },
    
};
