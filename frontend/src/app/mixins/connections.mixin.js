import { formatLinkageLabel, normalizeDisplayMode } from "../../core/formatting.js";

// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 5488, 5517, 5540, 5565, 5570, 5592, 5598, 5623, 5754, 5827, 5834, 5856, 6048, 6068.
export const connectionsMixin = {
    startLongPress(sugar, event) {
        this.connectionStartSugar = sugar;
        if (this.pendingAddClick) {
            clearTimeout(this.pendingAddClick);
            this.pendingAddClick = null;
        }
        
        // Set a timer for long press detection
        this.longPressTimer = setTimeout(() => {
            // Long press detected, start connection dragging
            this.isConnectionDragging = true;
            this.highlightConnectionStart(sugar);
            
            // Show add preview dot at start position initially
            if (this.addPreviewDot) {
                const startX = parseFloat(sugar.getAttribute('data-x'));
                const startY = parseFloat(sugar.getAttribute('data-y'));
                this.addPreviewDot.setAttribute('cx', startX);
                this.addPreviewDot.setAttribute('cy', startY);
                this.addPreviewDot.style.display = 'block';
            }
            
            // Change cursor to indicate connection mode
            this.canvas.style.cursor = 'crosshair';
            
            // Set a flag to prevent click event processing
            this.preventNextClick = true;
            
            // Prevent regular click handling
            event.preventDefault();
        }, this.longPressDelay);
    },
    

    endConnectionDragging() {
        this.isConnectionDragging = false;
        this.connectionStartSugar = null;
        this.connectionTargetSugar = null;
        
        // Clear highlights
        this.clearConnectionStartHighlight();
        this.clearConnectionTargetHighlight();
        
        // Hide add preview dot
        if (this.addPreviewDot) {
            this.addPreviewDot.style.display = 'none';
        }
        
        // Reset cursor
        this.canvas.style.cursor = '';
        
        // Set flag to prevent next click from creating a sugar
        setTimeout(() => {
            this.preventNextClick = false;
        }, 50);
    },
    

    highlightConnectionStart(sugar) {
        // Remove existing start highlight
        this.clearConnectionStartHighlight();
        
        const x = parseFloat(sugar.getAttribute('data-x'));
        const y = parseFloat(sugar.getAttribute('data-y'));
        
        // Create start highlight (green circle)
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.classList.add('connection-start-highlight');
        highlight.setAttribute('cx', x);
        highlight.setAttribute('cy', y);
        // Use actual sugar size for connection start highlight
        const actualSize = this.getSugarSize(sugar);
        highlight.setAttribute('r', actualSize + 8);
        highlight.setAttribute('fill', 'none');
        highlight.setAttribute('stroke', '#00A651');
        highlight.setAttribute('stroke-width', '3');
        highlight.setAttribute('stroke-dasharray', '8,4');
        highlight.setAttribute('pointer-events', 'none');
        
        // Insert before the sugar so it appears behind
        this.canvas.insertBefore(highlight, sugar);
    },
    

    clearConnectionStartHighlight() {
        const highlights = this.canvas.querySelectorAll('.connection-start-highlight');
        highlights.forEach(highlight => highlight.remove());
    },
    

    highlightConnectionTarget(sugar) {
        const x = parseFloat(sugar.getAttribute('data-x'));
        const y = parseFloat(sugar.getAttribute('data-y'));
        
        // Create target highlight (orange circle)
        const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.classList.add('connection-target-highlight');
        highlight.setAttribute('cx', x);
        highlight.setAttribute('cy', y);
        // Use actual sugar size for connection target highlight
        const actualSize = this.getSugarSize(sugar);
        highlight.setAttribute('r', actualSize + 6);
        highlight.setAttribute('fill', 'none');
        highlight.setAttribute('stroke', '#F47920');
        highlight.setAttribute('stroke-width', '3');
        highlight.setAttribute('stroke-dasharray', '6,3');
        highlight.setAttribute('pointer-events', 'none');
        
        // Insert before the sugar so it appears behind
        this.canvas.insertBefore(highlight, sugar);
    },
    

    clearConnectionTargetHighlight() {
        const highlights = this.canvas.querySelectorAll('.connection-target-highlight');
        highlights.forEach(highlight => highlight.remove());
    },
    
    // Check if two sugars are already connected

    areConnected(sugar1, sugar2) {
        const x1 = parseFloat(sugar1.getAttribute('data-x'));
        const y1 = parseFloat(sugar1.getAttribute('data-y'));
        const x2 = parseFloat(sugar2.getAttribute('data-x'));
        const y2 = parseFloat(sugar2.getAttribute('data-y'));
        
        const connections = this.canvas.querySelectorAll('.connection');
        
        for (let line of connections) {
            const lx1 = parseFloat(line.getAttribute('x1'));
            const ly1 = parseFloat(line.getAttribute('y1'));
            const lx2 = parseFloat(line.getAttribute('x2'));
            const ly2 = parseFloat(line.getAttribute('y2'));
            
            // Check both directions
            if ((Math.abs(lx1 - x1) < 1 && Math.abs(ly1 - y1) < 1 &&
                 Math.abs(lx2 - x2) < 1 && Math.abs(ly2 - y2) < 1) ||
                (Math.abs(lx1 - x2) < 1 && Math.abs(ly1 - y2) < 1 &&
                 Math.abs(lx2 - x1) < 1 && Math.abs(ly2 - y1) < 1)) {
                return true;
            }
        }
        return false;
    },
    

    createConnection(parentSugar, childSugar, skipDefaultStyling = false, linkageInfo = null) {
        // Handle reversed linkage direction if in add mode
        if (this.currentTool === 'add' && this.currentLinkageConfig.reversed) {
            // Swap parent and child to reverse the direction
            [parentSugar, childSugar] = [childSugar, parentSugar];
        }
        
        // Check if already connected
        if (this.areConnected(parentSugar, childSugar)) {
            return; // Don't create duplicate connections
        }
        
        const parentX = parseFloat(parentSugar.getAttribute('data-x'));
        const parentY = parseFloat(parentSugar.getAttribute('data-y'));
        const childX = parseFloat(childSugar.getAttribute('data-x'));
        const childY = parseFloat(childSugar.getAttribute('data-y'));
        
        // Create connection line between centers
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('connection');
        line.setAttribute('x1', parentX);
        line.setAttribute('y1', parentY);
        line.setAttribute('x2', childX);
        line.setAttribute('y2', childY);
        
        // Set linkage information (default to unknown if not provided)
        const normalizedLinkage = linkageInfo ? this.normalizeLinkage(linkageInfo) : '??-?';
        line.setAttribute('data-linkage', normalizedLinkage);
        
        // Set linkage visibility based on mode
        if (this.currentTool === 'add') {
            // In add mode, use showText from currentLinkageConfig
            line.setAttribute('data-linkage-visible', this.currentLinkageConfig.showText ? 'true' : 'false');
        } else {
            // In other modes, default to false to match the default behavior when adding sugars
            line.setAttribute('data-linkage-visible', 'false');
        }

        const displayMode = normalizeDisplayMode(
            this.currentLinkageConfig?.displayMode || "standard",
        );
        line.setAttribute("data-linkage-display-mode", displayMode);
        
        // Apply styling based on current linkage settings or defaults
        if (!skipDefaultStyling) {
            // Get current linkage style settings from currentLinkageConfig or UI
            let width, color, opacity, style;
            
            if (this.currentTool === 'add') {
                // In add mode, use currentLinkageConfig
                width = this.currentLinkageConfig.strokeWidth || 2;
                color = this.currentLinkageConfig.strokeColor || '#000000';
                opacity = this.currentLinkageConfig.strokeOpacity || 1;
                style = this.currentLinkageConfig.strokeStyle || 'solid';
            } else {
                // In other modes, use UI values
                width = document.getElementById('connectionStrokeWidth')?.value || '2';
                color = document.getElementById('connectionColor')?.value || '#000000';
                opacity = document.getElementById('linkageOpacity')?.value || '1';
                
                // Get active style button for dash pattern
                const styleBtn = document.querySelector('.connection-style-btn.active');
                style = styleBtn ? styleBtn.dataset.style : 'solid';
            }
                        
            // Normalize color to hex format before applying
            const normalizedColor = this.normalizeColorToHex(color);
            
            // Apply the settings to the line using style properties to override CSS
            line.style.setProperty('stroke', normalizedColor, 'important');
            line.style.setProperty('stroke-width', width, 'important');
            line.style.setProperty('stroke-opacity', opacity, 'important');
                        
            // Apply dash pattern based on style
            switch (style) {
                case 'dashed':
                    line.setAttribute('stroke-dasharray', `${width * 4},${width * 2}`);
                    break;
                case 'dotted':
                    line.setAttribute('stroke-dasharray', `${width},${width}`);
                    break;
                default: // solid
                    // Remove any existing dasharray
                    line.removeAttribute('stroke-dasharray');
            }
            
            // Store text style preferences from currentLinkageConfig when in add mode
            if (this.currentTool === 'add') {
                  line.setAttribute('data-text-size', this.currentLinkageConfig.textSize || 12);
                  line.setAttribute('data-text-color', this.currentLinkageConfig.textColor || '#000000');
                  line.setAttribute('data-text-font-family', this.currentLinkageConfig.textFontFamily || 'Arial');
                  line.setAttribute('data-text-opacity', this.currentLinkageConfig.textOpacity != null ? this.currentLinkageConfig.textOpacity : 1);
                  if (this.currentLinkageConfig.textStyle) {
                     line.setAttribute('data-text-bold', this.currentLinkageConfig.textStyle.bold ? 'true' : 'false');
                     line.setAttribute('data-text-italic', this.currentLinkageConfig.textStyle.italic ? 'true' : 'false');
                     line.setAttribute('data-text-underline', this.currentLinkageConfig.textStyle.underline ? 'true' : 'false');
                  }
            }
        }
        
        // Store sugar IDs for style management
        line.setAttribute('data-start', parentSugar.getAttribute('id'));
        line.setAttribute('data-end', childSugar.getAttribute('id'));
        // Assign deterministic connection id based on sugar numbers (connection-<min>-<max>)
        try {
            const startId = parentSugar.getAttribute('id');
            const endId = childSugar.getAttribute('id');
            let connId = this.computeConnectionId(startId, endId);
            // Avoid collision: if id already exists, append a suffix
            if (document.getElementById(connId)) {
                let suffix = 1;
                while (document.getElementById(connId + `-${suffix}`)) suffix++;
                connId = `${connId}-${suffix}`;
            }
            line.setAttribute('id', connId);
        } catch (e) {
            // fallback to generated id
            if (!line.getAttribute('id')) line.setAttribute('id', this.generateUniqueId('connection'));
        }
        
        // Insert line before sugars so it appears behind them
        this.canvas.insertBefore(line, this.canvas.firstChild);
        
        // Create linkage text label if checkbox is checked
        this.updateLinkageText(line);
        
        // Record creation for undo/redo system
        const objectData = this.createObjectData(line);
        if (objectData) {
            this.recordObjectAdded(objectData);
        }
        
        return line; // Return the created line for further styling if needed
    },
    
    // Normalize linkage information to standard format

    normalizeLinkage(linkage) {
        if (!linkage || linkage.trim() === '') return '??-?';

        // Normalize whitespace and to lower-case for easier parsing
        let s = ('' + linkage).trim();

        // Replace ASCII A/a and B/b with Greek α/β equivalents (accept both cases)
        s = s.replace(/A/gi, 'α');
        s = s.replace(/B/gi, 'β');

        // Replace common latin alternatives that users might type (like "a"/"b")
        s = s.replace(/^a/iu, 'α');
        s = s.replace(/^b/iu, 'β');

        // Remove surrounding spaces
        s = s.replace(/\s+/g, '');

        // Now possible valid forms:
        // 1) single greek letter: "α" or "β"
        // 2) greek + digits with optional dash: "α1-2", "α12" (means 1-2), "β13" (means 1-3)
        // 3) already normalized forms

        // Accept single-letter forms
        if (/^[αβ]$/i.test(s)) return s;

        // Match greek + digits (with or without dash)
        const m = s.match(/^([αβ])(\d+)(?:-(\d+))?$/i);
        if (m) {
            const letter = m[1];
            const numA = m[2];
            const numB = m[3];

            // If both numbers are provided via dash, use them
            if (numB !== undefined) {
                return `${letter}${numA}-${numB}`;
            }

            // If only one numeric string provided, try to split into two single-digit numbers
            if (numA.length === 2) {
                const a = numA.charAt(0);
                const b = numA.charAt(1);
                if (/^\d$/.test(a) && /^\d$/.test(b)) {
                    return `${letter}${a}-${b}`;
                }
            }

            // If more than 2 digits or cannot interpret, fallback to unknown
            return '??-?';
        }

        // Also accept inputs where user typed greek name words like 'alpha'/'beta' (lower/upper)
        const alphaMatch = s.match(/^(alpha)(\d+)(?:-(\d+))?$/i);
        if (alphaMatch) {
            const numA = alphaMatch[2];
            const numB = alphaMatch[3];
            if (numB !== undefined) return `α${numA}-${numB}`;
            if (numA.length === 2) return `α${numA.charAt(0)}-${numA.charAt(1)}`;
            return '??-?';
        }
        const betaMatch = s.match(/^(beta)(\d+)(?:-(\d+))?$/i);
        if (betaMatch) {
            const numA = betaMatch[2];
            const numB = betaMatch[3];
            if (numB !== undefined) return `β${numA}-${numB}`;
            if (numA.length === 2) return `β${numA.charAt(0)}-${numA.charAt(1)}`;
            return '??-?';
        }

        // If none matched, it's unformattable
        return '??-?';
    },
    
    // Generate unique ID for elements

    generateUniqueId(prefix = 'element') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Parse linkage information into configuration and position (SNFG standard)
    // Input: "α1-3" or "β1-4" format
    // Output: { config: "α", position: "3" } (removes the '1-' part, keeps only the target position)

    parseLinkageInfo(linkage) {
        if (!linkage || linkage === '??-?' || linkage.trim() === '') {
            return { config: '?', position: '?' };
        }
        
        const trimmed = linkage.trim();
        
        // Match pattern: α/β followed by optional number-number format
        // Examples: α1-3 → {config: α, position: 3}, β1-4 → {config: β, position: 4}
        const match = trimmed.match(/^([αβ])(\d+-(\d+))?$/);
        
        if (match) {
            const config = match[1]; // α or β
            const position = match[3] || ''; // The second number after dash, or empty if just α/β
            return { config, position };
        }
        
        // If doesn't match expected format, return unknown
        return { config: '?', position: '?' };
    },
    
    // Update or create linkage text label for a connection

    updateLinkageText(connection, textSize, textColor, textFontFamily, textBold, textItalic, textUnderline, textOpacity) {
        // Check both global visibility and connection-specific visibility
        const showAllLinkageText = document.getElementById('showAllLinkageText')?.checked ?? true; // Default to true if checkbox doesn't exist
        const connectionVisible = connection.getAttribute('data-linkage-visible') !== 'false';
        
        // Find existing linkage text elements for this connection
        const connectionId = connection.getAttribute('id') || this.generateUniqueId('connection');
        if (!connection.getAttribute('id')) {
            connection.setAttribute('id', connectionId);
        }
        
        // Look for both config and position text elements
        let configText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="config"]`);
        let positionText = this.canvas.querySelector(`text[data-connection-id="${connectionId}"][data-linkage-part="position"]`);
        
        if (!showAllLinkageText || !connectionVisible) {
            // Remove linkage text if global checkbox is unchecked or connection is set to hidden
            if (configText) configText.remove();
            if (positionText) positionText.remove();
            return;
        }
        
        // Get linkage info and parse it
        const linkage = connection.getAttribute('data-linkage') || '??-?';
        const { config, position } = this.parseLinkageInfo(linkage);
        const displayMode = normalizeDisplayMode(
            connection.getAttribute("data-linkage-display-mode") || "standard",
        );
        
        // Try to get text size and color from parameters (set during creation in add mode)
        // If not provided, fall back to UI controls or defaults
        let finalTextSize = textSize;
        let finalTextColor = textColor;
        let finalTextFontFamily = textFontFamily;
        let finalTextBold = textBold;
        let finalTextItalic = textItalic;
        let finalTextUnderline = textUnderline;
        let finalTextOpacity = textOpacity;
        
        if (!finalTextSize) {
            finalTextSize = connection.getAttribute('data-text-size') || document.getElementById('linkageTextSize')?.value || '12';
        }
        if (!finalTextColor) {
            finalTextColor = connection.getAttribute('data-text-color') || document.getElementById('linkageTextColor')?.value || '#000000';
        }
        if (!finalTextFontFamily) {
            finalTextFontFamily = connection.getAttribute('data-text-font-family') || document.getElementById('linkageTextFontFamily')?.value || 'Arial';
        }
        if (finalTextBold === undefined) {
            const attr = connection.getAttribute('data-text-bold');
            if (attr !== null) {
                finalTextBold = attr === 'true';
            } else {
                finalTextBold = document.getElementById('linkageTextBoldBtn')?.classList.contains('active') || false;
            }
        }
        if (finalTextItalic === undefined) {
            const attr = connection.getAttribute('data-text-italic');
            if (attr !== null) {
                finalTextItalic = attr === 'true';
            } else {
                finalTextItalic = document.getElementById('linkageTextItalicBtn')?.classList.contains('active') || false;
            }
        }
        if (finalTextUnderline === undefined) {
            const attr = connection.getAttribute('data-text-underline');
            if (attr !== null) {
                finalTextUnderline = attr === 'true';
            } else {
                finalTextUnderline = document.getElementById('linkageTextUnderlineBtn')?.classList.contains('active') || false;
            }
        }
        if (!finalTextOpacity) {
            finalTextOpacity = connection.getAttribute('data-text-opacity') || document.getElementById('linkageTextOpacity')?.value || '1';
        }
        
        // Get connection coordinates
        // x1,y1 = start sugar (B in your description), x2,y2 = end sugar (A in your description)
        const x1 = parseFloat(connection.getAttribute('x1'));
        const y1 = parseFloat(connection.getAttribute('y1'));
        const x2 = parseFloat(connection.getAttribute('x2'));
        const y2 = parseFloat(connection.getAttribute('y2'));
        
        // Calculate vector from start (B) to end (A)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return; // Avoid division by zero
        
        // Normalized direction vector
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Perpendicular vector (right side of the stroke, pointing from B to A)
        const perpX = -dirY;
        const perpY = dirX;
        
        // Offset distance from the line
        const offset = 8;
        
        // Position for config (α/β) - closer to end sugar (A), on the right side
        const configRatio = 0.65; // 65% along the line from start to end
        const configX = x1 + dx * configRatio + perpX * offset;
        const configY = y1 + dy * configRatio + perpY * offset;
        
        // Position for position number - closer to start sugar (B), on the right side
        const positionRatio = 0.35; // 35% along the line from start to end
        const positionX = x1 + dx * positionRatio + perpX * offset;
        const positionY = y1 + dy * positionRatio + perpY * offset;
        
        // Create or update config text (α/β)
        if (!configText) {
            configText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            configText.classList.add('linkage-label');
            configText.setAttribute('data-connection-id', connectionId);
            configText.setAttribute('data-linkage-part', 'config');
            configText.setAttribute('id', `${connectionId}-config-text`);
            this.canvas.appendChild(configText);
        }
        
        configText.textContent = formatLinkageLabel(config, position, displayMode);
        configText.setAttribute('x', configX);
        configText.setAttribute('y', configY);
        configText.style.setProperty('font-size', finalTextSize + 'px', 'important');
        configText.style.setProperty('font-family', finalTextFontFamily, 'important');
        const normalizedConfigTextColor = this.normalizeColorToHex(finalTextColor);
        configText.style.setProperty('fill', normalizedConfigTextColor, 'important');
        configText.style.setProperty('fill-opacity', finalTextOpacity, 'important');
        
        if (finalTextBold) {
            configText.style.setProperty('font-weight', 'bold', 'important');
        } else {
            configText.style.removeProperty('font-weight');
        }
        
        if (finalTextItalic) {
            configText.style.setProperty('font-style', 'italic', 'important');
        } else {
            configText.style.removeProperty('font-style');
        }
        
        if (finalTextUnderline) {
            configText.style.setProperty('text-decoration', 'underline', 'important');
        } else {
            configText.style.removeProperty('text-decoration');
        }
        
        configText.setAttribute('text-anchor', 'middle');
        configText.setAttribute('dominant-baseline', 'middle');
        configText.setAttribute('pointer-events', 'none'); // Don't interfere with selection
        
        if (displayMode === "compact") {
            if (positionText) {
                positionText.remove();
            }
        } else {
            // Create or update position text (the number)
            if (!positionText) {
                positionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                positionText.classList.add('linkage-label');
                positionText.setAttribute('data-connection-id', connectionId);
                positionText.setAttribute('data-linkage-part', 'position');
                positionText.setAttribute('id', `${connectionId}-position-text`);
                this.canvas.appendChild(positionText);
            }

            positionText.textContent = position;
            positionText.setAttribute('x', positionX);
            positionText.setAttribute('y', positionY);
            positionText.style.setProperty('font-size', finalTextSize + 'px', 'important');
            positionText.style.setProperty('font-family', finalTextFontFamily, 'important');
            const normalizedPositionTextColor = this.normalizeColorToHex(finalTextColor);
            positionText.style.setProperty('fill', normalizedPositionTextColor, 'important');
            positionText.style.setProperty('fill-opacity', finalTextOpacity, 'important');

            if (finalTextBold) {
                positionText.style.setProperty('font-weight', 'bold', 'important');
            } else {
                positionText.style.removeProperty('font-weight');
            }

            if (finalTextItalic) {
                positionText.style.setProperty('font-style', 'italic', 'important');
            } else {
                positionText.style.removeProperty('font-style');
            }

            if (finalTextUnderline) {
                positionText.style.setProperty('text-decoration', 'underline', 'important');
            } else {
                positionText.style.removeProperty('text-decoration');
            }

            positionText.setAttribute('text-anchor', 'middle');
            positionText.setAttribute('dominant-baseline', 'middle');
            positionText.setAttribute('pointer-events', 'none'); // Don't interfere with selection
        }
        this.refreshLinkageArrows();
    },
    
    // Update linkage information for selected connection(s)

    updateConnectionLinkage(linkage, selectedConnections = null) {
        const normalizedLinkage = this.normalizeLinkage(linkage);

        // Use provided connections or fall back to legacy selection for backward compatibility
        const connections = selectedConnections || Array.from(this.selectedConnections || []);

        connections.forEach(connection => {
            // Record before state if we're in an undo/redo step
            const beforeData = this.createObjectData(connection);

            connection.setAttribute('data-linkage', normalizedLinkage);
            this.updateLinkageText(connection);

            // Record after state if we're in an undo/redo step
            const afterData = this.createObjectData(connection);
            this.recordObjectModified(connection.getAttribute('id'), beforeData, afterData);
        });
    },
    
    // Refresh all linkage text displays (when checkbox changes)

    refreshAllLinkageTexts() {
        const connections = this.canvas.querySelectorAll('.connection');
        connections.forEach(connection => {
            this.updateLinkageText(connection);
        });
    },

    normalizeSelectedLinkageLengths() {
        const selectedConnections = this.getEffectiveSelectedConnections();
        if (selectedConnections.length === 0) return;

        const lengths = selectedConnections.map((connection) => {
            const start = document.getElementById(connection.getAttribute("data-start"));
            const end = document.getElementById(connection.getAttribute("data-end"));
            if (!start || !end) return null;
            const dx = parseFloat(end.getAttribute("data-x")) - parseFloat(start.getAttribute("data-x"));
            const dy = parseFloat(end.getAttribute("data-y")) - parseFloat(start.getAttribute("data-y"));
            return Math.sqrt(dx * dx + dy * dy);
        }).filter((length) => length !== null);

        if (lengths.length === 0) return;
        const targetLength = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;

        this.startStep("Normalize linkage length");
        selectedConnections.forEach((connection) => {
            const start = document.getElementById(connection.getAttribute("data-start"));
            const end = document.getElementById(connection.getAttribute("data-end"));
            if (!start || !end) return;

            const beforeData = this.createObjectData(connection);
            const sx = parseFloat(start.getAttribute("data-x"));
            const sy = parseFloat(start.getAttribute("data-y"));
            const ex = parseFloat(end.getAttribute("data-x"));
            const ey = parseFloat(end.getAttribute("data-y"));
            const dx = ex - sx;
            const dy = ey - sy;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length === 0) return;

            const beforeSugarData = this.createObjectData(end);
            const next = {
                x: sx + dx / length * targetLength,
                y: sy + dy / length * targetLength,
            };
            this.moveSugar(end, next.x, next.y);
            const afterData = this.createObjectData(connection);
            this.recordObjectModified(connection.getAttribute("id"), beforeData, afterData);
            this.recordObjectModified(end.getAttribute("id"), beforeSugarData, this.createObjectData(end));
        });
        this.finishStep();
    },

    refreshLinkageArrows() {
        this.clearLinkageArrows();
        const selectedLinkageIds = new Set([
            ...this.getSelectedElementsByType("connection").map((connection) => connection.getAttribute("id")),
            ...Array.from(this.selectedConnections || []).map((connection) => connection.getAttribute("id")),
        ]);
        const selectedSugarIds = new Set(
            this.getSelectedElementsByType("sugar").map((sugar) => sugar.getAttribute("id")),
        );

        this.canvas.querySelectorAll(".connection").forEach((connection) => {
            const startId = connection.getAttribute("data-start");
            const endId = connection.getAttribute("data-end");
            const relevant = selectedLinkageIds.has(connection.getAttribute("id"))
                || selectedSugarIds.has(startId)
                || selectedSugarIds.has(endId);
            if (!relevant) return;

            const x1 = parseFloat(connection.getAttribute("x1"));
            const y1 = parseFloat(connection.getAttribute("y1"));
            const x2 = parseFloat(connection.getAttribute("x2"));
            const y2 = parseFloat(connection.getAttribute("y2"));
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            const stroke = connection.style.stroke || connection.getAttribute("stroke") || "#000000";

            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            arrow.classList.add("linkage-arrow");
            arrow.setAttribute("points", "-8,-5 8,0 -8,5");
            arrow.setAttribute("transform", `translate(${mx} ${my}) rotate(${angle})`);
            arrow.setAttribute("fill", stroke);
            arrow.setAttribute("pointer-events", "none");
            this.canvas.appendChild(arrow);
        });
    },

    clearLinkageArrows() {
        this.canvas.querySelectorAll(".linkage-arrow").forEach((arrow) => arrow.remove());
    },
    
};
