// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 6137, 6193, 6437, 6506, 6537, 6544, 6560, 6636.
export const exportMixin = {
    getContentExportBounds(padding = 80) {
        const bbox = this.computeExportBBox(0, 0, 4000, 2800);
        if (!bbox) {
            return { minX: 0, minY: 0, maxX: 4000, maxY: 2800 };
        }
        return {
            minX: bbox.minX - padding,
            minY: bbox.minY - padding,
            maxX: bbox.maxX + padding,
            maxY: bbox.maxY + padding,
        };
    },

    downloadSVG() {
        const { minX, minY, maxX, maxY } = this.getContentExportBounds();
        const exportW = Math.max(1, Math.ceil(maxX - minX));
        const exportH = Math.max(1, Math.ceil(maxY - minY));

        // Create a clean SVG for export with only elements within bounds
        const exportSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        exportSVG.setAttribute('width', exportW);
        exportSVG.setAttribute('height', exportH);
        exportSVG.setAttribute('viewBox', `0 0 ${exportW} ${exportH}`);
        exportSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        exportSVG.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        // Copy only elements within computed bounds and translate them to origin
        this.copyElementsInBounds(exportSVG, minX, minY, maxX, maxY);

        // Get the SVG string
        const svgString = new XMLSerializer().serializeToString(exportSVG);
        
        // Create and download the file
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `glycan-structure-${new Date().getTime()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    },
    
    // Copy only elements that are within the export bounds

    copyElementsInBounds(targetSVG, minX, minY, maxX, maxY) {
        const allElements = this.canvas.children;
        
        // Collect gradient IDs referenced by divided shapes that will be copied
        const gradientIdsToCopy = new Set();
        
        // First pass: identify which gradients need to be copied
        for (let element of allElements) {
            // Skip temporary UI elements
            if (element.classList.contains('selection-highlight') || 
                element.classList.contains('selection-box') ||
                element.classList.contains('connection-preview') ||
                element.classList.contains('box-selection-preview') ||
                element.classList.contains("linkage-arrow")) {
                continue;
            }
            
            let shouldInclude = false;
            
            if (element.classList.contains('sugar')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                const size = parseFloat(element.getAttribute('data-size')) || this.sugarRadius;
                const shape = element.querySelector('.sugar-shape');
                const strokeWidth = parseFloat(element.getAttribute('data-border-width'))
                    || parseFloat(shape?.style.strokeWidth)
                    || 2;
                const pad = strokeWidth / 2;
                
                // Include if sugar is at least partially within bounds
                if (x + size + pad >= minX && x - size - pad <= maxX && y + size + pad >= minY && y - size - pad <= maxY) {
                    shouldInclude = true;
                }
            } else if (element.classList.contains('text-element')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                
                // Include if text position is within bounds
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    shouldInclude = true;
                }
            } else if (element.classList.contains('connection')) {
                // Include connections if either endpoint is within bounds
                const x1 = parseFloat(element.getAttribute('x1'));
                const y1 = parseFloat(element.getAttribute('y1'));
                const x2 = parseFloat(element.getAttribute('x2'));
                const y2 = parseFloat(element.getAttribute('y2'));
                
                if ((x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) ||
                    (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY)) {
                    shouldInclude = true;
                }
            } else if (element.tagName && element.tagName.toLowerCase() === 'text' && element.classList.contains('linkage-label')) {
                // Linkage label text elements (config/position) - include if within bounds
                const x = parseFloat(element.getAttribute('x'));
                const y = parseFloat(element.getAttribute('y'));
                if (!isNaN(x) && !isNaN(y)) {
                    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                        shouldInclude = true;
                    }
                }
            }
            
            // If this sugar will be included, check if it references gradients
            if (shouldInclude && element.classList.contains('sugar')) {
                const shape = element.querySelector('.sugar-shape');
                if (shape) {
                    const gradientId = shape.getAttribute('data-gradient-id');
                    if (gradientId) {
                        gradientIdsToCopy.add(gradientId);
                    }

                    const fill = shape.getAttribute('fill');
                    if (fill && fill.startsWith('url(#')) {
                        const renderGradientId = fill.slice(5, -1);
                        if (renderGradientId.startsWith('render-soft-') ||
                            renderGradientId.startsWith('render-glossy-')) {
                            gradientIdsToCopy.add(renderGradientId);
                        }
                    }
                }
            }
        }
        
        // Copy referenced gradients to target SVG
        if (gradientIdsToCopy.size > 0) {
            // Ensure target SVG has a defs element
            let targetDefs = targetSVG.querySelector('defs');
            if (!targetDefs) {
                targetDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                targetSVG.insertBefore(targetDefs, targetSVG.firstChild);
            }
            
            // Copy each gradient
            const sourceDefs = this.canvas.querySelector('defs');
            if (sourceDefs) {
                gradientIdsToCopy.forEach(gradientId => {
                    const gradient = sourceDefs.querySelector('#' + gradientId);
                    if (gradient && !targetDefs.querySelector('#' + gradientId)) {
                        const clonedGradient = gradient.cloneNode(true);
                        targetDefs.appendChild(clonedGradient);
                    }
                });
            }
        }
        
        // Second pass: copy the actual elements
        for (let element of allElements) {
            // Skip temporary UI elements
            if (element.classList.contains('selection-highlight') || 
                element.classList.contains('selection-box') ||
                element.classList.contains('connection-preview') ||
                element.classList.contains('box-selection-preview') ||
                element.classList.contains("linkage-arrow")) {
                continue;
            }
            
            let shouldInclude = false;
            
            if (element.classList.contains('sugar')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                const size = parseFloat(element.getAttribute('data-size')) || this.sugarRadius;
                const shape = element.querySelector('.sugar-shape');
                const strokeWidth = parseFloat(element.getAttribute('data-border-width'))
                    || parseFloat(shape?.style.strokeWidth)
                    || 2;
                const pad = strokeWidth / 2;
                
                // Include if sugar is at least partially within bounds
                if (x + size + pad >= minX && x - size - pad <= maxX && y + size + pad >= minY && y - size - pad <= maxY) {
                    shouldInclude = true;
                }
            } else if (element.classList.contains('text-element')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                
                // Include if text position is within bounds
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    shouldInclude = true;
                }
            } else if (element.classList.contains('connection')) {
                // Include connections if either endpoint is within bounds
                const x1 = parseFloat(element.getAttribute('x1'));
                const y1 = parseFloat(element.getAttribute('y1'));
                const x2 = parseFloat(element.getAttribute('x2'));
                const y2 = parseFloat(element.getAttribute('y2'));
                
                if ((x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) ||
                    (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY)) {
                    shouldInclude = true;
                }
            } else if (element.tagName && element.tagName.toLowerCase() === 'text' && element.classList.contains('linkage-label')) {
                // Linkage label text elements (config/position) - include if within bounds
                const x = parseFloat(element.getAttribute('x'));
                const y = parseFloat(element.getAttribute('y'));
                if (!isNaN(x) && !isNaN(y)) {
                    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                        shouldInclude = true;
                    }
                }
            }
            
            if (shouldInclude) {
                const clonedElement = element.cloneNode(true);
                
                // Check for exclude-export attribute on child shapes (like freeend-asterisk)
                const excludedShapes = clonedElement.querySelectorAll('[data-exclude-export="true"]');
                excludedShapes.forEach(shape => shape.remove());
                
                // Translate coordinates relative to export area bounds
                if (clonedElement.classList.contains('sugar')) {
                    const x = parseFloat(clonedElement.getAttribute('data-x'));
                    const y = parseFloat(clonedElement.getAttribute('data-y'));
                    const newX = x - minX;
                    const newY = y - minY;
                    
                    clonedElement.setAttribute('data-x', newX);
                    clonedElement.setAttribute('data-y', newY);
                    
                    // Update all child shape elements' coordinates
                    const childShapes = clonedElement.querySelectorAll('circle, rect, polygon, ellipse, path, text, line');
                    childShapes.forEach(shape => {
                        if (shape.hasAttribute('cx') && shape.hasAttribute('cy')) {
                            // Circle or ellipse
                            const cx = parseFloat(shape.getAttribute('cx'));
                            const cy = parseFloat(shape.getAttribute('cy'));
                            shape.setAttribute('cx', cx - minX);
                            shape.setAttribute('cy', cy - minY);
                        }
                        if (shape.hasAttribute('x') && shape.hasAttribute('y')) {
                            // Rectangle or text element
                            const shapeX = parseFloat(shape.getAttribute('x'));
                            const shapeY = parseFloat(shape.getAttribute('y'));
                            shape.setAttribute('x', shapeX - minX);
                            shape.setAttribute('y', shapeY - minY);
                        }
                        if (shape.hasAttribute('points')) {
                            // Polygon
                            const points = shape.getAttribute('points');
                            const newPoints = points.split(' ').map(point => {
                                const [px, py] = point.split(',').map(parseFloat);
                                return `${px - minX},${py - minY}`;
                            }).join(' ');
                            shape.setAttribute('points', newPoints);
                        }
                        if (shape.hasAttribute('d')) {
                            // Path element (like freeend-wave) - update path coordinates
                            const d = shape.getAttribute('d');
                            const updatedD = d.replace(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g, (match, xVal, yVal) => {
                                const adjustedX = parseFloat(xVal) - minX;
                                const adjustedY = parseFloat(yVal) - minY;
                                return `${adjustedX} ${adjustedY}`;
                            });
                            shape.setAttribute('d', updatedD);
                        }
                        if (shape.hasAttribute('x1') && shape.hasAttribute('y1') && shape.hasAttribute('x2') && shape.hasAttribute('y2')) {
                            // Line element (like dividing lines in divided shapes)
                            const x1 = parseFloat(shape.getAttribute('x1'));
                            const y1 = parseFloat(shape.getAttribute('y1'));
                            const x2 = parseFloat(shape.getAttribute('x2'));
                            const y2 = parseFloat(shape.getAttribute('y2'));
                            shape.setAttribute('x1', x1 - minX);
                            shape.setAttribute('y1', y1 - minY);
                            shape.setAttribute('x2', x2 - minX);
                            shape.setAttribute('y2', y2 - minY);
                        }
                    });
                } else if (clonedElement.classList.contains('text-element')) {
                    const x = parseFloat(clonedElement.getAttribute('data-x'));
                    const y = parseFloat(clonedElement.getAttribute('data-y'));
                    const newX = x - minX;
                    const newY = y - minY;
                    
                    clonedElement.setAttribute('data-x', newX);
                    clonedElement.setAttribute('data-y', newY);
                    clonedElement.setAttribute('x', newX);
                    clonedElement.setAttribute('y', newY);
                } else if (clonedElement.tagName && clonedElement.tagName.toLowerCase() === 'text' && clonedElement.classList.contains('linkage-label')) {
                    // Translate linkage-label text elements (config and position labels)
                    const x = parseFloat(clonedElement.getAttribute('x'));
                    const y = parseFloat(clonedElement.getAttribute('y'));
                    if (!isNaN(x) && !isNaN(y)) {
                        const newX = x - minX;
                        const newY = y - minY;
                        clonedElement.setAttribute('x', newX);
                        clonedElement.setAttribute('y', newY);
                    }
                } else if (clonedElement.classList.contains('connection')) {
                    const x1 = parseFloat(clonedElement.getAttribute('x1'));
                    const y1 = parseFloat(clonedElement.getAttribute('y1'));
                    const x2 = parseFloat(clonedElement.getAttribute('x2'));
                    const y2 = parseFloat(clonedElement.getAttribute('y2'));
                    
                    clonedElement.setAttribute('x1', x1 - minX);
                    clonedElement.setAttribute('y1', y1 - minY);
                    clonedElement.setAttribute('x2', x2 - minX);
                    clonedElement.setAttribute('y2', y2 - minY);
                }
                
                targetSVG.appendChild(clonedElement);
            }
        }
    },

    // Compute the union bounding box (in canvas coordinates) of all elements that would be included
    // between the provided bounds. Returns { minX, minY, maxX, maxY } or null if nothing found.

    computeExportBBox(minX, minY, maxX, maxY) {
        const allElements = this.canvas.children;
        let found = false;
        let minUsedX = Infinity, minUsedY = Infinity, maxUsedX = -Infinity, maxUsedY = -Infinity;

        for (let element of allElements) {
            if (element.classList.contains('selection-highlight') ||
                element.classList.contains('selection-box') ||
                element.classList.contains('connection-preview')) {
                continue;
            }

            if (element.classList.contains('sugar')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                const size = parseFloat(element.getAttribute('data-size')) || this.sugarRadius;
                const shape = element.querySelector('.sugar-shape');
                const strokeWidth = parseFloat(element.getAttribute('data-border-width'))
                    || parseFloat(shape?.style.strokeWidth)
                    || 2;
                const pad = strokeWidth / 2;
                if (x + size + pad >= minX && x - size - pad <= maxX && y + size + pad >= minY && y - size - pad <= maxY) {
                    found = true;
                    if (x - size - pad < minUsedX) minUsedX = x - size - pad;
                    if (y - size - pad < minUsedY) minUsedY = y - size - pad;
                    if (x + size + pad > maxUsedX) maxUsedX = x + size + pad;
                    if (y + size + pad > maxUsedY) maxUsedY = y + size + pad;
                }
            } else if (element.classList.contains('text-element')) {
                const x = parseFloat(element.getAttribute('data-x'));
                const y = parseFloat(element.getAttribute('data-y'));
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    found = true;
                    if (x < minUsedX) minUsedX = x;
                    if (y < minUsedY) minUsedY = y;
                    if (x > maxUsedX) maxUsedX = x;
                    if (y > maxUsedY) maxUsedY = y;
                }
            } else if (element.classList.contains('connection')) {
                const x1 = parseFloat(element.getAttribute('x1'));
                const y1 = parseFloat(element.getAttribute('y1'));
                const x2 = parseFloat(element.getAttribute('x2'));
                const y2 = parseFloat(element.getAttribute('y2'));
                if ((x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) ||
                    (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY)) {
                    found = true;
                    const lineMinX = Math.min(x1, x2);
                    const lineMinY = Math.min(y1, y2);
                    const lineMaxX = Math.max(x1, x2);
                    const lineMaxY = Math.max(y1, y2);
                    if (lineMinX < minUsedX) minUsedX = lineMinX;
                    if (lineMinY < minUsedY) minUsedY = lineMinY;
                    if (lineMaxX > maxUsedX) maxUsedX = lineMaxX;
                    if (lineMaxY > maxUsedY) maxUsedY = lineMaxY;
                }
            } else if (element.tagName && element.tagName.toLowerCase() === 'text' && element.classList.contains('linkage-label')) {
                const x = parseFloat(element.getAttribute('x'));
                const y = parseFloat(element.getAttribute('y'));
                if (!isNaN(x) && !isNaN(y)) {
                    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                        found = true;
                        if (x < minUsedX) minUsedX = x;
                        if (y < minUsedY) minUsedY = y;
                        if (x > maxUsedX) maxUsedX = x;
                        if (y > maxUsedY) maxUsedY = y;
                    }
                }
            }
        }

        if (!found) return null;
        return { minX: minUsedX, minY: minUsedY, maxX: maxUsedX, maxY: maxUsedY };
    },

    computeSelectionBBox(elements) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        const include = (x1, y1, x2, y2) => {
            minX = Math.min(minX, x1, x2);
            minY = Math.min(minY, y1, y2);
            maxX = Math.max(maxX, x1, x2);
            maxY = Math.max(maxY, y1, y2);
        };

        for (const element of elements) {
            if (element.classList.contains("sugar")) {
                const x = parseFloat(element.getAttribute("data-x"));
                const y = parseFloat(element.getAttribute("data-y"));
                const size = parseFloat(element.getAttribute("data-size")) || this.sugarRadius;
                const pad = size * 1.6 + 10;
                include(x - pad, y - pad, x + pad, y + pad);
            } else if (element.classList.contains("text-element")) {
                const x = parseFloat(element.getAttribute("data-x"));
                const y = parseFloat(element.getAttribute("data-y"));
                include(x, y, x, y);
            } else if (element.classList.contains("connection")) {
                include(
                    parseFloat(element.getAttribute("x1")),
                    parseFloat(element.getAttribute("y1")),
                    parseFloat(element.getAttribute("x2")),
                    parseFloat(element.getAttribute("y2")),
                );
            }
        }

        if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
            return null;
        }

        return { minX, minY, maxX, maxY };
    },

    loadSvgImage(svgString) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const image = new Image();
            image.onload = () => {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Could not rasterize selected elements"));
            };
            image.src = url;
        });
    },

    async copySelectedAsSvg() {
        const selectedElements = Array.from(this.selectedElements || []);
        const effectiveConnections = this.getEffectiveSelectedConnections?.() || [];
        const elements = Array.from(new Set([...selectedElements, ...effectiveConnections]));
        if (elements.length === 0) return;

        const bbox = this.computeSelectionBBox(elements);
        if (!bbox) return;

        const padding = 20;
        const minX = bbox.minX - padding;
        const minY = bbox.minY - padding;
        const maxX = bbox.maxX + padding;
        const maxY = bbox.maxY + padding;
        const width = Math.max(1, Math.ceil(maxX - minX));
        const height = Math.max(1, Math.ceil(maxY - minY));

        const exportSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        exportSVG.setAttribute("width", width);
        exportSVG.setAttribute("height", height);
        exportSVG.setAttribute("viewBox", `0 0 ${width} ${height}`);
        exportSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        exportSVG.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
        this.copyElementsInBounds(exportSVG, minX, minY, maxX, maxY);

        const svgString = this.addInlineStyles(new XMLSerializer().serializeToString(exportSVG));
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });

        if (!navigator.clipboard || !window.ClipboardItem) {
            throw new Error("SVG clipboard copy is not supported in this browser");
        }
        await navigator.clipboard.write([new ClipboardItem({ "image/svg+xml": blob })]);
    },
    

    addInlineStyles(svgString) {
        // Add basic styles inline for better compatibility with external programs
        const styleString = `
            <defs>
                <style>
                    .sugar .sugar-shape {
                        stroke-width: 2;
                    }
                    .connection {
                        stroke: #808080;
                        stroke-width: 2;
                        fill: none;
                    }
                    .text-element {
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        fill: #2c3e50;
                    }
                </style>
            </defs>
        `;
        
        // Insert styles after the opening svg tag but before content
        const svgTagEndIndex = svgString.indexOf('>');
        if (svgTagEndIndex !== -1) {
            return svgString.slice(0, svgTagEndIndex + 1) + styleString + svgString.slice(svgTagEndIndex + 1);
        }
        return svgString;
    },
    
    // Helper method to close export dropdown

    closeExportDropdown() {
        const exportDropdown = document.querySelector('.export-dropdown');
        if (exportDropdown) {
            exportDropdown.classList.remove('open');
        }
    },
    

    exportCanvas(format) {
        switch (format) {
            case 'svg':
                this.downloadSVG();
                break;
            case 'png':
                this.exportAsPNG();
                break;
            case 'jpg':
                this.exportAsJPG();
                break;
            default:
                console.error('Unknown export format:', format);
        }
    },
    

    exportAsPNG() {
        const { minX, minY, maxX, maxY } = this.getContentExportBounds();
        const exportW = Math.max(1, Math.ceil(maxX - minX));
        const exportH = Math.max(1, Math.ceil(maxY - minY));

    const exportSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSVG.setAttribute('width', exportW);
    exportSVG.setAttribute('height', exportH);
    exportSVG.setAttribute('viewBox', `0 0 ${exportW} ${exportH}`);
    exportSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Copy only elements within computed bounds
    this.copyElementsInBounds(exportSVG, minX, minY, maxX, maxY);

    const svgString = new XMLSerializer().serializeToString(exportSVG);

    // Create canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Use export area dimensions (tight bbox) instead of main canvas dimensions
    const svgWidth = exportW;
    const svgHeight = exportH;
        
        // Set canvas size with higher resolution for better quality
        const scale = 2;
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;
        
        // Scale context for high resolution
        ctx.scale(scale, scale);
        
        const img = new Image();
        img.onload = () => {
            // Clear canvas (keep transparent background for PNG)
            ctx.clearRect(0, 0, svgWidth, svgHeight);

            // Draw the SVG image at the correct size
            ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
            
            // Convert to PNG and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `glycan-structure-${new Date().getTime()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
    },
    

    exportAsJPG() {
        const { minX, minY, maxX, maxY } = this.getContentExportBounds();
        const exportW = Math.max(1, Math.ceil(maxX - minX));
        const exportH = Math.max(1, Math.ceil(maxY - minY));

        const exportSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        exportSVG.setAttribute('width', exportW);
        exportSVG.setAttribute('height', exportH);
        exportSVG.setAttribute('viewBox', `0 0 ${exportW} ${exportH}`);
        exportSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Copy only elements within computed bounds
        this.copyElementsInBounds(exportSVG, minX, minY, maxX, maxY);

        const svgString = new XMLSerializer().serializeToString(exportSVG);

        // Create canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use export area dimensions (tight bbox)
        const svgWidth = exportW;
        const svgHeight = exportH;

        // Set canvas size with higher resolution for better quality
        const scale = 2;
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;

        // Scale context for high resolution and set white background
        ctx.scale(scale, scale);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, svgWidth, svgHeight);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);

            // Convert to JPG and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `glycan-structure-${new Date().getTime()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.9);
        };

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
    },
    
};
