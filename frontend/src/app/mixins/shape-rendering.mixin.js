// Feature mixin extracted mechanically from js/script.js.

// Original line ranges: 3527, 4063, 4074, 4085, 4122, 4131, 4145, 4160, 4184, 4199, 4214, 4230.
export const shapeRenderingMixin = {
    createSugarShape(x, y, shape, color, size = null, strokeWidth = null, applyRender = true) {
        const actualSize = size !== null ? size : this.sugarRadius;
        // Do not force a default stroke color/width here — let higher-level code
        // (createSugar / applySugarBorderStyle / selection handlers) apply
        // the desired border color and width. Use null to indicate "no override".
        const strokeColor = null;
        const actualStrokeWidth = strokeWidth !== null ? strokeWidth : null;
        
        let element;
        
        switch (shape) {
            case 'circle':
            case 'circle-filled':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                element.setAttribute('cx', x);
                element.setAttribute('cy', y);
                element.setAttribute('r', actualSize);
                break;
                
            case 'circle-flat':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                element.setAttribute('cx', x);
                element.setAttribute('cy', y);
                element.setAttribute('rx', actualSize * 1.4); // 宽度较大
                element.setAttribute('ry', actualSize * 0.7); // 高度较小
                break;
                
            case 'circle-narrow':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                element.setAttribute('cx', x);
                element.setAttribute('cy', y);
                element.setAttribute('rx', actualSize * 0.7); // 宽度较小
                element.setAttribute('ry', actualSize * 1.4); // 高度较大
                break;
                

            case 'square':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', x - actualSize);
                element.setAttribute('y', y - actualSize);
                element.setAttribute('width', actualSize * 2);
                element.setAttribute('height', actualSize * 2);
                break;

            case 'square-flat':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', x - actualSize);
                element.setAttribute('y', y - actualSize * 0.7);
                element.setAttribute('width', actualSize * 2);
                element.setAttribute('height', actualSize * 1.4);
                break;

            case 'square-narrow':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                element.setAttribute('x', x - actualSize * 0.7);
                element.setAttribute('y', y - actualSize);
                element.setAttribute('width', actualSize * 1.4);
                element.setAttribute('height', actualSize * 2);
                break;

            case 'square-divided':
                // 分割正方形，左下白色，右上用户色，左上到右下对角线分割
                const dividedSquareGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                const squareDividedElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                // 四个顶点
                const p1 = {x: x - actualSize, y: y - actualSize}; // 左上
                const p2 = {x: x + actualSize, y: y - actualSize}; // 右上
                const p3 = {x: x + actualSize, y: y + actualSize}; // 右下
                const p4 = {x: x - actualSize, y: y + actualSize}; // 左下
                // points字符串
                const squarePoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
                squareDividedElement.setAttribute('points', squarePoints);

                // 渐变ID
                const gradientSquareId = `square-divided-gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                // 渐变定义
                const defsSquare = this.canvas.querySelector('defs') || this.canvas.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
                const gradientSquare = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradientSquare.id = gradientSquareId;
                // 沿对角线分割，使用45度渐变
                gradientSquare.setAttribute('x1', '0%');
                gradientSquare.setAttribute('y1', '100%');
                gradientSquare.setAttribute('x2', '100%');
                gradientSquare.setAttribute('y2', '0%');
                // 左下部分白色，右上部分用户色
                const stopDiv1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopDiv1.setAttribute('offset', '50%');
                stopDiv1.setAttribute('stop-color', 'white');
                stopDiv1.setAttribute('stop-opacity', '1');
                const stopDiv2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopDiv2.setAttribute('offset', '50%');
                stopDiv2.setAttribute('stop-color', color || '#0072BC');
                stopDiv2.setAttribute('stop-opacity', '1');
                gradientSquare.appendChild(stopDiv1);
                gradientSquare.appendChild(stopDiv2);
                defsSquare.appendChild(gradientSquare);
                squareDividedElement.setAttribute('fill', `url(#${gradientSquareId})`);
                if (strokeColor) squareDividedElement.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) squareDividedElement.setAttribute('stroke-width', actualStrokeWidth);

                // 分割线（左上到右下）
                const dividingLineSquare = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                dividingLineSquare.setAttribute('x1', p1.x);
                dividingLineSquare.setAttribute('y1', p1.y);
                dividingLineSquare.setAttribute('x2', p3.x);
                dividingLineSquare.setAttribute('y2', p3.y);
                if (strokeColor) dividingLineSquare.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) dividingLineSquare.setAttribute('stroke-width', actualStrokeWidth);
                dividingLineSquare.classList.add('dividing-line');

                dividedSquareGroup.appendChild(squareDividedElement);
                dividedSquareGroup.appendChild(dividingLineSquare);
                dividedSquareGroup.setAttribute('data-gradient-id', gradientSquareId);
                dividedSquareGroup.classList.add('square-divided-group');
                element = dividedSquareGroup;
                break;
                
            case 'triangle':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const triPoints = this.generatePolygonPoints(x, y, actualSize, 3, -Math.PI/2);
                element.setAttribute('points', triPoints);
                break;
                
            case 'triangle-inverted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const invertedTriPoints = this.generatePolygonPoints(x, y, actualSize, 3, Math.PI/2);
                element.setAttribute('points', invertedTriPoints);
                break;
                
            case 'triangle-divided':
                // 使用组合方式：多边形 + 渐变 + 分割线
                const dividedGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // 主三角形多边形
                const triangleElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const dividedTriPoints = this.generatePolygonPoints(x, y, actualSize, 3, -Math.PI/2);
                triangleElement.setAttribute('points', dividedTriPoints);
                
                // 创建唯一的渐变ID
                const gradientId = `triangle-divided-gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // 创建渐变定义
                const defs = this.canvas.querySelector('defs') || this.canvas.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
                const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradient.id = gradientId;
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '100%');
                gradient.setAttribute('y2', '0%');
                
                // 左半部分：白色
                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '50%');
                stop1.setAttribute('stop-color', 'white');
                stop1.setAttribute('stop-opacity', '1');
                
                // 右半部分：用户颜色 - 确保颜色正确传递
                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '50%');
                stop2.setAttribute('stop-color', color || '#4CAF50'); // 使用更明显的默认颜色进行调试
                stop2.setAttribute('stop-opacity', '1');
                
                gradient.appendChild(stop1);
                gradient.appendChild(stop2);
                defs.appendChild(gradient);
                
                // 应用渐变到三角形
                triangleElement.setAttribute('fill', `url(#${gradientId})`);
                if (strokeColor) triangleElement.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) triangleElement.setAttribute('stroke-width', actualStrokeWidth);
                
                // 计算分割线坐标（从顶点到底边中点）
                const vertices = this.parsePolygonPoints(dividedTriPoints);
                if (vertices.length >= 3) {
                    // 顶点（第一个点）
                    const topVertex = vertices[0];
                    // 底边中点（第二个和第三个点的中点）
                    const bottomMidX = (vertices[1].x + vertices[2].x) / 2;
                    const bottomMidY = (vertices[1].y + vertices[2].y) / 2;
                    
                    // 创建分割线
                    const dividingLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    dividingLine.setAttribute('x1', topVertex.x);
                    dividingLine.setAttribute('y1', topVertex.y);
                    dividingLine.setAttribute('x2', bottomMidX);
                    dividingLine.setAttribute('y2', bottomMidY);
                    if (strokeColor) dividingLine.setAttribute('stroke', strokeColor);
                    if (actualStrokeWidth) dividingLine.setAttribute('stroke-width', actualStrokeWidth);
                    dividingLine.classList.add('dividing-line');
                    
                    dividedGroup.appendChild(triangleElement);
                    dividedGroup.appendChild(dividingLine);
                } else {
                    // 如果解析失败，只添加三角形
                    dividedGroup.appendChild(triangleElement);
                }
                
                // 存储渐变信息用于后续颜色更新
                dividedGroup.setAttribute('data-gradient-id', gradientId);
                dividedGroup.classList.add('triangle-divided-group');
                element = dividedGroup;
                break;
                
            case 'diamond':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                element.setAttribute('points', diamondPoints);
                break;
                
            case 'diamond-flat':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondFlatPoints = `${x},${y-actualSize*0.7} ${x+actualSize*1.4},${y} ${x},${y+actualSize*0.7} ${x-actualSize*1.4},${y}`;
                element.setAttribute('points', diamondFlatPoints);
                break;
                
            case 'diamond-narrow':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondNarrowPoints = `${x},${y-actualSize*1.4} ${x+actualSize*0.7},${y} ${x},${y+actualSize*1.4} ${x-actualSize*0.7},${y}`;
                element.setAttribute('points', diamondNarrowPoints);
                break;
                
            case 'diamond-divided-top':
                // 分割菱形：上半部分用户颜色，下半部分白色（GlcA标准）
                const dividedTopGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // 主菱形
                const diamondTopElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondTopPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                diamondTopElement.setAttribute('points', diamondTopPoints);
                
                // 创建唯一的渐变ID
                const gradientTopId = `diamond-divided-top-gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // 创建渐变定义
                const defsTop = this.canvas.querySelector('defs') || this.canvas.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
                const gradientTop = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradientTop.id = gradientTopId;
                gradientTop.setAttribute('x1', '0%');
                gradientTop.setAttribute('y1', '0%');
                gradientTop.setAttribute('x2', '0%');
                gradientTop.setAttribute('y2', '100%');
                
                // 上半部分：用户颜色
                const stopTop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopTop1.setAttribute('offset', '50%');
                stopTop1.setAttribute('stop-color', color || '#0072BC');
                stopTop1.setAttribute('stop-opacity', '1');
                
                // 下半部分：白色
                const stopTop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopTop2.setAttribute('offset', '50%');
                stopTop2.setAttribute('stop-color', 'white');
                stopTop2.setAttribute('stop-opacity', '1');
                
                gradientTop.appendChild(stopTop1);
                gradientTop.appendChild(stopTop2);
                defsTop.appendChild(gradientTop);
                
                // 应用渐变
                diamondTopElement.setAttribute('fill', `url(#${gradientTopId})`);
                if (strokeColor) diamondTopElement.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) diamondTopElement.setAttribute('stroke-width', actualStrokeWidth);
                
                // 创建水平分割线
                const dividingLineTop = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                dividingLineTop.setAttribute('x1', x - actualSize);
                dividingLineTop.setAttribute('y1', y);
                dividingLineTop.setAttribute('x2', x + actualSize);
                dividingLineTop.setAttribute('y2', y);
                if (strokeColor) dividingLineTop.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) dividingLineTop.setAttribute('stroke-width', actualStrokeWidth);
                dividingLineTop.classList.add('dividing-line');
                
                dividedTopGroup.appendChild(diamondTopElement);
                dividedTopGroup.appendChild(dividingLineTop);
                
                // 存储渐变信息
                dividedTopGroup.setAttribute('data-gradient-id', gradientTopId);
                dividedTopGroup.classList.add('diamond-divided-top-group');
                element = dividedTopGroup;
                break;
                
            case 'diamond-divided-bottom':
                // 分割菱形：下半部分用户颜色，上半部分白色
                const dividedBottomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                // 主菱形
                const diamondBottomElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const diamondBottomPoints = `${x},${y-actualSize} ${x+actualSize},${y} ${x},${y+actualSize} ${x-actualSize},${y}`;
                diamondBottomElement.setAttribute('points', diamondBottomPoints);
                
                // 创建唯一的渐变ID
                const gradientBottomId = `diamond-divided-bottom-gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // 创建渐变定义
                const defsBottom = this.canvas.querySelector('defs') || this.canvas.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
                const gradientBottom = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradientBottom.id = gradientBottomId;
                gradientBottom.setAttribute('x1', '0%');
                gradientBottom.setAttribute('y1', '0%');
                gradientBottom.setAttribute('x2', '0%');
                gradientBottom.setAttribute('y2', '100%');
                
                // 上半部分：白色
                const stopBottom1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopBottom1.setAttribute('offset', '50%');
                stopBottom1.setAttribute('stop-color', 'white');
                stopBottom1.setAttribute('stop-opacity', '1');
                
                // 下半部分：用户颜色
                const stopBottom2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopBottom2.setAttribute('offset', '50%');
                stopBottom2.setAttribute('stop-color', color || '#0072BC');
                stopBottom2.setAttribute('stop-opacity', '1');
                
                gradientBottom.appendChild(stopBottom1);
                gradientBottom.appendChild(stopBottom2);
                defsBottom.appendChild(gradientBottom);
                
                // 应用渐变
                diamondBottomElement.setAttribute('fill', `url(#${gradientBottomId})`);
                if (strokeColor) diamondBottomElement.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) diamondBottomElement.setAttribute('stroke-width', actualStrokeWidth);
                
                // 创建水平分割线
                const dividingLineBottom = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                dividingLineBottom.setAttribute('x1', x - actualSize);
                dividingLineBottom.setAttribute('y1', y);
                dividingLineBottom.setAttribute('x2', x + actualSize);
                dividingLineBottom.setAttribute('y2', y);
                if (strokeColor) dividingLineBottom.setAttribute('stroke', strokeColor);
                if (actualStrokeWidth) dividingLineBottom.setAttribute('stroke-width', actualStrokeWidth);
                dividingLineBottom.classList.add('dividing-line');
                
                dividedBottomGroup.appendChild(diamondBottomElement);
                dividedBottomGroup.appendChild(dividingLineBottom);
                
                // 存储渐变信息
                dividedBottomGroup.setAttribute('data-gradient-id', gradientBottomId);
                dividedBottomGroup.classList.add('diamond-divided-bottom-group');
                element = dividedBottomGroup;
                break;
                
            case 'star':
            case 'star-5':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const starPoints = this.generateStarPoints(x, y, actualSize, 5, 0);
                element.setAttribute('points', starPoints);
                break;
                
            case 'star-5-inverted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const starInvertedPoints = this.generateStarPoints(x, y, actualSize, 5, Math.PI);
                element.setAttribute('points', starInvertedPoints);
                break;
                
            case 'star-4':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const star4Points = this.generateStarPoints(x, y, actualSize, 4, 0);
                element.setAttribute('points', star4Points);
                break;
                
            case 'star-4-tilted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const star4TiltedPoints = this.generateStarPoints(x, y, actualSize, 4, Math.PI/4);
                element.setAttribute('points', star4TiltedPoints);
                break;
                
            case 'star-6':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const star6Points = this.generateStarPoints(x, y, actualSize, 6, 0);
                element.setAttribute('points', star6Points);
                break;
                
            case 'star-6-tilted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const star6TiltedPoints = this.generateStarPoints(x, y, actualSize, 6, Math.PI/6);
                element.setAttribute('points', star6TiltedPoints);
                break;
                
            case 'hexagon':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const hexPoints = this.generatePolygonPoints(x, y, actualSize, 6, 0);
                element.setAttribute('points', hexPoints);
                break;
                
            case 'flat-hexagon':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const flatHexPoints = this.generatePolygonPoints(x, y, actualSize, 6, Math.PI/6);
                element.setAttribute('points', flatHexPoints);
                break;
                
            case 'hexagon-compressed':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const compressedHexPoints = this.generateCompressedPolygonPoints(x, y, actualSize, 6, 0, 0.7);
                element.setAttribute('points', compressedHexPoints);
                break;
                
            case 'flat-hexagon-compressed':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const compressedFlatHexPoints = this.generateCompressedPolygonPoints(x, y, actualSize, 6, Math.PI/6, 0.7);
                element.setAttribute('points', compressedFlatHexPoints);
                break;
                
            case 'flat-diamond':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const flatDiamondPoints = `${x-actualSize*0.7},${y} ${x},${y-actualSize*0.7} ${x+actualSize*0.7},${y} ${x},${y+actualSize*0.7}`;
                element.setAttribute('points', flatDiamondPoints);
                break;
                
            case 'pentagon':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const pentPoints = this.generatePolygonPoints(x, y, actualSize, 5, -Math.PI/2);
                element.setAttribute('points', pentPoints);
                break;
                
            case 'pentagon-inverted':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const pentInvertedPoints = this.generatePolygonPoints(x, y, actualSize, 5, Math.PI/2);
                element.setAttribute('points', pentInvertedPoints);
                break;
                
            case 'freeend-asterisk':
                // Asterisk shape for free end - path-based line shape
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createAsteriskPath(x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.classList.add('freeend-asterisk');
                element.setAttribute('data-exclude-export', 'true'); // Mark for exclusion from export
                break;
                
            case 'freeend-wave':
                // Wave line for peptide/protein - stored as data, rendered dynamically
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('data-x', x);
                element.setAttribute('data-y', y);
                element.setAttribute('data-size', actualSize);
                this.updateWavePath(element, x, y, actualSize);
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-linecap', 'round');
                element.classList.add('freeend-wave');
                break;
                
            // Bracket shapes (path-based)
            case 'bracket-left':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createBracketPath('left', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.setAttribute('stroke-linejoin', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'bracket-right':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createBracketPath('right', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.setAttribute('stroke-linejoin', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'paren-left':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createParenPath('left', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'paren-right':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createParenPath('right', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'brace-left':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createBracePath('left', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.setAttribute('stroke-linejoin', 'round');
                element.classList.add('bracket-shape');
                break;
                
            case 'brace-right':
                element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                element.setAttribute('d', this.createBracePath('right', x, y, actualSize));
                element.setAttribute('fill', 'none');
                element.setAttribute('stroke-width', actualSize * 0.15);
                element.setAttribute('stroke-linecap', 'round');
                element.setAttribute('stroke-linejoin', 'round');
                element.classList.add('bracket-shape');
                break;
                
            default:
                return this.createSugarShape(x, y, 'circle', color);
        }
        
        // Set fill and stroke
        if (shape === 'triangle-divided' || shape === 'diamond-divided-top' || shape === 'diamond-divided-bottom') {
            // 分割形状的特殊处理已经在case中完成（渐变填充和分割线）
            // 组级别不需要额外的填充和描边设置
        } else if (shape === 'freeend-asterisk') {
            // Asterisk text - use color for fill
            element.setAttribute('fill', color);
        } else if (shape === 'freeend-wave') {
            // Wave line - use color for stroke, preserve stroke-width from attributes
            element.setAttribute('stroke', color);
            if (!element.getAttribute('stroke-width')) {
                element.setAttribute('stroke-width', actualStrokeWidth);
            }
        } else if (shape === 'bracket-left' || shape === 'bracket-right' || 
                   shape === 'paren-left' || shape === 'paren-right' ||
                   shape === 'brace-left' || shape === 'brace-right') {
            // Bracket and parenthesis path shapes - use color for stroke
            element.setAttribute('stroke', color);
            element.setAttribute('stroke-width', actualStrokeWidth);
        } else {
            element.setAttribute('fill', color);
            element.setAttribute('stroke', strokeColor);
            element.setAttribute('stroke-width', actualStrokeWidth);
        }

        if (applyRender) {
            this.applyRenderPreset(element, shape, color);
        }
        
        return element;
    },

    applyRenderPreset(element, shape, color, preset = this.currentSugarConfig?.renderPreset || "flat") {
        const isDivided = element.hasAttribute("data-gradient-id")
            || (element.classList && (
                element.classList.contains("triangle-divided-group")
                || element.classList.contains("square-divided-group")
                || element.classList.contains("diamond-divided-top-group")
                || element.classList.contains("diamond-divided-bottom-group")
            ));

        if (isDivided) {
            element.setAttribute("data-render-preset", preset);
            this.applyDividedRenderInPlace(element, preset, color);
            return element;
        }

        const currentFill = element.getAttribute("fill");
        if (!currentFill || currentFill === "none") {
            return element;
        }

        if (preset === "flat") {
            element.setAttribute("fill", color);
            element.style.setProperty("fill", color, "important");
            return element;
        }

        const gradientId = `render-${preset}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const defs = this.canvas.querySelector("defs") || this.canvas.appendChild(
            document.createElementNS("http://www.w3.org/2000/svg", "defs"),
        );
        const gradient = document.createElementNS(
            "http://www.w3.org/2000/svg",
            preset === "soft" ? "radialGradient" : "linearGradient",
        );
        gradient.id = gradientId;

        if (preset === "soft") {
            gradient.setAttribute("cx", "35%");
            gradient.setAttribute("cy", "30%");
            gradient.setAttribute("r", "70%");
        } else {
            gradient.setAttribute("x1", "0%");
            gradient.setAttribute("y1", "0%");
            gradient.setAttribute("x2", "0%");
            gradient.setAttribute("y2", "100%");
        }

        const light = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        light.setAttribute("offset", "0%");
        light.setAttribute("stop-color", this.lightenHex(color, 140));
        const base = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        base.setAttribute("offset", "100%");
        base.setAttribute("stop-color", color);

        gradient.appendChild(light);
        gradient.appendChild(base);
        defs.appendChild(gradient);
        const fillUrl = `url(#${gradientId})`;
        element.setAttribute("fill", fillUrl);
        element.style.setProperty("fill", fillUrl, "important");
        return element;
    },

    lightenHex(color, amount) {
        const normalized = this.normalizeColorToHex(color);
        const hex = normalized.replace("#", "");
        const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + amount);
        const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount);
        return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    },

    applyDividedRenderInPlace(element, preset, color) {
        element.querySelectorAll(".render-overlay").forEach((overlay) => overlay.remove());
        const gradientId = element.getAttribute("data-gradient-id");
        if (!gradientId) return;

        const gradient = document.getElementById(gradientId);
        if (!gradient) return;

        gradient.querySelectorAll(".render-light").forEach((stop) => stop.remove());
        const stops = Array.from(gradient.querySelectorAll("stop"));
        const baseColor = this.normalizeColorToHex(color);
        let firstColoredIndex = -1;
        stops.forEach((stop, index) => {
            if (this.normalizeColorToHex(stop.getAttribute("stop-color")) !== "#FFFFFF") {
                stop.setAttribute("stop-color", baseColor);
                if (firstColoredIndex === -1) firstColoredIndex = index;
            }
        });

        if (preset === "flat") {
            return;
        }

        const light = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        light.classList.add("render-light");
        const lightAmount = preset === "soft" ? 45 : 120;
        const lightOffset = preset === "soft"
            ? (firstColoredIndex === 0 ? "25%" : "75%")
            : (firstColoredIndex === 0 ? "0%" : "100%");
        light.setAttribute("offset", lightOffset);
        light.setAttribute("stop-color", this.lightenHex(color, lightAmount));
        if (firstColoredIndex === 0) {
            gradient.insertBefore(light, stops[0]);
        } else {
            gradient.appendChild(light);
        }
    },

    getDividedColoredPoints(element, points) {
        if (points.length < 3) return null;
        const midpoint = (a, b) => ({
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
        });

        if (element.classList.contains("diamond-divided-top-group")) {
            return [points[0], points[1], points[3]];
        }
        if (element.classList.contains("diamond-divided-bottom-group")) {
            return [points[2], points[1], points[3]];
        }
        if (element.classList.contains("triangle-divided-group")) {
            return [points[0], midpoint(points[1], points[2]), points[2]];
        }
        if (element.classList.contains("square-divided-group")) {
            return [points[0], points[1], points[2]];
        }
        return null;
    },

    insetPoints(points, amount) {
        if (!points.length) return points;
        const cx = points.reduce((sum, point) => sum + point.x, 0) / points.length;
        const cy = points.reduce((sum, point) => sum + point.y, 0) / points.length;
        return points.map((point) => {
            const dx = point.x - cx;
            const dy = point.y - cy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) return { ...point };
            const factor = (distance - amount) / distance;
            return {
                x: cx + dx * factor,
                y: cy + dy * factor,
            };
        });
    },

    formatPoints(points) {
        return points.map((point) => `${point.x},${point.y}`).join(" ");
    },
    

    generatePolygonPoints(centerX, centerY, radius, sides, rotation = 0) {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (2 * Math.PI * i / sides) + rotation;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        return points.join(' ');
    },
    

    generateCompressedPolygonPoints(centerX, centerY, radius, sides, rotation = 0, heightScale = 0.7) {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (2 * Math.PI * i / sides) + rotation;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle) * heightScale;
            points.push(`${x},${y}`);
        }
        return points.join(' ');
    },
    

    generateDividedTriangleParts(centerX, centerY, radius, rotation = -Math.PI/2) {
        // 使用与generatePolygonPoints相同的计算方法，确保大小一致
        // 计算三角形的三个顶点（与普通三角形完全相同）
        const vertices = [];
        for (let i = 0; i < 3; i++) {
            const angle = (2 * Math.PI * i / 3) + rotation;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            vertices.push({x, y});
        }
        
        // 顶点、左底角、右底角
        const topVertex = vertices[0];
        const leftBottomVertex = vertices[1];
        const rightBottomVertex = vertices[2];
        
        // 底边中点（垂直分割线的底部点）
        const bottomMidX = (leftBottomVertex.x + rightBottomVertex.x) / 2;
        const bottomMidY = (leftBottomVertex.y + rightBottomVertex.y) / 2;
        
        // 左半部分：顶点 + 左底角 + 底边中点（稳定白色）
        const leftPoints = [
            `${topVertex.x},${topVertex.y}`,
            `${leftBottomVertex.x},${leftBottomVertex.y}`,
            `${bottomMidX},${bottomMidY}`
        ].join(' ');
        
        // 右半部分：顶点 + 底边中点 + 右底角（跟随用户颜色）
        const rightPoints = [
            `${topVertex.x},${topVertex.y}`,
            `${bottomMidX},${bottomMidY}`,
            `${rightBottomVertex.x},${rightBottomVertex.y}`
        ].join(' ');
        
        return {leftPoints, rightPoints};
    },
    

    updateWavePath(element, x, y, size) {
        // Update wave path based on position and size
        const waveWidth = size * 2;
        const waveHeight = size * 0.6;
        const wavePath = `M ${x - waveWidth/2} ${y} Q ${x - waveWidth/4} ${y - waveHeight} ${x} ${y} T ${x + waveWidth/2} ${y}`;
        element.setAttribute('d', wavePath);
    },
    
    // Create square bracket path [ or ]

    createBracketPath(side, x, y, size) {
        const height = size * 2;
        const width = size * 0.5;
        
        if (side === 'left') {
            // Left bracket [
            return `M ${x + width/2} ${y - height/2} L ${x - width/2} ${y - height/2} L ${x - width/2} ${y + height/2} L ${x + width/2} ${y + height/2}`;
        } else {
            // Right bracket ]
            return `M ${x - width/2} ${y - height/2} L ${x + width/2} ${y - height/2} L ${x + width/2} ${y + height/2} L ${x - width/2} ${y + height/2}`;
        }
    },
    
    // Create parenthesis path ( or )

    createParenPath(side, x, y, size) {
        const height = size * 2;
        const width = size * 0.3;  // Reduced from 0.6 to 0.3 (half width)
        const curve = size * 0.4;  // Reduced from 0.8 to 0.4 (half curve)
        
        if (side === 'left') {
            // Left parenthesis (
            return `M ${x + width/2} ${y - height/2} Q ${x - curve} ${y - height/4} ${x - curve} ${y} Q ${x - curve} ${y + height/4} ${x + width/2} ${y + height/2}`;
        } else {
            // Right parenthesis )
            return `M ${x - width/2} ${y - height/2} Q ${x + curve} ${y - height/4} ${x + curve} ${y} Q ${x + curve} ${y + height/4} ${x - width/2} ${y + height/2}`;
        }
    },
    
    // Create curly brace path { or }

    createBracePath(side, x, y, size) {
        const height = size * 2;
        const width = size * 0.25;      // Reduced from 0.5 to 0.25 (half width)
        const curveSize = size * 0.15;  // Reduced from 0.3 to 0.15 (half curve)
        const midPoint = y;
        
        if (side === 'left') {
            // Left brace {
            return `M ${x + width/2} ${y - height/2} 
                    Q ${x - width/2} ${y - height/2 + curveSize} ${x - width/2} ${y - height/4}
                    Q ${x - width/2} ${midPoint - curveSize} ${x - width/2 - curveSize} ${midPoint}
                    Q ${x - width/2} ${midPoint + curveSize} ${x - width/2} ${y + height/4}
                    Q ${x - width/2} ${y + height/2 - curveSize} ${x + width/2} ${y + height/2}`;
        } else {
            // Right brace }
            return `M ${x - width/2} ${y - height/2}
                    Q ${x + width/2} ${y - height/2 + curveSize} ${x + width/2} ${y - height/4}
                    Q ${x + width/2} ${midPoint - curveSize} ${x + width/2 + curveSize} ${midPoint}
                    Q ${x + width/2} ${midPoint + curveSize} ${x + width/2} ${y + height/4}
                    Q ${x + width/2} ${y + height/2 - curveSize} ${x - width/2} ${y + height/2}`;
        }
    },
    
    // Create asterisk path * (6-pointed star for free end)

    createAsteriskPath(x, y, size) {
        const length = size * 1.2; // Length of each ray
        const paths = [];
        
        // Create 6 rays radiating from center at 60-degree intervals
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * i / 3) - Math.PI / 2; // Start from top, 60° apart
            const endX = x + length * Math.cos(angle);
            const endY = y + length * Math.sin(angle);
            paths.push(`M ${x} ${y} L ${endX} ${endY}`);
        }
        
        return paths.join(' ');
    },
    

    parsePolygonPoints(pointsStr) {
        // 解析多边形点字符串，返回坐标数组
        const points = [];
        const coords = pointsStr.trim().split(/\s+/);
        
        for (const coord of coords) {
            const [x, y] = coord.split(',').map(Number);
            if (!isNaN(x) && !isNaN(y)) {
                points.push({x, y});
            }
        }
        
        return points;
    },
    

    generateStarPoints(centerX, centerY, radius, points, rotation = 0) {
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        const pointsArray = [];
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI * i / points) - Math.PI / 2 + rotation;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            pointsArray.push(`${x},${y}`);
        }
        
        return pointsArray.join(' ');
    },
    

    // Deprecated: selectSugar method removed - use selectElement() instead
    
    // Deprecated: selectSugarOnly method removed - use selectElement() instead
    
    // Deprecated: deselectSugar method removed - use deselectElement() instead
    
    // Deprecated: selectText and selectTextOnly methods removed - use selectElement() instead
    
    // Deprecated: deselectText method removed - use deselectElement() instead
    
};
