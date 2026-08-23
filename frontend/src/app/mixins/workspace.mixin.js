import { loadPreferences, savePreference } from "../../core/preferences.js";

// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 10573, 10606, 10639, 10685, 10720, 10768, 10791, 10810, 10821, 10854, 10879.
export const workspaceMixin = {
    setupZoomControl() {
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        const zoomReset = document.getElementById('zoomReset');
        
        if (!zoomSlider || !zoomValue || !zoomReset) {
            console.error('Zoom control elements not found', {
                slider: !!zoomSlider,
                value: !!zoomValue,
                reset: !!zoomReset
            });
            return;
        }

        zoomSlider.min = Math.round(this.minZoom * 100);
        zoomSlider.max = Math.round(this.maxZoom * 100);
        zoomSlider.step = 10;
        
        // Update zoom when slider changes
        zoomSlider.addEventListener('input', (e) => {
            const zoomPercent = parseInt(e.target.value);
            this.setZoomLevel(zoomPercent / 100);
            zoomValue.textContent = zoomPercent + '%';
        });
        
        // Reset zoom to 100% when reset button clicked
        zoomReset.addEventListener('click', () => {
            zoomSlider.value = 100;
            this.setZoomLevel(1.0);
            zoomValue.textContent = '100%';
        });
        
        // Initialize zoom display
        zoomValue.textContent = '100%';
        },
    
    // Set zoom level and apply to canvas content only

    setZoomLevel(zoom) {
        // Clamp zoom level
        const minZoom = Number.isFinite(this.minZoom) ? this.minZoom : 0.5;
        const maxZoom = Number.isFinite(this.maxZoom) ? this.maxZoom : 3.0;
        this.zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoom));
        
        // Find canvas and export area elements
        const canvas = document.getElementById('canvas');
        const exportArea = document.getElementById('exportArea');
        const workspace = document.getElementById('workspace');
        
        if (canvas) {
            // Apply zoom to canvas only
            canvas.style.transform = `scale(${this.zoomLevel})`;
            canvas.style.transformOrigin = 'center center';
            }
        
        if (exportArea) {
            // Apply zoom to export area as well, but keep the existing margin-based centering
            exportArea.style.transform = `scale(${this.zoomLevel})`;
            exportArea.style.transformOrigin = '50% 50%'; // Center the scaling
            }
        
        if (workspace) {
            // Update stored reference but don't transform workspace
            this.workspace = workspace;
            
            // Update grid background to match zoom
            this.updateGridBackground();
        } else {
            console.error('Workspace element not found!');
        }
    },
    
    // Workspace Management

    initializeWorkspace() {
        this.workspace = document.getElementById('workspace');
        this.exportArea = document.getElementById('exportArea');
        
        if (!this.workspace || !this.exportArea) {
            console.error('Workspace elements not found');
            return;
        }
        
        // Set initial export area size (medium)
        this.setExportAreaSize('medium');
        
        // Initialize grid background
        this.updateGridBackground();
        
        // Add wheel event listener for zoom
        this.workspace.addEventListener('wheel', (e) => {
            // Handle Alt+wheel zoom
            this.handleWheelZoom(e);
        });
        
        
        // Center the viewport and hide loading cover
        const startTime = Date.now();
        const minLoadingTime = 1000; // Minimum 1000ms loading time to show Dolly.gif animation
        
        setTimeout(() => {
            this.centerWorkspaceView();
            // Hide loading cover after minimum time has passed
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
            
            setTimeout(() => {
                const loadingCover = document.getElementById('loadingCover');
                if (loadingCover) {
                    loadingCover.classList.add('hidden');
                    // Remove from DOM after transition
                    setTimeout(() => {
                        loadingCover.remove();
                    }, 300);
                }
            }, remainingTime);
        }, 300);
        
        },
    

    setExportAreaSize(size) {
        if (!this.exportSizes[size]) {
            console.error(`Invalid size: ${size}`);
            return;
        }
        
        const { width, height } = this.exportSizes[size];
        this.currentExportSize = size;
        
        // Note: We do NOT change canvas dimensions here!
        // Canvas should remain fixed size, only export area (white background) changes
        // Canvas dimensions should only be changed during actual export
        
        // Update export area size - find element fresh each time
        const exportArea = document.getElementById('exportArea');
        if (exportArea) {
            exportArea.style.width = width + 'px';
            exportArea.style.height = height + 'px';
            // Update margins for centering (half of width/height)
            exportArea.style.marginLeft = -(width / 2) + 'px';
            exportArea.style.marginTop = -(height / 2) + 'px';
            // Update stored reference
            this.exportArea = exportArea;
        } else {
            console.error('Export area element not found!');
            }
        
        // Update button states
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
        
        },
    
    // Center the workspace view (scroll to middle of canvas)

    centerWorkspaceView() {
        if (!this.workspace) return;
        
        // The canvas is positioned with CSS: top:50%, left:50%, margin-top:-1400px, margin-left:-2000px
        // This means the canvas center aligns with the workspace center
        // To center the view, we need to scroll so the workspace viewport shows the canvas center
        
        // Calculate the total scrollable area
        const totalScrollWidth = this.workspace.scrollWidth;
        const totalScrollHeight = this.workspace.scrollHeight;
        
        // Get workspace viewport dimensions
        const viewportWidth = this.workspace.clientWidth;
        const viewportHeight = this.workspace.clientHeight;
        
        // Center the scroll position
        const scrollLeft = (totalScrollWidth - viewportWidth) / 2;
        const scrollTop = (totalScrollHeight - viewportHeight) / 2;
        
        this.expectingScrollChange = true;
        this.workspace.scrollLeft = scrollLeft;
        this.workspace.scrollTop = scrollTop;
        setTimeout(() => this.expectingScrollChange = false, 100);
        
        // Verify the setting took effect
        setTimeout(() => {
            const actualScrollLeft = this.workspace.scrollLeft;
            const actualScrollTop = this.workspace.scrollTop;
            // Only show warning if the difference is significant (more than 2px)
            const leftDiff = Math.abs(actualScrollLeft - scrollLeft);
            const topDiff = Math.abs(actualScrollTop - scrollTop);
            
            if (leftDiff > 2 || topDiff > 2) {
                console.warn('Scroll position was reset by something else!');
                // Try again
                this.expectingScrollChange = true;
                this.workspace.scrollLeft = scrollLeft;
                this.workspace.scrollTop = scrollTop;
                setTimeout(() => this.expectingScrollChange = false, 100);
            }
            
            // Reset the expecting flag
            this.expectingScrollChange = false;
        }, 100);
        
        },
    
    // Handle Alt+wheel zoom

    handleWheelZoom(e) {
        // Only zoom when Alt is pressed
        if (!e.altKey) return;
        
        e.preventDefault();
        
        // Determine zoom direction (up = zoom in, down = zoom out)
        const zoomStep = 10; // 10% increment
        const currentPercent = Math.round(this.zoomLevel * 100);
        const deltaPercent = e.deltaY < 0 ? zoomStep : -zoomStep;
        const minPercent = Math.round(this.minZoom * 100);
        const maxPercent = Math.round(this.maxZoom * 100);
        const newPercent = Math.max(minPercent, Math.min(maxPercent, currentPercent + deltaPercent));
        
        // Update zoom level
        this.setZoomLevel(newPercent / 100);
        
        // Update slider and display
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider) zoomSlider.value = newPercent;
        if (zoomValue) zoomValue.textContent = newPercent + '%';
    },
    
    setupGridAndSnapControls() {
        const snapButton = document.getElementById("snapToggle");

        const syncButtons = () => {
            const preferences = loadPreferences();
            if (snapButton) snapButton.classList.toggle("active", preferences.snapEnabled);
        };

        snapButton?.addEventListener("click", () => {
            const next = !loadPreferences().snapEnabled;
            savePreference("snapEnabled", next);
            syncButtons();
        });

        syncButtons();
    },

    // Update grid background size to match zoom level

    updateGridBackground() {
        // Grid rendering has been removed; only snap-to-grid behavior remains.
    },
    
    // Removed handleWorkspaceWheel - now using zoom slider instead
    
    // Legacy canvas size adjustment (kept for compatibility)

    changeCanvasSize(sizeValue) {
        const [width, height] = sizeValue.split(',').map(Number);
        
        // Update canvas dimensions
        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);
        this.canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        },
    
    // Undo system methods

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        // Calculate distance from point (px, py) to line segment (x1, y1) to (x2, y2)
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    },
    

    getConnectionAtPoint(x, y) {
        // Find the closest connection line to the point
        const connections = this.canvas.querySelectorAll('.connection');
        let closestConnection = null;
        let minDistance = Infinity;
        const threshold = 10; // pixels
        
        for (const connection of connections) {
            const x1 = parseFloat(connection.getAttribute('x1'));
            const y1 = parseFloat(connection.getAttribute('y1'));
            const x2 = parseFloat(connection.getAttribute('x2'));
            const y2 = parseFloat(connection.getAttribute('y2'));
            
            // Calculate distance from point to line segment
            const distance = this.pointToLineDistance(x, y, x1, y1, x2, y2);
            
            if (distance < threshold && distance < minDistance) {
                minDistance = distance;
                closestConnection = connection;
            }
        }
        
        return closestConnection;
    },
    

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        // Calculate the distance from point (px, py) to line segment from (x1,y1) to (x2,y2)
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            // Line segment is actually a point
            return Math.sqrt(A * A + B * B);
        }
        
        let param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
};
