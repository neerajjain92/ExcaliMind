import rough from 'roughjs';
import { getStroke } from 'perfect-freehand';
import { createElement, updateElement, drawElement, regenerateElementDrawable, groupElements, ungroupElements } from './elements.js';
import { updateJsonEditor } from './jsonEditor.js';
import { selectTool, updateGroupUngroupButtonStates } from './toolbar.js';

// Canvas state
let canvas;
let ctx;
let roughCanvas;
let roughGenerator; // Add separate roughGenerator
let elements = [];
let action = 'none';
let selectedElements = [];
let selectedElementIndices = [];
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

// Throttle mechanism for mouse move
let animationFrameId = null;

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
    selectedElements = [];
    selectedElementIndices = [];
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

    if (hitResult) {
      const clickedElementIndex = hitResult.index;
      const clickedElement = elements[clickedElementIndex];

      if (e.shiftKey) {
        const existingIndex = selectedElementIndices.indexOf(clickedElementIndex);
        if (existingIndex > -1) {
          // Element is already selected, remove it
          selectedElementIndices.splice(existingIndex, 1);
          selectedElements.splice(existingIndex, 1);
        } else {
          // Element is not selected, add it
          selectedElementIndices.push(clickedElementIndex);
          selectedElements.push(clickedElement);
        }
      } else {
        // Shift key is not pressed, select only the clicked element
        selectedElementIndices = [clickedElementIndex];
        selectedElements = [clickedElement];
      }
      
      needsStaticRedraw = true; // Selection changed

      if (hitResult.position === 'inside') {
        action = 'moving';
      } else if (hitResult.position === 'handle') {
        action = 'resizing';
        // currentResizeHandle = hitResult.handle; // Optional: store for detailed resize logic
      }
    } else {
      // Clicked on empty canvas
      if (!e.shiftKey) {
        if (selectedElements.length > 0) {
          needsStaticRedraw = true; // Selection cleared
        }
        selectedElements = [];
        selectedElementIndices = [];
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
      selectedElements = [];
      selectedElementIndices = [];
      needsStaticRedraw = true;
      updateJsonEditor(elements);
    }
  } else {
    isDrawing = true;
    const id = elements.length;
    const newElement = createElement(id, startX, startY, startX, startY, tool, { 
      strokeColor, 
      fillColor, 
      fillStyle,
      strokeWidth 
    }, roughGenerator);
    
    elements.push(newElement);
    selectedElements = [newElement];
    selectedElementIndices = [elements.length - 1];
    action = 'drawing';
  }
  
  render();
  updateGroupUngroupButtonStates(selectedElements); // Ensure this is called after selection changes
}

function handleMouseMove(e) {
  currentX = (e.offsetX - panOffset.x) / scale;
  currentY = (e.offsetY - panOffset.y) / scale;
  
  // Cancel any pending animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Throttle rendering using requestAnimationFrame
  animationFrameId = requestAnimationFrame(() => {
    if (action === 'drawing' && selectedElements.length > 0) {
      // Drawing action always refers to the first (and typically only) element in selectedElements during drawing
      updateElement(selectedElementIndices[0], elements, currentX, currentY, roughGenerator);
    } else if (action === 'moving' && selectedElements.length > 0) {
      const dx = currentX - startX;
      const dy = currentY - startY;
      selectedElements.forEach(currentSelectedElement => {
        currentSelectedElement.x += dx;
        currentSelectedElement.y += dy;
        if (currentSelectedElement.type === 'arrow' || currentSelectedElement.type === 'line' || currentSelectedElement.type === 'freedraw') {
          currentSelectedElement.points.forEach(point => {
            point[0] += dx;
            point[1] += dy;
          });
        }
        regenerateElementDrawable(currentSelectedElement, roughGenerator);
      });
      startX = currentX;
      startY = currentY;
      needsStaticRedraw = true; 
    } else if (action === 'resizing' && selectedElements.length > 0) {
      // Resizing only applies if a single element is selected.
      if (selectedElements.length === 1) {
        const currentSelectedElement = selectedElements[0];
        // The existing logic for resizing a single element.
        const width = currentX - currentSelectedElement.x;
        const height = currentY - currentSelectedElement.y;
        if (currentSelectedElement.type === 'rectangle' || currentSelectedElement.type === 'ellipse' || currentSelectedElement.type === 'diamond' || currentSelectedElement.type === 'text' || currentSelectedElement.type === 'image' || currentSelectedElement.type === 'frame') {
          currentSelectedElement.width = width;
          currentSelectedElement.height = height;
        } else if (currentSelectedElement.type === 'arrow' || currentSelectedElement.type === 'line') {
          const lastPointIndex = currentSelectedElement.points.length - 1;
          currentSelectedElement.points[lastPointIndex] = [currentX - currentSelectedElement.x, currentY - currentSelectedElement.y];
        }
        regenerateElementDrawable(currentSelectedElement, roughGenerator);
        needsStaticRedraw = true;
      }
      // If multiple elements are selected, resizing is disabled for now.
      // Future: Implement multi-element resize, e.g., based on a bounding box.
    } else if (action === 'panning') {
      const dx = e.offsetX - lastPanPoint.x;
      const dy = e.offsetY - lastPanPoint.y;
      
      panOffset.x += dx;
      panOffset.y += dy;
      
      lastPanPoint = { x: e.offsetX, y: e.offsetY };
      
      // Mark static elements for redraw since view transform changed
      needsStaticRedraw = true;
    } else if (action === 'erasing') {
      const hitResult = getElementAtPosition(currentX, currentY);
      if (hitResult) {
        const elementToDelete = elements[hitResult.index];
        elements = elements.filter(el => el.id !== elementToDelete.id);
        // After removing an element, no element should be selected
        selectedElements = [];
        selectedElementIndices = [];
        needsStaticRedraw = true;
        updateJsonEditor(elements);
      }
    } else if (tool === 'selection') {
      const hitResult = getElementAtPosition(currentX, currentY);
      canvas.style.cursor = hitResult ? 'move' : 'default';
    }
    
    render();
  });
}

