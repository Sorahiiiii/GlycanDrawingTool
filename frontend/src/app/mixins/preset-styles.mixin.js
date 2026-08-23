// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 2288, 2340, 2387.
export const presetStylesMixin = {
    selectPreset(preset) {
        if (this.snfgPresets[preset]) {
            // Initialize config if it doesn't exist
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            
            // Only update type, preset, shape, and color - keep other settings
            this.currentSugarConfig.type = 'preset';
            this.currentSugarConfig.preset = preset;
            this.currentSugarConfig.shape = this.snfgPresets[preset].shape;
            this.currentSugarConfig.color = this.snfgPresets[preset].color;
            
            // Update preset button states
            document.querySelectorAll('.preset-item').forEach(item => {
                item.classList.toggle('active', item.dataset.preset === preset);
            });
            
            // Sync with custom controls - highlight corresponding shape and color
            this.syncCustomControlsWithPreset(preset);
            
            // If in select mode, only apply shape and color from preset (not size/border)
            if (this.currentTool === 'select') {
                // Use the same selection logic as applySugarShape and applySugarColor functions
                const sugarsToChange = [];
                if (this.selectedSugar) {
                    sugarsToChange.push(this.selectedSugar);
                }
                if (this.selectedSugars.size > 0) {
                    sugarsToChange.push(...Array.from(this.selectedSugars));
                }
                
                if (sugarsToChange.length > 0) {
                    this.applySugarPreset(this.snfgPresets[preset].shape, this.snfgPresets[preset].color);
                }
            } else {
                // In add mode, apply full preset configuration
                this.setTool('add');
            }
        }
    },
    

    syncCustomControlsWithPreset(preset) {
        const presetConfig = this.snfgPresets[preset];
        if (!presetConfig) return;
        
        // Clear all shape button states first
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.shape-dropdown-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.shape-category').forEach(cat => {
            cat.classList.remove('active');
        });
        
        // Highlight the corresponding shape button (main buttons and dropdown items)
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            if (btn.dataset.shape === presetConfig.shape) {
                btn.classList.add('active');
            }
        });
        document.querySelectorAll('.shape-dropdown-item').forEach(item => {
            const isActive = item.dataset.shape === presetConfig.shape;
            if (isActive) {
                item.classList.add('active');
                // Also activate the parent category if this item matches
                const category = item.closest('.shape-category');
                if (category) {
                    category.classList.add('active');
                    const mainBtn = category.querySelector('.shape-main-btn');
                    if (mainBtn) mainBtn.classList.add('active');
                }
            }
        });
        
        // Highlight the corresponding color button (keep preset and custom selections together)
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === presetConfig.color);
        });
        
        // Update custom color picker to match preset color
        const customColorPicker = document.getElementById('customColor');
        if (customColorPicker) {
            customColorPicker.value = presetConfig.color;
        }
    },
    

    clearPresetSelection() {
        // Clear all preset selections
        document.querySelectorAll('.preset-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Update current config to remove preset
        if (this.currentSugarConfig) {
            this.currentSugarConfig.type = 'custom';
            this.currentSugarConfig.preset = null;
        }
    },

};
