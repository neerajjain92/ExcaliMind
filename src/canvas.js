import rough from 'roughjs';
import { getStroke } from 'perfect-freehand';
import { createElement, updateElement, drawElement, regenerateElementDrawable, updateConnectedArrows, findElementAt, getNearestConnectionPoint, getConnectionPoint, createGroup, ungroup, getElementGroup, getGroupElements, isInGroup } from './elements.js';
import { updateJsonEditor } from './jsonEditor.js';
import { selectTool, updateGroupingUI, updateGroupingUIWithSelection } from './toolbar.js';

// Canvas state
let canvas;
let ctx;
let roughCanvas;
let roughGenerator; // Add separate roughGenerator
let elements = [];
let action = 'none';
let selectedElement = null;
let selectedElementIndex = -1;
let selectedElements = []; // Array of selected elements for multi-selection
let selectedElementIndices = []; // Array of selected element indices
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let isDrawing = false;
let tool = 'selection';
let panOffset = { x: 0, y: 0 };
let lastPanPoint = { x: 0, y: 0 };
let scale = 1;
let strokeColor = '#1e1e1e';
let fillColor = 'transparent';
let fillStyle = 'hachure'; // Add fillStyle property
let strokeWidth = 2;

// Offscreen canvas for caching static elements
let offscreenCanvas;
let offscreenCtx;
let roughOffscreenCanvas;
let needsStaticRedraw = true;

export function initCanvas() {
  canvas = document.getElementById('excalidraw-canvas');
  ctx = canvas.getContext('2d');
  
  // Initialize rough.js - IMPORTANT: Do this before resizeCanvas
  roughCanvas = rough.canvas(canvas);
  roughGenerator = roughCanvas.generator; // Store the generator separately
  
  // Create offscreen canvas for caching
  offscreenCanvas = document.createElement('canvas');
  offscreenCtx = offscreenCanvas.getContext('2d');
  roughOffscreenCanvas = rough.canvas(offscreenCanvas);
  
  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Add event listeners
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('wheel', handleWheel);
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  // Resize offscreen canvas
  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;
  
  // Mark static elements for redraw
  needsStaticRedraw = true;
  
  // Make sure roughCanvas and roughGenerator are initialized before rendering
  if (roughCanvas && roughGenerator) {
    render();
  }
}

export function setTool(newTool) {
  tool = newTool;
  if (tool !== 'selection' && tool !== 'pan' && tool !== 'hand') {
    selectedElement = null;
    selectedElementIndex = -1;
  }
  canvas.style.cursor = getCursor();
  render();
}

function getCursor() {
  switch (tool) {
    case 'selection': return 'default';
    case 'pan': return 'grab';
    case 'hand': return 'grab';
    case 'rectangle': return 'crosshair';
    case 'diamond': return 'crosshair';
    case 'ellipse': return 'crosshair';
    case 'arrow': return 'crosshair';
    case 'line': return 'crosshair';
    case 'text': return 'text';
    case 'freedraw': return 'crosshair';
    case 'eraser': return 'crosshair';
    case 'image': return 'crosshair';
    case 'frame': return 'crosshair';
    default: return 'default';
  }
}

