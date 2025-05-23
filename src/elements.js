import rough from 'roughjs';
import { getStroke } from 'perfect-freehand';

// New function to regenerate cached drawable for an element
export function regenerateElementDrawable(element, roughGenerator) {
  if (!roughGenerator) return;
  
  switch (element.type) {
    case 'rectangle':
      element.cachedDrawable = roughGenerator.rectangle(
        element.x,
        element.y,
        element.width,
        element.height,
        {
          stroke: element.strokeColor,
          strokeWidth: element.strokeWidth,
          fill: element.backgroundColor !== 'transparent' ? element.backgroundColor : undefined,
          fillStyle: element.fillStyle,
          roughness: element.roughness,
          seed: element.seed
        }
      );
      break;
      
    case 'diamond':
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      element.cachedDrawable = roughGenerator.polygon([
        [cx, element.y],
        [element.x + element.width, cy],
        [cx, element.y + element.height],
        [element.x, cy]
      ], {
        stroke: element.strokeColor,
        strokeWidth: element.strokeWidth,
        fill: element.backgroundColor !== 'transparent' ? element.backgroundColor : undefined,
        fillStyle: element.fillStyle,
        roughness: element.roughness,
        seed: element.seed
      });
      break;
      
    case 'ellipse':
      element.cachedDrawable = roughGenerator.ellipse(
        element.x + element.width / 2,
        element.y + element.height / 2,
        element.width,
        element.height,
        {
          stroke: element.strokeColor,
          strokeWidth: element.strokeWidth,
          fill: element.backgroundColor !== 'transparent' ? element.backgroundColor : undefined,
          fillStyle: element.fillStyle,
          roughness: element.roughness,
          seed: element.seed
        }
      );
      break;
      
    case 'arrow':
    case 'line':
      const points = element.points.map(point => [element.x + point[0], element.y + point[1]]);
      
      element.cachedDrawable = roughGenerator.linearPath(points, {
        stroke: element.strokeColor,
        strokeWidth: element.strokeWidth,
        roughness: element.roughness,
        seed: element.seed
      });
      
      // For arrows, also cache the arrowhead
      if (element.type === 'arrow') {
        const lastPoint = points[points.length - 1];
        const prevPoint = points[points.length - 2] || points[0];
        
        const angle = Math.atan2(lastPoint[1] - prevPoint[1], lastPoint[0] - prevPoint[0]);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        const x1 = lastPoint[0] - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = lastPoint[1] - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = lastPoint[0] - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = lastPoint[1] - arrowLength * Math.sin(angle + arrowAngle);
        
        element.cachedArrowhead = roughGenerator.linearPath([
          [x1, y1],
          [lastPoint[0], lastPoint[1]],
          [x2, y2]
        ], {
          stroke: element.strokeColor,
          strokeWidth: element.strokeWidth,
          roughness: element.roughness,
          seed: element.seed
        });
      }
      break;
      
    case 'frame':
      element.cachedDrawable = roughGenerator.rectangle(
        element.x,
        element.y,
        element.width,
        element.height,
        {
          stroke: element.strokeColor,
          strokeWidth: element.strokeWidth,
          roughness: 0
        }
      );
      break;
      
    case 'image':
      // Image placeholder
      if (element.status === 'placeholder') {
        element.cachedDrawable = roughGenerator.rectangle(
          element.x,
          element.y,
          element.width,
          element.height,
          {
            stroke: element.strokeColor,
            strokeWidth: 1,
            fill: '#f0f0f0',
            fillStyle: 'solid',
            roughness: 0
          }
        );
      }
      break;
  }
}

