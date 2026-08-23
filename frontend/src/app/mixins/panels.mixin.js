// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 7117, 7123, 7183, 7199, 7215, 7225, 7259, 7269, 7279, 7286, 7496, 7515, 7524, 7743, 7830.
export const panelsMixin = {
    updateLeftPanel() {
        // Left panel only contains tools now, no dynamic content
        // This method is kept for compatibility but doesn't need to do anything
        return;
    },
    

    updateRightPanel() {
        const tabs = document.querySelectorAll(".panel-tab");
        const contents = document.querySelectorAll("[data-panel-content]");
        const hint = document.getElementById("rightPanelHint");
        const presetSection = document.getElementById("presetGlycanSection");
        if (presetSection) presetSection.hidden = this.currentTool !== "preset";

        const selectedTypes = new Set(
            Array.from(this.selectedElements).map((element) => this.getElementType(element)),
        );

        let visibleTypes = new Set();

        if (this.currentTool === "add") {
            visibleTypes.add("sugar");
            visibleTypes.add("linkage");
        } else if (this.currentTool === "text") {
            visibleTypes.add("text");
        } else if (this.currentTool === "preset") {
            visibleTypes.add("preset");
        } else if (this.currentTool === "delete") {
            visibleTypes = new Set();
        } else {
            if (selectedTypes.has("sugar")) visibleTypes.add("sugar");
            if (selectedTypes.has("text")) visibleTypes.add("text");
            if (selectedTypes.has("connection")) visibleTypes.add("linkage");
            if (selectedTypes.has("sugar") && this.getEffectiveSelectedConnections().length > 0) {
                visibleTypes.add("linkage");
            }
            if (selectedTypes.size > 0) visibleTypes.add("view");
        }

        tabs.forEach((tab) => {
            tab.hidden = !visibleTypes.has(tab.dataset.panelTab);
        });

        contents.forEach((content) => {
            const shouldShow = visibleTypes.has(content.dataset.panelContent);
            content.hidden = !shouldShow;
            content.style.display = shouldShow ? "block" : "none";
        });

        const linkageAddSection = document.getElementById("linkagePreselectionSection");
        if (linkageAddSection) {
            linkageAddSection.style.display = this.currentTool === "add" ? "block" : "none";
        }
        document.querySelectorAll("#linkageControlsSection > details").forEach((group) => {
            group.style.display = this.currentTool === "add" ? "none" : "";
        });

        const hasVisibleTabs = visibleTypes.size > 0;
        if (hint) {
            hint.hidden = hasVisibleTabs;
            hint.style.display = hasVisibleTabs ? "none" : "block";
        }

        if (visibleTypes.size === 0) {
            document.querySelectorAll(".panel-tab").forEach((tab) => tab.classList.remove("active"));
            contents.forEach((content) => {
                content.hidden = true;
                content.style.display = "none";
            });
            if (hint) {
                hint.hidden = false;
                hint.style.display = "block";
            }
            this.updateTransformAvailability?.();
            return;
        }

        if (this.currentTool === "add") {
            const renderPreset = this.currentSugarConfig?.renderPreset || "flat";
            document.querySelectorAll("[data-render-preset]").forEach((button) => {
                button.classList.toggle("active", button.dataset.renderPreset === renderPreset);
            });
        }

        const preferredOrder = ["preset", "sugar", "text", "linkage", "view"];
        const activeType = preferredOrder.find((type) => visibleTypes.has(type)) || "view";
        this.activatePanelTab(activeType);
        if (visibleTypes.has("sugar")) {
            this.syncRenderButtonsForSelection(this.getSelectedElementsByType("sugar"));
            this.updateSugarControlValues?.();
        }
        if (visibleTypes.has("linkage")) {
            this.updateLinkageControlValues?.();
        }
        this.updateTransformAvailability?.();
    },

    activatePanelTab(type) {
        document.querySelectorAll(".panel-tab").forEach((tab) => {
            tab.classList.toggle("active", tab.dataset.panelTab === type);
        });
        document.querySelectorAll("[data-panel-content]").forEach((content) => {
            const active = content.dataset.panelContent === type;
            content.hidden = !active;
            content.style.display = active ? "block" : "none";
        });
    },

    setupPanelTabs() {
        document.querySelectorAll(".panel-tab").forEach((tab) => {
            tab.addEventListener("click", () => this.activatePanelTab(tab.dataset.panelTab));
        });
    },

    setupCollapsibleGroups() {
        document.querySelectorAll("[data-panel-content]").forEach((content) => {
            content.querySelectorAll(".panel-group").forEach((group, index) => {
                group.open = index === 0;
            });
        });
    },
    

    shouldShowSugarControls() {
        // Show sugar controls when:
        // 1. Current tool is 'add'
        // 2. Selected elements include at least one sugar
        if (this.currentTool === 'add') {
            return true;
        }
        
        if (this.currentTool === 'select') {
            // Check if any selected elements are sugars
            return this.selectedSugars.size > 0 || this.selectedSugar !== null;
        }
        
        return false;
    },
    

    shouldShowTextControls() {
        // Show text controls when:
        // 1. Current tool is 'text'
        // 2. Selected elements include at least one text
        if (this.currentTool === 'text') {
            return true;
        }
        
        if (this.currentTool === 'select') {
            // Check if any selected text elements
            return this.selectedText !== null || this.selectedTexts.size > 0;
        }
        
        return false;
    },
    

    shouldShowLinkageControls() {
        // Show linkage controls when:
        // In select mode and connections are selected
        if (this.currentTool === 'select') {
            return this.selectedConnections && this.selectedConnections.size > 0;
        }
        
        return false;
    },
    

    updateConnectionStatus() {
        const connectionStatus = document.getElementById('connectionStatus');
        if (!connectionStatus) return;
        
        const statusText = connectionStatus.querySelector('.status-text');
        if (!statusText) return;
        
        if (this.currentTool === 'select') {
            // Count connections between selected sugars
            let connectionCount = 0;
            const selectedSugarElements = Array.from(this.selectedSugars);
            if (this.selectedSugar) {
                selectedSugarElements.push(this.selectedSugar);
            }
            
            // Count connections
            const allConnections = document.querySelectorAll('.connection-line');
            allConnections.forEach(connection => {
                const startSugar = document.getElementById(connection.getAttribute('data-start'));
                const endSugar = document.getElementById(connection.getAttribute('data-end'));
                
                if ((selectedSugarElements.includes(startSugar) || selectedSugarElements.includes(endSugar))) {
                    connectionCount++;
                }
            });
            
            statusText.textContent = `选中了 ${connectionCount} 条连接线`;
            connectionStatus.className = connectionCount > 0 ? 'connection-status has-connections' : 'connection-status';
        } else {
            statusText.textContent = '选中了 0 条连接线';
            connectionStatus.className = 'connection-status';
        }
    },
    

    updateSugarControlValues() {
        if (this.currentTool === 'add') {
            // In add mode, restore the persisted new-sugar configuration into the
            // controls. This keeps add-mode panel state separate from selections.
            if (this.updateStyleControlValues) {
                this.updateStyleControlValues();
            } else {
                this.updateSugarControlsToDefaults();
            }
        } else if (this.currentTool === 'select') {
            // In select mode, show selected sugar properties or mixed values
            this.updateSugarControlsFromSelection();
        }
    },
    

    updateTextControlValues() {
        if (this.currentTool === 'text') {
            // In text mode, show current panel configuration
            this.updateTextControlsToDefaults();
        } else if (this.currentTool === 'select') {
            // In select mode, show selected text properties or mixed values
            this.updateTextControlsFromSelection();
        }
    },
    

    updateLinkageControlValues() {
        if (this.currentTool === "add") {
            this.updateAddModeLinkageControls();
        } else if (this.currentTool === "select") {
            this.updateLinkageControlsFromSelection();
        }
    },

    updateAddModeLinkageControls() {
        const config = this.currentLinkageConfig || {};
        const set = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        };

        set("linkageInputAdd", config.linkage || "");
        set("connectionWidthAdd", config.strokeWidth ?? 2);
        set("connectionWidthAddValue", config.strokeWidth ?? 2);
        set("connectionOpacityAdd", config.strokeOpacity ?? 1);
        set("connectionOpacityAddValue", Math.round((config.strokeOpacity ?? 1) * 100) + "%");
        set("connectionColorAdd", this.normalizeColorToHex(config.strokeColor || "#000000"));
        set("connectionColorAddHex", this.normalizeColorToHex(config.strokeColor || "#000000"));
        set("linkageTextSizeAdd", config.textSize ?? 12);
        set("linkageTextSizeAddValue", config.textSize ?? 12);
        set("linkageTextFontFamilyAdd", config.textFontFamily || "Arial");
        set("linkageTextColorAdd", this.normalizeColorToHex(config.textColor || "#000000"));
        set("linkageTextColorAddHex", this.normalizeColorToHex(config.textColor || "#000000"));
        set("linkageTextOpacityAdd", config.textOpacity ?? 1);
        set("linkageTextOpacityAddValue", Math.round((config.textOpacity ?? 1) * 100) + "%");

        const showText = document.getElementById("showLinkageTextAdd");
        if (showText) showText.checked = Boolean(config.showText);

        document.querySelectorAll("#linkagePreselectionSection [data-display-mode]").forEach((button) => {
            button.classList.toggle("active", button.dataset.displayMode === (config.displayMode || "standard"));
        });

        document.querySelectorAll('#linkagePreselectionSection .connection-style-btn[data-style]').forEach((button) => {
            button.classList.toggle("active", button.dataset.style === (config.strokeStyle || "solid"));
        });

        document.querySelectorAll('[data-target="connectionColorAdd"]').forEach((button) => {
            button.classList.toggle("active", button.dataset.color === this.normalizeColorToHex(config.strokeColor || "#000000"));
        });

        document.querySelectorAll('[data-target="linkageTextColorAdd"]').forEach((button) => {
            button.classList.toggle("active", button.dataset.color === this.normalizeColorToHex(config.textColor || "#000000"));
        });

        const reverseButton = document.getElementById("reverseLinkageAdd");
        if (reverseButton) reverseButton.classList.toggle("active", Boolean(config.reversed));
    },
    

    updateLinkageControlsFromSelection() {
        // Set flag to prevent style application during UI update
        this.isUpdatingUI = true;
        
        const connections = this.getEffectiveSelectedConnections();
        
        if (connections.length === 0) {
            this.isUpdatingUI = false;
            return;
        }
        
        // Get values from first connection
        const firstConn = connections[0];
        const firstLinkage = firstConn.getAttribute('data-linkage') || '';
        const firstWidth = parseFloat(firstConn.style.strokeWidth || firstConn.getAttribute('stroke-width')) || 2;
        const firstColorRaw = firstConn.style.stroke || firstConn.getAttribute('stroke') || '#000000';
        const firstColor = this.normalizeColorToHex(firstColorRaw); // Convert to hex format
        const firstOpacity = parseFloat(firstConn.style.strokeOpacity || firstConn.getAttribute('stroke-opacity')) || 1;
        const firstDashArray = firstConn.style.strokeDasharray || firstConn.getAttribute('stroke-dasharray') || '';
        const firstVisible = firstConn.getAttribute('data-linkage-visible') !== 'false';
        const firstTextSize = firstConn.getAttribute('data-text-size') || '12';
        const firstTextColorRaw = firstConn.getAttribute('data-text-color') || '#000000';
        const firstTextColor = this.normalizeColorToHex(firstTextColorRaw); // Convert to hex format
        const firstTextOpacity = parseFloat(firstConn.getAttribute('data-text-opacity')) || 1;
        const firstTextFontFamily = firstConn.getAttribute('data-text-font-family') || 'Arial';
        const firstDisplayMode = firstConn.getAttribute('data-linkage-display-mode') || 'standard';
        
        // Determine style from dash array
        let firstStyle = 'solid';
        if (firstDashArray) {
            const dashValues = firstDashArray.split(',').map(v => parseFloat(v.trim()));
            if (dashValues.length >= 2) {
                const ratio = dashValues[0] / dashValues[1];
                if (ratio > 1.5) firstStyle = 'dashed';
                else firstStyle = 'dotted';
            }
        }
        
        // Check if all connections have same values
        let mixedLinkage = false, mixedWidth = false, mixedColor = false, mixedOpacity = false;
        let mixedStyle = false, mixedVisible = false, mixedTextSize = false, mixedTextColor = false, mixedTextOpacity = false, mixedTextFontFamily = false, mixedDisplayMode = false;
        
        for (let i = 1; i < connections.length; i++) {
            const conn = connections[i];
            if ((conn.getAttribute('data-linkage') || '') !== firstLinkage) mixedLinkage = true;
            if ((parseFloat(conn.style.strokeWidth || conn.getAttribute('stroke-width')) || 2) !== firstWidth) mixedWidth = true;
            
            // Normalize color before comparison
            const connColorRaw = conn.style.stroke || conn.getAttribute('stroke') || '#000000';
            const connColor = this.normalizeColorToHex(connColorRaw);
            if (connColor !== firstColor) mixedColor = true;
            
            if ((parseFloat(conn.style.strokeOpacity || conn.getAttribute('stroke-opacity')) || 1) !== firstOpacity) mixedOpacity = true;
            if ((conn.getAttribute('data-linkage-visible') !== 'false') !== firstVisible) mixedVisible = true;
            if ((conn.getAttribute('data-text-size') || '12') !== firstTextSize) mixedTextSize = true;
            
            // Normalize text color before comparison
            const connTextColorRaw = conn.getAttribute('data-text-color') || '#000000';
            const connTextColor = this.normalizeColorToHex(connTextColorRaw);
            if (connTextColor !== firstTextColor) mixedTextColor = true;
            
            if ((parseFloat(conn.getAttribute('data-text-opacity')) || 1) !== firstTextOpacity) mixedTextOpacity = true;
            if ((conn.getAttribute('data-text-font-family') || 'Arial') !== firstTextFontFamily) mixedTextFontFamily = true;
            if ((conn.getAttribute('data-linkage-display-mode') || 'standard') !== firstDisplayMode) mixedDisplayMode = true;
            
            const dashArray = conn.style.strokeDasharray || conn.getAttribute('stroke-dasharray') || '';
            let style = 'solid';
            if (dashArray) {
                const dashValues = dashArray.split(',').map(v => parseFloat(v.trim()));
                if (dashValues.length >= 2) {
                    const ratio = dashValues[0] / dashValues[1];
                    if (ratio > 1.5) style = 'dashed';
                    else style = 'dotted';
                }
            }
            if (style !== firstStyle) mixedStyle = true;
        }
        
        // Update controls
        const linkageInput = document.getElementById('linkageInput');
        const connectionStrokeWidth = document.getElementById('connectionStrokeWidth');
        const connectionStrokeWidthValue = document.getElementById('connectionStrokeWidthValue');
        const connectionColor = document.getElementById('connectionColor');
        const connectionColorHex = document.getElementById('connectionColorHex');
        const linkageOpacity = document.getElementById('linkageOpacity');
        const linkageOpacityValue = document.getElementById('linkageOpacityValue');
        const showLinkageText = document.getElementById('showLinkageText');
        const linkageTextSize = document.getElementById('linkageTextSize');
        const linkageTextSizeValue = document.getElementById('linkageTextSizeValue');
        const linkageTextColor = document.getElementById('linkageTextColor');
        const linkageTextColorHex = document.getElementById('linkageTextColorHex');
        const linkageTextOpacity = document.getElementById('linkageTextOpacity');
        const linkageTextOpacityValue = document.getElementById('linkageTextOpacityValue');
        const linkageTextFontFamily = document.getElementById('linkageTextFontFamily');
        
        if (linkageInput) {
            linkageInput.value = mixedLinkage ? '' : firstLinkage;
            linkageInput.placeholder = '';
        }
        
        if (connectionStrokeWidth && connectionStrokeWidthValue) {
            connectionStrokeWidth.value = mixedWidth ? '' : firstWidth;
            connectionStrokeWidthValue.textContent = mixedWidth ? (window.languageManager.getTranslation('mixed') || 'Mixed') : firstWidth;
        }
        
        if (connectionColor && connectionColorHex) {
            connectionColor.value = mixedColor ? '#000000' : this.normalizeColorToHex(firstColor);
            connectionColorHex.value = mixedColor ? '' : this.normalizeColorToHex(firstColor);
            if (mixedColor) {
                connectionColor.classList.add('mixed');
                connectionColorHex.placeholder = window.languageManager.getTranslation('mixed') || 'Mixed';
            } else {
                connectionColor.classList.remove('mixed');
                connectionColorHex.placeholder = firstColor;
            }
        }
        
        if (linkageOpacity && linkageOpacityValue) {
            linkageOpacity.value = mixedOpacity ? '1' : firstOpacity;
            linkageOpacityValue.textContent = mixedOpacity ? (window.languageManager.getTranslation('mixed') || 'Mixed') : Math.round(firstOpacity * 100) + '%';
        }
        
        if (showLinkageText) {
            showLinkageText.checked = !mixedVisible && firstVisible;
            showLinkageText.indeterminate = mixedVisible;
        }
        
        if (linkageTextSize && linkageTextSizeValue) {
            linkageTextSize.value = mixedTextSize ? '12' : firstTextSize;
            linkageTextSizeValue.textContent = mixedTextSize ? (window.languageManager.getTranslation('mixed') || 'Mixed') : firstTextSize;
        }
        
        if (linkageTextColor && linkageTextColorHex) {
            linkageTextColor.value = mixedTextColor ? '#000000' : firstTextColor;
            linkageTextColorHex.value = mixedTextColor ? '' : this.normalizeColorToHex(firstTextColor);
            if (mixedTextColor) {
                linkageTextColor.classList.add('mixed');
                linkageTextColorHex.placeholder = window.languageManager.getTranslation('mixed') || 'Mixed';
            } else {
                linkageTextColor.classList.remove('mixed');
                linkageTextColorHex.placeholder = firstTextColor;
            }
        }
        
        if (linkageTextOpacity && linkageTextOpacityValue) {
            linkageTextOpacity.value = mixedTextOpacity ? '1' : firstTextOpacity;
            linkageTextOpacityValue.textContent = mixedTextOpacity ? (window.languageManager.getTranslation('mixed') || 'Mixed') : Math.round(firstTextOpacity * 100) + '%';
        }
        
        if (linkageTextFontFamily) {
            linkageTextFontFamily.value = mixedTextFontFamily ? '' : firstTextFontFamily;
        }
        
        // Update style buttons
        document.querySelectorAll('.connection-style-btn').forEach(btn => {
            btn.classList.toggle('active', !mixedStyle && btn.dataset.style === firstStyle);
        });

        document.querySelectorAll('#linkageControlsSection [data-display-mode]').forEach((button) => {
            button.classList.toggle('active', !mixedDisplayMode && button.dataset.displayMode === firstDisplayMode);
        });
        
        // Update color buttons
        document.querySelectorAll('.color-btn-compact[data-target="connectionColor"]').forEach(btn => {
            btn.classList.toggle('active', !mixedColor && btn.dataset.color.toLowerCase() === firstColor.toLowerCase());
        });
        
        document.querySelectorAll('.color-btn-compact[data-target="linkageTextColor"]').forEach(btn => {
            btn.classList.toggle('active', !mixedTextColor && btn.dataset.color.toLowerCase() === firstTextColor.toLowerCase());
        });

        // Sync bold/italic/underline buttons based on selected connections.
        try {
            const boldBtn = document.getElementById('linkageTextBoldBtn');
            const italicBtn = document.getElementById('linkageTextItalicBtn');
            const underlineBtn = document.getElementById('linkageTextUnderlineBtn');

            if (connections.length > 0) {
                let boldCount = 0, italicCount = 0, underlineCount = 0;
                connections.forEach(conn => {
                    const b = conn.getAttribute('data-text-bold');
                    const i = conn.getAttribute('data-text-italic');
                    const u = conn.getAttribute('data-text-underline');
                    if (b === 'true') boldCount++;
                    if (i === 'true') italicCount++;
                    if (u === 'true') underlineCount++;
                });

                const total = connections.length;
                if (boldBtn) {
                    if (boldCount === total) { boldBtn.classList.add('active'); boldBtn.removeAttribute('data-mixed'); }
                    else if (boldCount === 0) { boldBtn.classList.remove('active'); boldBtn.removeAttribute('data-mixed'); }
                    else { boldBtn.classList.remove('active'); boldBtn.setAttribute('data-mixed', 'true'); }
                }
                if (italicBtn) {
                    if (italicCount === total) { italicBtn.classList.add('active'); italicBtn.removeAttribute('data-mixed'); }
                    else if (italicCount === 0) { italicBtn.classList.remove('active'); italicBtn.removeAttribute('data-mixed'); }
                    else { italicBtn.classList.remove('active'); italicBtn.setAttribute('data-mixed', 'true'); }
                }
                if (underlineBtn) {
                    if (underlineCount === total) { underlineBtn.classList.add('active'); underlineBtn.removeAttribute('data-mixed'); }
                    else if (underlineCount === 0) { underlineBtn.classList.remove('active'); underlineBtn.removeAttribute('data-mixed'); }
                    else { underlineBtn.classList.remove('active'); underlineBtn.setAttribute('data-mixed', 'true'); }
                }
            }
        } catch (e) {
            console.error('Error syncing linkage style buttons:', e);
        }

        this.isUpdatingUI = false;
    },
    

    updateSugarControlsToDefaults() {
        // Set controls to current configuration values (what will be used for new sugars)
        const sugarType = document.getElementById('sugarType');
        const sugarSize = document.getElementById('sugarSize');
        const sugarBorderWidth = document.getElementById('sugarBorderWidth');
        const sugarBorderColor = document.getElementById('sugarBorderColor');
        const sugarBorderColorHex = document.getElementById('sugarBorderColorHex');
        
        // Clear mixed states when not in selection mode
        if (sugarBorderColor) sugarBorderColor.classList.remove('mixed');
        if (sugarBorderColorHex) sugarBorderColorHex.classList.remove('mixed');
        if (sugarBorderWidth) sugarBorderWidth.classList.remove('mixed');
        const sugarBorderWidthValue = document.getElementById('sugarBorderWidthValue');
        if (sugarBorderWidthValue) sugarBorderWidthValue.classList.remove('mixed');
        
        // These should reflect current tool settings, not change them
        // The values should be what's currently set as defaults
    },
    

    updateTextControlsToDefaults() {
        // Set controls to current configuration values (what will be used for new text)
        const fontSize = document.getElementById('fontSize');
        const fontFamily = document.getElementById('fontFamily');
        const textColor = document.getElementById('textColor');
        
        // These should reflect current tool settings, not change them
    },
    

    updateSugarControlsFromSelection() {
        // Set flag to prevent style application during UI update
        this.isUpdatingUI = true;
        
        // Use new unified selection UI method for shape/color/preset handling
        this.updateSelectionUI();
        
        // Get selected sugars using unified selection system
        const selectedSugars = Array.from(this.selectedElements).filter(el => this.getElementType(el) === 'sugar');
        
        if (selectedSugars.length === 0) {
            this.isUpdatingUI = false;
            return;
        }
        
        // Get values from first sugar for detailed controls
        const firstSugar = selectedSugars[0];
        const firstType = firstSugar.getAttribute('data-shape');
        const firstSize = this.getSugarSize(firstSugar);
        const firstShape = firstSugar.querySelector('.sugar-shape');
        const firstBorderWidth = firstShape ? this.getEffectiveBorderWidth(firstShape) : 2;
        const firstBorderColor = firstShape ? this.getEffectiveBorderColor(firstShape) : '#000000';
        const firstBorderOpacity = firstShape ? this.getEffectiveBorderOpacity(firstShape) : 1;
        const firstFillColor = firstShape ? this.getEffectiveFillColor(firstShape) : '#0072BC';
        const firstFillOpacity = firstShape ? (parseFloat(firstShape.style.fillOpacity || firstShape.getAttribute('fill-opacity')) || 1) : 1;
        
        // Check if all selected sugars have same values for detailed controls
        let mixedType = false, mixedSize = false, mixedBorderWidth = false, mixedBorderColor = false, mixedBorderOpacity = false;
        let mixedFillColor = false, mixedFillOpacity = false;
        
        for (let i = 1; i < selectedSugars.length; i++) {
            const sugar = selectedSugars[i];
            const shape = sugar.querySelector('.sugar-shape');
            
            if (sugar.getAttribute('data-shape') !== firstType) mixedType = true;
            if (this.getSugarSize(sugar) !== firstSize) mixedSize = true;
            if (shape) {
                const borderWidth = this.getEffectiveBorderWidth(shape);
                const borderColor = this.getEffectiveBorderColor(shape);
                const borderOpacity = this.getEffectiveBorderOpacity(shape);
                const fillColor = this.getEffectiveFillColor(shape);
                const fillOpacity = parseFloat(shape.style.fillOpacity || shape.getAttribute('fill-opacity')) || 1;
                if (borderWidth !== firstBorderWidth) mixedBorderWidth = true;
                if (borderColor !== firstBorderColor) mixedBorderColor = true;
                if (borderOpacity !== firstBorderOpacity) mixedBorderOpacity = true;
                if (fillColor !== firstFillColor) mixedFillColor = true;
                if (fillOpacity !== firstFillOpacity) mixedFillOpacity = true;
            }
        }
        
        // Update detailed controls (these are handled separately from main UI)
        const sugarType = document.getElementById('sugarType');
        const sugarSize = document.getElementById('sugarSize');
        const sugarSizeValue = document.getElementById('sugarSizeValue');
        const sugarBorderWidth = document.getElementById('sugarBorderWidth');
        const sugarBorderWidthValue = document.getElementById('sugarBorderWidthValue');
        const sugarBorderColor = document.getElementById('sugarBorderColor');
        const sugarBorderColorHex = document.getElementById('sugarBorderColorHex');
        const sugarBorderOpacity = document.getElementById('sugarBorderOpacity');
        const sugarBorderOpacityValue = document.getElementById('sugarBorderOpacityValue');
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        const customSugarOpacity = document.getElementById('customSugarOpacity');
        const customSugarOpacityValue = document.getElementById('customSugarOpacityValue');
        
        if (sugarType) {
            sugarType.value = mixedType ? '' : firstType;
        }
        
        if (sugarSize && sugarSizeValue) {
            if (mixedSize) {
                sugarSize.value = '';
                sugarSizeValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                sugarSize.classList.add('mixed');
                sugarSizeValue.classList.add('mixed');
            } else {
                sugarSize.value = firstSize;
                sugarSizeValue.textContent = firstSize;
                sugarSize.classList.remove('mixed');
                sugarSizeValue.classList.remove('mixed');
            }
        }
        
        if (sugarBorderWidth && sugarBorderWidthValue) {
            if (mixedBorderWidth) {
                sugarBorderWidth.value = '';
                sugarBorderWidthValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                sugarBorderWidth.classList.add('mixed');
                sugarBorderWidthValue.classList.add('mixed');
            } else {
                sugarBorderWidth.value = firstBorderWidth;
                sugarBorderWidthValue.textContent = firstBorderWidth;
                sugarBorderWidth.classList.remove('mixed');
                sugarBorderWidthValue.classList.remove('mixed');
            }
        }
        
        if (sugarBorderColor && sugarBorderColorHex) {
            if (mixedBorderColor) {
                sugarBorderColor.value = '#ffffff';
                sugarBorderColorHex.value = '';
                sugarBorderColor.classList.add('mixed');
                sugarBorderColorHex.classList.add('mixed');
            } else {
                const hexBorderColor = this.normalizeColorToHex(firstBorderColor);
                sugarBorderColor.value = hexBorderColor;
                sugarBorderColorHex.value = hexBorderColor;
                sugarBorderColor.classList.remove('mixed');
                sugarBorderColorHex.classList.remove('mixed');
            }
        }
        
        if (sugarBorderOpacity && sugarBorderOpacityValue) {
            if (mixedBorderOpacity) {
                sugarBorderOpacity.value = '';
                sugarBorderOpacityValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                sugarBorderOpacity.classList.add('mixed');
                sugarBorderOpacityValue.classList.add('mixed');
            } else {
                sugarBorderOpacity.value = firstBorderOpacity;
                sugarBorderOpacityValue.textContent = Math.round(firstBorderOpacity * 100) + '%';
                sugarBorderOpacity.classList.remove('mixed');
                sugarBorderOpacityValue.classList.remove('mixed');
            }
        }
        
        // Update custom sugar color (additional detailed control)  
        if (customSugarColor && customSugarColorHex) {
            if (mixedFillColor) {
                customSugarColor.value = '#ffffff';
                customSugarColorHex.value = '';
                customSugarColor.classList.add('mixed');
                customSugarColorHex.classList.add('mixed');
            } else {
                const hexFillColor = this.normalizeColorToHex(firstFillColor);
                customSugarColor.value = hexFillColor;
                customSugarColorHex.value = hexFillColor;
                customSugarColor.classList.remove('mixed');
                customSugarColorHex.classList.remove('mixed');
            }
        }
        
        // Update custom sugar opacity
        if (customSugarOpacity && customSugarOpacityValue) {
            if (mixedFillOpacity) {
                customSugarOpacity.value = '';
                customSugarOpacityValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
                customSugarOpacity.classList.add('mixed');
                customSugarOpacityValue.classList.add('mixed');
            } else {
                customSugarOpacity.value = firstFillOpacity;
                customSugarOpacityValue.textContent = Math.round(firstFillOpacity * 100) + '%';
                customSugarOpacity.classList.remove('mixed');
                customSugarOpacityValue.classList.remove('mixed');
            }
        }
        
        // Update border style buttons based on selected sugars
        const borderStyleButtons = document.querySelectorAll('.border-style-btn');
        if (borderStyleButtons.length > 0) {
            // Get border style from first sugar
            let firstBorderStyle = 'solid';
            if (firstShape) {
                const dashArray = this.getEffectiveBorderDashArray(firstShape);
                if (dashArray) {
                    const dashValues = dashArray.split(',').map(v => parseFloat(v.trim()));
                    if (dashValues.length === 2) {
                        const width = firstBorderWidth;
                        if (dashValues[0] === width * 3 && dashValues[1] === width * 2) {
                            firstBorderStyle = 'dashed';
                        } else if (dashValues[0] === width && dashValues[1] === width) {
                            firstBorderStyle = 'dotted';
                        }
                    }
                }
            }
            
            // Check if all selected sugars have same border style
            let mixedBorderStyle = false;
            for (let i = 1; i < selectedSugars.length; i++) {
                const sugar = selectedSugars[i];
                const shape = sugar.querySelector('.sugar-shape');
                let borderStyle = 'solid';
                if (shape) {
                    const dashArray = this.getEffectiveBorderDashArray(shape);
                    const width = this.getEffectiveBorderWidth(shape);
                    if (dashArray) {
                        const dashValues = dashArray.split(',').map(v => parseFloat(v.trim()));
                        if (dashValues.length === 2) {
                            if (dashValues[0] === width * 3 && dashValues[1] === width * 2) {
                                borderStyle = 'dashed';
                            } else if (dashValues[0] === width && dashValues[1] === width) {
                                borderStyle = 'dotted';
                            }
                        }
                    }
                }
                if (borderStyle !== firstBorderStyle) {
                    mixedBorderStyle = true;
                    break;
                }
            }
            
            // Update border style button states
            borderStyleButtons.forEach(btn => {
                if (mixedBorderStyle) {
                    btn.classList.remove('active');
                    btn.classList.add('mixed');
                } else {
                    btn.classList.toggle('active', btn.dataset.style === firstBorderStyle);
                    btn.classList.remove('mixed');
                }
            });
        }

        this.syncRenderButtonsForSelection(selectedSugars);
        
        // Clear flag after UI update is complete
        this.isUpdatingUI = false;
    },
    

    updateTextControlsFromSelection() {
        // Check for mixed values across selected texts
        const selectedTexts = Array.from(this.selectedTexts);
        if (this.selectedText && !selectedTexts.includes(this.selectedText)) {
            selectedTexts.push(this.selectedText);
        }
        
        if (selectedTexts.length === 0) return;
        
        // Get values from first text
        const firstText = selectedTexts[0];
        const firstFontSize = parseFloat(firstText.style.fontSize || '16');
        const firstFontFamily = firstText.style.fontFamily || 'Arial';
        const firstColor = firstText.style.fill || firstText.getAttribute('fill') || '#000000';
        const firstBold = firstText.style.fontWeight === 'bold';
        const firstItalic = firstText.style.fontStyle === 'italic';
        const firstUnderline = firstText.style.textDecoration === 'underline';
        
        // Check for mixed values
        let mixedSize = false, mixedFamily = false, mixedColor = false;
        let mixedBold = false, mixedItalic = false, mixedUnderline = false;
        
        for (let i = 1; i < selectedTexts.length; i++) {
            const text = selectedTexts[i];
            const fontSize = parseFloat(text.style.fontSize || '16');
            const fontFamily = text.style.fontFamily || 'Arial';
            const color = text.style.fill || text.getAttribute('fill') || '#000000';
            const bold = text.style.fontWeight === 'bold';
            const italic = text.style.fontStyle === 'italic';
            const underline = text.style.textDecoration === 'underline';
            
            if (fontSize !== firstFontSize) mixedSize = true;
            if (fontFamily !== firstFontFamily) mixedFamily = true;
            if (color !== firstColor) mixedColor = true;
            if (bold !== firstBold) mixedBold = true;
            if (italic !== firstItalic) mixedItalic = true;
            if (underline !== firstUnderline) mixedUnderline = true;
        }
        
        // Update controls
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const fontFamily = document.getElementById('fontFamily');
        const textColor = document.getElementById('textColor');
        const textColorHex = document.getElementById('textColorHex');
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        const underlineBtn = document.getElementById('underlineBtn');
        
        if (fontSize && fontSizeValue) {
            if (mixedSize) {
                fontSize.value = '';
                fontSizeValue.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
            } else {
                fontSize.value = firstFontSize;
                fontSizeValue.textContent = firstFontSize;
            }
        }
        if (fontFamily) {
            fontFamily.value = mixedFamily ? '' : firstFontFamily.replace(/['"]/g, '');
        }
        if (textColor && textColorHex) {
            if (mixedColor) {
                textColor.value = '#ffffff';
                textColorHex.value = '';
            } else {
                const hexColor = this.normalizeColorToHex(firstColor);
                textColor.value = hexColor;
                textColorHex.value = hexColor;
            }
        }
        
        // Update style buttons with mixed state
        if (boldBtn) {
            boldBtn.classList.toggle('active', !mixedBold && firstBold);
            boldBtn.classList.toggle('mixed', mixedBold);
        }
        if (italicBtn) {
            italicBtn.classList.toggle('active', !mixedItalic && firstItalic);
            italicBtn.classList.toggle('mixed', mixedItalic);
        }
        if (underlineBtn) {
            underlineBtn.classList.toggle('active', !mixedUnderline && firstUnderline);
            underlineBtn.classList.toggle('mixed', mixedUnderline);
        }
    },
    

    getCurrentTextConfig() {
        if (this.currentTool === 'text') {
            // 文本工具模式：使用保存的配置
            return this.currentTextConfig || {
                fontSize: 16,
                fontFamily: 'Arial, sans-serif',
                color: '#000000',
                bold: false,
                italic: false,
                underline: false
            };
        } else {
            // 选择模式或其他模式：从右侧面板读取当前值
            const fontSize = document.getElementById('fontSize');
            const fontFamily = document.getElementById('fontFamily');
            const textColor = document.getElementById('textColor');
            const boldBtn = document.getElementById('bold');
            const italicBtn = document.getElementById('italic');
            const underlineBtn = document.getElementById('underline');
            
            return {
                fontSize: fontSize ? parseInt(fontSize.value) : 16,
                fontFamily: fontFamily ? fontFamily.value : 'Arial, sans-serif',
                color: textColor ? textColor.value : '#000000',
                bold: boldBtn ? boldBtn.classList.contains('active') : false,
                italic: italicBtn ? italicBtn.classList.contains('active') : false,
                underline: underlineBtn ? underlineBtn.classList.contains('active') : false
            };
        }
    },
    
    // Eraser methods
};