function handleMouseUp() {
  // Cancel any pending animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  if (action === 'drawing') {
    const currentSelectedElement = selectedElements.length > 0 ? selectedElements[0] : null;
    const currentSelectedElementIndex = selectedElementIndices.length > 0 ? selectedElementIndices[0] : -1;

    // Update element dimensions before the check
    if (currentSelectedElement) {
      updateElement(currentSelectedElementIndex, elements, currentX, currentY, roughGenerator);
    }

    isDrawing = false;
    
    // Remove elements with no dimensions (click without drag)
    if (currentSelectedElement && currentSelectedElement.type !== 'text' &&
        currentSelectedElement.width === 0 &&
        currentSelectedElement.height === 0 &&
        // For arrow and line, check if points are the same (no drag)
        !( (currentSelectedElement.type === 'arrow' || currentSelectedElement.type === 'line') &&
           (currentSelectedElement.points[0][0] === currentSelectedElement.points[1][0] && currentSelectedElement.points[0][1] === currentSelectedElement.points[1][1])
         )
        ) {
      elements.pop(); // Remove the element from the main list
      selectedElements = []; // Clear selected elements
      selectedElementIndices = []; // Clear selected indices
    } else if (currentSelectedElement) {
      // The new element is valid, make it the sole selected element
      selectedElements = [currentSelectedElement];
      selectedElementIndices = [elements.indexOf(currentSelectedElement)]; // Ensure index is correct
      // Switch back to selection tool after placing a shape
      // Only switch if it was a drawing action and not a text element (text tool handles its own state)
      if (tool !== 'text') {
        selectTool('selection');
      }
    }
  } else if (action === 'panning') {
    canvas.style.cursor = tool === 'pan' || tool === 'hand' ? 'grab' : 'default';
  }
  
  action = 'none'; // Set action to none after all checks
  if (selectedElements.length > 0) {
    needsStaticRedraw = true; // Mark for redraw when selection changes
  }
  updateJsonEditor(elements);
  render();
  updateGroupUngroupButtonStates(selectedElements);
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
  // First, check if the mouse is on a resize handle of any *currently selected* element.
  // This gives priority to resizing an already selected element.
  if (selectedElements.length > 0) {
    for (let i = 0; i < selectedElements.length; i++) {
      const currentSelectedElement = selectedElements[i];
      const currentSelectedElementIndex = selectedElementIndices[i];
      const handles = getResizeHandles(currentSelectedElement);
      for (const handle of handles) {
        if (isPointInHandle(x, y, handle)) {
          return { index: currentSelectedElementIndex, position: 'handle', handle: handle };
        }
      }
    }
  }

  // If not on a handle of a selected element (or no element is selected),
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

