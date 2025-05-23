import { setElements, getElements } from './canvas.js';

// Sample Excalidraw JSON data
const sampleExcalidrawData = {
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "rect-1",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#e7f5ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 1234567890,
      "versionNonce": 1234567890,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "text-1",
      "type": "text",
      "x": 150,
      "y": 130,
      "width": 100,
      "height": 40,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 1234567891,
      "versionNonce": 1234567891,
      "isDeleted": false,
      "text": "Hello World!",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 34,
      "containerId": null,
      "originalText": "Hello World!",
      "lineHeight": 1.25,
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "ellipse-1",
      "type": "ellipse",
      "x": 350,
      "y": 80,
      "width": 120,
      "height": 80,
      "angle": 0,
      "strokeColor": "#c2255c",
      "backgroundColor": "#fce7f3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 1234567892,
      "versionNonce": 1234567892,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "arrow-1",
      "type": "arrow",
      "x": 300,
      "y": 150,
      "width": 80,
      "height": -30,
      "angle": 0,
      "strokeColor": "#1971c2",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 1234567893,
      "versionNonce": 1234567893,
      "isDeleted": false,
      "points": [[0, 0], [80, -30]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "updated": 1,
      "link": null,
      "locked": false
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
};

export function setupJsonEditor() {
  const jsonEditor = document.getElementById('json-editor');
  const loadSampleBtn = document.getElementById('load-sample-btn');
  const renderBtn = document.getElementById('render-btn');
  const urlInput = document.getElementById('url-input');
  const loadUrlBtn = document.getElementById('load-url-btn');
  
  // Load sample data
  loadSampleBtn.addEventListener('click', loadSampleData);
  
  // Render button
  renderBtn.addEventListener('click', renderFromJson);
  
  // URL loader
  loadUrlBtn.addEventListener('click', loadFromUrl);
  
  // Allow Enter key to load URL
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadFromUrl();
    }
  });
  
  // Auto-render on input change (debounced)
  let renderTimeout;
  jsonEditor.addEventListener('input', () => {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderFromJson, 1000);
  });
  
  // Initialize with sample data
  loadSampleData();
}

function loadSampleData() {
  const jsonEditor = document.getElementById('json-editor');
  jsonEditor.value = JSON.stringify(sampleExcalidrawData, null, 2);
  renderFromJson();
  showUrlStatus('Sample data loaded successfully!', 'success');
}

function renderFromJson() {
  const jsonEditor = document.getElementById('json-editor');
  const jsonInput = jsonEditor.value;
  
  clearError();
  
  if (!jsonInput.trim()) {
    showError('Please enter JSON data');
    return;
  }
  
  try {
    const data = JSON.parse(jsonInput);
    
    if (!data.elements || !Array.isArray(data.elements)) {
      throw new Error('Invalid Excalidraw format: missing or invalid elements array');
    }
    
    // Convert Excalidraw elements to our format
    const elements = data.elements.map(element => {
      // Handle arrow and line elements
      if (element.type === 'arrow' || element.type === 'line') {
        return {
          ...element,
          points: element.points || [[0, 0], [element.width || 0, element.height || 0]]
        };
      }
      
      return element;
    });
    
    // Update canvas
    setElements(elements);
    
    // Update element count
    document.getElementById('element-count').textContent = `${elements.length} elements`;
    
  } catch (err) {
    showError(`JSON Parse Error: ${err.message}`);
  }
}

export function updateJsonEditor(elements) {
  const jsonEditor = document.getElementById('json-editor');
  
  // Create Excalidraw format
  const excalidrawData = {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: elements,
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff"
    },
    files: {}
  };
  
  jsonEditor.value = JSON.stringify(excalidrawData, null, 2);
}

function convertGitHubUrl(url) {
  // Convert GitHub blob URLs to raw URLs
  if (url.includes('github.com') && url.includes('/blob/')) {
    const convertedUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    return convertedUrl;
  }
  return url;
}

async function loadFromUrl() {
  const urlInput = document.getElementById('url-input');
  const loadBtn = document.getElementById('load-url-btn');
  const btnText = document.getElementById('btn-text');
  const jsonEditor = document.getElementById('json-editor');
  
  let url = urlInput.value.trim();
  
  if (!url) {
    showUrlStatus('Please enter a URL', 'error');
    urlInput.classList.add('pulse-effect');
    setTimeout(() => urlInput.classList.remove('pulse-effect'), 600);
    return;
  }
  
  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    showUrlStatus('Please enter a valid URL', 'error');
    urlInput.classList.add('pulse-effect');
    setTimeout(() => urlInput.classList.remove('pulse-effect'), 600);
    return;
  }
  
  // Auto-convert GitHub URLs
  const originalUrl = url;
  url = convertGitHubUrl(url);
  
  if (originalUrl !== url) {
    showUrlStatus('🔄 Converting GitHub URL to raw format...', '');
    urlInput.value = url; // Update the input to show the converted URL
  }
  
  // Set loading state
  loadBtn.classList.add('loading');
  loadBtn.disabled = true;
  btnText.textContent = 'Loading...';
  showUrlStatus('Fetching data from URL...', '');
  
  try {
    // Add no-cors mode as fallback, but try normal fetch first
    let response;
    try {
      response = await fetch(url);
    } catch (corsError) {
      // If CORS fails, try with a proxy service
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      showUrlStatus('🔄 Trying CORS proxy...', '');
      response = await fetch(proxyUrl);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Response is not valid JSON');
    }
    
    // Validate it's excalidraw format
    if (!jsonData.elements || !Array.isArray(jsonData.elements)) {
      throw new Error('Invalid Excalidraw format: missing or invalid elements array');
    }
    
    // Success! Load the data
    const formattedJson = JSON.stringify(jsonData, null, 2);
    jsonEditor.value = formattedJson;
    renderFromJson();
    
    showUrlStatus(`✅ Loaded ${jsonData.elements.length} elements successfully!`, 'success');
    
    // Add success animation
    jsonEditor.classList.add('pulse-effect');
    setTimeout(() => jsonEditor.classList.remove('pulse-effect'), 600);
    
  } catch (error) {
    console.error('Error loading URL:', error);
    let errorMessage = 'Failed to load from URL: ';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage += 'Network error. ';
      if (url.includes('github.com')) {
        errorMessage += 'Make sure to use raw.githubusercontent.com URLs for GitHub files.';
      } else {
        errorMessage += 'The server may not allow cross-origin requests.';
      }
    } else if (error.message.includes('JSON')) {
      errorMessage += 'The response is not valid JSON format.';
    } else if (error.message.includes('Excalidraw')) {
      errorMessage += 'The file is not in Excalidraw format.';
    } else {
      errorMessage += error.message;
    }
    
    showUrlStatus(errorMessage, 'error');
    
    // Show helpful suggestions
    if (url.includes('github.com')) {
      setTimeout(() => {
        showUrlStatus('💡 Tip: Use the "Raw" button on GitHub to get the correct URL format', '');
      }, 3000);
    }
    
  } finally {
    // Reset loading state
    loadBtn.classList.remove('loading');
    loadBtn.disabled = false;
    btnText.textContent = 'Load URL';
  }
}

function showError(message) {
  const errorContainer = document.getElementById('error-container');
  errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

function clearError() {
  const errorContainer = document.getElementById('error-container');
  errorContainer.innerHTML = '';
}

function showUrlStatus(message, type = '') {
  const statusEl = document.getElementById('url-status');
  statusEl.textContent = message;
  statusEl.className = `url-status ${type}`;
  
  // Auto-clear status after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'url-status';
    }, 5000);
  }
}
