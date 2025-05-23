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
        endArrowhead: 'arrow',
        // Connection properties
        startBinding: null, // { elementId, focus, gap }
        endBinding: null    // { elementId, focus, gap }
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
        seed: Math.floor(Math.random() * 2000000000),
        // Connection properties
        startBinding: null, // { elementId, focus, gap }
        endBinding: null    // { elementId, focus, gap }
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
  const fonts = {
    1: 'Cascadia, Segoe UI',
    2: 'Courier New, monospace',
    3: 'Georgia, serif',
    4: 'Arial, sans-serif'
  };
  return fonts[fontFamily] || fonts[1];
}

// Connection utility functions for smart arrows
export function getConnectionPoint(element, focus) {
  // focus is a point from 0-1 representing position on element perimeter
  // For rectangles: 0=top-left corner, 0.25=top-right, 0.5=bottom-right, 0.75=bottom-left
  const { x, y, width, height, type } = element;
  
  if (type === 'rectangle' || type === 'frame' || type === 'text' || type === 'image') {
    const perimeter = 2 * (Math.abs(width) + Math.abs(height));
    const distance = focus * perimeter;
    
    const w = Math.abs(width);
    const h = Math.abs(height);
    
    // Determine which side of rectangle
    if (distance <= w) {
      // Top edge
      return { x: x + distance, y: y };
    } else if (distance <= w + h) {
      // Right edge
      return { x: x + width, y: y + (distance - w) };
    } else if (distance <= 2 * w + h) {
      // Bottom edge
      return { x: x + width - (distance - w - h), y: y + height };
    } else {
      // Left edge
      return { x: x, y: y + height - (distance - 2 * w - h) };
    }
  } else if (type === 'ellipse') {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const angle = focus * 2 * Math.PI;
    const radiusX = Math.abs(width) / 2;
    const radiusY = Math.abs(height) / 2;
    
    return {
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle)
    };
  } else if (type === 'diamond') {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const angle = focus * 2 * Math.PI;
    
    // Approximate diamond as rotated square
    const size = Math.min(Math.abs(width), Math.abs(height)) / 2;
    const cos45 = Math.cos(Math.PI / 4);
    
    return {
      x: centerX + size * cos45 * Math.cos(angle),
      y: centerY + size * cos45 * Math.sin(angle)
    };
  }
  
  // Fallback to center
  return { x: x + width / 2, y: y + height / 2 };
}

export function getNearestConnectionPoint(element, point) {
  // Find the nearest connection point on an element's perimeter
  const { x, y, width, height, type } = element;
  
  if (type === 'rectangle' || type === 'frame' || type === 'text' || type === 'image') {
    // Find closest point on rectangle perimeter
    const left = x;
    const right = x + width;
    const top = y;
    const bottom = y + height;
    
    // Clamp point to rectangle bounds
    const clampedX = Math.max(left, Math.min(right, point.x));
    const clampedY = Math.max(top, Math.min(bottom, point.y));
    
    // Find which edge is closest
    const distances = [
      { edge: 'top', dist: Math.abs(point.y - top), x: clampedX, y: top },
      { edge: 'bottom', dist: Math.abs(point.y - bottom), x: clampedX, y: bottom },
      { edge: 'left', dist: Math.abs(point.x - left), x: left, y: clampedY },
      { edge: 'right', dist: Math.abs(point.x - right), x: right, y: clampedY }
    ];
    
    const nearest = distances.reduce((min, curr) => curr.dist < min.dist ? curr : min);
    return { x: nearest.x, y: nearest.y };
  } else if (type === 'ellipse') {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = Math.abs(width) / 2;
    const radiusY = Math.abs(height) / 2;
    
    const angle = Math.atan2(point.y - centerY, point.x - centerX);
    
    return {
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle)
    };
  } else if (type === 'diamond') {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Find intersection with diamond edges
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const halfWidth = Math.abs(width) / 2;
    const halfHeight = Math.abs(height) / 2;
    
    // Normalize to unit diamond, then scale back
    const scale = Math.max(Math.abs(dx) / halfWidth + Math.abs(dy) / halfHeight, 0.001);
    
    return {
      x: centerX + dx / scale,
      y: centerY + dy / scale
    };
  }
  
  // Fallback to center
  return { x: x + width / 2, y: y + height / 2 };
}