function render() {
  // Safety check to ensure we have the necessary objects
  if (!ctx || !roughCanvas || !roughGenerator) {
    console.error('Canvas rendering context or RoughJS not initialized');
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
    
    // Draw grid to offscreen canvas
    drawGridToContext(offscreenCtx);
    
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
  
  // Apply transform to main canvas for drawing selected element and handles
  ctx.save();
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(scale, scale);
  
  // Draw selected elements on top
  if (selectedElements.length > 0) {
    selectedElements.forEach(element => {
      // The 'true' flag indicates this element is selected
      drawElement(roughCanvas, ctx, element, true, roughGenerator); 
      // Draw resize handles only for the primary selected element or if only one is selected
      if (selectedElements.length === 1) { // Or based on a primary selection concept
        drawResizeHandles(element);
      }
    });
    // If multiple elements are selected, consider drawing a bounding box around all of them
    // This part is for future implementation, for now, handles are shown per element or only for one.
  }
  
  ctx.restore();
  
  // Update element count
  const elementCountEl = document.getElementById('element-count');
  if (elementCountEl) {
    elementCountEl.textContent = `${elements.length} elements`;
  }
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
  needsStaticRedraw = true;
  render();
}

export function setStrokeColor(color) {
  strokeColor = color;
  // If elements are selected, update their color and regenerate drawables
  if (selectedElements.length > 0) {
    selectedElements.forEach(element => {
      element.strokeColor = color;
      regenerateElementDrawable(element, roughGenerator);
    });
    needsStaticRedraw = true; // Selected elements might be redrawn on main canvas, but underlying static might need update if their state changes
    render();
  }
}

export function setFillColor(color) {
  fillColor = color;
  // If elements are selected, update their fill and regenerate drawables
  if (selectedElements.length > 0) {
    selectedElements.forEach(element => {
      element.backgroundColor = color;
      // Update fill style if setting solid color
      if (color !== 'transparent' && color !== 'hachure') {
        element.fillStyle = 'solid';
      }
      regenerateElementDrawable(element, roughGenerator);
    });
    needsStaticRedraw = true;
    render();
  }
}

export function setFillStyle(style) {
  fillStyle = style;
  // If elements are selected, update their fill style and regenerate drawables
  if (selectedElements.length > 0) {
    selectedElements.forEach(element => {
      element.fillStyle = style;
      regenerateElementDrawable(element, roughGenerator);
    });
    needsStaticRedraw = true;
    render();
  }
}

export function setStrokeWidth(width) {
  strokeWidth = width;
  // If elements are selected, update their stroke width and regenerate drawables
  if (selectedElements.length > 0) {
    selectedElements.forEach(element => {
      element.strokeWidth = width;
      regenerateElementDrawable(element, roughGenerator);
    });
    needsStaticRedraw = true;
    render();
  }
}

export function getElements() {
  return elements;
}

// Export getSelectedElements to be potentially used by toolbar or other UI components
export function getSelectedElements() {
  return selectedElements;
}

export function groupSelectedElements() {
  if (selectedElements.length <= 1) {
    // console.warn("Need to select more than one element to group.");
    return; 
  }

  // Use a more robust ID generation if many elements are created/deleted.
  // For simplicity, elements.length might lead to collisions if elements are deleted.
  // A better approach would be a counter or UUID.
  const nextIdFn = () => elements.reduce((maxId, el) => Math.max(el.id, maxId), -1) + 1;
  const newGroup = groupElements(selectedElements, roughGenerator, nextIdFn);

  if (newGroup) {
    // Filter out the original selected elements from the main elements array
    const selectedElementIds = selectedElements.map(el => el.id);
    elements = elements.filter(el => !selectedElementIds.includes(el.id));
    
    // Add the new group to the elements array
    elements.push(newGroup);

    // Update selection to the new group
    selectedElements = [newGroup];
    selectedElementIndices = [elements.indexOf(newGroup)];

    // Update UI and state
    updateGroupUngroupButtonStates(selectedElements);
    needsStaticRedraw = true;
    render();
    updateJsonEditor(elements);
  }
}

export function ungroupSelectedElement() {
  if (selectedElements.length !== 1 || selectedElements[0].type !== 'group') {
    // console.warn("Need to select a single group to ungroup.");
    return;
  }

  const groupToUngroup = selectedElements[0];
  const ungroupedChildren = ungroupElements(groupToUngroup, roughGenerator);

  // Remove the group from the elements array
  elements = elements.filter(el => el.id !== groupToUngroup.id);

  // Add all ungrouped children to the elements array
  // Ensure IDs are unique if they were not before
  // This example assumes ungroupElements might not re-assign IDs, so we do it here if needed.
  // For simplicity, let's assume IDs are fine or a more robust ID system is in place.
  elements.push(...ungroupedChildren);

  // Update selection to the ungrouped children
  selectedElements = ungroupedChildren;
  selectedElementIndices = ungroupedChildren.map(child => elements.indexOf(child));
  // A more robust way to find indices if direct indexOf might fail:
  // selectedElementIndices = ungroupedChildren.map(child => elements.findIndex(el => el.id === child.id));


  // Update UI and state
  updateGroupUngroupButtonStates(selectedElements);
  needsStaticRedraw = true;
  render();
  updateJsonEditor(elements);
}
