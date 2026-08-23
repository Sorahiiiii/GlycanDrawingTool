// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 2400, 2405, 2441, 2447, 2521, 2545, 2578, 2592.
export const colorControlsMixin = {
    selectColor(color) {
        const normalizedColor = this.normalizeColorToHex(color);
        
        // Update color grid buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.color === normalizedColor) {
                btn.classList.add('active');
            }
        });
        
        // Update custom color controls
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        if (customSugarColor && customSugarColorHex) {
            customSugarColor.value = normalizedColor;
            customSugarColorHex.value = normalizedColor;
        }
        
        // Clear SNFG preset selection when manually selecting color
        this.clearPresetSelection();
        
        if (this.currentTool === 'add') {
            // 添加模式：更新配置
            if (!this.currentSugarConfig) {
                this.currentSugarConfig = { type: 'custom', shape: 'circle', color: '#0072BC' };
            }
            this.currentSugarConfig.color = normalizedColor;
            this.currentSugarConfig.type = 'custom';
            this.currentSugarConfig.preset = null;
        } else if (this.currentTool === 'select') {
            // 选择模式：应用到选中的糖分子
            this.applySugarColor(normalizedColor);
        }
    },
    

    isValidHexColor(color) {
        // Accept 3- or 6-digit hex, with or without leading '#'
        return /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i.test(color);
    },
    
    // Convert any color format to hex format for consistency

    normalizeColorToHex(color) {
        if (!color) return '#000000';

        const s = String(color).trim();

        // Handle direct hex (3 or 6 digits) with or without leading '#'
        const hexMatch = s.match(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i);
        if (hexMatch) {
            let hex = hexMatch[1];
            if (hex.length === 3) {
                // Expand shorthand (e.g. 'abc' -> 'aabbcc')
                hex = hex.split('').map(ch => ch + ch).join('');
            }
            return ('#' + hex).toUpperCase();
        }

        // Handle rgb(r, g, b) format
        const rgbMatch = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return ('#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)).toUpperCase();
        }

        // Handle rgba(r, g, b, a) format (ignore alpha)
        const rgbaMatch = s.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/i);
        if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1]);
            const g = parseInt(rgbaMatch[2]);
            const b = parseInt(rgbaMatch[3]);
            return ('#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)).toUpperCase();
        }

        // Handle cmyk(c%, m%, y%, k%) format
        const cmykMatch = s.match(/cmyk\((\d+)%?,\s*(\d+)%?,\s*(\d+)%?,\s*(\d+)%?\)/i);
        if (cmykMatch) {
            const c = parseFloat(cmykMatch[1]) / 100;
            const m = parseFloat(cmykMatch[2]) / 100;
            const y = parseFloat(cmykMatch[3]) / 100;
            const k = parseFloat(cmykMatch[4]) / 100;

            // Convert CMYK to RGB
            const r = Math.round(255 * (1 - c) * (1 - k));
            const g = Math.round(255 * (1 - m) * (1 - k));
            const b = Math.round(255 * (1 - y) * (1 - k));

            return ('#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)).toUpperCase();
        }

        // Handle named colors by creating a temporary element and reading computed style
        try {
            const tempDiv = document.createElement('div');
            tempDiv.style.color = s;
            document.body.appendChild(tempDiv);
            const computedColor = window.getComputedStyle(tempDiv).color;
            document.body.removeChild(tempDiv);

            const computedRgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
            if (computedRgbMatch) {
                const r = parseInt(computedRgbMatch[1]);
                const g = parseInt(computedRgbMatch[2]);
                const b = parseInt(computedRgbMatch[3]);
                return ('#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)).toUpperCase();
            }
        } catch (e) {
            // ignore
        }

        // Fallback to black if conversion fails
        return '#000000';
    },
    
    // Convert hex color to CMYK format

    hexToCMYK(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        // Convert RGB to CMYK
        const k = 1 - Math.max(r, g, b);
        const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
        const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
        const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
        
        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    },
    
    // Convert hex color to HSL format

    hexToHSL(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },
    

    updateCanvasCursor() {
        // Remove all cursor-related classes
        this.canvas.classList.remove('select-mode', 'delete-mode', 'text-mode', 'add-mode', 'add-on-sugar');
        if (this.currentTool === 'select') {
            this.canvas.classList.add('select-mode');
        } else if (this.currentTool === 'delete') {
            this.canvas.classList.add('delete-mode');
        } else if (this.currentTool === 'text') {
            this.canvas.classList.add('text-mode');
        } else if (this.currentTool === 'add') {
            this.canvas.classList.add('add-mode');
        }
    },
    

    updateAddModeCursor(x, y) {
        const clickedElement = this.getElementAtPoint(x, y);
        
        // Remove previous add cursor classes
        this.canvas.classList.remove('add-on-sugar');
        
        // Hide preview dot by default
        if (this.addPreviewDot) {
            this.addPreviewDot.style.display = 'none';
        }
        
        if (clickedElement && clickedElement.classList.contains('sugar')) {
            // Mouse is over a sugar - show crosshair for directional addition
            this.canvas.classList.add('add-on-sugar');
            
            // Show preview dot at the position where new sugar would be added
            if (this.addPreviewDot) {
                const sugarX = parseFloat(clickedElement.getAttribute('data-x'));
                const sugarY = parseFloat(clickedElement.getAttribute('data-y'));
                const bestDir = this.findBestDirection(sugarX, sugarY, x, y);
                const previewX = sugarX + bestDir.dx * this.connectionDistance;
                const previewY = sugarY + bestDir.dy * this.connectionDistance;
                
                this.addPreviewDot.setAttribute('cx', previewX);
                this.addPreviewDot.setAttribute('cy', previewY);
                this.addPreviewDot.style.display = 'block';
            }
        }
        // When not over sugar, default add-mode class shows hand pointer
    },
    
    // Helper method to get SVG coordinates
};