function handleMouseDown(e) {
  startX = (e.offsetX - panOffset.x) / scale;
  startY = (e.offsetY - panOffset.y) / scale;
  
  if (tool === 'selection') {
    const hitResult = getElementAtPosition(startX, startY); // Expects { index, position, handle } or null
    const isShiftPressed = e.shiftKey;

    if (hitResult) {
      // An element or its handle was hit.
      
      if (isShiftPressed) {
        // Multi-selection with Shift+click
        const elementIndex = hitResult.index;
        const isAlreadySelected = selectedElementIndices.includes(elementIndex);
        
        if (isAlreadySelected) {
          // Remove from selection
          selectedElementIndices = selectedElementIndices.filter(idx => idx !== elementIndex);
          selectedElements = selectedElements.filter(el => el !== elements[elementIndex]);
        } else {
          // Add to selection
          selectedElementIndices.push(elementIndex);
          selectedElements.push(elements[elementIndex]);
        }
        
        // Update single selection for compatibility
        if (selectedElementIndices.length === 1) {
          selectedElementIndex = selectedElementIndices[0];
          selectedElement = selectedElements[0];
        } else if (selectedElementIndices.length === 0) {
          selectedElementIndex = -1;
          selectedElement = null;
        } else {
          // Multiple selection - clear single selection
          selectedElementIndex = -1;
          selectedElement = null;
        }
        
        needsStaticRedraw = true;
      } else {
        // Single selection (normal click)
        const clickedElement = elements[hitResult.index];
        
        // Check if clicked element is in a group
        if (clickedElement.groupId && !isShiftPressed) {
          // Select the entire group
          selectGroup(clickedElement.id);
          needsStaticRedraw = true;
        } else {
          // Normal single selection
          const wasSelected = selectedElementIndices.includes(hitResult.index);
          
          // Clear previous selection
          selectedElementIndices = [hitResult.index];
          selectedElements = [elements[hitResult.index]];
          selectedElementIndex = hitResult.index;
          selectedElement = elements[selectedElementIndex];
          
          if (!wasSelected) {
            needsStaticRedraw = true; // Selection changed
          }
        }

        if (hitResult.position === 'inside') {
          action = 'moving';
        } else if (hitResult.position === 'handle') {
          action = 'resizing';
        }
      }
    } else {
      // Clicked on empty canvas
      if (!isShiftPressed) {
        // Clear selection if not holding Shift
        if (selectedElements.length > 0) {
          needsStaticRedraw = true; // Selection cleared
        }
        selectedElement = null;
        selectedElementIndex = -1;
        selectedElements = [];
        selectedElementIndices = [];
        
        // Start rectangle selection
        action = 'selecting';
      }
    }
  } else if (tool === 'pan' || tool === 'hand') {
    action = 'panning';
    lastPanPoint = { x: e.offsetX, y: e.offsetY };
    canvas.style.cursor = 'grabbing';
  } else if (tool === 'eraser') {
    action = 'erasing';
    const hitResult = getElementAtPosition(startX, startY);
    if (hitResult) {
      const elementToDelete = elements[hitResult.index];
      elements = elements.filter(el => el.id !== elementToDelete.id);
      // After removing an element, no element should be selected
      selectedElement = null;
      selectedElementIndex = -1;
      selectedElements = [];
      selectedElementIndices = [];
      needsStaticRedraw = true;
      updateJsonEditor(elements);
    }
  } else {
    isDrawing = true;
    const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check for potential connection at start point for arrows/lines
    let startBinding = null;
    if (tool === 'arrow' || tool === 'line') {
      const targetElement = findElementAt({ x: startX, y: startY }, elements);
      if (targetElement) {
        const connectionPoint = getNearestConnectionPoint(targetElement, { x: startX, y: startY });
        startX = connectionPoint.x;
        startY = connectionPoint.y;
        
        // Calculate focus (0-1 position on perimeter)
        const focus = 0.5; // Simplified - you could calculate exact focus
        startBinding = {
          elementId: targetElement.id,
          focus: focus,
          gap: 8
        };
      }
    }
    
    const newElement = createElement(id, startX, startY, startX, startY, tool, { 
      strokeColor, 
      fillColor, 
      fillStyle,
      strokeWidth 
    }, roughGenerator);
    
    // Add start binding if we found one
    if (startBinding && (tool === 'arrow' || tool === 'line')) {
      newElement.startBinding = startBinding;
    }
    
    elements.push(newElement);
    selectedElement = newElement;
    selectedElementIndex = elements.length - 1;
    selectedElements = [newElement];
    selectedElementIndices = [elements.length - 1];
    action = 'drawing';
  }
  
  render();
}

