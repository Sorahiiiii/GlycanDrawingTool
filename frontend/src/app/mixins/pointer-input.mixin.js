import { snapToGrid } from "../../core/geometry.js";
import { loadPreferences } from "../../core/preferences.js";

// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 2624, 2641, 2738, 2868, 3010, 3043, 3315.
export const pointerInputMixin = {
    getSVGCoordinates(e) {
        // Use SVG's native transformation which should handle all transforms
        const pt = this.canvas.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;

        // getScreenCTM() accounts for all transformations including CSS transforms
        const svgPt = pt.matrixTransform(this.canvas.getScreenCTM().inverse());



        return {
            x: svgPt.x,
            y: svgPt.y
        };
    },
    

    handleMouseDown(e) {
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
    // Store modifier keys state for dragging (primary modifier: Ctrl or Command)
    this.dragWithCtrl = e.ctrlKey || e.metaKey;
        this.dragWithShift = e.shiftKey;
        
        // Find clicked element using unified system
        const clickedElement = this.getElementAtPoint(x, y);
        
        if (this.currentTool === 'select') {
            if (clickedElement) {
                // Reset paste counter when user starts selecting
                this.resetPasteCounter();
                
                // Get SVG-relative coordinates
                const svgX = x;
                const svgY = y;
                
                // Handle Shift+click for multi-selection
                if (e.shiftKey) {
                    this.toggleElementSelection(clickedElement, true);
                    this.updateStylePanel();
                    e.preventDefault();
                    return; // Don't start dragging on shift-click
                }
                
                // Check if element is already selected
                if (this.selectedElements.has(clickedElement)) {
                    // Start dragging all selected elements
                    this.startDragging(x, y, true);
                } else {
                    // Select this element (clear others first)
                    this.selectElement(clickedElement, false);
                    
                    // Start dragging this element
                    this.startDragging(x, y, false);
                }
                
                this.updateStylePanel();
                e.preventDefault();
            } else {
                // Check if user clicked on a connection
                const clickedConnection = this.getConnectionAtPoint(x, y);
                if (clickedConnection) {
                    this.resetPasteCounter();
                    // Handle Shift+click for multi-selection of connections
                    if (e.shiftKey) {
                        this.toggleConnectionSelection(clickedConnection, true);
                    } else {
                        // Normal click - select only this connection
                        this.selectConnection(clickedConnection, false);
                    }
                    e.preventDefault();
                } else {
                    // Clicked on empty space
                    this.resetPasteCounter();
                    
                    // If currently editing text, finish the edit first
                    if (this.isEditingText) {
                        this.finishTextEditing();
                    }
                    
                    this.clearAllSelections();
                    this.startBoxSelection(x, y);
                    e.preventDefault();
                }
            }
        } else if (this.currentTool === 'add') {
            this.resetPasteCounter();
            if (clickedElement) {
                // Start long press detection for connection dragging
                this.startLongPress(clickedElement, e);
                e.preventDefault();
            }
        } else if (this.currentTool === 'delete') {
            this.resetPasteCounter();
            // Start erasing on mouse down
            this.startErasing(x, y);
            e.preventDefault();
        }
    },
    

    handleMouseMove(e) {
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        // Handle dynamic cursor in add mode
        if (this.currentTool === 'add' && !this.isDragging) {
            this.updateAddModeCursor(x, y);
        }
        
        // Handle hover preview in select mode (when not dragging)
        if (this.currentTool === 'select' && !this.isDragging && !this.isBoxSelecting) {
            const hoveredElement = this.getElementAtPoint(x, y);
            
            if (hoveredElement !== this.hoveredElement) {
                // Clear previous hover
                this.hideHoverPreview();
                
                // Show new hover if element is not selected
                if (hoveredElement && !this.selectedElements.has(hoveredElement)) {
                    this.showHoverPreview(hoveredElement);
                }
            }
        }

        // Handle box selection
        if (this.isBoxSelecting && this.currentTool === 'select') {
            this.updateBoxSelection(x, y);
            e.preventDefault();
        }
        
        // Handle select mode dragging
        if (this.isDragging && this.currentTool === 'select') {
            if (this.isDraggingMultiple && this.selectedElements.size > 0) {
                // Calculate movement delta from initial drag position
                let deltaX = x - this.dragStartX;  
                let deltaY = y - this.dragStartY;

                // Apply Shift constraint for axis-aligned movement
                if (this.dragWithShift) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        deltaY = 0; // Horizontal movement only
                    } else {
                        deltaX = 0; // Vertical movement only
                    }
                }
                
                const preferences = loadPreferences();
                const primary = this.dragPrimaryElement || Array.from(this.selectedElements)[0];
                const primaryInitialX = parseFloat(primary.getAttribute('data-initial-x'));
                const primaryInitialY = parseFloat(primary.getAttribute('data-initial-y'));
                let appliedDeltaX = deltaX;
                let appliedDeltaY = deltaY;
                if (preferences.snapEnabled) {
                    const snappedX = snapToGrid(primaryInitialX + deltaX, preferences.snapGridSize);
                    const snappedY = snapToGrid(primaryInitialY + deltaY, preferences.snapGridSize);
                    appliedDeltaX = snappedX - primaryInitialX;
                    appliedDeltaY = snappedY - primaryInitialY;
                }

                this.selectedElements.forEach(element => {
                    const initialX = parseFloat(element.getAttribute('data-initial-x'));
                    const initialY = parseFloat(element.getAttribute('data-initial-y'));
                    const newX = initialX + appliedDeltaX;
                    const newY = initialY + appliedDeltaY;

                    const type = this.getElementType(element);
                    if (type === 'sugar') {
                        this.moveSugar(element, newX, newY);
                    } else if (type === 'text') {
                        this.moveText(element, newX, newY);
                    }
                });
                
                e.preventDefault();
            } else if (this.selectedElements.size === 1) {
                // Single element dragging
                const element = Array.from(this.selectedElements)[0];
                const preferences = loadPreferences();
                let newX = x - this.dragOffset.x;
                let newY = y - this.dragOffset.y;
                
                // Apply Shift constraint for axis-aligned movement
                if (this.dragWithShift) {
                    const originalX = parseFloat(element.getAttribute('data-initial-x') || element.getAttribute('data-x'));
                    const originalY = parseFloat(element.getAttribute('data-initial-y') || element.getAttribute('data-y'));
                    
                    const deltaX = newX - originalX;
                    const deltaY = newY - originalY;
                    
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        newY = originalY; // Horizontal movement only
                    } else {
                        newX = originalX; // Vertical movement only
                    }
                }

                if (preferences.snapEnabled) {
                    newX = snapToGrid(newX, preferences.snapGridSize);
                    newY = snapToGrid(newY, preferences.snapGridSize);
                }
                
                // Update element position
                const type = this.getElementType(element);
                if (type === 'sugar') {
                    this.moveSugar(element, newX, newY);
                } else if (type === 'text') {
                    this.moveText(element, newX, newY);
                }
                
                e.preventDefault();
            }
        }
        
        // Handle connection dragging in add mode
        if (this.isConnectionDragging && this.currentTool === 'add') {
            // Clear previous target highlight
            this.clearConnectionTargetHighlight();
            
            // Find potential target sugar
            const targetSugar = this.getSugarAtPoint(x, y);
            if (targetSugar && targetSugar !== this.connectionStartSugar) {
                this.connectionTargetSugar = targetSugar;
                this.highlightConnectionTarget(targetSugar);
                this.addPreviewDot.style.display = 'none'; // Hide dot when targeting existing sugar
            } else {
                this.connectionTargetSugar = null;
                // Show preview dot at best position for adding new sugar
                const startX = parseFloat(this.connectionStartSugar.getAttribute('data-x'));
                const startY = parseFloat(this.connectionStartSugar.getAttribute('data-y'));
                const bestDir = this.findBestDirection(startX, startY, x, y);
                const previewX = startX + bestDir.dx * this.connectionDistance;
                const previewY = startY + bestDir.dy * this.connectionDistance;
                this.addPreviewDot.setAttribute('cx', previewX);
                this.addPreviewDot.setAttribute('cy', previewY);
                this.addPreviewDot.style.display = 'block';
            }
            
            e.preventDefault();
        }
        
        // Handle continuous erasing in delete mode
        if (this.isErasing && this.currentTool === 'delete') {
            this.continueErasing(x, y);
        }
    },
    

    handleMouseUp(e) {
        // Handle connection dragging completion first
        if (this.isConnectionDragging && this.currentTool === 'add') {
            if (this.connectionTargetSugar && this.connectionStartSugar) {
                // Create connection between start and target sugars
                const linkage = this.currentLinkageConfig.linkage || document.getElementById('linkageInput')?.value || null;
                this.createConnection(this.connectionStartSugar, this.connectionTargetSugar, false, linkage);
                
                // Finish the step so each connection creation is undoable individually
                this.finishStep();
            } else if (this.connectionStartSugar) {
                // Add new sugar at the preview position
                const coords = this.getSVGCoordinates(e);
                const x = coords.x;
                const y = coords.y;
                const startX = parseFloat(this.connectionStartSugar.getAttribute('data-x'));
                const startY = parseFloat(this.connectionStartSugar.getAttribute('data-y'));
                const bestDir = this.findBestDirection(startX, startY, x, y);
                const newX = startX + bestDir.dx * this.connectionDistance;
                const newY = startY + bestDir.dy * this.connectionDistance;
                const sugar = this.createSugar(newX, newY, this.currentSugarConfig);
                this.selectElement(sugar);
                this.recordObjectAdded(this.createObjectData(sugar));
                
                // Create connection between start sugar and new sugar
                const linkage = this.currentLinkageConfig.linkage || document.getElementById('linkageInput')?.value || null;
                this.createConnection(this.connectionStartSugar, sugar, false, linkage);
                
                // Finish the step so each sugar addition is undoable individually
                this.finishStep();
            }
            
            // Clean up connection dragging state
            this.endConnectionDragging();
            
            // Clear long press timer
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            // Prevent the click event from being processed after connection dragging
            this.preventNextClick = true;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        // Clear long press timer if no connection dragging occurred
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
            // If timer was still running, it means no long press occurred, allow normal click
            this.preventNextClick = false;
        }
        
        // Handle box selection completion
        if (this.isBoxSelecting) {
            this.finishBoxSelection(e.shiftKey);
        }
        
    // Handle Ctrl+drag copy functionality
    // Temporarily disabled: creating duplicated elements during Ctrl+drag
    // has been causing accidental duplicate creations in some workflows.
    // To re-enable this behavior later, remove the `&& false` from
    // the condition below (or change to a configurable flag).
    if (this.isDragging && this.dragWithCtrl && this.currentTool === 'select' && false) {
  
            // Copy all selected elements
            const copies = [];
            this.selectedElements.forEach(element => {
                const type = this.getElementType(element);
                let newElement;
                
                if (type === 'sugar') {
                    newElement = this.copySugar(element);
                } else if (type === 'text') {
                    newElement = this.copyText(element);
                }
                
                if (newElement) {
                    copies.push(newElement);
                }
            });
            
            // Clear current selection and select the copies
            this.clearAllSelections();
            copies.forEach(copy => {
                this.selectElement(copy, true);
            });
        }
        
        // Clean up drag state for all selected elements
        this.selectedElements.forEach(element => {
            // Record modification if element was moved during dragging
            if (this.isDragging && element.hasAttribute('data-before-move')) {
                const beforeDataStr = element.getAttribute('data-before-move');
                const beforeData = JSON.parse(beforeDataStr);
                const afterData = this.createObjectData(element);
                
                if (afterData && (beforeData.x !== afterData.x || beforeData.y !== afterData.y)) {
                    this.recordObjectModified(element.getAttribute('id'), beforeData, afterData);
                }
                
                element.removeAttribute('data-before-move');
            }
            
            element.removeAttribute('data-initial-x');
            element.removeAttribute('data-initial-y');
            element.classList.remove('dragging');
        });
        
        // Finish the drag step if we were dragging
        if (this.isDragging) {
            this.finishStep();
        }
        
        // Reset drag flags
        this.isDraggingMultiple = false;
        this.isDraggingMultipleTexts = false;
        
        // Remove global drag listeners as backup cleanup
        document.removeEventListener('mousemove', this.globalDragMouseMove);
        document.removeEventListener('mouseup', this.globalDragMouseUp);
        
        // Stop erasing
        if (this.isErasing) {
            this.stopErasing();
        }

        this.isDragging = false;
        
        // Re-enable workspace transitions after dragging
        const workspace = document.querySelector('.workspace');
        if (workspace) {
            workspace.classList.remove('dragging-active');
        }
        
        // Remove global dragging class from body to re-enable transitions
        document.body.classList.remove('global-dragging');
    },
    

    handleMouseLeave(e) {
        // Clean up any UI artifacts when mouse leaves canvas
        
        // Clear hover previews
        this.clearAllHoverPreviews();
        
        // DON'T stop dragging operations when mouse leaves - let them continue
        // until mouse up event. This prevents elements from getting stuck.
        
        // Clear connection target highlights
        this.clearConnectionTargetHighlight();
        
        // End connection dragging cleanly
        if (this.isConnectionDragging) {
            this.endConnectionDragging();
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }
        
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Stop erasing
        if (this.isErasing) {
            this.stopErasing();
        }
    },
    

    handleCanvasClick(e) {
        // Prevent double handling in select mode
        if (this.currentTool === 'select') return;
        
        // Don't handle regular clicks if we're in connection dragging mode
        if (this.isConnectionDragging) return;
        
        // Skip this click if it was after a long press connection
        if (this.preventNextClick) {
            this.preventNextClick = false;
            return;
        }
        
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        // Check if clicking on existing elements
        const clickedSugar = this.getSugarAtPoint(x, y);
        const clickedText = this.getTextAtPoint(x, y);
        
        if (this.currentTool === 'add') {
            const addSugarAction = () => {
                this.startStep('Add sugar');
                if (clickedSugar) {
                    this.addConnectedSugar(clickedSugar, x, y);
                } else {
                    this.createSugar(x, y, this.currentSugarConfig);
                }
                this.finishStep();
            };

            if (this.pendingAddClick) {
                clearTimeout(this.pendingAddClick);
                this.pendingAddClick = null;
                if (clickedSugar) {
                    return;
                }
            }

            this.pendingAddClick = setTimeout(() => {
                this.pendingAddClick = null;
                addSugarAction();
            }, this.doubleClickDelay);
        } else if (this.currentTool === 'text') {
            this.resetPasteCounter();
            if (this.isEditingText) {
                // If currently editing text, ignore clicks to prevent multiple dialogs
                return;
            }
            
            if (clickedText) {
                // Editing existing text is now triggered by a double-click in Select mode.
                return;
            } else {
                // Create new text at click position
                this.startStep('Add text');
                this.createText(x, y, 'Text');
                this.finishStep();
            }
        } else if (this.currentTool === 'delete') {
            this.startStep('Delete object');
            if (clickedSugar) {
                this.deleteSugar(clickedSugar);
            } else if (clickedText) {
                this.deleteText(clickedText);
            }
            this.finishStep();
        } else {
            // If preset mode active (selected from right panel), insert preset glyph
            if (this.activePreset && this.activePreset.src) {
                const src = this.activePreset.src;
                // Attempt to clone the loaded SVG template and insert at click position
                    this.startStep('Insert preset glycan');
                    this.loadPresetSVG(src).then((svgTemplate) => {
                            try {
                                // Work on a deep clone so we don't touch the original template
                                const cloned = svgTemplate.cloneNode(true);

                                // Compute origin of template graphical objects so we ignore large svg canvas origin
                                const origin = this.computeTemplateOrigin(cloned);
                                const ox = origin.minX;
                                const oy = origin.minY;

                                // Final placement coordinates
                                const dx = x;
                                const dy = y;

                                // Map from original template sugar id -> newly created sugar element
                                const sugarMap = {};
                                const addedNodeIds = [];

                                // Helper to determine sugar coordinates from a template sugar node
                                const getTemplateSugarPosition = (node) => {
                                    let tx = parseFloat(node.getAttribute('data-x'));
                                    let ty = parseFloat(node.getAttribute('data-y'));
                                    if (!isFinite(tx) || !isFinite(ty)) {
                                        // Try common child shapes
                                        const c = node.querySelector('circle,ellipse');
                                        if (c) {
                                            tx = parseFloat(c.getAttribute('cx')) || tx || 0;
                                            ty = parseFloat(c.getAttribute('cy')) || ty || 0;
                                        } else {
                                            const r = node.querySelector('rect');
                                            if (r) {
                                                const rx = parseFloat(r.getAttribute('x')) || 0;
                                                const ry = parseFloat(r.getAttribute('y')) || 0;
                                                const w = parseFloat(r.getAttribute('width')) || 0;
                                                const h = parseFloat(r.getAttribute('height')) || 0;
                                                tx = rx + w/2;
                                                ty = ry + h/2;
                                            } else {
                                                // Fallback to origin
                                                tx = tx || ox || 0;
                                                ty = ty || oy || 0;
                                            }
                                        }
                                    }
                                    return { tx, ty };
                                };

                                // 1) Create sugars via canonical createSugar(...) to preserve sequencing/side-effects
                                const templateSugars = Array.from(cloned.querySelectorAll('.sugar'));
                                templateSugars.forEach(tnode => {
                                    const oldId = tnode.getAttribute('id');
                                    const pos = getTemplateSugarPosition(tnode);
                                    const newX = pos.tx - ox + dx;
                                    const newY = pos.ty - oy + dy;

                                    // Build config from template attributes (best-effort), preserving template's border settings
                                    const shapeElement = tnode.querySelector('.sugar-shape');
                                    let templateBorderWidth = null;
                                    if (shapeElement) {
                                        // Extract border width from template's inline style or attribute
                                        const styleStrokeWidth = shapeElement.style.getPropertyValue('stroke-width');
                                        const attrStrokeWidth = shapeElement.getAttribute('stroke-width');
                                        if (styleStrokeWidth) {
                                            templateBorderWidth = parseFloat(styleStrokeWidth);
                                        } else if (attrStrokeWidth) {
                                            templateBorderWidth = parseFloat(attrStrokeWidth);
                                        }
                                    }
                                    
                                    const sugarConfig = {
                                        shape: tnode.getAttribute('data-shape') || tnode.getAttribute('data-shape-type') || 'circle',
                                        color: tnode.getAttribute('data-color') || tnode.getAttribute('fill') || null,
                                        size: parseFloat(tnode.getAttribute('data-size')) || undefined,
                                        type: 'preset',
                                        preset: this.activePreset?.name || null,
                                        // Use template's border width if defined, otherwise inherit current settings
                                        borderWidth: (templateBorderWidth !== null) ? templateBorderWidth : this.currentSugarConfig?.borderWidth,
                                        borderColor: this.currentSugarConfig?.borderColor,
                                        borderOpacity: this.currentSugarConfig?.borderOpacity,
                                        borderStyle: this.currentSugarConfig?.borderStyle,
                                        fillOpacity: this.currentSugarConfig?.fillOpacity
                                    };

                                    // Create sugar using canonical path so sugarCount increments correctly
                                    const created = this.createSugar(newX, newY, sugarConfig);
                                    if (created && created.getAttribute) {
                                        sugarMap[oldId || `__anon_${Math.random().toString(36).slice(2,8)}`] = created;
                                        addedNodeIds.push(created.getAttribute('id'));
                                    }
                                });
                                // 2) Recreate connections via createConnection(...) so ids and undo match
                                const templateConnections = Array.from(cloned.querySelectorAll('.connection, line[data-start][data-end]'));
                                templateConnections.forEach(conn => {
                                    const sOld = conn.getAttribute('data-start');
                                    const eOld = conn.getAttribute('data-end');
                                    if (!sOld || !eOld) return;
                                    const startEl = sugarMap[sOld];
                                    const endEl = sugarMap[eOld];
                                    if (!startEl || !endEl) return; // ignore connections to external nodes

                                    const linkage = conn.getAttribute('data-linkage') || conn.getAttribute('data-linkage') || null;
                                    
                                    // Extract stroke width from template connection
                                    let templateStrokeWidth = null;
                                    const styleStrokeWidth = conn.style.getPropertyValue('stroke-width');
                                    const attrStrokeWidth = conn.getAttribute('stroke-width');
                                    if (styleStrokeWidth) {
                                        templateStrokeWidth = parseFloat(styleStrokeWidth);
                                    } else if (attrStrokeWidth) {
                                        templateStrokeWidth = parseFloat(attrStrokeWidth);
                                    }
                                    
                                    // createConnection expects sugar elements
                                        try {
                                            const createdConn = this.createConnection(startEl, endEl, false, linkage);
                                            if (createdConn && createdConn.getAttribute) {
                                                addedNodeIds.push(createdConn.getAttribute('id'));
                                                // Apply template stroke width if it exists
                                                if (templateStrokeWidth !== null) {
                                                    createdConn.style.setProperty('stroke-width', templateStrokeWidth, 'important');
                                                }
                                            }
                                        } catch (e) {
                                            // ignore individual connection failures
                                        }
                                });
                                // 3) Append non-sugar, non-connection nodes (decorations, texts, defs)
                                const clones = [];
                                const defsClones = [];
                                Array.from(cloned.children).forEach(child => {
                                    const tag = (child.tagName || '').toLowerCase();
                                    // defs go to defsClones
                                    if (tag === 'defs') {
                                        defsClones.push(child.cloneNode(true));
                                        return;
                                    }

                                    // Skip sugar groups (they were created via createSugar)
                                    if (child.classList && child.classList.contains('sugar')) {
                                        return;
                                    }

                                    // Skip connection lines: they were recreated via createConnection
                                    if ((tag === 'line' && child.hasAttribute && child.hasAttribute('data-start') && child.hasAttribute('data-end')) ||
                                        (child.classList && child.classList.contains('connection'))) {
                                        return;
                                    }

                                    // Otherwise clone decorations/texts/etc.
                                    clones.push(child.cloneNode(true));
                                });

                                // Remap ids for these clones and defs to avoid collisions
                                const allNodes = this.collectNodes(defsClones.concat(clones));
                                const idMap = this.buildIdMapForNodes(allNodes);
                                this.applyIdMapToNodes(allNodes, idMap);

                                // Normalize coordinates and place cloned non-sugar nodes
                                clones.forEach(childClone => {
                                    // Remove any connection elements that might still be present inside decorations
                                    Array.from(childClone.querySelectorAll('.connection, line[data-start][data-end]')).forEach(n => n.remove());

                                    this.shiftElementCoordinates(childClone, ox, oy);
                                    this.shiftElementCoordinates(childClone, -dx, -dy);

                                    // Append into canvas
                                    this.canvas.appendChild(childClone);

                                    try {
                                        if (childClone.getAttribute && childClone.getAttribute('id')) {
                                            const od = this.createObjectData(childClone);
                                            this.recordObjectAdded(od);
                                            addedNodeIds.push(childClone.getAttribute('id'));
                                        }
                                        Array.from(childClone.querySelectorAll('*')).forEach(node => {
                                            if (node.getAttribute && node.getAttribute('id')) {
                                                const od = this.createObjectData(node);
                                                this.recordObjectAdded(od);
                                                addedNodeIds.push(node.getAttribute('id'));
                                            }
                                        });
                                    } catch (e) {}
                                });

                                // Append defs to canvas root (after remapping ids)
                                defsClones.forEach(defNode => {
                                    try { this.canvas.appendChild(defNode); } catch (e) {}
                                });

                                // Record a wrapper group for logical grouping in undo
                                try {
                                    const wrapperId = `preset-${Date.now()}`;
                                    this.recordObjectAdded({ id: wrapperId, type: 'preset-group', children: addedNodeIds });
                                } catch (e) {}

                                this.finishStep();
                                // Exit preset mode after placing
                                this.exitPresetMode();
                                document.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('active'));
                            } catch (err) {
                                console.error('Failed to insert preset:', err);
                                this.finishStep();
                            }
                        }).catch(err => {
                            console.error('Could not load preset svg for insertion', err);
                            this.finishStep();
                        });
            }
        }
    },
    

    handleDoubleClick(e) {
        const coords = this.getSVGCoordinates(e);
        const x = coords.x;
        const y = coords.y;
        
        const clickedSugar = this.getSugarAtPoint(x, y);
        const clickedText = this.getTextAtPoint(x, y);

        if (this.currentTool === 'add' && clickedSugar) {
            if (this.pendingAddClick) {
                clearTimeout(this.pendingAddClick);
                this.pendingAddClick = null;
            }
            this.setTool('select');
            this.clearAllSelections();
            this.selectElement(clickedSugar);
            this.updateStylePanel();
            e.preventDefault();
            return;
        }

        if (this.currentTool === 'text' && clickedText) {
            this.setTool('select');
            this.clearAllSelections();
            this.selectElement(clickedText);
            this.updateStylePanel();
            e.preventDefault();
            return;
        }

        if (this.currentTool !== 'select') return;
        
        if (clickedSugar) {
            // Use unified selection system
            this.clearAllSelections();
            this.selectElement(clickedSugar);
            this.updateStylePanel();
        } else if (clickedText) {
            // Double click on text in select mode should edit it
            this.editText(clickedText);
        }
    },
    
};
