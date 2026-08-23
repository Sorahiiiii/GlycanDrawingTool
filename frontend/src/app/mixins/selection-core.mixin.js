// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 11337, 11495, 11507, 11515, 11520, 11550, 11565, 11577, 11586, 11599, 11608, 11624, 11640, 11671, 11690, 11726, 11733, 11738.
export const selectionCoreMixin = {
    handleKeyDown(e) {
        // Track modifier keys (primary modifier: Ctrl on Windows/Linux, Command(meta) on macOS)
        this.isCtrlPressed = e.ctrlKey; // backward-compatible
        this.isPrimaryModifierPressed = e.ctrlKey || e.metaKey;
        this.isShiftPressed = e.shiftKey;
        
        // Determine if a text input is focused (input/textarea/contentEditable)
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );

        // Don't handle shortcuts when editing rich text via the app's text editor
        if (this.isEditingText) {
            // Allow text formatting shortcuts even when editing
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.toggleTextStyle('boldBtn');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.toggleTextStyle('italicBtn');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.toggleTextStyle('underlineBtn');
                        break;
                    case '=':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.toggleSuperscript();
                        } else {
                            this.toggleSubscript();
                        }
                        break;
                }
            }
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            this.copySelectedAsSvg().catch((error) => {
                console.error('Could not copy selected elements as SVG:', error);
            });
            return;
        }

        if (e.altKey && !e.ctrlKey && !e.metaKey && !isInputFocused) {
            const toolByKey = {
                a: 'add',
                t: 'text',
                s: 'select',
                p: 'preset',
                d: 'delete',
            };
            const tool = toolByKey[e.key.toLowerCase()];
            if (tool) {
                e.preventDefault();
                this.setTool(tool);
            }
        }
        
    // Handle keyboard shortcuts (use primary modifier). If a regular input is focused,
    // allow the browser to handle clipboard and select-all shortcuts there.
    if (e.ctrlKey || e.metaKey) {
        if (isInputFocused) return; // let the browser/input handle Ctrl/C/V/X/A/A
            switch (e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    this.copySelection();
                    break;
                case 'v':
                    e.preventDefault();
                    this.pasteFromClipboard();
                    break;
                case 'x':
                    e.preventDefault();
                    this.cutSelection();
                    break;
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                    case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
                case 'b':
                    e.preventDefault();
                    // If a connection is selected, apply to its linkage text instead
                    const selConnsB = this.getSelectedElementsByType('connection') || [];
                    if (selConnsB.length > 0) {
                        // Dispatch a real click so the existing linkage button handlers run
                        const lbtn = document.getElementById('linkageTextBoldBtn');
                        if (lbtn) {
                            // simulate full user interaction so mousedown/mouseup handlers run
                            lbtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                        }
                    } else {
                        this.toggleTextStyle('boldBtn');
                    }
                    break;
                case 'i':
                    e.preventDefault();
                    // If a connection is selected, apply to its linkage text instead
                    const selConnsI = this.getSelectedElementsByType('connection') || [];
                    if (selConnsI.length > 0) {
                        // Dispatch a real click so the existing linkage button handlers run
                        const lbtn = document.getElementById('linkageTextItalicBtn');
                        if (lbtn) {
                            // simulate full user interaction so mousedown/mouseup handlers run
                            lbtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                        }
                    } else {
                        this.toggleTextStyle('italicBtn');
                    }
                    break;
                case 'u':
                    e.preventDefault();
                    // If a connection is selected, apply to its linkage text instead
                    const selConnsU = this.getSelectedElementsByType('connection') || [];
                    if (selConnsU.length > 0) {
                        // Dispatch a real click so the existing linkage button handlers run
                        const lbtn = document.getElementById('linkageTextUnderlineBtn');
                        if (lbtn) {
                            // simulate full user interaction so mousedown/mouseup handlers run
                            lbtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                            lbtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                        }
                    } else {
                        this.toggleTextStyle('underlineBtn');
                    }
                    break;
                case '=':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.toggleSuperscript();
                    } else {
                        this.toggleSubscript();
                    }
                    break;
            }
        } else {
            // Don't handle Delete/Backspace when focus is in an input field
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.contentEditable === 'true'
            );
            
            if (!isInputFocused) {
                switch (e.key) {
                    case 'Escape':
                        e.preventDefault();
                        this.clearSelection();
                        break;
                    case 'Delete':
                    case 'Backspace':
                        e.preventDefault();
                        this.deleteSelection();
                        break;
                }
            }
        }
    },
    

    handleKeyUp(e) {
        // Update modifier key states (primary modifier included)
        this.isCtrlPressed = e.ctrlKey;
        this.isPrimaryModifierPressed = e.ctrlKey || e.metaKey;
        this.isShiftPressed = e.shiftKey;
    },
    
    // Removed handleWheel - now using zoom slider instead
    
    // ===== UNIFIED ELEMENT SYSTEM =====
    
    // Element type detection

    getElementType(element) {
        if (element.classList.contains('sugar')) return 'sugar';
        if (element.classList.contains('text-element')) return 'text';
        if (element.classList.contains('connection')) return 'connection';
        return null;
    },
    
    // Check if element is selectable

    isSelectableElement(element) {
        return this.getElementType(element) !== null;
    },
    
    // Unified element selection

    selectElement(element, multiSelect = false) {
        if (!this.isSelectableElement(element)) return;
        
        // Only force complete operations if we're switching between different elements during styling
        // Don't force complete for simple selection changes or when selecting newly created elements
        if (this.pendingOperation && this.operationContext === 'styling') {
            const elementIds = new Set([element.id || element.getAttribute('id')]);
            const currentIds = new Set(Array.from(this.operationTargetElements).map(el => el.id || el.getAttribute('id')));
            
            // Only force complete if we're switching to a different element during styling
            if (!this.setsEqual(elementIds, currentIds)) {
                }
        }
        
        if (!multiSelect) {
            this.clearAllSelectionsQuiet(); // 使用不触发循环的版本
        }
        
        this.selectedElements.add(element);
        element.classList.add('selected');
        this.showSelectionHighlight(element);
        
        // Update legacy selection states for backward compatibility
        this.updateLegacySelectionStates();
        
        // Update right panel to show appropriate controls (including linkage)
        this.updateRightPanel();
        this.refreshLinkageArrows();
    },
    
    // Unified element deselection

    deselectElement(element) {
        if (!this.selectedElements.has(element)) return;
        this.commitRotationPreview?.();
        
        this.selectedElements.delete(element);
        element.classList.remove('selected');
        this.hideSelectionHighlight(element);
        
        // Update legacy selection states
        this.updateLegacySelectionStates();
        
        // Update right panel to hide controls if needed
        this.updateRightPanel();
        this.refreshLinkageArrows();
    },
    
    // Toggle element selection

    toggleElementSelection(element, multiSelect = false) {
        if (this.selectedElements.has(element)) {
            this.deselectElement(element);
        } else {
            this.selectElement(element, multiSelect);
        }
        
        // Update right panel (redundant but ensures it's called)
        this.updateRightPanel();
        this.refreshLinkageArrows();
    },
    
    // Show hover preview

    showHoverPreview(element) {
        if (!this.isSelectableElement(element)) return;
        if (this.selectedElements.has(element)) return; // Already selected
        
        this.hoveredElement = element;
        element.classList.add('hover-preview');
    },
    
    // Hide hover preview

    hideHoverPreview(element = null) {
        if (element) {
            element.classList.remove('hover-preview');
            if (this.hoveredElement === element) {
                this.hoveredElement = null;
            }
        } else if (this.hoveredElement) {
            this.hoveredElement.classList.remove('hover-preview');
            this.hoveredElement = null;
        }
    },
    
    // Clear all hover previews

    clearAllHoverPreviews() {
        document.querySelectorAll('.hover-preview').forEach(el => {
            el.classList.remove('hover-preview');
        });
        this.hoveredElements.clear();
        this.hoveredElement = null;
    },
    
    // Unified selection highlight

    showSelectionHighlight(element) {
        const type = this.getElementType(element);
        switch (type) {
            case 'sugar':
                this.addSelectionHighlight(element);
                break;
            case 'text':
                this.addTextSelectionHighlight(element);
                break;
            case 'connection':
                // Connection selection highlight (if needed)
                break;
        }
    },
    
    // Unified selection highlight removal

    hideSelectionHighlight(element) {
        const type = this.getElementType(element);
        switch (type) {
            case 'sugar':
                this.removeSelectionHighlight(element);
                break;
            case 'text':
                this.removeTextSelectionHighlight(element);
                break;
            case 'connection':
                // Connection selection highlight removal (if needed)
                break;
        }
    },
    
    // Clear all selections

    clearAllSelections() {
        this.commitRotationPreview?.();
        // Only force complete operations if there's actually a meaningful styling operation pending
        // AND the operation has made actual changes to the canvas
        if (this.pendingOperation && this.operationContext === 'styling' && 
            this.operationStartState && 
            this.operationStartState.canvasContent !== this.canvas.innerHTML) {
            } else if (this.pendingOperation) {
            // Clear any pending operation without saving if no meaningful changes were made
            this.pendingOperation = false;
            this.operationStartState = null;
            this.operationTargetElements.clear();
            this.operationContext = null;
            if (this.operationTimer) {
                clearTimeout(this.operationTimer);
                this.operationTimer = null;
            }
        }
        
        this.selectedElements.forEach(element => {
            element.classList.remove('selected');
            this.hideSelectionHighlight(element);
        });
        this.selectedElements.clear();
        this.clearAllHoverPreviews();
        
        // Update legacy selection states
        this.updateLegacySelectionStates();
        this.updateStylePanel();
        this.refreshLinkageArrows();
    },
    
    // 不触发UI更新的清除选择（用于避免循环调用）

    clearAllSelectionsQuiet() {
        this.commitRotationPreview?.();
        this.selectedElements.forEach(element => {
            element.classList.remove('selected');
            this.hideSelectionHighlight(element);
        });
        this.selectedElements.clear();
        this.clearAllHoverPreviews();
        
        // 只更新legacy状态，不触发UI更新
        this.selectedSugar = null;
        this.selectedText = null;
        this.selectedSugars.clear();
        this.selectedTexts.clear();
        this.selectedConnections.clear();
        
        this.updateStylePanel();
    },
    
    // Update legacy selection states for backward compatibility

    updateLegacySelectionStates() {
        // Clear legacy states
        this.selectedSugar = null;
        this.selectedText = null;
        this.selectedSugars.clear();
        this.selectedTexts.clear();
        this.selectedConnections.clear();
        
        // Update from unified selection
        this.selectedElements.forEach(element => {
            const type = this.getElementType(element);
            switch (type) {
                case 'sugar':
                    this.selectedSugars.add(element);
                    if (!this.selectedSugar) this.selectedSugar = element;
                    break;
                case 'text':
                    this.selectedTexts.add(element);
                    if (!this.selectedText) this.selectedText = element;
                    break;
                case 'connection':
                    this.selectedConnections.add(element);
                    break;
            }
        });
        
        // 更新选择UI - 使用新的统一逻辑，但只在有糖选择时调用
        if (this.currentTool === 'select' && this.selectedSugars.size > 0) {
            this.updateSelectionUI();
        } else if (this.currentTool === 'select' && this.selectedElements.size === 0) {
            // 如果没有任何选择，只清除UI状态，不触发递归
            this.clearUISelections();
        }
    },
    
    // Get all selected elements by type

    getSelectedElementsByType(type) {
        return Array.from(this.selectedElements).filter(element => 
            this.getElementType(element) === type
        );
    },
    
    // Check if any elements are selected

    hasSelectedElements() {
        return this.selectedElements.size > 0;
    },
    
    // Get element at point (unified)

    getElementAtPoint(x, y) {
        // Check for sugars first
        const clickedSugar = this.getSugarAtPoint(x, y);
        if (clickedSugar) return clickedSugar;
        
        // Then check for text
        const clickedText = this.getTextAtPoint(x, y);
        if (clickedText) return clickedText;
        
        // Could add connections here in the future
        return null;
    },
    
    // Start dragging selected elements
};