function handleMouseMove(e) {
  currentX = (e.offsetX - panOffset.x) / scale;
  currentY = (e.offsetY - panOffset.y) / scale;
  
  // Direct, immediate updates for smooth dragging - no throttling
  if (action === 'drawing') {
    updateElement(selectedElementIndex, elements, currentX, currentY, roughGenerator);
    render();
  } else if (action === 'selecting') {
    // Rectangle selection - just mark for redraw, actual selection happens in render()
    needsStaticRedraw = true;
    render();
  } else if (action === 'moving') {
    const dx = currentX - startX;
    const dy = currentY - startY;
    
    // Only update if there's actual movement to avoid unnecessary redraws
    if (dx !== 0 || dy !== 0) {
      // Move all selected elements
      selectedElements.forEach(element => {
        element.x += dx;
        element.y += dy;
        
        if (element.type === 'arrow' || element.type === 'line') {
          element.points.forEach(point => {
            point[0] += dx;
            point[1] += dy;
          });
        }
      });
      
      startX = currentX;
      startY = currentY;
      
      // Immediate lightweight render for smooth visual feedback
      needsStaticRedraw = true;
      render();
    }
  } else if (action === 'resizing') {
    // Only allow resizing for single selection
    if (selectedElement) {
      const width = currentX - selectedElement.x;
      const height = currentY - selectedElement.y;
      
      if (selectedElement.type === 'rectangle' || selectedElement.type === 'ellipse' || selectedElement.type === 'diamond') {
        selectedElement.width = width;
        selectedElement.height = height;
      } else if (selectedElement.type === 'arrow' || selectedElement.type === 'line') {
        // Update the last point for arrows and lines
        const lastPointIndex = selectedElement.points.length - 1;
        selectedElement.points[lastPointIndex] = [currentX - selectedElement.x, currentY - selectedElement.y];
      }
      
      // Regenerate drawable after resizing
      regenerateElementDrawable(selectedElement, roughGenerator);
      render();
    }
  } else if (action === 'panning') {
    const dx = e.offsetX - lastPanPoint.x;
    const dy = e.offsetY - lastPanPoint.y;
    
    panOffset.x += dx;
    panOffset.y += dy;
    
    lastPanPoint = { x: e.offsetX, y: e.offsetY };
    
    // Mark static elements for redraw since view transform changed
    needsStaticRedraw = true;
    render();
  } else if (action === 'erasing') {
    const hitResult = getElementAtPosition(currentX, currentY);
    if (hitResult) {
      const elementToDelete = elements[hitResult.index];
      elements = elements.filter(el => el.id !== elementToDelete.id);
      // After removing an element, no element should be selected
      selectedElement = null; 
      selectedElementIndex = -1;
      selectedElements = [];
      selectedElementIndices = [];
      needsStaticRedraw = true;
      updateJsonEditor(elements);
      render();
    }
  } else if (tool === 'selection') {
    const hitResult = getElementAtPosition(currentX, currentY);
    canvas.style.cursor = hitResult ? 'move' : 'default';
  }
}

