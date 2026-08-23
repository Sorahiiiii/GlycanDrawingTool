// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 3336, 3351, 3381, 3407, 3422.
export const sugarCreationMixin = {
    getSugarAtPoint(x, y) {
        const sugars = this.canvas.querySelectorAll('.sugar');
        for (let sugar of sugars) {
            const sugarX = parseFloat(sugar.getAttribute('data-x'));
            const sugarY = parseFloat(sugar.getAttribute('data-y'));
            const distance = Math.sqrt((x - sugarX) ** 2 + (y - sugarY) ** 2);
            // Use actual sugar size for hit detection with a small buffer
            const actualSize = this.getSugarSize(sugar);
            if (distance <= actualSize + 5) {
                return sugar;
            }
        }
        return null;
    },
    

    addConnectedSugar(parentSugar, clickX, clickY, config = null) {
        
        const sugarConfig = config || this.currentSugarConfig;
        const parentX = parseFloat(parentSugar.getAttribute('data-x'));
        const parentY = parseFloat(parentSugar.getAttribute('data-y'));
        
        // Find the best direction based on where the user clicked
        const bestDirection = this.findBestDirection(parentX, parentY, clickX, clickY);
        
        // Calculate position for new sugar
        const newX = parentX + bestDirection.dx * this.connectionDistance;
        const newY = parentY + bestDirection.dy * this.connectionDistance;
        
        // Check if position is available
        const existingSugar = this.getSugarAtPoint(newX, newY);
        if (existingSugar) {
            // Try alternative directions
            const altPosition = this.findAlternativePosition(parentX, parentY, bestDirection);
            if (altPosition) {
                const childSugar = this.createSugar(altPosition.x, altPosition.y, sugarConfig, false); // Don't save state again
                const linkage = this.currentLinkageConfig.linkage || document.getElementById('linkageInput')?.value || null;
                this.createConnection(parentSugar, childSugar, false, linkage);
            }
        } else {
            const childSugar = this.createSugar(newX, newY, sugarConfig, false); // Don't save state again
            const linkage = this.currentLinkageConfig.linkage || document.getElementById('linkageInput')?.value || null;
            this.createConnection(parentSugar, childSugar, false, linkage);
        }
    },
    

    findBestDirection(parentX, parentY, clickX, clickY) {
        const dx = clickX - parentX;
        const dy = clickY - parentY;
        
        // Normalize the direction vector
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return this.directions[8]; // Default to South
        
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        
        // Find the direction that best matches the click direction
        let bestDirection = this.directions[0];
        let bestDot = -2;
        
        for (const direction of this.directions) {
            const dot = normalizedDx * direction.dx + normalizedDy * direction.dy;
            if (dot > bestDot) {
                bestDot = dot;
                bestDirection = direction;
            }
        }
        
        return bestDirection;
    },
    

    findAlternativePosition(parentX, parentY, excludeDirection) {
        // Try other directions
        for (const direction of this.directions) {
            if (direction === excludeDirection) continue;
            
            const newX = parentX + direction.dx * this.connectionDistance;
            const newY = parentY + direction.dy * this.connectionDistance;
            
            if (!this.getSugarAtPoint(newX, newY)) {
                return { x: newX, y: newY };
            }
        }
        return null;
    },
    

    createSugar(x, y, config) {
        this.sugarCount++;
        
        // Create a group element for the sugar
        const sugarGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        sugarGroup.classList.add('sugar');
        sugarGroup.setAttribute('id', `sugar-${this.sugarCount}`);
        sugarGroup.setAttribute('data-x', x);
        sugarGroup.setAttribute('data-y', y);
        sugarGroup.setAttribute('data-shape', config.shape);
        sugarGroup.setAttribute('data-color', config.color);
        const renderPreset = config.renderPreset || this.currentSugarConfig?.renderPreset || 'flat';
        sugarGroup.setAttribute('data-render-preset', renderPreset);
        sugarGroup.setAttribute('data-rotation', config.rotation || '0');
        
        // Store config data
        if (config.type === 'preset') {
            sugarGroup.setAttribute('data-preset', config.preset);
        }
        
        // Create the shape based on config
        const size = config.size || this.sugarRadius;
        sugarGroup.setAttribute('data-size', size);
        const shape = this.createSugarShape(x, y, config.shape, config.color, size, null, false);
        shape.classList.add('sugar-shape');
        this.applyRenderPreset(shape, config.shape, config.color, renderPreset);
        if (parseFloat(config.rotation || '0') !== 0) {
            this.applyShapeRotation?.(sugarGroup, parseFloat(config.rotation));
        }
        
        // Apply border settings from config
        // Check if this is a divided shape that needs special handling
        const shapeType = config.shape;
        if ((shapeType === 'triangle-divided' && shape.classList.contains('triangle-divided-group')) ||
            (shapeType === 'square-divided' && shape.classList.contains('square-divided-group')) ||
            (shapeType === 'diamond-divided-top' && shape.classList.contains('diamond-divided-top-group')) ||
            (shapeType === 'diamond-divided-bottom' && shape.classList.contains('diamond-divided-bottom-group'))) {
            // Handle divided shapes: apply settings to both polygon and dividing line
            const polygon = shape.querySelector('polygon');
            const line = shape.querySelector('.dividing-line');
            
            // Compute effective border/fill values (use config if present, otherwise fall back to currentSugarConfig, finally to hard defaults)
            const effectiveBorderWidth = (config && config.borderWidth != null) ? config.borderWidth : (this.currentSugarConfig?.borderWidth ?? 3);
            const effectiveBorderColor = (config && config.borderColor) ? this.normalizeColorToHex(config.borderColor) : (this.currentSugarConfig?.borderColor ? this.normalizeColorToHex(this.currentSugarConfig.borderColor) : '#000000');
            const effectiveBorderOpacity = (config && config.borderOpacity != null) ? config.borderOpacity : (this.currentSugarConfig?.borderOpacity != null ? this.currentSugarConfig.borderOpacity : 1);
            const effectiveFillOpacity = (config && config.fillOpacity != null) ? config.fillOpacity : (this.currentSugarConfig?.fillOpacity != null ? this.currentSugarConfig.fillOpacity : 1);

            if (polygon) polygon.style.setProperty('stroke-width', effectiveBorderWidth, 'important');
            if (line) line.style.setProperty('stroke-width', effectiveBorderWidth, 'important');

            if (polygon) polygon.style.setProperty('stroke', effectiveBorderColor, 'important');
            if (line) line.style.setProperty('stroke', effectiveBorderColor, 'important');

            if (polygon) polygon.style.setProperty('stroke-opacity', effectiveBorderOpacity, 'important');
            if (line) line.style.setProperty('stroke-opacity', effectiveBorderOpacity, 'important');

            if (polygon) polygon.style.setProperty('fill-opacity', effectiveFillOpacity, 'important');
            if (config.borderStyle && config.borderStyle !== 'solid') {
                const width = config.borderWidth || '2';
                let dashArray;
                switch (config.borderStyle) {
                    case 'dashed':
                        dashArray = `${width * 3},${width * 2}`;
                        break;
                    case 'dotted':
                        dashArray = `${width},${width}`;
                        break;
                }
                if (dashArray) {
                    if (polygon) polygon.style.setProperty('stroke-dasharray', dashArray, 'important');
                    if (line) line.style.setProperty('stroke-dasharray', dashArray, 'important');
                }
            }
        } else {
            // Handle regular shapes
            // Apply effective defaults for regular shapes
            const effectiveBorderWidthReg = (config && config.borderWidth != null) ? config.borderWidth : (this.currentSugarConfig?.borderWidth ?? 3);
            const effectiveBorderColorReg = (config && config.borderColor) ? this.normalizeColorToHex(config.borderColor) : (this.currentSugarConfig?.borderColor ? this.normalizeColorToHex(this.currentSugarConfig.borderColor) : '#000000');
            const effectiveBorderOpacityReg = (config && config.borderOpacity != null) ? config.borderOpacity : (this.currentSugarConfig?.borderOpacity != null ? this.currentSugarConfig.borderOpacity : 1);
            const effectiveFillOpacityReg = (config && config.fillOpacity != null) ? config.fillOpacity : (this.currentSugarConfig?.fillOpacity != null ? this.currentSugarConfig.fillOpacity : 1);

            shape.style.setProperty('stroke-width', effectiveBorderWidthReg, 'important');
            shape.style.setProperty('stroke', effectiveBorderColorReg, 'important');
            shape.style.setProperty('stroke-opacity', effectiveBorderOpacityReg, 'important');
            shape.style.setProperty('fill-opacity', effectiveFillOpacityReg, 'important');
            if (config.borderStyle && config.borderStyle !== 'solid') {
                const width = config.borderWidth || '2';
                switch (config.borderStyle) {
                    case 'dashed':
                        shape.style.setProperty('stroke-dasharray', `${width * 3},${width * 2}`, 'important');
                        break;
                    case 'dotted':
                        shape.style.setProperty('stroke-dasharray', `${width},${width}`, 'important');
                        break;
                }
            }
        }
        
        sugarGroup.appendChild(shape);
        
        // Add to canvas
        this.canvas.appendChild(sugarGroup);
        
        // Record creation for undo/redo system
        const objectData = this.createObjectData(sugarGroup);
        if (objectData) {
            this.recordObjectAdded(objectData);
        }
        
        return sugarGroup;
    },
    
};
