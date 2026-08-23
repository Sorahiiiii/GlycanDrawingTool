import { snapToGrid } from "../../core/geometry.js";
import { loadPreferences } from "../../core/preferences.js";

// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 6785, 6818, 6860, 6870, 6882, 6925, 6936, 6988, 6993, 7013, 7090, 7105.
export const boxSelectionMixin = {
    startBoxSelection(x, y) {
        this.isBoxSelecting = true;
        this.boxSelectionStart = { x, y };
        
        // Create selection box as HTML overlay instead of SVG element
        this.selectionBox = document.createElement('div');
        this.selectionBox.classList.add('selection-box-overlay');
        
        // Convert SVG coordinates to screen coordinates, then to workspace coordinates
        const screenCoords = this.svgToScreenCoordinates(x, y);
        const workspace = document.getElementById('workspace');
        const workspaceRect = workspace.getBoundingClientRect();
        
        // Account for workspace scroll position
        const workspaceX = screenCoords.x - workspaceRect.left + workspace.scrollLeft;
        const workspaceY = screenCoords.y - workspaceRect.top + workspace.scrollTop;
        
        this.selectionBox.style.left = workspaceX + 'px';
        this.selectionBox.style.top = workspaceY + 'px';
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        
        // Add to workspace instead of canvas
        workspace.appendChild(this.selectionBox);
        
        // Add global event listeners for box selection outside canvas
        this.globalBoxSelectionMouseMove = (e) => this.handleGlobalBoxSelectionMove(e);
        this.globalBoxSelectionMouseUp = (e) => this.handleGlobalBoxSelectionUp(e);
        
        document.addEventListener('mousemove', this.globalBoxSelectionMouseMove);
        document.addEventListener('mouseup', this.globalBoxSelectionMouseUp);
    },
    

    updateBoxSelection(currentX, currentY) {
        if (!this.selectionBox) return;
        
        const startX = this.boxSelectionStart.x;
        const startY = this.boxSelectionStart.y;
        
        // Calculate rectangle bounds in SVG coordinates
        const selectionX = Math.min(startX, currentX);
        const selectionY = Math.min(startY, currentY);
        const selectionWidth = Math.abs(currentX - startX);
        const selectionHeight = Math.abs(currentY - startY);
        
        // Convert SVG coordinates to workspace coordinates for the HTML overlay
        const startScreenCoords = this.svgToScreenCoordinates(selectionX, selectionY);
        const endScreenCoords = this.svgToScreenCoordinates(selectionX + selectionWidth, selectionY + selectionHeight);
        const workspace = document.getElementById('workspace');
        const workspaceRect = workspace.getBoundingClientRect();

        // Account for workspace scroll position
        const workspaceX = startScreenCoords.x - workspaceRect.left + workspace.scrollLeft;
        const workspaceY = startScreenCoords.y - workspaceRect.top + workspace.scrollTop;
        const workspaceWidth = endScreenCoords.x - startScreenCoords.x;
        const workspaceHeight = endScreenCoords.y - startScreenCoords.y;
        
        // Update visual selection box (HTML overlay can extend across full workspace)
        this.selectionBox.style.left = workspaceX + 'px';
        this.selectionBox.style.top = workspaceY + 'px';
        this.selectionBox.style.width = workspaceWidth + 'px';
        this.selectionBox.style.height = workspaceHeight + 'px';
        
        // Store unclamped bounds for selection logic
        this.currentSelectionBounds = {
            x: selectionX,
            y: selectionY,
            width: selectionWidth,
            height: selectionHeight
        };
        
        // Preview selection using unclamped bounds
        this.previewBoxSelection(selectionX, selectionY, selectionWidth, selectionHeight);
    },
    

    handleGlobalBoxSelectionMove(e) {
        if (!this.isBoxSelecting) return;
        
        // Convert global coordinates to SVG coordinates
        const coords = this.getSVGCoordinates(e);
        
        this.updateBoxSelection(coords.x, coords.y);
        e.preventDefault();
    },
    

    handleGlobalBoxSelectionUp(e) {
        if (!this.isBoxSelecting) return;
        
        // Remove global event listeners
        document.removeEventListener('mousemove', this.globalBoxSelectionMouseMove);
        document.removeEventListener('mouseup', this.globalBoxSelectionMouseUp);
        
        // Finish box selection
        this.finishBoxSelection(e.shiftKey);
        e.preventDefault();
    },
    

    handleGlobalDragMove(e) {
        if (!this.isDragging || this.currentTool !== 'select') return;
        
        // Convert global coordinates to SVG coordinates
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        // Use the existing drag logic from handleMouseMove
        if (this.isDraggingMultiple && this.selectedElements.size > 0) {
            // Calculate movement delta from initial drag position
            let deltaX = x - this.dragStartX;  
            let deltaY = y - this.dragStartY;
            
            // Apply Shift constraint for axis-aligned movement
            if (this.dragWithShift) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    deltaY = 0; // Horizontal movement only
                } else {
                    deltaX = 0; // Vertical movement only
                }
            }
            
            const preferences = loadPreferences();
            const primary = this.dragPrimaryElement || Array.from(this.selectedElements)[0];
            const primaryInitialX = parseFloat(primary.getAttribute('data-initial-x'));
            const primaryInitialY = parseFloat(primary.getAttribute('data-initial-y'));
            let appliedDeltaX = deltaX;
            let appliedDeltaY = deltaY;
            if (preferences.snapEnabled) {
                const snappedX = snapToGrid(primaryInitialX + deltaX, preferences.snapGridSize);
                const snappedY = snapToGrid(primaryInitialY + deltaY, preferences.snapGridSize);
                appliedDeltaX = snappedX - primaryInitialX;
                appliedDeltaY = snappedY - primaryInitialY;
            }

            this.selectedElements.forEach(element => {
                const initialX = parseFloat(element.getAttribute('data-initial-x'));
                const initialY = parseFloat(element.getAttribute('data-initial-y'));
                const newX = initialX + appliedDeltaX;
                const newY = initialY + appliedDeltaY;

                const type = this.getElementType(element);
                if (type === 'sugar') {
                    this.moveSugar(element, newX, newY);
                } else if (type === 'text') {
                    this.moveText(element, newX, newY);
                }
            });
        }
        
        e.preventDefault();
    },
    

    handleGlobalDragUp(e) {
        if (!this.isDragging) return;
        
        // Remove global event listeners
        document.removeEventListener('mousemove', this.globalDragMouseMove);
        document.removeEventListener('mouseup', this.globalDragMouseUp);
        
        // Use existing mouse up logic
        this.handleMouseUp(e);
    },
    

    previewBoxSelection(boxX, boxY, boxWidth, boxHeight) {
        // Clear previous previews
        this.clearBoxSelectionPreviews();
        this.hoveredElements.clear();
        
        // In select mode, check sugars, texts, and connections
        const sugars = this.canvas.querySelectorAll('.sugar');
        const texts = this.canvas.querySelectorAll('.text-element');
        const connections = this.canvas.querySelectorAll('.connection');
        
        // Check sugars
        sugars.forEach(sugar => {
            const sugarX = parseFloat(sugar.getAttribute('data-x'));
            const sugarY = parseFloat(sugar.getAttribute('data-y'));
            
            // Check if sugar center is within the selection box
            if (sugarX >= boxX && sugarX <= boxX + boxWidth &&
                sugarY >= boxY && sugarY <= boxY + boxHeight) {
                sugar.classList.add('box-selection-preview');
                this.hoveredElements.add(sugar);
            }
        });
        
        // Check texts
        texts.forEach(text => {
            const textX = parseFloat(text.getAttribute('data-x'));
            const textY = parseFloat(text.getAttribute('data-y'));
            
            // Check if text position is within the selection box
            if (textX >= boxX && textX <= boxX + boxWidth &&
                textY >= boxY && textY <= boxY + boxHeight) {
                text.classList.add('box-selection-preview');
                this.hoveredElements.add(text);
            }
        });
        
        // Check connections
        connections.forEach(line => {
            // Get line endpoints
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            
            // Check if line intersects with selection box
            if (this.lineIntersectsBox(x1, y1, x2, y2, boxX, boxY, boxX + boxWidth, boxY + boxHeight)) {
                line.classList.add('box-selection-preview');
                this.hoveredElements.add(line);
            }
        });
    },
    

    clearBoxSelectionPreviews() {
        const previews = this.canvas.querySelectorAll('.box-selection-preview');
        previews.forEach(element => element.classList.remove('box-selection-preview'));
    },
    

    clearSelectionBox() {
        if (this.selectionBox) {
            // Remove HTML overlay from workspace
            document.getElementById('workspace').removeChild(this.selectionBox);
            this.selectionBox = null;
        }
        this.currentSelectionBounds = null; // Clear stored bounds
        this.clearBoxSelectionPreviews();
        
        // Remove global event listeners if they exist
        if (this.globalBoxSelectionMouseMove) {
            document.removeEventListener('mousemove', this.globalBoxSelectionMouseMove);
            this.globalBoxSelectionMouseMove = null;
        }
        if (this.globalBoxSelectionMouseUp) {
            document.removeEventListener('mouseup', this.globalBoxSelectionMouseUp);
            this.globalBoxSelectionMouseUp = null;
        }
    },
    

    finishBoxSelection(isShiftKey = false) {
        if (!this.isBoxSelecting || !this.selectionBox) return;
        
        // Get elements that were previewed during box selection
        const elementsInBox = Array.from(this.hoveredElements);
        
        if (!isShiftKey) {
            // Normal box selection - clear all previous selections
            this.clearAllSelections();
        }
        
        // Handle Shift box selection logic
        if (isShiftKey && elementsInBox.length > 0) {
            // Check if ALL elements in box are already selected
            const allElementsSelected = elementsInBox.every(element => 
                this.selectedElements.has(element)
            );

            if (allElementsSelected) {
                // All elements are selected - remove them from selection
                elementsInBox.forEach(element => {
                    // Use type-aware deselection for connections
                    if (this.getElementType(element) === 'connection') {
                        this.deselectConnection(element);
                    } else {
                        this.deselectElement(element);
                    }
                });
            } else {
                // Some elements are not selected - add all unselected to selection
                elementsInBox.forEach(element => {
                    if (!this.selectedElements.has(element)) {
                        if (this.getElementType(element) === 'connection') {
                            this.selectConnection(element, true);
                        } else {
                            this.selectElement(element, true);
                        }
                    }
                });
            }
        } else {
            // Normal selection - select all elements in box
            elementsInBox.forEach(element => {
                if (this.getElementType(element) === 'connection') {
                    this.selectConnection(element, true);
                } else {
                    this.selectElement(element, true);
                }
            });
        }
        
        // Clean up
        this.clearBoxSelectionPreviews();
        this.hoveredElements.clear();
        if (this.selectionBox) {
            // Remove HTML overlay from workspace
            document.getElementById('workspace').removeChild(this.selectionBox);
            this.selectionBox = null;
        }
        this.currentSelectionBounds = null; // Clear stored bounds
        
        // Remove global event listeners
        if (this.globalBoxSelectionMouseMove) {
            document.removeEventListener('mousemove', this.globalBoxSelectionMouseMove);
            this.globalBoxSelectionMouseMove = null;
        }
        if (this.globalBoxSelectionMouseUp) {
            document.removeEventListener('mouseup', this.globalBoxSelectionMouseUp);
            this.globalBoxSelectionMouseUp = null;
        }
        
        this.isBoxSelecting = false;
        
        // Update right panel to show controls for selected elements
        this.updateRightPanel();
    },
    

    lineIntersectsBox(x1, y1, x2, y2, boxLeft, boxTop, boxRight, boxBottom) {
        // Check if a line segment intersects with a rectangle
        // First check if either endpoint is inside the box
        if ((x1 >= boxLeft && x1 <= boxRight && y1 >= boxTop && y1 <= boxBottom) ||
            (x2 >= boxLeft && x2 <= boxRight && y2 >= boxTop && y2 <= boxBottom)) {
            return true;
        }
        
        // Check if line intersects any of the box edges
        return this.lineIntersectsLine(x1, y1, x2, y2, boxLeft, boxTop, boxRight, boxTop) ||     // top edge
               this.lineIntersectsLine(x1, y1, x2, y2, boxRight, boxTop, boxRight, boxBottom) || // right edge
               this.lineIntersectsLine(x1, y1, x2, y2, boxRight, boxBottom, boxLeft, boxBottom) || // bottom edge
               this.lineIntersectsLine(x1, y1, x2, y2, boxLeft, boxBottom, boxLeft, boxTop);     // left edge
    },
    

    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Check if two line segments intersect
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return false; // Lines are parallel
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    },
    
    // Left panel control methods (now controls right panel in new layout)
};