function handleMouseUp() {
  if (action === 'drawing') {
    // Update element dimensions before the check
    if (selectedElement) {
      updateElement(selectedElementIndex, elements, currentX, currentY, roughGenerator);
      
      // Check for potential end connection for arrows/lines
      if ((selectedElement.type === 'arrow' || selectedElement.type === 'line') && 
          selectedElement.points && selectedElement.points.length > 1) {
        const endPoint = {
          x: selectedElement.x + selectedElement.points[selectedElement.points.length - 1][0],
          y: selectedElement.y + selectedElement.points[selectedElement.points.length - 1][1]
        };
        
        const targetElement = findElementAt(endPoint, elements.filter(el => el !== selectedElement));
        if (targetElement) {
          const connectionPoint = getNearestConnectionPoint(targetElement, endPoint);
          
          // Update end point to connection point
          selectedElement.points[selectedElement.points.length - 1] = [
            connectionPoint.x - selectedElement.x,
            connectionPoint.y - selectedElement.y
          ];
          
          // Add end binding
          selectedElement.endBinding = {
            elementId: targetElement.id,
            focus: 0.5, // Simplified focus calculation
            gap: 8
          };
          
          // Regenerate drawable with new end point
          regenerateElementDrawable(selectedElement, roughGenerator);
        }
      }
    }

    isDrawing = false;
    
    // Remove elements with no dimensions (click without drag)
    if (selectedElement && selectedElement.type !== 'text' && 
        selectedElement.width === 0 && 
        selectedElement.height === 0 &&
        // For arrow and line, check if points are the same (no drag)
        !( (selectedElement.type === 'arrow' || selectedElement.type === 'line') && 
           (selectedElement.points[0][0] === selectedElement.points[1][0] && selectedElement.points[0][1] === selectedElement.points[1][1])
         )
        ) {
      elements.pop();
      selectedElement = null;
      selectedElementIndex = -1;
      selectedElements = [];
      selectedElementIndices = [];
    } else if (selectedElement) {
      // Switch back to selection tool after placing a shape
      // Only switch if it was a drawing action and not a text element (text tool handles its own state)
      if (tool !== 'text') {
        selectTool('selection');
      }
    }
  } else if (action === 'selecting') {
    // Complete rectangle selection
    const selectionRect = {
      x: Math.min(startX, currentX),
      y: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY)
    };
    
    // Find elements within selection rectangle
    const newSelectedIndices = [];
    const newSelectedElements = [];
    
    elements.forEach((element, index) => {
      if (isElementInRect(element, selectionRect)) {
        newSelectedIndices.push(index);
        newSelectedElements.push(element);
      }
    });
    
    // Update selection
    selectedElementIndices = newSelectedIndices;
    selectedElements = newSelectedElements;
    
    // Update single selection for compatibility
    if (selectedElementIndices.length === 1) {
      selectedElementIndex = selectedElementIndices[0];
      selectedElement = selectedElements[0];
    } else {
      selectedElementIndex = -1;
      selectedElement = null;
    }
    
    needsStaticRedraw = true;
  } else if (action === 'moving') {
    // NOW do the expensive operations after smooth dragging is complete
    
    // Regenerate drawables for all moved elements
    selectedElements.forEach(element => {
      regenerateElementDrawable(element, roughGenerator);
      
      // Update connected arrows if this element has connections
      if (element.type !== 'arrow' && element.type !== 'line') {
        updateConnectedArrows(element, elements, roughGenerator);
      }
    });
  } else if (action === 'panning') {
    canvas.style.cursor = tool === 'pan' || tool === 'hand' ? 'grab' : 'default';
  }
  
  action = 'none';
  needsStaticRedraw = true;
  updateJsonEditor(elements);
  render();
}

function handleWheel(e) {
  e.preventDefault();
  
  const zoom = e.deltaY < 0 ? 1.1 : 0.9;
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;
  
  // Calculate new scale
  const newScale = scale * zoom;
  
  // Limit scale
  if (newScale > 0.1 && newScale < 10) {
    // Calculate mouse position in world space before zoom
    const worldX = (mouseX - panOffset.x) / scale;
    const worldY = (mouseY - panOffset.y) / scale;
    
    // Update scale
    scale = newScale;
    
    // Calculate new offset to zoom at mouse position
    panOffset.x = mouseX - worldX * scale;
    panOffset.y = mouseY - worldY * scale;
    
    // Mark static elements for redraw since view transform changed
    needsStaticRedraw = true;
    
    render();
  }
}

function getElementAtPosition(x, y) {
  // First, check if the mouse is on a resize handle of the *currently selected* element.
  // This gives priority to resizing an already selected element.
  if (selectedElement && selectedElementIndex !== -1) { // Check only if an element is already selected
    const handles = getResizeHandles(selectedElement);
    for (const handle of handles) {
      if (isPointInHandle(x, y, handle)) {
        return { index: selectedElementIndex, position: 'handle', handle: handle };
      }
    }
  }

  // If not on a handle of the selected element (or no element is selected),
  // check if the mouse is inside any other element (for selection or starting a move).
  // Iterate from top-most to bottom-most.
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (isPointInElement(x, y, element)) {
      // If we clicked inside an element.
      // If it's the currently selected element and not a handle, it's a 'move' action.
      // If it's a different element, this click is to select it and then potentially move.
      return { index: i, position: 'inside', handle: null };
    }
  }
  return null; // No element or handle was hit
}

