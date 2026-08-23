// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 267.
export const toolbarMixin = {
    setupToolbar() {
        // Tool buttons
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.setTool(tool);
            });
        });
    },
    
};
