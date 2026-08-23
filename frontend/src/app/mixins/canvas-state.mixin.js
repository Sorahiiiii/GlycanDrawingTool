// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 6710, 6770.
export const canvasStateMixin = {
    clearCanvas() {
        // Start recording a step for clear operation
        this.startStep('Clear canvas');
        
        // Record all existing objects for removal
        this.canvas.querySelectorAll('.sugar, .text-element, .connection').forEach(element => {
            const elementId = element.getAttribute('id');
            if (elementId) {
                this.recordObjectRemoved(elementId);
            }
        });
        
        // Deselect any selected elements
        this.deselectAll();
        
        // End any connection dragging
        this.endConnectionDragging();
        
        // Clear any timers
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Remove any text input boxes that might be open
        const textInputs = document.querySelectorAll('.text-input-box');
        textInputs.forEach(input => input.remove());
        
        // Reset editing state
        this.isEditingText = false;
        
        // Remove all elements from canvas
        while (this.canvas.firstChild) {
            this.canvas.removeChild(this.canvas.firstChild);
        }
        
        // Reset counters
        this.sugarCount = 0;
        this.textCount = 0;

        // Recreate addPreviewDot so add-mode still shows a preview after clearing
        try {
            // If a preview dot already exists as a reference, discard and recreate to ensure it's attached to the canvas
            this.addPreviewDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            this.addPreviewDot.setAttribute('r', '10');
            // Keep same styling used during init; color may be overridden elsewhere if purple is desired
            this.addPreviewDot.setAttribute('fill', 'blue');
            this.addPreviewDot.setAttribute('opacity', '0.3');
            this.addPreviewDot.style.display = 'none';
            if (this.canvas) this.canvas.appendChild(this.addPreviewDot);
        } catch (err) {
            // If something goes wrong, log but don't block clearing
            console.error('Failed to recreate addPreviewDot after clearCanvas:', err);
        }
        
        // Finish recording the step
        this.finishStep();
    },
    
    // Helper method to convert SVG coordinates to screen coordinates

    svgToScreenCoordinates(svgX, svgY) {
        const pt = this.canvas.createSVGPoint();
        pt.x = svgX;
        pt.y = svgY;
        
        // Transform SVG coordinates to screen coordinates
        const screenPt = pt.matrixTransform(this.canvas.getScreenCTM());
        
        return {
            x: screenPt.x,
            y: screenPt.y
        };
    },
    
    // Box selection methods
};
