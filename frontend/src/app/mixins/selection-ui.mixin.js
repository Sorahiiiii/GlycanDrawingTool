// Feature mixin extracted mechanically from js/script.js.
// Original line ranges: 4981, 5015, 5135, 5276, 5294.
export const selectionUiMixin = {
    updateSelectionUI() {
        const selectedElements = Array.from(this.selectedElements);
        
        if (selectedElements.length === 0) {
            this.clearUISelections(); // 使用不同的方法名避免循环调用
            return;
        }
        
        // 获取所有选中元素的糖数据
        const sugarDataList = selectedElements
            .filter(element => element && element.classList && element.classList.contains('sugar'))
            .map(element => ({
                shape: element.getAttribute('data-shape'),
                color: element.getAttribute('data-color'),
                preset: element.getAttribute('data-preset'),
                size: parseFloat(element.getAttribute('data-size')) || 20
            }))
            .filter(data => data.shape && data.color);
            
        if (sugarDataList.length === 0) {
            this.clearAllSelections();
            return;
        }
        
        if (sugarDataList.length === 1) {
            // 单个选择
            this.updateSingleSelectionUI(sugarDataList[0]);
        } else {
            // 多个选择
            this.updateMultipleSelectionUI(sugarDataList);
        }
    },
    
    // 单个元素选择的UI更新

    updateSingleSelectionUI(sugarData) {
        // Safety check to prevent shape from being reset
        if (!sugarData.shape) {
            console.warn('No shape data found for selected sugar');
            return;
        }
        
        // 定义默认调色板颜色
        const defaultColors = [
            '#0072BC', '#00A651', '#FFD400', '#8FCCE9', 
            '#F69EA1', '#A54399', '#A17A4D', '#F47920',
            '#ED1C24', '#FFFFFF', '#808080', '#000000'
        ];
        
        // 清除所有UI选择状态（仅仅清除视觉选中状态，不影响参数）
        this.clearUISelections();
        
        // 更新选中糖分子的显示颜色（不影响添加模式参数）
        const selectedSugar = Array.from(this.selectedElements).find(el => el.classList.contains('sugar'));
        let effectiveFillColor = sugarData.color;
        if (selectedSugar) {
            const shape = selectedSugar.querySelector('.sugar-shape');
            if (shape) {
                effectiveFillColor = this.getEffectiveFillColor(shape);
            }
        }
        
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        if (customSugarColor && effectiveFillColor) {
            customSugarColor.value = this.normalizeColorToHex(effectiveFillColor);
        }
        if (customSugarColorHex && effectiveFillColor) {
            customSugarColorHex.value = this.normalizeColorToHex(effectiveFillColor);
        }
        
        // 更新形状按钮 - 显示实际形状 (主按钮和下拉项目)
        const mappedShape = this.mapLegacyShape(sugarData.shape);
        document.querySelectorAll('.shape-main-btn').forEach(btn => {
            if (btn.dataset.shape === mappedShape) {
                btn.classList.add('active');
            }
        });
        document.querySelectorAll('.shape-dropdown-item').forEach(item => {
            if (item.dataset.shape === mappedShape) {
                item.classList.add('active');
                // Also activate the parent category
                const category = item.closest('.shape-category');
                if (category) {
                    category.classList.add('active');
                    const mainBtn = category.querySelector('.shape-main-btn');
                    if (mainBtn) mainBtn.classList.add('active');
                }
            }
        });
        
        // 更新新的形状选择器 - 显示实际子形状
        if (this.updateShapeSelectorFromSelection) {
            this.updateShapeSelectorFromSelection([sugarData.shape]);
        }
        
        // 更新颜色按钮 - 只有在默认调色板中的颜色才显示选中
        const normalizedSugarColor = this.normalizeColorToHex(sugarData.color);
        document.querySelectorAll('.color-btn').forEach(btn => {
            if (btn.dataset.color === normalizedSugarColor && defaultColors.includes(normalizedSugarColor)) {
                btn.classList.add('active');
            }
        });
        
        // 更新边框颜色预设按钮 - 获取选中糖的边框颜色并激活匹配的预设按钮
        const selectedSugarForBorder = Array.from(this.selectedElements).find(el => el.classList.contains('sugar'));
        if (selectedSugarForBorder) {
            const shape = selectedSugarForBorder.querySelector('.sugar-shape');
            if (shape) {
                const borderColor = shape.style.stroke || shape.getAttribute('stroke') || '#000000';
                const normalizedBorderColor = this.normalizeColorToHex(borderColor);
                
                // 激活匹配的边框颜色预设按钮
                document.querySelectorAll('.color-btn-compact[data-target="sugarBorderColor"]').forEach(btn => {
                    if (btn.dataset.color === normalizedBorderColor) {
                        btn.classList.add('active');
                    }
                });
            }
        }
        
        // 查找匹配的SNFG预设
        let matchingPreset = null;
        const presetMappedShape = this.mapLegacyShape(sugarData.shape);
        for (const [presetKey, presetConfig] of Object.entries(this.snfgPresets)) {
            if (presetConfig.shape === presetMappedShape && presetConfig.color === normalizedSugarColor) {
                matchingPreset = presetKey;
                break;
            }
        }
        
        // 更新SNFG预设按钮 - 如果匹配则显示选中
        document.querySelectorAll('.snfg-btn, .preset-item').forEach(btn => {
            if (btn.dataset.preset === matchingPreset) {
                btn.classList.add('active');
            }
        });
        
        // 更新尺寸显示（仅显示，不修改添加模式参数）
        const sizeDisplay = document.getElementById('sugarSizeDisplay');
        if (sizeDisplay) {
            sizeDisplay.textContent = sugarData.size;
        }
        
        const sizeSlider = document.getElementById('sugarSize');
        if (sizeSlider) {
            sizeSlider.value = sugarData.size;
        }
        
        // 重要：不修改 this.currentSugarConfig！
        // 选中糖分子的显示与添加新糖的参数应该是独立的
        // this.currentSugarConfig 应该保持上次选择的添加参数不变
    },
    
    // 多个元素选择的UI更新

    updateMultipleSelectionUI(sugarDataList) {
        // 定义默认调色板颜色
        const defaultColors = [
            '#0072BC', '#00A651', '#FFD400', '#8FCCE9', 
            '#F69EA1', '#A54399', '#A17A4D', '#F47920',
            '#ED1C24', '#FFFFFF', '#808080', '#000000'
        ];
        
        // 清除所有UI选择状态（仅仅清除视觉选中状态）
        this.clearUISelections();
        
        // 检查各属性一致性
        const shapes = [...new Set(sugarDataList.map(data => data.shape))];
        const colors = [...new Set(sugarDataList.map(data => this.normalizeColorToHex(data.color)))];
        const sizes = [...new Set(sugarDataList.map(data => data.size))];
        
        // 多选时，如果参数不一致，不显示具体内容（按照需求）
        
        // 更新形状按钮 - 只有当所有选中元素形状相同时才显示选中
        if (shapes.length === 1) {
            const mappedShape = this.mapLegacyShape(shapes[0]);
            document.querySelectorAll('.shape-main-btn').forEach(btn => {
                if (btn.dataset.shape === mappedShape) {
                    btn.classList.add('active');
                }
            });
            document.querySelectorAll('.shape-dropdown-item').forEach(item => {
                const isActive = item.dataset.shape === mappedShape;
                item.classList.toggle('active', isActive);
                if (isActive) {
                    const category = item.closest('.shape-category');
                    if (category) {
                        category.classList.add('active');
                        const mainBtn = category.querySelector('.shape-main-btn');
                        if (mainBtn) mainBtn.classList.add('active');
                    }
                }
            });
            
            // 更新形状选择器
            if (this.updateShapeSelectorFromSelection) {
                this.updateShapeSelectorFromSelection(shapes);
            }
        }
        
        // 更新颜色按钮 - 只有当所有选中元素颜色相同且在默认调色板中时才显示选中
        if (colors.length === 1 && defaultColors.includes(colors[0])) {
            document.querySelectorAll('.color-btn').forEach(btn => {
                if (btn.dataset.color === colors[0]) {
                    btn.classList.add('active');
                }
            });
        }
        
        // 更新边框颜色预设按钮 - 检查所有选中糖的边框颜色是否相同
        const selectedSugars = Array.from(this.selectedElements).filter(el => el.classList.contains('sugar'));
        if (selectedSugars.length > 0) {
            const borderColors = [...new Set(selectedSugars.map(sugar => {
                const shape = sugar.querySelector('.sugar-shape');
                if (shape) {
                    const borderColor = shape.style.stroke || shape.getAttribute('stroke') || '#000000';
                    return this.normalizeColorToHex(borderColor);
                }
                return null;
            }).filter(color => color !== null))];
            
            // 如果所有选中糖的边框颜色相同，激活对应的预设按钮
            if (borderColors.length === 1) {
                document.querySelectorAll('.color-btn-compact[data-target="sugarBorderColor"]').forEach(btn => {
                    if (btn.dataset.color === borderColors[0]) {
                        btn.classList.add('active');
                    }
                });
            }
        }
        
        // 检查SNFG预设匹配 - 只有当所有选中元素都匹配同一个预设时才显示选中
        let commonPreset = null;
        if (shapes.length === 1 && colors.length === 1) {
            const multiMappedShape = this.mapLegacyShape(shapes[0]);
            for (const [presetKey, presetConfig] of Object.entries(this.snfgPresets)) {
                if (presetConfig.shape === multiMappedShape && presetConfig.color === colors[0]) {
                    commonPreset = presetKey;
                    break;
                }
            }
        }
        
        document.querySelectorAll('.snfg-btn, .preset-item').forEach(btn => {
            if (btn.dataset.preset === commonPreset) {
                btn.classList.add('active');
            }
        });
        
        // 更新颜色显示 - 如果颜色一致则显示该颜色，否则不显示任何颜色
        const customSugarColor = document.getElementById('customSugarColor');
        const customSugarColorHex = document.getElementById('customSugarColorHex');
        
        if (colors.length === 1) {
            // 颜色一致，显示该颜色
            if (customSugarColor) {
                customSugarColor.value = colors[0];
                customSugarColor.classList.remove('mixed');
            }
            if (customSugarColorHex) {
                customSugarColorHex.value = this.normalizeColorToHex(colors[0]);
                customSugarColorHex.classList.remove('mixed');
            }
        } else {
            // 颜色不一致，显示混合状态
            if (customSugarColor) {
                customSugarColor.classList.add('mixed');
            }
            if (customSugarColorHex) {
                customSugarColorHex.value = window.languageManager.getTranslation('mixed') || 'Mixed';
                customSugarColorHex.classList.add('mixed');
            }
        }
        
        // 更新尺寸显示 - 如果尺寸一致则显示该尺寸，否则显示混合状态
        const sizeDisplay = document.getElementById('sugarSizeDisplay');
        const sizeSlider = document.getElementById('sugarSize');
        
        if (sizes.length === 1) {
            if (sizeDisplay) sizeDisplay.textContent = sizes[0];
            if (sizeSlider) {
                sizeSlider.value = sizes[0];
                sizeSlider.classList.remove('mixed');
            }
        } else {
            if (sizeDisplay) sizeDisplay.textContent = window.languageManager.getTranslation('mixed') || 'Mixed';
            if (sizeSlider) {
                sizeSlider.classList.add('mixed');
            }
        }
        
        // 重要：不修改 this.currentSugarConfig！
        // 多选时不应该影响添加新糖的参数
    },
    
    // 清除UI选择状态（不触发其他更新）

    clearUISelections() {
        document.querySelectorAll('.shape-main-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.shape-dropdown-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.color-btn-compact').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.snfg-btn, .preset-item').forEach(btn => btn.classList.remove('active'));
        
        // 清除新形状选择器的选择状态
        document.querySelectorAll('.shape-category').forEach(cat => cat.classList.remove('active'));
        document.querySelectorAll('.shape-main-btn').forEach(btn => btn.classList.remove('active'));
        
        const sizeDisplay = document.getElementById('sugarSizeDisplay');
        if (sizeDisplay) sizeDisplay.textContent = '20';
        
        const sizeSlider = document.getElementById('sugarSize');
        if (sizeSlider) sizeSlider.value = '20';
    },
    

    updateUIForSelectedSugar(sugar) {
        // 保持向后兼容性，但使用新的统一方法
        this.updateSelectionUI();
    },
    
};
