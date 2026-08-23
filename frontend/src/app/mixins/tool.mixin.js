// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 2235.
export const toolMixin = {
    setTool(tool) {
        // Don't switch tools if currently editing text (let the edit finish first)
        if (this.isEditingText && this.currentTool !== tool) {
            return;
        }
        
        // Store previous tool before changing
        const previousTool = this.currentTool;
        this.currentTool = tool;
        
        // Clear selections when switching to non-selection modes
        if (tool === 'add' || tool === 'delete' || tool === 'text') {
            this.deselectAll();
            if (this.selectedConnections) {
                this.clearConnectionSelections();
            }
        }
        
        // If switching away from text tool and currently editing, close any open text inputs
        if (tool !== 'text' && this.isEditingText) {
            const textInputs = document.querySelectorAll('.text-input-box');
            textInputs.forEach(input => input.remove());
            this.isEditingText = false;
        }
        
        // If switching away from delete tool, stop erasing
        if (tool !== 'delete' && this.isErasing) {
            this.stopErasing();
        }
        
        // Update button states
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Update canvas cursor
        this.updateCanvasCursor();
        
        // Hide add preview dot when switching tools
        if (this.addPreviewDot) {
            this.addPreviewDot.style.display = 'none';
        }
        
        // Update style panels visibility
        this.updateStylePanel();
        
        // Update left panel visibility (kept for compatibility)
        this.updateLeftPanel();
        
        // Update right panel content based on tool and selections
        this.updateRightPanel();
    },
    
};
