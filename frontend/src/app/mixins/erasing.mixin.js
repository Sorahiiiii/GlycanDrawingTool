// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 7862, 7870, 7876, 7885.
export const erasingMixin = {
    startErasing(x, y) {
        this.isErasing = true;
        this.lastErasedElement = null;
        
        // Immediately erase at current position
        this.eraseAtPosition(x, y);
    },
    

    continueErasing(x, y) {
        if (this.isErasing) {
            this.eraseAtPosition(x, y);
        }
    },
    

    stopErasing() {
        this.isErasing = false;
        this.lastErasedElement = null;
        if (this.eraserTimer) {
            clearInterval(this.eraserTimer);
            this.eraserTimer = null;
        }
    },
    

    eraseAtPosition(x, y) {
        // Find elements at current position
        const clickedSugar = this.getSugarAtPoint(x, y);
        const clickedText = this.getTextAtPoint(x, y);
        
        // Prevent deleting the same element multiple times during one drag
        const elementToErase = clickedSugar || clickedText;
        if (elementToErase && elementToErase !== this.lastErasedElement) {
            if (clickedSugar) {
                this.deleteSugar(clickedSugar);
            } else if (clickedText) {
                this.deleteText(clickedText);
            }
            this.lastErasedElement = elementToErase;
        }
    },
    
    // Clear custom sugar type selections when switching contexts
};
