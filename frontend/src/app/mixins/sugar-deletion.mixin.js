// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 6075.
export const sugarDeletionMixin = {
    deleteSugar(sugar) {
        // Record removal for undo/redo system before actually deleting
        const sugarId = sugar.getAttribute('id');
        this.recordObjectRemoved(sugarId);
        
        // Collect connected connections for removal tracking
        const sugarX = parseFloat(sugar.getAttribute('data-x'));
        const sugarY = parseFloat(sugar.getAttribute('data-y'));
        
        const connections = this.canvas.querySelectorAll('.connection');
        const connectionsToRemove = [];
        
        connections.forEach(connection => {
            const x1 = parseFloat(connection.getAttribute('x1'));
            const y1 = parseFloat(connection.getAttribute('y1'));
            const x2 = parseFloat(connection.getAttribute('x2'));
            const y2 = parseFloat(connection.getAttribute('y2'));
            
            if ((x1 === sugarX && y1 === sugarY) || (x2 === sugarX && y2 === sugarY)) {
                connectionsToRemove.push(connection);
            }
        });
        
        // Record connected connection removals
        connectionsToRemove.forEach(connection => {
            const connectionId = connection.getAttribute('id');
            if (connectionId) {
                this.recordObjectRemoved(connectionId);
            }
        });
        
        // Remove from selection if selected
        if (this.selectedSugar === sugar) {
            this.selectedSugar = null;
        }
        this.selectedSugars.delete(sugar);
        
        // Remove connections involving this sugar
        connectionsToRemove.forEach(connection => {
            // Remove associated linkage text before removing connection
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
        
        // Remove selection highlight before deleting the sugar
        this.removeSelectionHighlight(sugar);
        
        // Remove the sugar
        sugar.remove();
    },
    
};