function isPointInElement(x, y, element) {
  if (element.type === 'rectangle' || element.type === 'frame' || element.type === 'text' || element.type === 'image') {
    const x1 = Math.min(element.x, element.x + element.width);
    const x2 = Math.max(element.x, element.x + element.width);
    const y1 = Math.min(element.y, element.y + element.height);
    const y2 = Math.max(element.y, element.y + element.height);
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  } else if (element.type === 'diamond') {
    const absWidth = Math.abs(element.width);
    const absHeight = Math.abs(element.height);
    if (absWidth === 0 || absHeight === 0) return false;

    const halfWidth = absWidth / 2;
    const halfHeight = absHeight / 2;
    
    const elX1 = Math.min(element.x, element.x + element.width);
    const elX2 = Math.max(element.x, element.x + element.width);
    const elY1 = Math.min(element.y, element.y + element.height);
    const elY2 = Math.max(element.y, element.y + element.height);

    const centerX = (elX1 + elX2) / 2;
    const centerY = (elY1 + elY2) / 2;
    
    const dx = Math.abs(x - centerX) / halfWidth;
    const dy = Math.abs(y - centerY) / halfHeight;
    return dx + dy <= 1;
  } else if (element.type === 'ellipse') {
    const absWidth = Math.abs(element.width);
    const absHeight = Math.abs(element.height);
    if (absWidth === 0 || absHeight === 0) return false;

    const rx = absWidth / 2;
    const ry = absHeight / 2;

    const elX1 = Math.min(element.x, element.x + element.width);
    const elX2 = Math.max(element.x, element.x + element.width);
    const elY1 = Math.min(element.y, element.y + element.height);
    const elY2 = Math.max(element.y, element.y + element.height);

    const cx = (elX1 + elX2) / 2;
    const cy = (elY1 + elY2) / 2;
        
    const normX = (x - cx) / rx;
    const normY = (y - cy) / ry;
    return normX * normX + normY * normY <= 1;
  } else if (element.type === 'arrow' || element.type === 'line') {
    // Check if point is near the line
    const points = element.points;
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = element.x + points[i][0];
      const y1 = element.y + points[i][1];
      const x2 = element.x + points[i + 1][0];
      const y2 = element.y + points[i + 1][1];
      
      const distance = distanceToLine(x, y, x1, y1, x2, y2);
      if (distance < 10) {
        return true;
      }
    }
  } else if (element.type === 'freedraw') {
    // Check if point is near any segment of the freedraw
    const points = element.points;
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = element.x + points[i][0];
      const y1 = element.y + points[i][1];
      const x2 = element.x + points[i + 1][0];
      const y2 = element.y + points[i + 1][1];
      
      const distance = distanceToLine(x, y, x1, y1, x2, y2);
      if (distance < 10) {
        return true;
      }
    }
  }
  
  return false;
}

