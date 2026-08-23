// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 278, 295, 333, 374, 435, 483, 494, 502, 517, 533, 562, 581, 586, 630, 639.
export const presetsMixin = {
    setupPresets() {
        // SNFG preset buttons
        const presetItems = document.querySelectorAll('.preset-item');
        presetItems.forEach(item => {
            item.addEventListener('click', () => {
                // Skip disabled items
                if (item.classList.contains('disabled') || !item.dataset.preset) {
                    return;
                }
                
                const preset = item.dataset.preset;
                this.selectPreset(preset);
            });
        });
    },

    // New: preset glycan toolbar setup

    setupPresetGlycans() {
        this.presetTemplates = {}; // key -> DocumentFragment of SVG
        this.activePreset = null; // {src, name}

        const toolbar = document.getElementById('presetGlycanToolbar');
        if (!toolbar) return;

        // Bind clicks on thumbnails
        toolbar.querySelectorAll('.preset-thumb').forEach(thumb => {
            const src = thumb.dataset.presetSrc;
            if (src) {
                thumb.addEventListener('click', (e) => {
                    // Toggle selection
                    if (thumb.classList.contains('active')) {
                        thumb.classList.remove('active');
                        this.exitPresetMode();
                    } else {
                        toolbar.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                        this.enterPresetMode(src);
                    }
                });
                // Preload template
                this.loadPresetSVG(src).catch(err => {
                    console.warn('Failed to load preset SVG:', src, err);
                });
            }
        });

        // Esc key to cancel preset mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activePreset) {
                this.exitPresetMode();
                document.querySelectorAll('.preset-thumb').forEach(t => t.classList.remove('active'));
            }
        });
    },


    async loadPresetSVG(src) {
        if (this.presetTemplates[src]) return this.presetTemplates[src];

        // Check for embedded template in DOM to avoid fetch/CORS issues when opened via file://
        try {
            const base = src.split('/').pop().split('?')[0].replace(/\.[^.]+$/, ''); // e.g. 'test-glycan'
            const embeddedId = `embedded-${base}`;
            const embedded = document.getElementById(embeddedId);
            if (embedded) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(embedded.textContent || embedded.innerHTML, 'image/svg+xml');
                const svg = doc.querySelector('svg');
                if (svg) {
                    // Store the original template but return a clone to avoid mutations
                    this.presetTemplates[src] = svg;
                    return document.importNode(svg, true);
                }
            }
        } catch (e) {
            // fall through to fetch
            console.warn('Embedded preset parse failed, will try fetch:', e);
        }

        // Fallback to fetch (for HTTP/HTTPS serving)
        try {
            const resp = await fetch(src);
            const text = await resp.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'image/svg+xml');
            const svg = doc.querySelector('svg');
            if (!svg) throw new Error('No svg root found');
            // Store original and return a clone so caller can modify without affecting cache
            this.presetTemplates[src] = svg;
            return document.importNode(svg, true);
        } catch (err) {
            console.error('Error loading preset SVG', src, err);
            throw err;
        }
    },

    // Compute the minimum x/y coordinates used by the template's graphical elements

    computeTemplateOrigin(svgRoot) {
        let minX = Infinity;
        let minY = Infinity;

        function consider(x, y) {
            if (typeof x === 'number' && typeof y === 'number') {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
            }
        }

        function scan(node) {
            if (!node || node.nodeType !== 1) return;
            const tag = node.tagName.toLowerCase();
            if (tag === 'circle' || tag === 'ellipse') {
                const cx = parseFloat(node.getAttribute('cx')) || 0;
                const cy = parseFloat(node.getAttribute('cy')) || 0;
                const r = parseFloat(node.getAttribute('r')) || 0;
                consider(cx - r, cy - r);
            } else if (tag === 'rect') {
                const x = parseFloat(node.getAttribute('x')) || 0;
                const y = parseFloat(node.getAttribute('y')) || 0;
                consider(x, y);
            } else if (tag === 'line') {
                const x1 = parseFloat(node.getAttribute('x1')) || 0;
                const y1 = parseFloat(node.getAttribute('y1')) || 0;
                const x2 = parseFloat(node.getAttribute('x2')) || 0;
                const y2 = parseFloat(node.getAttribute('y2')) || 0;
                consider(Math.min(x1, x2), Math.min(y1, y2));
            } else if (tag === 'polygon' || tag === 'polyline') {
                const pts = (node.getAttribute('points') || '').trim();
                if (pts) {
                    pts.split(/\s+/).forEach(pair => {
                        const parts = pair.split(',');
                        if (parts.length >= 2) consider(parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0);
                    });
                }
            } else if (tag === 'g' || tag === 'svg') {
                Array.from(node.children).forEach(child => scan(child));
                return;
            } else if (tag === 'use') {
                // try to read x/y attributes
                const x = parseFloat(node.getAttribute('x')) || 0;
                const y = parseFloat(node.getAttribute('y')) || 0;
                consider(x, y);
            } else if (tag === 'path') {
                // skip complex path parsing; assume it sits near origin if no other hints
            }

            // Also descend into children for composite nodes
            Array.from(node.children).forEach(child => scan(child));
        }

        scan(svgRoot);

        if (!isFinite(minX)) minX = 0;
        if (!isFinite(minY)) minY = 0;
        return { minX, minY };
    },

    // Shift basic coordinate attributes of common SVG elements by dx/dy

    shiftElementCoordinates(node, dx, dy) {
        if (!node || node.nodeType !== 1) return;
        const tag = node.tagName.toLowerCase();
        function shiftAttr(attr) {
            if (node.hasAttribute(attr)) {
                const v = parseFloat(node.getAttribute(attr)) || 0;
                node.setAttribute(attr, (v - dx).toString());
            }
        }

        if (tag === 'circle' || tag === 'ellipse') {
            if (node.hasAttribute('cx')) node.setAttribute('cx', (parseFloat(node.getAttribute('cx') || 0) - dx).toString());
            if (node.hasAttribute('cy')) node.setAttribute('cy', (parseFloat(node.getAttribute('cy') || 0) - dy).toString());
        } else if (tag === 'rect') {
            if (node.hasAttribute('x')) node.setAttribute('x', (parseFloat(node.getAttribute('x') || 0) - dx).toString());
            if (node.hasAttribute('y')) node.setAttribute('y', (parseFloat(node.getAttribute('y') || 0) - dy).toString());
        } else if (tag === 'line') {
            if (node.hasAttribute('x1')) node.setAttribute('x1', (parseFloat(node.getAttribute('x1') || 0) - dx).toString());
            if (node.hasAttribute('y1')) node.setAttribute('y1', (parseFloat(node.getAttribute('y1') || 0) - dy).toString());
            if (node.hasAttribute('x2')) node.setAttribute('x2', (parseFloat(node.getAttribute('x2') || 0) - dx).toString());
            if (node.hasAttribute('y2')) node.setAttribute('y2', (parseFloat(node.getAttribute('y2') || 0) - dy).toString());
        } else if (tag === 'polygon' || tag === 'polyline') {
            const pts = (node.getAttribute('points') || '').trim();
            if (pts) {
                const newPts = pts.split(/\s+/).map(pair => {
                    const parts = pair.split(',');
                    if (parts.length >= 2) {
                        const nx = (parseFloat(parts[0]) || 0) - dx;
                        const ny = (parseFloat(parts[1]) || 0) - dy;
                        return `${nx},${ny}`;
                    }
                    return pair;
                }).join(' ');
                node.setAttribute('points', newPts);
            }
        } else if (tag === 'g' || tag === 'svg') {
            // If group has transform translate, try to incorporate it (best-effort)
            const t = node.getAttribute('transform');
            // For now, simply recurse children
            Array.from(node.children).forEach(child => this.shiftElementCoordinates(child, dx, dy));
            return;
        }

        // Recurse into children
        Array.from(node.children).forEach(child => this.shiftElementCoordinates(child, dx, dy));
    },

    // Extract numeric part from sugar id like 'sugar-12' -> 12. Returns NaN if not found.

    getSugarNumberFromId(id) {
        if (!id || typeof id !== 'string') return NaN;
        const m = id.match(/sugar-?(\d+)$/i);
        if (m) return parseInt(m[1], 10);
        return NaN;
    },

    // Compute deterministic connection id in the form 'connection-<smaller>-<larger>' based on sugar ids

    computeConnectionId(idA, idB) {
        const a = this.getSugarNumberFromId(idA);
        const b = this.getSugarNumberFromId(idB);
        if (!isNaN(a) && !isNaN(b)) {
            const min = Math.min(a, b);
            const max = Math.max(a, b);
            return `connection-${min}-${max}`;
        }
        // Fallback: if we can't parse numbers, create a unique-ish deterministic id using the raw ids
        const safeA = (idA || '').replace(/[^A-Za-z0-9_-]/g, '_');
        const safeB = (idB || '').replace(/[^A-Za-z0-9_-]/g, '_');
        return `connection-${safeA}-${safeB}`;
    },

    // Collect all nodes under a node (or array of nodes)

    collectNodes(rootOrArray) {
        const nodes = [];
        const pushNode = (n) => {
            nodes.push(n);
            Array.from(n.children || []).forEach(c => pushNode(c));
        };
        if (Array.isArray(rootOrArray)) {
            rootOrArray.forEach(r => pushNode(r));
        } else {
            pushNode(rootOrArray);
        }
        return nodes;
    },

    // Build id map for a set of nodes (oldId -> newId)
    // Compute next available sugar id like sugar-2, sugar-3 based on existing ids in the document and any assigned in idMap

    getNextSugarId(existingMap) {
        let max = 0;
        const sugarRegex = /^sugar-?(\d+)$/i;

        // Check existing document ids
        Array.from(document.querySelectorAll('[id]')).forEach(el => {
            const id = el.getAttribute('id');
            if (!id) return;
            const m = id.match(sugarRegex);
            if (m) {
                const n = parseInt(m[1], 10) || 0;
                if (n > max) max = n;
            }
        });

        // Also consider ids already assigned in existingMap
        if (existingMap) {
            Object.values(existingMap).forEach(id => {
                const m = ('' + id).match(sugarRegex);
                if (m) {
                    const n = parseInt(m[1], 10) || 0;
                    if (n > max) max = n;
                }
            });
        }

        return `sugar-${max + 1}`;
    },


    buildIdMapForNodes(nodes) {
        const idMap = {};
        nodes.forEach(node => {
            if (node.getAttribute && node.getAttribute('id')) {
                const oldId = node.getAttribute('id');
                // If the node represents a sugar (by class) or its id looks like a sugar id, allocate a sequential sugar id
                const looksLikeSugarId = /^sugar-?\d+$/i.test(oldId);
                const isSugarClass = node.classList && node.classList.contains && node.classList.contains('sugar');
                if ((isSugarClass || looksLikeSugarId) && !idMap[oldId]) {
                    idMap[oldId] = this.getNextSugarId(idMap);
                } else if (!idMap[oldId]) {
                    idMap[oldId] = this.generateUniqueId(oldId);
                }
            }
        });
        return idMap;
    },

    // Escape regex special characters in string

    escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    // Apply id map to nodes: rename ids and update references (url(#id), href, xlink:href, and plain '#id')

    applyIdMapToNodes(nodes, idMap) {
        if (!idMap || Object.keys(idMap).length === 0) return;
        const oldIds = Object.keys(idMap);
        // Pre-build regexes for replacements
        const urlRegexes = oldIds.map(old => ({
            old,
            urlRe: new RegExp('url\\(#' + this.escapeRegExp(old) + '\\)', 'g'),
            hashRe: new RegExp('(^|[^A-Za-z0-9_-])#' + this.escapeRegExp(old) + '($|[^A-Za-z0-9_-])', 'g')
        }));

        nodes.forEach(node => {
            if (node.getAttribute && node.getAttribute('id')) {
                const oldId = node.getAttribute('id');
                if (idMap[oldId]) {
                    node.setAttribute('id', idMap[oldId]);
                }
            }

            // Update attributes that may reference ids
            if (node.attributes) {
                Array.from(node.attributes).forEach(attr => {
                    let v = attr.value;
                    if (!v || typeof v !== 'string') return;
                    let newV = v;
                    urlRegexes.forEach(({old, urlRe, hashRe}) => {
                        const newId = idMap[old];
                        if (!newId) return;
                        // url(#old) => url(#new)
                        newV = newV.replace(urlRe, `url(#${newId})`);
                        // href values like '#old' or occurrences of #old bounded by non identifier chars
                        // Replace exact '#old' first
                        if (newV === `#${old}`) newV = `#${newId}`;
                        // Replace any standalone occurrences of #old (best-effort)
                        newV = newV.replace(hashRe, (m, p1, p2) => `${p1}#${newId}${p2}`);
                    });

                    if (newV !== v) {
                        try { node.setAttribute(attr.name, newV); } catch (e) { /* ignore */ }
                    }
                });
            }
        });
    },


    enterPresetMode(src) {
        // Save previous tool so we can restore when exiting preset mode
        this.previousToolBeforePreset = this.currentTool;
        // Enter a dedicated preset mode so the right panel can show the preset UI only in this mode
        this.setTool('preset');
        this.activePreset = { src };
        // No longer show popup notification - instruction text is visible on the right panel
    },


    exitPresetMode() {
        this.activePreset = null;
        // Restore previous tool if available
        if (this.previousToolBeforePreset) {
            this.setTool(this.previousToolBeforePreset);
            this.previousToolBeforePreset = null;
        } else {
            this.setTool('select');
        }
    },
    
};
