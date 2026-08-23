import { boundingBoxCenter, rotatePoint, snapAngle } from "../../core/geometry.js";
import { loadPreferences } from "../../core/preferences.js";

// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 4252, 4264, 4294, 4305, 4318, 4346, 4359, 4383, 4662, 4752, 4796, 4922, 4953.
export const sugarSelectionMixin = {
    deselectAll() {
        // Use unified selection system
        this.clearAllSelections();
        
        // Always update panels when deselecting
        this.updateStylePanel();
        this.updateLeftPanel();
        this.updateRightPanel();
    },
    
    // Deprecated: Multiple old deselection methods removed - use clearAllSelections() instead
    

    addSelectionHighlight(sugar) {
        // Remove existing highlight for this sugar
        this.removeSelectionHighlight(sugar);
        
        const x = parseFloat(sugar.getAttribute('data-x'));
        const y = parseFloat(sugar.getAttribute('data-y'));
        
        // Create unique highlight ID for this sugar
        const highlightId = 'highlight-' + sugar.getAttribute('id');
        
        // Create highlight circle
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.classList.add('selection-highlight');
        highlight.setAttribute('id', highlightId);
        highlight.setAttribute('cx', x);
        highlight.setAttribute('cy', y);
        // Use actual sugar size for highlight
        const actualSize = this.getSugarSize(sugar);
        highlight.setAttribute('r', actualSize + 5);
        highlight.setAttribute('fill', 'none');
        highlight.setAttribute('stroke', '#0072BC');
        highlight.setAttribute('stroke-width', '2');
        highlight.setAttribute('stroke-dasharray', '5,5');
        highlight.setAttribute('pointer-events', 'none');
        
        // Insert before the sugar so it appears behind
        this.canvas.insertBefore(highlight, sugar);
        sugar.setAttribute('data-highlight-id', highlightId);
    },
    

    updateSelectionHighlightPosition(sugar, x, y) {
        const highlightId = sugar.getAttribute('data-highlight-id');
        if (highlightId) {
            const highlight = this.canvas.querySelector('#' + highlightId);
            if (highlight) {
                highlight.setAttribute('cx', x);
                highlight.setAttribute('cy', y);
            }
        }
    },
    

    removeSelectionHighlight(sugar) {
        if (sugar) {
            const highlightId = sugar.getAttribute('data-highlight-id');
            if (highlightId) {
                const highlight = this.canvas.querySelector('#' + highlightId);
                if (highlight) {
                    highlight.remove();
                }
                sugar.removeAttribute('data-highlight-id');
            }
        }
    },
    

    addTextSelectionHighlight(text) {
        const x = parseFloat(text.getAttribute('x'));
        const y = parseFloat(text.getAttribute('y'));
        
        // Get text dimensions for background rect
        const bbox = text.getBBox();
        
        // Create selection highlight rectangle
        const highlightId = 'text-highlight-' + Date.now();
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        highlight.setAttribute('id', highlightId);
        highlight.setAttribute('x', bbox.x - 4);
        highlight.setAttribute('y', bbox.y - 2);
        highlight.setAttribute('width', bbox.width + 8);
        highlight.setAttribute('height', bbox.height + 4);
        highlight.setAttribute('fill', '#0072BC33');  // #0072BC with 20% opacity (0.2 * 255 = 51 = 0x33)
        highlight.setAttribute('stroke', '#0072BC');
        highlight.setAttribute('stroke-width', '2');
        highlight.setAttribute('stroke-dasharray', '5,5');
        highlight.setAttribute('rx', '3');
        highlight.setAttribute('ry', '3');
        highlight.setAttribute('pointer-events', 'none');
        
        // Insert before the text so it appears behind
        this.canvas.insertBefore(highlight, text);
        text.setAttribute('data-text-highlight-id', highlightId);
    },
    

    removeTextSelectionHighlight(text) {
        if (text) {
            const highlightId = text.getAttribute('data-text-highlight-id');
            if (highlightId) {
                const highlight = this.canvas.querySelector('#' + highlightId);
                if (highlight) {
                    highlight.remove();
                }
                text.removeAttribute('data-text-highlight-id');
            }
        }
    },
    

    moveSugar(sugar, newX, newY) {
        const oldX = parseFloat(sugar.getAttribute('data-x'));
        const oldY = parseFloat(sugar.getAttribute('data-y'));
        
        // Update sugar position
        sugar.setAttribute('data-x', newX);
        sugar.setAttribute('data-y', newY);
        
        // Update the sugar shape position
        const shape = sugar.querySelector('.sugar-shape');
        const shapeType = sugar.getAttribute('data-shape');
        if (shape && shapeType) {
            this.updateShapePosition(shape, shapeType, newX, newY);
        }
        
        // Update selection highlight position directly without recreating
        if (sugar.classList.contains('selected') || this.selectedSugars.has(sugar)) {
            this.updateSelectionHighlightPosition(sugar, newX, newY);
        }
        
        // Update connected lines
        this.updateConnectedLines(sugar, oldX, oldY, newX, newY);
        const rotation = parseFloat(sugar.getAttribute("data-rotation") || "0");
        if (rotation !== 0) {
            this.applyShapeRotation?.(sugar, rotation);
        }
        this.refreshLinkageArrows();
    },

    updateShapePosition(shape, shapeType, x, y) {
        if (!shape) return; // Safety check
        
        // Get the actual size from the sugar element's data-size attribute
        // Find the parent sugar element
        let sugarElement = shape.parentElement;
        while (sugarElement && !sugarElement.classList.contains('sugar')) {
            sugarElement = sugarElement.parentElement;
        }
        
        // Use the sugar's actual size if available, otherwise fall back to default
        const size = sugarElement ? 
            (parseFloat(sugarElement.getAttribute('data-size')) || this.sugarRadius) : 
            this.sugarRadius;
        
        switch (shapeType) {
            case 'circle':
            case 'circle-filled':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                break;
                
            case 'circle-flat':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', size * 1.4);
                shape.setAttribute('ry', size * 0.7);
                break;
                
            case 'circle-narrow':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', size * 0.7);
                shape.setAttribute('ry', size * 1.4);
                break;

            case 'square':
                shape.setAttribute('x', x - size);
                shape.setAttribute('y', y - size);
                break;

            case 'square-flat':
                shape.setAttribute('x', x - size);
                shape.setAttribute('y', y - size * 0.7);
                shape.setAttribute('width', size * 2);
                shape.setAttribute('height', size * 1.4);
                break;

            case 'square-narrow':
                shape.setAttribute('x', x - size * 0.7);
                shape.setAttribute('y', y - size);
                shape.setAttribute('width', size * 1.4);
                shape.setAttribute('height', size * 2);
                break;

            case 'square-divided':
                // 分割正方形拖拽，更新group内polygon和分割线
                if (shape.classList.contains('square-divided-group')) {
                    const p1 = {x: x - size, y: y - size}; // 左上
                    const p2 = {x: x + size, y: y - size}; // 右上
                    const p3 = {x: x + size, y: y + size}; // 右下
                    const p4 = {x: x - size, y: y + size}; // 左下
                    const squarePoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
                    const polygon = shape.querySelector('polygon');
                    if (polygon) polygon.setAttribute('points', squarePoints);
                    const line = shape.querySelector('.dividing-line');
                    if (line) {
                        line.setAttribute('x1', p1.x);
                        line.setAttribute('y1', p1.y);
                        line.setAttribute('x2', p3.x);
                        line.setAttribute('y2', p3.y);
                    }
                }
                break;
                
            case 'triangle':
                const triPoints = this.generatePolygonPoints(x, y, size, 3, -Math.PI/2);
                shape.setAttribute('points', triPoints);
                break;
                
            case 'triangle-inverted':
                const invertedTriPoints = this.generatePolygonPoints(x, y, size, 3, Math.PI/2);
                shape.setAttribute('points', invertedTriPoints);
                break;
                
            case 'triangle-divided':
                // 新的分割三角形结构：group包含polygon+line
                if (shape.classList.contains('triangle-divided-group')) {
                    // 重新计算三角形点
                    const newTriPoints = this.generatePolygonPoints(x, y, size, 3, -Math.PI/2);
                    
                    // 更新多边形
                    const polygon = shape.querySelector('polygon');
                    if (polygon) {
                        polygon.setAttribute('points', newTriPoints);
                    }
                    
                    // 更新分割线
                    const line = shape.querySelector('.dividing-line');
                    if (line) {
                        const vertices = this.parsePolygonPoints(newTriPoints);
                        if (vertices.length >= 3) {
                            const topVertex = vertices[0];
                            const bottomMidX = (vertices[1].x + vertices[2].x) / 2;
                            const bottomMidY = (vertices[1].y + vertices[2].y) / 2;
                            
                            line.setAttribute('x1', topVertex.x);
                            line.setAttribute('y1', topVertex.y);
                            line.setAttribute('x2', bottomMidX);
                            line.setAttribute('y2', bottomMidY);
                        }
                    }
                }
                break;
                
            case 'diamond':
                const diamondPoints = `${x},${y-size} ${x+size},${y} ${x},${y+size} ${x-size},${y}`;
                shape.setAttribute('points', diamondPoints);
                break;
                
            case 'diamond-flat':
                const diamondFlatPoints = `${x},${y-size*0.7} ${x+size*1.4},${y} ${x},${y+size*0.7} ${x-size*1.4},${y}`;
                shape.setAttribute('points', diamondFlatPoints);
                break;
                
            case 'diamond-narrow':
                const diamondNarrowPoints = `${x},${y-size*1.4} ${x+size*0.7},${y} ${x},${y+size*1.4} ${x-size*0.7},${y}`;
                shape.setAttribute('points', diamondNarrowPoints);
                break;
                
            case 'diamond-divided-top':
                // 分割菱形（下白）结构：group包含polygon+line
                if (shape.classList.contains('diamond-divided-top-group')) {
                    // 重新计算菱形点
                    const newDiamondTopPoints = `${x},${y-size} ${x+size},${y} ${x},${y+size} ${x-size},${y}`;
                    
                    // 更新多边形
                    const polygon = shape.querySelector('polygon');
                    if (polygon) {
                        polygon.setAttribute('points', newDiamondTopPoints);
                    }
                    
                    // 更新水平分割线
                    const line = shape.querySelector('.dividing-line');
                    if (line) {
                        line.setAttribute('x1', x - size);
                        line.setAttribute('y1', y);
                        line.setAttribute('x2', x + size);
                        line.setAttribute('y2', y);
                    }
                }
                break;
                
            case 'diamond-divided-bottom':
                // 分割菱形（上白）结构：group包含polygon+line
                if (shape.classList.contains('diamond-divided-bottom-group')) {
                    // 重新计算菱形点
                    const newDiamondBottomPoints = `${x},${y-size} ${x+size},${y} ${x},${y+size} ${x-size},${y}`;
                    
                    // 更新多边形
                    const polygon = shape.querySelector('polygon');
                    if (polygon) {
                        polygon.setAttribute('points', newDiamondBottomPoints);
                    }
                    
                    // 更新水平分割线
                    const line = shape.querySelector('.dividing-line');
                    if (line) {
                        line.setAttribute('x1', x - size);
                        line.setAttribute('y1', y);
                        line.setAttribute('x2', x + size);
                        line.setAttribute('y2', y);
                    }
                }
                break;
                
            case 'star':
            case 'star-5':
                const starPoints = this.generateStarPoints(x, y, size, 5, 0);
                shape.setAttribute('points', starPoints);
                break;
                
            case 'star-5-inverted':
                const starInvertedPoints = this.generateStarPoints(x, y, size, 5, Math.PI);
                shape.setAttribute('points', starInvertedPoints);
                break;
                
            case 'star-4':
                const star4Points = this.generateStarPoints(x, y, size, 4, 0);
                shape.setAttribute('points', star4Points);
                break;
                
            case 'star-4-tilted':
                const star4TiltedPoints = this.generateStarPoints(x, y, size, 4, Math.PI/4);
                shape.setAttribute('points', star4TiltedPoints);
                break;
                
            case 'star-6':
                const star6Points = this.generateStarPoints(x, y, size, 6, 0);
                shape.setAttribute('points', star6Points);
                break;
                
            case 'star-6-tilted':
                const star6TiltedPoints = this.generateStarPoints(x, y, size, 6, Math.PI/6);
                shape.setAttribute('points', star6TiltedPoints);
                break;
                
            case 'hexagon':
                const hexPoints = this.generatePolygonPoints(x, y, size, 6, 0);
                shape.setAttribute('points', hexPoints);
                break;
                
            case 'flat-hexagon':
                const flatHexPoints = this.generatePolygonPoints(x, y, size, 6, Math.PI/6);
                shape.setAttribute('points', flatHexPoints);
                break;
                
            case 'hexagon-compressed':
                const compressedHexPoints = this.generateCompressedPolygonPoints(x, y, size, 6, 0, 0.7);
                shape.setAttribute('points', compressedHexPoints);
                break;
                
            case 'flat-hexagon-compressed':
                const compressedFlatHexPoints = this.generateCompressedPolygonPoints(x, y, size, 6, Math.PI/6, 0.7);
                shape.setAttribute('points', compressedFlatHexPoints);
                break;
                
            case 'flat-diamond':
                const flatDiamondPoints = `${x-size*0.7},${y} ${x},${y-size*0.7} ${x+size*0.7},${y} ${x},${y+size*0.7}`;
                shape.setAttribute('points', flatDiamondPoints);
                break;
                
            case 'pentagon':
                const pentPoints = this.generatePolygonPoints(x, y, size, 5, -Math.PI/2);
                shape.setAttribute('points', pentPoints);
                break;
                
            case 'pentagon-inverted':
                const pentInvertedPoints = this.generatePolygonPoints(x, y, size, 5, Math.PI/2);
                shape.setAttribute('points', pentInvertedPoints);
                break;
                
            case 'freeend-asterisk':
                // Update asterisk path position
                shape.setAttribute('d', this.createAsteriskPath(x, y, size));
                break;
                
            case 'freeend-wave':
                // Update wave path
                this.updateWavePath(shape, x, y, size);
                break;
                
            case 'bracket-left':
                shape.setAttribute('d', this.createBracketPath('left', x, y, size));
                break;
                
            case 'bracket-right':
                shape.setAttribute('d', this.createBracketPath('right', x, y, size));
                break;
                
            case 'paren-left':
                shape.setAttribute('d', this.createParenPath('left', x, y, size));
                break;
                
            case 'paren-right':
                shape.setAttribute('d', this.createParenPath('right', x, y, size));
                break;
                
            case 'brace-left':
                shape.setAttribute('d', this.createBracePath('left', x, y, size));
                break;
                
            case 'brace-right':
                shape.setAttribute('d', this.createBracePath('right', x, y, size));
                break;
        }
    },
    
    // Update existing shape element to a different shape type

    updateShapeToType(shape, newShapeType, x, y, color, size, strokeWidth = null) {
        if (!shape) return;
        
        const currentType = shape.tagName.toLowerCase();
        const targetType = this.getTargetElementType(newShapeType);
        
        // If the SVG element type needs to change (e.g., circle to rect), we need to replace it
        if (currentType !== targetType) {
            const parent = shape.parentElement;
            const oldShape = shape;
            
            // Create new shape element
            const newShape = this.createSugarShape(x, y, newShapeType, color, size, strokeWidth);
            newShape.classList.add('sugar-shape');

            // Preserve stroke-related properties from the old shape onto the new one.
            try {
                // If the old shape is a grouped/divided shape, prefer reading stroke values
                // from its inner polygon/line elements. Otherwise fall back to attributes on
                // the container element itself.
                let oldStroke = null;
                let oldStrokeWidth = null;
                let oldDash = null;
                let oldStrokeOpacity = null;

                // Try to find inner elements that commonly hold stroke information
                const oldInnerPoly = oldShape.querySelector ? (oldShape.querySelector('polygon') || oldShape.querySelector('path') || oldShape.querySelector('ellipse') || oldShape.querySelector('rect')) : null;
                const oldInnerLine = oldShape.querySelector ? oldShape.querySelector('.dividing-line') : null;

                if (oldInnerPoly) {
                    oldStroke = oldInnerPoly.style.stroke || oldInnerPoly.getAttribute('stroke') || null;
                    oldStrokeWidth = oldInnerPoly.style.strokeWidth || oldInnerPoly.getAttribute('stroke-width') || null;
                    oldDash = oldInnerPoly.style.strokeDasharray || oldInnerPoly.getAttribute('stroke-dasharray') || null;
                    oldStrokeOpacity = oldInnerPoly.style.strokeOpacity || oldInnerPoly.getAttribute('stroke-opacity') || null;
                }

                // If the dividing line has stroke properties, prefer them for the line element
                if (oldInnerLine && !oldStroke) {
                    oldStroke = oldInnerLine.style.stroke || oldInnerLine.getAttribute('stroke') || oldStroke;
                }
                if (oldInnerLine && !oldStrokeWidth) {
                    oldStrokeWidth = oldInnerLine.style.strokeWidth || oldInnerLine.getAttribute('stroke-width') || oldStrokeWidth;
                }
                if (oldInnerLine && !oldDash) {
                    oldDash = oldInnerLine.style.strokeDasharray || oldInnerLine.getAttribute('stroke-dasharray') || oldDash;
                }
                if (oldInnerLine && !oldStrokeOpacity) {
                    oldStrokeOpacity = oldInnerLine.style.strokeOpacity || oldInnerLine.getAttribute('stroke-opacity') || oldStrokeOpacity;
                }

                // Fallback to container-level attributes if inner elements had no values
                if (!oldStroke) oldStroke = oldShape.style.stroke || oldShape.getAttribute('stroke') || null;
                if (!oldStrokeWidth) oldStrokeWidth = oldShape.style.strokeWidth || oldShape.getAttribute('stroke-width') || null;
                if (!oldDash) oldDash = oldShape.style.strokeDasharray || oldShape.getAttribute('stroke-dasharray') || null;
                if (!oldStrokeOpacity) oldStrokeOpacity = oldShape.style.strokeOpacity || oldShape.getAttribute('stroke-opacity') || null;

                // If newShape is a group (complex divided shape), apply to inner polygon and dividing line
                const innerPoly = newShape.querySelector ? newShape.querySelector('polygon') : null;
                const innerLine = newShape.querySelector ? newShape.querySelector('.dividing-line') : null;
                if (innerPoly) {
                    if (oldStroke) innerPoly.style.setProperty('stroke', oldStroke, 'important');
                    if (oldStrokeWidth) innerPoly.style.setProperty('stroke-width', oldStrokeWidth, 'important');
                    if (oldDash) innerPoly.style.setProperty('stroke-dasharray', oldDash, 'important');
                    if (oldStrokeOpacity) innerPoly.style.setProperty('stroke-opacity', oldStrokeOpacity, 'important');
                }
                if (innerLine) {
                    if (oldStroke) innerLine.style.setProperty('stroke', oldStroke, 'important');
                    if (oldStrokeWidth) innerLine.style.setProperty('stroke-width', oldStrokeWidth, 'important');
                    if (oldDash) innerLine.style.setProperty('stroke-dasharray', oldDash, 'important');
                    if (oldStrokeOpacity) innerLine.style.setProperty('stroke-opacity', oldStrokeOpacity, 'important');
                }

                // For simple elements, copy attributes directly
                if (!innerPoly && !innerLine) {
                    if (oldStroke) newShape.style.setProperty('stroke', oldStroke, 'important');
                    if (oldStrokeWidth) newShape.style.setProperty('stroke-width', oldStrokeWidth, 'important');
                    if (oldDash) newShape.style.setProperty('stroke-dasharray', oldDash, 'important');
                    if (oldStrokeOpacity) newShape.style.setProperty('stroke-opacity', oldStrokeOpacity, 'important');
                }
            } catch (e) {}

            // Replace the old shape with the new one
            parent.replaceChild(newShape, oldShape);
        } else {
            // Same element type, just update attributes
            this.updateShapeAttributes(shape, newShapeType, x, y, color, size, strokeWidth);
        }
    },
    
    // Get the SVG element type needed for a shape

    getTargetElementType(shapeType) {
        switch (shapeType) {
            case 'circle':
            case 'circle-filled':
                return 'circle';
            case 'circle-flat':
            case 'circle-narrow':
                return 'ellipse';
            case 'square':
            case 'square-flat':
            case 'square-narrow':
                return 'rect';
            case 'square-divided':
            case 'triangle-divided':
            case 'diamond-divided-top':
            case 'diamond-divided-bottom':
                return 'g'; // These are complex shapes with gradients and multiple elements
            case 'triangle':
            case 'triangle-filled':
            case 'triangle-inverted':
            case 'diamond':
            case 'diamond-flat':
            case 'diamond-narrow':
            case 'star':
            case 'star-5':
            case 'star-5-inverted':
            case 'star-4':
            case 'star-4-tilted':
            case 'star-6':
            case 'star-6-tilted':
            case 'hexagon':
            case 'flat-hexagon':
            case 'hexagon-compressed':
            case 'flat-hexagon-compressed':
            case 'flat-diamond':
            case 'pentagon':
            case 'pentagon-inverted':
                return 'polygon';
            default:
                return 'polygon'; // Default for complex shapes
        }
    },
    
    // Update shape attributes for same element type

    updateShapeAttributes(shape, shapeType, x, y, color, size, strokeWidth = null) {
        const actualSize = size || this.sugarRadius;
    // Determine effective stroke width: use provided strokeWidth, otherwise use currentSugarConfig or fallback 3
    const actualStrokeWidth = (strokeWidth !== null && strokeWidth !== undefined) ? strokeWidth : (this.currentSugarConfig?.borderWidth ?? 3);
        
        // Update position and size attributes based on shape type
        switch (shapeType) {
            case 'circle':
            case 'circle-filled':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('r', actualSize);
                break;
                
            case 'circle-flat':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', actualSize * 1.4);
                shape.setAttribute('ry', actualSize * 0.7);
                break;
                
            case 'circle-narrow':
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', actualSize * 0.7);
                shape.setAttribute('ry', actualSize * 1.4);
                break;
                
            case 'square':
                shape.setAttribute('x', x - actualSize);
                shape.setAttribute('y', y - actualSize);
                shape.setAttribute('width', actualSize * 2);
                shape.setAttribute('height', actualSize * 2);
                break;
                
            case 'square-flat':
                shape.setAttribute('x', x - actualSize);
                shape.setAttribute('y', y - actualSize * 0.7);
                shape.setAttribute('width', actualSize * 2);
                shape.setAttribute('height', actualSize * 1.4);
                break;
                
            case 'square-narrow':
                shape.setAttribute('x', x - actualSize * 0.7);
                shape.setAttribute('y', y - actualSize);
                shape.setAttribute('width', actualSize * 1.4);
                shape.setAttribute('height', actualSize * 2);
                break;
                
            case 'triangle':
            case 'triangle-filled':
                const triPoints = `${x},${y-actualSize} ${x+actualSize*0.866},${y+actualSize*0.5} ${x-actualSize*0.866},${y+actualSize*0.5}`;
                shape.setAttribute('points', triPoints);
                break;
                
            case 'triangle-inverted':
                const triInvPoints = `${x},${y+actualSize} ${x+actualSize*0.866},${y-actualSize*0.5} ${x-actualSize*0.866},${y-actualSize*0.5}`;
                shape.setAttribute('points', triInvPoints);
                break;
                
            case 'diamond':
                const diamondPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                shape.setAttribute('points', diamondPoints);
                break;
                
            case 'diamond-flat':
                const diamondFlatPoints = `${x},${y-actualSize*0.7} ${x+actualSize*1.4},${y} ${x},${y+actualSize*0.7} ${x-actualSize*1.4},${y}`;
                shape.setAttribute('points', diamondFlatPoints);
                break;
                
            case 'diamond-narrow':
                const diamondNarrowPoints = `${x},${y-actualSize*1.4} ${x+actualSize*0.7},${y} ${x},${y+actualSize*1.4} ${x-actualSize*0.7},${y}`;
                shape.setAttribute('points', diamondNarrowPoints);
                break;
                
            case 'star-5':
                const star5Points = this.generateStarPoints(x, y, actualSize, 5, 0);
                shape.setAttribute('points', star5Points);
                break;
                
            case 'diamond-divided-top':
                // For complex shapes like diamond-divided-top, we need to replace the entire element
                // since it involves gradients and multiple elements
                console.warn('Cannot update diamond-divided-top in place, need full replacement');
                // This will be handled by the element replacement logic in updateShapeToType
                break;
                
            // Add other shape types as needed...
        }
        
        // Update color and stroke based on shape type
        const normalizedFillColor = this.normalizeColorToHex(color);
        
        if (shapeType === 'freeend-asterisk') {
            // Asterisk text - use color for fill, no stroke
            shape.style.setProperty('fill', normalizedFillColor, 'important');
            shape.style.removeProperty('stroke');
            shape.style.removeProperty('stroke-width');
        } else if (shapeType === 'freeend-wave') {
            // Wave line - use color for stroke
            shape.style.setProperty('stroke', normalizedFillColor, 'important');
            shape.style.setProperty('stroke-width', actualStrokeWidth, 'important');
            shape.style.removeProperty('fill');
        } else if (shapeType === 'bracket-left' || shapeType === 'bracket-right' || 
                   shapeType === 'paren-left' || shapeType === 'paren-right' ||
                   shapeType === 'brace-left' || shapeType === 'brace-right') {
            // Bracket and parenthesis path shapes - use color for stroke
            shape.style.setProperty('stroke', normalizedFillColor, 'important');
            shape.style.setProperty('stroke-width', actualStrokeWidth, 'important');
            shape.style.removeProperty('fill');
        } else {
            // Regular shapes - use color for fill.
            shape.style.setProperty('fill', normalizedFillColor, 'important');

            // Ensure stroke and stroke-width exist: prefer existing attribute/style, otherwise use defaults
            const existingStroke = shape.style.stroke || shape.getAttribute('stroke');
            const existingStrokeWidth = shape.style.strokeWidth || shape.getAttribute('stroke-width');

            const effectiveStroke = existingStroke || (this.currentSugarConfig?.borderColor ? this.normalizeColorToHex(this.currentSugarConfig.borderColor) : '#000000');
            const effectiveStrokeWidth = existingStrokeWidth || actualStrokeWidth;

            if (effectiveStroke) shape.style.setProperty('stroke', effectiveStroke, 'important');
            if (effectiveStrokeWidth) shape.style.setProperty('stroke-width', effectiveStrokeWidth, 'important');
        }
    },


    updateConnectedLines(sugar, oldX, oldY, newX, newY) {
        const sugarId = sugar.getAttribute('id');
        const connections = this.canvas.querySelectorAll('.connection');
        
        connections.forEach(line => {
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            const x2 = parseFloat(line.getAttribute('x2'));
            const y2 = parseFloat(line.getAttribute('y2'));
            
            // Check if this line is connected to the moved sugar
            let updated = false;
            if (Math.abs(x1 - oldX) < 1 && Math.abs(y1 - oldY) < 1) {
                // This line starts from the moved sugar
                line.setAttribute('x1', newX);
                line.setAttribute('y1', newY);
                updated = true;
            } else if (Math.abs(x2 - oldX) < 1 && Math.abs(y2 - oldY) < 1) {
                // This line ends at the moved sugar
                line.setAttribute('x2', newX);
                line.setAttribute('y2', newY);
                updated = true;
            }
            
            // Update linkage text position if this connection was updated
            if (updated) {
                this.updateLinkageText(line);
            }
        });
    },
    

    applySugarConfig(sugar, config) {
        // Update sugar attributes
        sugar.setAttribute('data-shape', config.shape);
        sugar.setAttribute('data-color', config.color);
        
        if (config.type === 'preset') {
            sugar.setAttribute('data-preset', config.preset);
        } else {
            sugar.removeAttribute('data-preset');
        }
        
        // Get current position
        const x = parseFloat(sugar.getAttribute('data-x'));
        const y = parseFloat(sugar.getAttribute('data-y'));
        
        // Remove old shape
        const oldShape = sugar.querySelector('.sugar-shape');
        if (oldShape) {
            oldShape.remove();
        }
        
        // Create new shape
        const newShape = this.createSugarShape(x, y, config.shape, config.color);
        newShape.classList.add('sugar-shape');
        sugar.appendChild(newShape);
    },
    
    // 新的统一选择UI更新方法
};