function distanceToLine(x, y, x1, y1, x2, y2) {
  const A = x - x1;
  const B = y - y1;
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
  
  const dx = x - xx;
  const dy = y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

function getResizeHandles(element) {
  if (element.type === 'rectangle' || element.type === 'ellipse' || element.type === 'text' || element.type === 'diamond' || element.type === 'image' || element.type === 'frame') {
    return [
      { x: element.x, y: element.y, position: 'nw' },
      { x: element.x + element.width / 2, y: element.y, position: 'n' },
      { x: element.x + element.width, y: element.y, position: 'ne' },
      { x: element.x + element.width, y: element.y + element.height / 2, position: 'e' },
      { x: element.x + element.width, y: element.y + element.height, position: 'se' },
      { x: element.x + element.width / 2, y: element.y + element.height, position: 's' },
      { x: element.x, y: element.y + element.height, position: 'sw' },
      { x: element.x, y: element.y + element.height / 2, position: 'w' }
    ];
  } else if (element.type === 'arrow' || element.type === 'line') {
    const firstPoint = [element.x, element.y];
    const lastPoint = [element.x + element.points[element.points.length - 1][0], 
                       element.y + element.points[element.points.length - 1][1]];
    return [
      { x: firstPoint[0], y: firstPoint[1], position: 'start' },
      { x: lastPoint[0], y: lastPoint[1], position: 'end' }
    ];
  } else if (element.type === 'freedraw') {
    // For freedraw, just return the bounding box handles
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    element.points.forEach(point => {
      minX = Math.min(minX, element.x + point[0]);
      minY = Math.min(minY, element.y + point[1]);
      maxX = Math.max(maxX, element.x + point[0]);
      maxY = Math.max(maxY, element.y + point[1]);
    });
    
    return [
      { x: minX, y: minY, position: 'nw' },
      { x: maxX, y: minY, position: 'ne' },
      { x: maxX, y: maxY, position: 'se' },
      { x: minX, y: maxY, position: 'sw' }
    ];
  }
  
  return [];
}

function isPointInHandle(x, y, handle) {
  const handleSize = 8;
  return x >= handle.x - handleSize / 2 && 
         x <= handle.x + handleSize / 2 && 
         y >= handle.y - handleSize / 2 && 
         y <= handle.y + handleSize / 2;
}

function isElementInRect(element, rect) {
  // Check if element overlaps with selection rectangle
  const elementBounds = getElementBounds(element);
  
  return !(elementBounds.x > rect.x + rect.width || 
           elementBounds.x + elementBounds.width < rect.x ||
           elementBounds.y > rect.y + rect.height ||
           elementBounds.y + elementBounds.height < rect.y);
}

function getElementBounds(element) {
  if (element.type === 'rectangle' || element.type === 'ellipse' || element.type === 'diamond' || 
      element.type === 'text' || element.type === 'image' || element.type === 'frame') {
    return {
      x: Math.min(element.x, element.x + element.width),
      y: Math.min(element.y, element.y + element.height),
      width: Math.abs(element.width),
      height: Math.abs(element.height)
    };
  } else if (element.type === 'arrow' || element.type === 'line') {
    // Calculate bounding box from points
    let minX = element.x;
    let minY = element.y;
    let maxX = element.x;
    let maxY = element.y;
    
    element.points.forEach(point => {
      minX = Math.min(minX, element.x + point[0]);
      minY = Math.min(minY, element.y + point[1]);
      maxX = Math.max(maxX, element.x + point[0]);
      maxY = Math.max(maxY, element.y + point[1]);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } else if (element.type === 'freedraw') {
    // Calculate bounding box from points
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    element.points.forEach(point => {
      minX = Math.min(minX, element.x + point[0]);
      minY = Math.min(minY, element.y + point[1]);
      maxX = Math.max(maxX, element.x + point[0]);
      maxY = Math.max(maxY, element.y + point[1]);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  return { x: element.x, y: element.y, width: 0, height: 0 };
}

function render() {
  // Safety check to ensure we have the necessary objects
  if (!ctx || !roughCanvas || !roughGenerator) {
    return;
  }

  // Clear main canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw static elements to offscreen canvas if needed
  if (needsStaticRedraw) {
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    // Apply same transformations to offscreen canvas
    offscreenCtx.save();
    offscreenCtx.translate(panOffset.x, panOffset.y);
    offscreenCtx.scale(scale, scale);
    
    // Clean canvas background - no grid for Excalidraw-like experience
    // drawGridToContext(offscreenCtx); // Removed for clean white background
    
    // Draw all non-selected elements to offscreen canvas
    elements.forEach((element, index) => {
      if (!selectedElementIndices.includes(index)) {
        drawElement(roughOffscreenCanvas, offscreenCtx, element, false, roughGenerator);
      }
    });
    
    offscreenCtx.restore();
    needsStaticRedraw = false;
  }
  
  // Copy static elements from offscreen canvas to main canvas
  ctx.drawImage(offscreenCanvas, 0, 0);
  
  // Apply transform to main canvas for drawing selected elements and handles
  ctx.save();
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(scale, scale);
  
  // Draw all selected elements on top
  selectedElements.forEach((element, index) => {
    const isLastSelected = index === selectedElements.length - 1;
    drawElement(roughCanvas, ctx, element, true, roughGenerator);
    
    // Only draw resize handles for single selection
    if (selectedElements.length === 1) {
      drawResizeHandles(element);
    }
  });
  
  // Draw selection rectangle if actively selecting
  if (action === 'selecting') {
    drawSelectionRectangle();
  }
  
  ctx.restore();
  
  // Update element count
  const elementCountEl = document.getElementById('element-count');
  if (elementCountEl) {
    if (selectedElements.length > 1) {
      elementCountEl.textContent = `${elements.length} elements (${selectedElements.length} selected)`;
    } else {
      elementCountEl.textContent = `${elements.length} elements`;
    }
  }
  
  // Update grouping UI based on current selection
  updateGroupingUIWithSelection(selectedElements);
}

function drawSelectionRectangle() {
  const rectX = Math.min(startX, currentX);
  const rectY = Math.min(startY, currentY);
  const rectWidth = Math.abs(currentX - startX);
  const rectHeight = Math.abs(currentY - startY);
  
  ctx.strokeStyle = '#5f72ff';
  ctx.fillStyle = 'rgba(95, 114, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
  ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
  
  ctx.setLineDash([]);
}

function drawGrid() {
  drawGridToContext(ctx);
}

function drawGridToContext(context) {
  const gridSize = 20;
  const gridColor = '#f0f0f0';
  
  context.strokeStyle = gridColor;
  context.lineWidth = 1;
  
  // Calculate grid boundaries based on pan and zoom
  const startX = Math.floor(-panOffset.x / scale / gridSize) * gridSize;
  const startY = Math.floor(-panOffset.y / scale / gridSize) * gridSize;
  const endX = Math.ceil((canvas.width - panOffset.x) / scale / gridSize) * gridSize;
  const endY = Math.ceil((canvas.height - panOffset.y) / scale / gridSize) * gridSize;
  
  // Draw vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    context.beginPath();
    context.moveTo(x, startY);
    context.lineTo(x, endY);
    context.stroke();
  }
  
  // Draw horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    context.beginPath();
    context.moveTo(startX, y);
    context.lineTo(endX, y);
    context.stroke();
  }
}

function drawResizeHandles(element) {
  const handles = getResizeHandles(element);
  
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  
  handles.forEach(handle => {
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

export function setElements(newElements) {
  elements = newElements;
  // Regenerate all drawables for loaded elements
  elements.forEach(element => {
    regenerateElementDrawable(element, roughGenerator);
  });
  
  // Process any existing connections for arrows/lines
  elements.forEach(element => {
    if ((element.type === 'arrow' || element.type === 'line') && 
        (element.startBinding || element.endBinding)) {
      
      // Update start binding connection
      if (element.startBinding) {
        const targetElement = elements.find(el => el.id === element.startBinding.elementId);
        if (targetElement) {
          const connectionPoint = getConnectionPoint(targetElement, element.startBinding.focus);
          element.x = connectionPoint.x;
          element.y = connectionPoint.y;
          
          // Update first point
          const endPoint = {
            x: element.x + element.points[element.points.length - 1][0],
            y: element.y + element.points[element.points.length - 1][1]
          };
          element.points[0] = [0, 0];
          element.points[element.points.length - 1] = [endPoint.x - element.x, endPoint.y - element.y];
        }
      }
      
      // Update end binding connection
      if (element.endBinding) {
        const targetElement = elements.find(el => el.id === element.endBinding.elementId);
        if (targetElement) {
          const connectionPoint = getConnectionPoint(targetElement, element.endBinding.focus);
          const lastIndex = element.points.length - 1;
          element.points[lastIndex] = [connectionPoint.x - element.x, connectionPoint.y - element.y];
        }
      }
      
      // Regenerate drawable after connection updates
      regenerateElementDrawable(element, roughGenerator);
    }
  });
  
  needsStaticRedraw = true;
  render();
}

export function setStrokeColor(color) {
  strokeColor = color;
  // If an element is selected, update its color and regenerate drawable
  if (selectedElement && selectedElementIndex !== -1) {
    selectedElement.strokeColor = color;
    regenerateElementDrawable(selectedElement, roughGenerator);
    render();
  }
}

export function setFillColor(color) {
  fillColor = color;
  // If an element is selected, update its fill and regenerate drawable
  if (selectedElement && selectedElementIndex !== -1) {
    selectedElement.backgroundColor = color;
    // Update fill style if setting solid color
    if (color !== 'transparent' && color !== 'hachure') {
      selectedElement.fillStyle = 'solid';
    }
    regenerateElementDrawable(selectedElement, roughGenerator);
    render();
  }
}

export function setFillStyle(style) {
  fillStyle = style;
  // If an element is selected, update its fill style and regenerate drawable
  if (selectedElement && selectedElementIndex !== -1) {
    selectedElement.fillStyle = style;
    regenerateElementDrawable(selectedElement, roughGenerator);
    render();
  }
}

export function setStrokeWidth(width) {
  strokeWidth = width;
  // If an element is selected, update its stroke width and regenerate drawable
  if (selectedElement && selectedElementIndex !== -1) {
    selectedElement.strokeWidth = width;
    regenerateElementDrawable(selectedElement, roughGenerator);
    render();
  }
}

export function getElements() {
  return elements;
}

export function groupSelectedElements() {
  console.log('groupSelectedElements called with', selectedElements.length, 'elements');
  
  if (selectedElements.length < 2) {
    console.log('Not enough elements to group');
    return; // Need at least 2 elements to group
  }
  
  const elementIds = selectedElements.map(el => el.id);
  console.log('Element IDs to group:', elementIds);
  
  const groupId = createGroup(elementIds);
  console.log('Created group:', groupId);
  
  // Add groupId to each selected element
  selectedElements.forEach(element => {
    element.groupId = groupId;
    console.log('Added groupId', groupId, 'to element', element.id);
  });
  
  needsStaticRedraw = true;
  updateJsonEditor(elements);
  render();
  console.log('Grouping completed');
}

export function ungroupSelectedElements() {
  console.log('ungroupSelectedElements called with', selectedElements.length, 'elements');
  
  if (selectedElements.length === 0) {
    console.log('No elements selected');
    return; // Need at least one element selected
  }
  
  // Find the first grouped element to get the group ID
  let groupId = null;
  for (const element of selectedElements) {
    if (element.groupId) {
      groupId = element.groupId;
      console.log('Found grouped element with groupId:', groupId);
      break;
    }
  }
  
  if (!groupId) {
    console.log('No grouped elements in selection');
    return; // No grouped elements in selection
  }
  
  const elementIds = ungroup(groupId);
  console.log('Ungrouped elements:', elementIds);
  
  // Remove groupId from all elements in the group
  elements.forEach(el => {
    if (el.groupId === groupId) {
      console.log('Removing groupId from element:', el.id);
      delete el.groupId;
    }
  });
  
  needsStaticRedraw = true;
  updateJsonEditor(elements);
  render();
  console.log('Ungrouping completed');
}

function selectGroup(elementId) {
  const element = elements.find(el => el.id === elementId);
  if (!element || !element.groupId) {
    return false; // Not in a group
  }
  
  // Select all elements in the group
  const groupElements = elements.filter(el => el.groupId === element.groupId);
  const groupIndices = groupElements.map(el => elements.indexOf(el));
  
  selectedElements = groupElements;
  selectedElementIndices = groupIndices;
  
  // Clear single selection since we have multiple
  selectedElement = null;
  selectedElementIndex = -1;
  
  return true;
}