export function updateConnectedArrows(movedElement, allElements, roughGenerator) {
  // Update all arrows connected to the moved element
  let connectionsUpdated = 0;
  allElements.forEach(element => {
    if ((element.type === 'arrow' || element.type === 'line') && element !== movedElement) {
      let updated = false;
      
      // Check start binding
      if (element.startBinding && element.startBinding.elementId === movedElement.id) {
        const connectionPoint = getConnectionPoint(movedElement, element.startBinding.focus);
        
        // Calculate the difference to maintain relative end point
        const oldStartX = element.x;
        const oldStartY = element.y;
        const endPoint = {
          x: element.x + element.points[element.points.length - 1][0],
          y: element.y + element.points[element.points.length - 1][1]
        };
        
        // Update start position
        element.x = connectionPoint.x;
        element.y = connectionPoint.y;
        
        // Update points to maintain relative positions
        element.points[0] = [0, 0];
        element.points[element.points.length - 1] = [endPoint.x - element.x, endPoint.y - element.y];
        updated = true;
      }
      
      // Check end binding
      if (element.endBinding && element.endBinding.elementId === movedElement.id) {
        const connectionPoint = getConnectionPoint(movedElement, element.endBinding.focus);
        const lastIndex = element.points.length - 1;
        element.points[lastIndex] = [connectionPoint.x - element.x, connectionPoint.y - element.y];
        updated = true;
      }
      
      if (updated) {
        connectionsUpdated++;
        // Regenerate the arrow's drawable with the correct roughGenerator
        regenerateElementDrawable(element, roughGenerator);
      }
    }
  });
}

export function findElementAt(point, elements) {
  // Find the topmost element at a given point (with some tolerance for better UX)
  const tolerance = 20; // pixels
  
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (isPointInElementBounds(point, element, tolerance)) {
      return element;
    }
  }
  return null;
}

function isPointInElementBounds(point, element, tolerance = 0) {
  const { x, y, width, height, type } = element;
  
  if (type === 'rectangle' || type === 'frame' || type === 'text' || type === 'image') {
    return point.x >= x - tolerance && point.x <= x + width + tolerance && 
           point.y >= y - tolerance && point.y <= y + height + tolerance;
  } else if (type === 'ellipse') {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = Math.abs(width) / 2 + tolerance;
    const radiusY = Math.abs(height) / 2 + tolerance;
    
    const dx = (point.x - centerX) / radiusX;
    const dy = (point.y - centerY) / radiusY;
    return dx * dx + dy * dy <= 1;
  } else if (type === 'diamond') {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const halfWidth = Math.abs(width) / 2 + tolerance;
    const halfHeight = Math.abs(height) / 2 + tolerance;
    
    if (halfWidth === 0 || halfHeight === 0) return false;
    
    const dx = Math.abs(point.x - centerX) / halfWidth;
    const dy = Math.abs(point.y - centerY) / halfHeight;
    return dx + dy <= 1;
  }
  
  return false;
}

// Group management
let nextGroupId = 1;
const groups = new Map(); // groupId -> { id, elementIds: Set() }

export function createGroup(elementIds) {
  const groupId = `group_${nextGroupId++}`;
  const group = {
    id: groupId,
    elementIds: new Set(elementIds)
  };
  
  groups.set(groupId, group);
  
  // Add groupId to each element
  elementIds.forEach(elementId => {
    // We'll need to find the element and add groupId to it
    // This will be handled by the caller
  });
  
  return groupId;
}

export function ungroup(groupId) {
  if (groups.has(groupId)) {
    const group = groups.get(groupId);
    groups.delete(groupId);
    return Array.from(group.elementIds);
  }
  return [];
}

export function getElementGroup(elementId) {
  for (const [groupId, group] of groups) {
    if (group.elementIds.has(elementId)) {
      return groupId;
    }
  }
  return null;
}

export function getGroupElements(groupId) {
  const group = groups.get(groupId);
  return group ? Array.from(group.elementIds) : [];
}

export function isInGroup(elementId) {
  return getElementGroup(elementId) !== null;
}

export function addElementToGroup(elementId, groupId) {
  const group = groups.get(groupId);
  if (group) {
    group.elementIds.add(elementId);
  }
}

export function removeElementFromGroup(elementId) {
  for (const [groupId, group] of groups) {
    if (group.elementIds.has(elementId)) {
      group.elementIds.delete(elementId);
      // If group becomes empty, remove it
      if (group.elementIds.size === 0) {
        groups.delete(groupId);
      }
      return groupId;
    }
  }
  return null;
}