export function createElement(id, x1, y1, x2, y2, type, options = {}, roughGenerator = null) {
  const { strokeColor = '#1e1e1e', fillColor = 'transparent', fillStyle = 'hachure', strokeWidth = 2 } = options;
  
  let element;
  
  switch (type) {
    case 'rectangle':
      const width = x2 - x1;
      const height = y2 - y1;
      element = {
        id,
        type,
        x: x1,
        y: y1,
        width,
        height,
        strokeColor,
        backgroundColor: fillColor,
        strokeWidth,
        roughness: 1,
        fillStyle: fillColor === 'transparent' ? fillStyle : 'solid',
        strokeStyle: 'solid',
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000)
      };
      break;
      
    case 'diamond':
      element = {
        id,
        type,
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        strokeColor,
        backgroundColor: fillColor,
        strokeWidth,
        roughness: 1,
        fillStyle: fillColor === 'transparent' ? fillStyle : 'solid',
        strokeStyle: 'solid',
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000)
      };
      break;
      
    case 'ellipse':
      element = {
        id,
        type,
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        strokeColor,
        backgroundColor: fillColor,
        strokeWidth,
        roughness: 1,
        fillStyle: fillColor === 'transparent' ? fillStyle : 'solid',
        strokeStyle: 'solid',
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000)
      };
      break;
      
    case 'arrow':
      element = {
        id,
        type,
        x: x1,
        y: y1,
        points: [[0, 0], [x2 - x1, y2 - y1]],
        strokeColor,
        backgroundColor: 'transparent',
        strokeWidth,
        roughness: 1,
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000),
        endArrowhead: 'arrow'
      };
      break;
      
    case 'line':
      element = {
        id,
        type,
        x: x1,
        y: y1,
        points: [[0, 0], [x2 - x1, y2 - y1]],
        strokeColor,
        backgroundColor: 'transparent',
        strokeWidth,
        roughness: 1,
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000)
      };
      break;
      
    case 'text':
      element = {
        id,
        type,
        x: x1,
        y: y1,
        width: 100,
        height: 24,
        text: 'Double click to edit',
        fontSize: 20,
        fontFamily: 1,
        textAlign: 'left',
        verticalAlign: 'top',
        strokeColor,
        backgroundColor: 'transparent',
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000)
      };
      break;
      
    case 'freedraw':
      element = {
        id,
        type,
        x: x1,
        y: y1,
        points: [[0, 0]],
        strokeColor,
        strokeWidth,
        roughness: 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000)
      };
      break;
      
    case 'image':
      element = {
        id,
        type,
        x: x1,
        y: y1,
        width: 200,
        height: 150,
        strokeColor,
        backgroundColor: 'transparent',
        strokeWidth,
        roughness: 0,
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000),
        status: 'placeholder',
        fileId: null
      };
      break;
      
    case 'frame':
      element = {
        id,
        type,
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        strokeColor,
        backgroundColor: '#ffffff',
        strokeWidth,
        roughness: 0,
        fillStyle: 'solid',
        strokeStyle: 'solid',
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000)
      };
      break;
      
    default:
      throw new Error(`Type not recognized: ${type}`);
  }
  
  // Regenerate cached drawable for the element
  regenerateElementDrawable(element, roughGenerator);
  
  return element;
}

export function updateElement(index, elements, x2, y2, roughGenerator = null) {
  const element = elements[index];
  
  if (!element) return;
  
  switch (element.type) {
    case 'rectangle':
    case 'ellipse':
    case 'diamond':
    case 'frame':
      element.width = x2 - element.x;
      element.height = y2 - element.y;
      // Regenerate drawable after dimension change
      regenerateElementDrawable(element, roughGenerator);
      break;
      
    case 'arrow':
    case 'line':
      element.points[1] = [x2 - element.x, y2 - element.y];
      // Regenerate drawable after points change
      regenerateElementDrawable(element, roughGenerator);
      break;
      
    case 'freedraw':
      element.points.push([x2 - element.x, y2 - element.y]);
      break;
      
    case 'image':
      element.width = Math.max(50, x2 - element.x);
      element.height = Math.max(50, y2 - element.y);
      // Regenerate drawable after dimension change
      regenerateElementDrawable(element, roughGenerator);
      break;
      
    default:
      break;
  }
}

