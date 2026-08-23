// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 650.
export const customizationMixin = {
    setupCustomization() {
        // Shape and color buttons are now handled in setupStyleControls()
        // This prevents double event listeners
        
        // Custom sugar color controls
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        const customSugarOpacity = document.getElementById('customSugarOpacity');
        const customSugarOpacityValue = document.getElementById('customSugarOpacityValue');
        
        if (customSugarColor && customSugarColorHex) {
            customSugarColor.addEventListener('input', (e) => {
                const color = e.target.value;
                // Picker values should be normalized; ensure uppercase #RRGGBB shown in the hex field
                // Ensure the hex field shows normalized uppercase #RRGGBB for picker changes
                customSugarColorHex.value = this.normalizeColorToHex(color);
                // Clear mixed state when user manually changes value
                customSugarColor.classList.remove('mixed');
                customSugarColorHex.classList.remove('mixed');
                
                // Clear SNFG preset selection (manual override)
                this.clearPresetSelection();
                
                // Update color grid buttons to deactivate them (user is using custom color)
                document.querySelectorAll('.color-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                if (this.currentTool === 'add') {
                    // 添加模式：只更新配置，不应用到任何元素
                    this.currentSugarConfig.color = this.normalizeColorToHex(color);
                    this.currentSugarConfig.type = 'custom'; 
                    this.currentSugarConfig.preset = null;
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applySugarColor(this.normalizeColorToHex(color));
                }
            });
            
            customSugarColorHex.addEventListener('input', (e) => {
                const color = e.target.value;
                if (this.isValidHexColor(color)) {
                    const normalizedColor = this.normalizeColorToHex(color);
                    if (customSugarColor) customSugarColor.value = normalizedColor;
                    // Do not overwrite the user's typed hex here; final normalization happens on blur/Enter
                }
            });

            // Finalize custom sugar hex input on blur or Enter
            customSugarColorHex.addEventListener('blur', (e) => {
                const normalized = this.normalizeColorToHex(e.target.value);
                e.target.value = normalized;
                const picker = document.getElementById('customSugarColor');
                if (picker) {
                    picker.value = normalized;
                    try { picker.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
                }
            });
            customSugarColorHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
        }
        
        // Custom sugar opacity control
        if (customSugarOpacity && customSugarOpacityValue) {
            customSugarOpacity.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                customSugarOpacityValue.textContent = Math.round(value * 100) + '%';
                
                if (this.currentTool === 'add') {
                    // 添加模式：只更新配置，不应用到任何元素
                    if (this.currentSugarConfig) {
                        this.currentSugarConfig.fillOpacity = value;
                    }
                } else if (this.currentTool === 'select') {
                    // 选择模式：只应用到选中元素，不更新配置
                    this.applySugarFillOpacity();
                }
            });
        }
    },
    
};