// Updated to accept roughGenerator as a parameter
export function drawElement(roughCanvas, context, element, isSelected = false, roughGenerator = null) {
  context.globalAlpha = element.opacity / 100;
  
  switch (element.type) {
    case 'rectangle':
      // Use cached drawable if available, otherwise generate it
      if (element.cachedDrawable) {
        roughCanvas.draw(element.cachedDrawable);
      } else {
        // Fallback: generate on the fly if cache is missing
        regenerateElementDrawable(element, roughGenerator);
        if (element.cachedDrawable) {
          roughCanvas.draw(element.cachedDrawable);
        }
      }
      break;
      
    case 'diamond':
      if (element.cachedDrawable) {
        roughCanvas.draw(element.cachedDrawable);
      } else {
        regenerateElementDrawable(element, roughGenerator);
        if (element.cachedDrawable) {
          roughCanvas.draw(element.cachedDrawable);
        }
      }
      break;
      
    case 'ellipse':
      if (element.cachedDrawable) {
        roughCanvas.draw(element.cachedDrawable);
      } else {
        regenerateElementDrawable(element, roughGenerator);
        if (element.cachedDrawable) {
          roughCanvas.draw(element.cachedDrawable);
        }
      }
      break;
      
    case 'arrow':
      // Draw the line
      if (element.cachedDrawable) {
        roughCanvas.draw(element.cachedDrawable);
      } else {
        regenerateElementDrawable(element, roughGenerator);
        if (element.cachedDrawable) {
          roughCanvas.draw(element.cachedDrawable);
        }
      }
      
      // Draw the arrowhead
      if (element.cachedArrowhead) {
        roughCanvas.draw(element.cachedArrowhead);
      }
      break;
      
    case 'line':
      if (element.cachedDrawable) {
        roughCanvas.draw(element.cachedDrawable);
      } else {
        regenerateElementDrawable(element, roughGenerator);
        if (element.cachedDrawable) {
          roughCanvas.draw(element.cachedDrawable);
        }
      }
      break;
      
    case 'text':
      context.font = `${element.fontSize}px ${getFontFamily(element.fontFamily)}`;
      context.fillStyle = element.strokeColor;
      context.textAlign = element.textAlign;
      context.textBaseline = 'top';
      
      const lines = element.text.split('\n');
      const lineHeight = element.fontSize * 1.2;
      
      lines.forEach((line, index) => {
        context.fillText(line, element.x, element.y + index * lineHeight);
      });
      break;
      
    case 'freedraw':
      const points2 = element.points.map(point => [element.x + point[0], element.y + point[1]]);
      
      if (points2.length < 2) {
        // Draw a dot if there's only one point
        context.beginPath();
        context.arc(points2[0][0], points2[0][1], element.strokeWidth / 2, 0, 2 * Math.PI);
        context.fillStyle = element.strokeColor;
        context.fill();
      } else {
        // Use perfect-freehand for smooth curves
        const stroke = getStroke(points2, {
          size: element.strokeWidth,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
          easing: (t) => t,
          simulatePressure: false
        });
        
        if (stroke.length > 0) {
          context.fillStyle = element.strokeColor;
          context.beginPath();
          
          const [firstX, firstY] = stroke[0];
          context.moveTo(firstX, firstY);
          
          for (let i = 1; i < stroke.length; i++) {
            const [x, y] = stroke[i];
            context.lineTo(x, y);
          }
          
          context.closePath();
          context.fill();
        }
      }
      break;
      
    case 'image':
      // Draw placeholder or image
      if (element.status === 'placeholder') {
        if (element.cachedDrawable) {
          roughCanvas.draw(element.cachedDrawable);
        } else {
          regenerateElementDrawable(element, roughGenerator);
          if (element.cachedDrawable) {
            roughCanvas.draw(element.cachedDrawable);
          }
        }
        
        // Draw placeholder icon
        context.fillStyle = '#aaaaaa';
        context.font = '24px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('📷', element.x + element.width / 2, element.y + element.height / 2);
      } else if (element.fileId) {
        // In a real implementation, you would load and draw the actual image here
        // For now, we'll just draw a placeholder
        context.fillStyle = '#f0f0f0';
        context.fillRect(element.x, element.y, element.width, element.height);
        context.strokeStyle = element.strokeColor;
        context.strokeRect(element.x, element.y, element.width, element.height);
      }
      break;
      
    case 'frame':
      // Draw frame with solid background
      context.fillStyle = element.backgroundColor || '#ffffff';
      context.fillRect(element.x, element.y, element.width, element.height);
      
      // Draw frame border
      if (element.cachedDrawable) {
        roughCanvas.draw(element.cachedDrawable);
      } else {
        regenerateElementDrawable(element, roughGenerator);
        if (element.cachedDrawable) {
          roughCanvas.draw(element.cachedDrawable);
        }
      }
      break;
      
    default:
      break;
  }
  
  context.globalAlpha = 1;
  
  // Draw selection outline
  if (isSelected) {
    context.strokeStyle = '#3b82f6';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    
    if (element.type === 'rectangle' || element.type === 'text' || element.type === 'image' || element.type === 'frame') {
      context.strokeRect(
        element.x - 2,
        element.y - 2,
        element.width + 4,
        element.height + 4
      );
    } else if (element.type === 'diamond') {
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      
      context.beginPath();
      context.moveTo(cx, element.y - 2);
      context.lineTo(element.x + element.width + 2, cy);
      context.lineTo(cx, element.y + element.height + 2);
      context.lineTo(element.x - 2, cy);
      context.closePath();
      context.stroke();
    } else if (element.type === 'ellipse') {
      context.beginPath();
      context.ellipse(
        element.x + element.width / 2,
        element.y + element.height / 2,
        element.width / 2 + 2,
        element.height / 2 + 2,
        0,
        0,
        2 * Math.PI
      );
      context.stroke();
    } else if (element.type === 'arrow' || element.type === 'line') {
      const points = element.points.map(point => [element.x + point[0], element.y + point[1]]);
      context.beginPath();
      context.moveTo(points[0][0], points[0][1]);
      
      for (let i = 1; i < points.length; i++) {
        context.lineTo(points[i][0], points[i][1]);
      }
      
      context.stroke();
    } else if (element.type === 'freedraw') {
      // Draw bounding box for freedraw
      const points = element.points;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      points.forEach(point => {
        minX = Math.min(minX, element.x + point[0]);
        minY = Math.min(minY, element.y + point[1]);
        maxX = Math.max(maxX, element.x + point[0]);
        maxY = Math.max(maxY, element.y + point[1]);
      });
      
      context.strokeRect(
        minX - 4,
        minY - 4,
        maxX - minX + 8,
        maxY - minY + 8
      );
    }
    
    context.setLineDash([]);
  }
}

function getFontFamily(fontFamily) {
  switch (fontFamily) {
    case 1: return 'Arial, sans-serif';
    case 2: return 'Courier New, monospace';
    case 3: return 'Georgia, serif';
    default: return 'Arial, sans-serif';
  }
}
