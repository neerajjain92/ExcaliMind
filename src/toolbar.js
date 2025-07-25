import { setTool, setStrokeColor, setFillColor, setStrokeWidth, groupSelectedElements, ungroupSelectedElements } from './canvas.js';

// Export selectTool as a standalone function
export function selectTool(tool) {
  const toolbar = document.getElementById('toolbar');
  const toolButtons = toolbar.querySelectorAll('.tool-btn');
  const button = toolbar.querySelector(`[data-tool="${tool}"]`);
  if (button) {
    toolButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    setTool(tool);
    
    // If a shape tool is selected, ensure properties panel might show relevant details
    // This is a placeholder for future, more complex property panel logic
    const shapeTools = ['rectangle', 'diamond', 'ellipse', 'arrow', 'line', 'freedraw', 'text'];
    if (shapeTools.includes(tool)) {
      document.body.classList.add('shape-tool-active');
    } else {
      document.body.classList.remove('shape-tool-active');
    }
  }
}

// Setup keyboard shortcuts - call this once from main.js
export function setupKeyboardShortcuts() {
  // Remove any existing keyboard listeners to prevent duplicates
  const existingListener = window.toolbarKeyboardListener;
  if (existingListener) {
    document.removeEventListener('keydown', existingListener);
  }

  // Create new keyboard listener
  const keyboardListener = (e) => {
    // Don't trigger shortcuts when typing in inputs or textareas
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable) {
      return;
    }
    
    // Don't trigger if any modifier keys are pressed
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    
    switch (e.key) {
      case '1':
        e.preventDefault();
        selectTool('selection');
        break;
      case '2':
        e.preventDefault();
        selectTool('hand');
        break;
      case '3':
        e.preventDefault();
        selectTool('rectangle');
        break;
      case '4':
        e.preventDefault();
        selectTool('diamond');
        break;
      case '5':
        e.preventDefault();
        selectTool('ellipse');
        break;
      case '6':
        e.preventDefault();
        selectTool('arrow');
        break;
      case '7':
        e.preventDefault();
        selectTool('line');
        break;
      case '8':
        e.preventDefault();
        selectTool('freedraw');
        break;
      case '9':
        e.preventDefault();
        selectTool('text');
        break;
      case '0':
        e.preventDefault();
        selectTool('image');
        break;
    }
  };

  // Store reference and add listener
  window.toolbarKeyboardListener = keyboardListener;
  document.addEventListener('keydown', keyboardListener);
}

// Show/hide properties panel
function togglePropertiesPanel(show) {
  const panel = document.getElementById('properties-panel');
  if (show) {
    panel.style.display = 'block';
    panel.classList.add('visible');
  } else {
    panel.classList.remove('visible');
    setTimeout(() => {
      if (!panel.classList.contains('visible')) {
        panel.style.display = 'none';
      }
    }, 200);
  }
}

export function setupToolbar() {
  const toolbar = document.getElementById('toolbar');
  
  toolbar.innerHTML = `
    <!-- Main Toolbar -->
    <div class="main-toolbar">
      <div class="tool-group">
        <button class="tool-btn active" data-tool="selection" data-shortcut="1" title="Selection (1)">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path></svg>
        </button>
        <button class="tool-btn" data-tool="hand" data-shortcut="2" title="Hand (2)">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>
        </button>
      </div>
        
      <div class="tool-separator"></div>
      
      <div class="tool-group">
        <button class="tool-btn" data-tool="rectangle" data-shortcut="3" title="Rectangle (3)">
          <svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="0" ry="0"></rect></svg>
        </button>
        <button class="tool-btn" data-tool="diamond" data-shortcut="4" title="Diamond (4)">
          <svg width="20" height="20" viewBox="0 0 24 24"><polygon points="12 2 22 12 12 22 2 12 12 2"></polygon></svg>
        </button>
        <button class="tool-btn" data-tool="ellipse" data-shortcut="5" title="Ellipse (5)">
          <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>
        </button>
        <button class="tool-btn" data-tool="arrow" data-shortcut="6" title="Arrow (6)">
          <svg width="20" height="20" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
        <button class="tool-btn" data-tool="line" data-shortcut="7" title="Line (7)">
          <svg width="20" height="20" viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5"></line></svg>
        </button>
      </div>

      <div class="tool-separator"></div>
      
      <div class="tool-group">
        <button class="tool-btn" data-tool="freedraw" data-shortcut="8" title="Draw (8)">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
        </button>
        <button class="tool-btn" data-tool="text" data-shortcut="9" title="Text (9)">
          <svg width="20" height="20" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
        </button>
        <button class="tool-btn" data-tool="image" data-shortcut="0" title="Insert Image (0)">
           <svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        </button>
        <button class="tool-btn" data-tool="eraser" title="Eraser">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path><path d="M22 21H7"></path><path d="m5 11 9 9"></path></svg>
        </button>
      </div>

      <div class="tool-separator-large"></div>

      <!-- Quick Properties Toggle -->
      <button id="properties-toggle" class="tool-btn" title="Properties">
        <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
      </button>
    </div>

    <!-- Properties Panel (floating) -->
    <div id="properties-panel" class="properties-panel">
      <div class="panel-header">
        <span>Properties</span>
        <button id="close-properties" class="close-btn">×</button>
      </div>
      
      <div class="panel-content">
        <!-- Stroke Section -->
        <div class="property-section">
          <label class="property-label">Stroke</label>
          <div class="color-palette stroke-colors">
            <button class="color-btn active" data-color="#1e1e1e" style="background-color: #1e1e1e;" title="Black"></button>
            <button class="color-btn" data-color="#e03131" style="background-color: #e03131;" title="Red"></button>
            <button class="color-btn" data-color="#2f9e44" style="background-color: #2f9e44;" title="Green"></button>
            <button class="color-btn" data-color="#1971c2" style="background-color: #1971c2;" title="Blue"></button>
            <button class="color-btn" data-color="#f08c00" style="background-color: #f08c00;" title="Orange"></button>
            <button class="color-btn" data-color="#333" style="background-color: #333;" title="Dark Gray"></button>
          </div>
        </div>

        <!-- Background Section -->
        <div class="property-section">
          <label class="property-label">Background</label>
          <div class="color-palette bg-colors">
            <button class="color-btn bg-transparent active" data-fill="transparent" title="Transparent">
              <div class="transparent-bg"></div>
            </button>
            <button class="color-btn" data-fill="#ffdbdb" style="background-color: #ffdbdb;" title="Light Pink"></button>
            <button class="color-btn" data-fill="#dbf4dd" style="background-color: #dbf4dd;" title="Light Green"></button>
            <button class="color-btn" data-fill="#d3f3fd" style="background-color: #d3f3fd;" title="Light Blue"></button>
            <button class="color-btn" data-fill="#fff3d3" style="background-color: #fff3d3;" title="Light Yellow"></button>
            <button class="color-btn bg-none" data-fill="none" title="No Background">
              <svg width="20" height="20" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <!-- Stroke Width Section -->
        <div class="property-section">
          <label class="property-label">Stroke width</label>
          <div class="button-group stroke-width-group">
            <button class="property-btn active" data-width="1" title="Thin">
              <div class="stroke-preview" style="height: 1px;"></div>
            </button>
            <button class="property-btn" data-width="2" title="Medium">
              <div class="stroke-preview" style="height: 2px;"></div>
            </button>
            <button class="property-btn" data-width="4" title="Thick">
              <div class="stroke-preview" style="height: 4px;"></div>
            </button>
          </div>
        </div>

        <!-- Stroke Style Section -->
        <div class="property-section">
          <label class="property-label">Stroke style</label>
          <div class="button-group stroke-style-group">
            <button class="property-btn active" data-style="solid" title="Solid">
              <svg width="32" height="20" viewBox="0 0 32 20"><line x1="4" y1="10" x2="28" y2="10" stroke="currentColor" stroke-width="2"></line></svg>
            </button>
            <button class="property-btn" data-style="dashed" title="Dashed">
              <svg width="32" height="20" viewBox="0 0 32 20"><line x1="4" y1="10" x2="28" y2="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4,3"></line></svg>
            </button>
            <button class="property-btn" data-style="dotted" title="Dotted">
              <svg width="32" height="20" viewBox="0 0 32 20"><line x1="4" y1="10" x2="28" y2="10" stroke="currentColor" stroke-width="2" stroke-dasharray="1,2"></line></svg>
            </button>
          </div>
        </div>

        <!-- Sloppiness Section -->
        <div class="property-section">
          <label class="property-label">Sloppiness</label>
          <div class="button-group sloppiness-group">
            <button class="property-btn" data-sloppiness="0" title="Architect">
              <svg width="32" height="20" viewBox="0 0 32 20"><path d="M4 10 L28 10" stroke="currentColor" stroke-width="2" fill="none"></path></svg>
            </button>
            <button class="property-btn active" data-sloppiness="1" title="Artist">
              <svg width="32" height="20" viewBox="0 0 32 20"><path d="M4 10 Q12 8 16 10 T28 10" stroke="currentColor" stroke-width="2" fill="none"></path></svg>
            </button>
            <button class="property-btn" data-sloppiness="2" title="Cartoonist">
              <svg width="32" height="20" viewBox="0 0 32 20"><path d="M4 10 Q8 6 12 10 T20 8 T28 10" stroke="currentColor" stroke-width="2" fill="none"></path></svg>
            </button>
          </div>
        </div>

        <!-- Edges Section -->
        <div class="property-section">
          <label class="property-label">Edges</label>
          <div class="button-group edges-group">
            <button class="property-btn active" data-edges="sharp" title="Sharp">
              <svg width="20" height="20" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="0" stroke="currentColor" stroke-width="1.5" fill="none" stroke-dasharray="2,1"></rect></svg>
            </button>
            <button class="property-btn" data-edges="round" title="Round">
              <svg width="20" height="20" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-dasharray="2,1"></rect></svg>
            </button>
          </div>
        </div>

        <!-- Opacity Section -->
        <div class="property-section">
          <label class="property-label">Opacity</label>
          <div class="slider-group">
            <input type="range" id="opacity-slider" min="0" max="100" value="100" class="opacity-slider">
            <div class="slider-values">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>

        <!-- Layers Section -->
        <div class="property-section">
          <label class="property-label">Layers</label>
          <div class="button-group layers-group">
            <button class="property-btn" data-layer="send-to-back" title="Send to back">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M7 16V4h10v12m-10 4h10" stroke="currentColor" stroke-width="2" fill="none"></path></svg>
            </button>
            <button class="property-btn" data-layer="send-backward" title="Send backward">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 19v-7m0 0l-3 3m3-3l3 3" stroke="currentColor" stroke-width="2" fill="none"></path></svg>
            </button>
            <button class="property-btn" data-layer="bring-forward" title="Bring forward">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 5v7m0 0l3-3m-3 3l-3-3" stroke="currentColor" stroke-width="2" fill="none"></path></svg>
            </button>
            <button class="property-btn" data-layer="bring-to-front" title="Bring to front">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M7 8V20h10V8M7 4h10v4" stroke="currentColor" stroke-width="2" fill="none"></path></svg>
            </button>
          </div>
        </div>

        <!-- Grouping Section -->
        <div class="property-section" id="grouping-section">
          <label class="property-label">Grouping</label>
          <div class="button-group grouping-group">
            <button class="property-btn" id="group-btn" title="Group selected elements">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="14" y="2" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="2" y="14" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="14" y="14" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="1" y="1" width="22" height="22" rx="2" stroke="currentColor" stroke-width="1" fill="none" stroke-dasharray="3,3"/>
              </svg>
            </button>
            <button class="property-btn" id="ungroup-btn" title="Ungroup selected elements">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="2"/>
                <line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add event listeners for main tools
  const mainToolButtons = toolbar.querySelectorAll('.tool-btn[data-tool]');
  mainToolButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectTool(button.dataset.tool);
    });
  });

  // Properties panel toggle
  const propertiesToggle = document.getElementById('properties-toggle');
  const propertiesPanel = document.getElementById('properties-panel');
  const closeProperties = document.getElementById('close-properties');

  propertiesToggle.addEventListener('click', () => {
    togglePropertiesPanel(!propertiesPanel.classList.contains('visible'));
  });

  closeProperties.addEventListener('click', () => {
    togglePropertiesPanel(false);
  });

  // Stroke color event listeners
  const strokeColorButtons = toolbar.querySelectorAll('.stroke-colors .color-btn');
  strokeColorButtons.forEach(button => {
    button.addEventListener('click', () => {
      strokeColorButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      setStrokeColor(button.dataset.color);
    });
  });

  // Background color event listeners
  const bgColorButtons = toolbar.querySelectorAll('.bg-colors .color-btn');
  bgColorButtons.forEach(button => {
    button.addEventListener('click', () => {
      bgColorButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const fillValue = button.dataset.fill;
      setFillColor(fillValue === 'none' ? 'transparent' : fillValue);
    });
  });

  // Stroke width event listeners
  const strokeWidthButtons = toolbar.querySelectorAll('.stroke-width-group .property-btn');
  strokeWidthButtons.forEach(button => {
    button.addEventListener('click', () => {
      strokeWidthButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      setStrokeWidth(parseInt(button.dataset.width));
    });
  });

  // Stroke style event listeners
  const strokeStyleButtons = toolbar.querySelectorAll('.stroke-style-group .property-btn');
  strokeStyleButtons.forEach(button => {
    button.addEventListener('click', () => {
      strokeStyleButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      // TODO: Implement stroke style in canvas.js
      console.log('Stroke style:', button.dataset.style);
    });
  });

  // Sloppiness event listeners
  const sloppinessButtons = toolbar.querySelectorAll('.sloppiness-group .property-btn');
  sloppinessButtons.forEach(button => {
    button.addEventListener('click', () => {
      sloppinessButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      // TODO: Implement sloppiness in canvas.js
      console.log('Sloppiness:', button.dataset.sloppiness);
    });
  });

  // Edges event listeners
  const edgesButtons = toolbar.querySelectorAll('.edges-group .property-btn');
  edgesButtons.forEach(button => {
    button.addEventListener('click', () => {
      edgesButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      // TODO: Implement edges in canvas.js
      console.log('Edges:', button.dataset.edges);
    });
  });

  // Opacity slider event listener
  const opacitySlider = document.getElementById('opacity-slider');
  opacitySlider.addEventListener('input', (e) => {
    // TODO: Implement opacity in canvas.js
    console.log('Opacity:', e.target.value);
  });

  // Layer controls event listeners
  const layerButtons = toolbar.querySelectorAll('.layers-group .property-btn');
  layerButtons.forEach(button => {
    button.addEventListener('click', () => {
      // TODO: Implement layer controls in canvas.js
      console.log('Layer action:', button.dataset.layer);
    });
  });

  // Grouping controls event listeners
  const groupBtn = document.getElementById('group-btn');
  const ungroupBtn = document.getElementById('ungroup-btn');
  
  groupBtn.addEventListener('click', () => {
    console.log('Group button clicked');
    groupSelectedElements();
    updateGroupingUI();
  });
  
  ungroupBtn.addEventListener('click', () => {
    console.log('Ungroup button clicked');
    ungroupSelectedElements();
    updateGroupingUI();
  });
}

// Function to update grouping UI based on selection
export function updateGroupingUI() {
  const groupingSection = document.getElementById('grouping-section');
  const groupBtn = document.getElementById('group-btn');
  const ungroupBtn = document.getElementById('ungroup-btn');
  
  if (!groupingSection || !groupBtn || !ungroupBtn) return;
  
  // Get selection info from canvas (we'll need to pass this as parameters)
  // For now, we'll check if the properties panel is visible and has multiple items
  const propertiesPanel = document.getElementById('properties-panel');
  if (!propertiesPanel || !propertiesPanel.classList.contains('visible')) {
    groupingSection.classList.remove('visible');
    return;
  }
  
  // We'll need to get selection info from canvas.js
  // For now, show grouping section when properties panel is open
  groupingSection.classList.add('visible');
}

// Updated function that takes selection info as parameters
export function updateGroupingUIWithSelection(selectedElements) {
  const groupingSection = document.getElementById('grouping-section');
  const groupBtn = document.getElementById('group-btn');
  const ungroupBtn = document.getElementById('ungroup-btn');
  
  if (!groupingSection || !groupBtn || !ungroupBtn) return;
  
  if (selectedElements.length < 2) {
    // Hide grouping section if less than 2 elements selected
    groupingSection.classList.remove('visible');
    return;
  }
  
  // Show grouping section for multiple selections
  groupingSection.classList.add('visible');
  
  // Enable/disable buttons based on selection state
  const hasGroupedElement = selectedElements.some(el => el.groupId);
  const allInSameGroup = selectedElements.length > 1 && 
                        selectedElements.every(el => el.groupId && el.groupId === selectedElements[0].groupId);
  
  // Enable group button if multiple elements selected and not all in same group
  groupBtn.disabled = selectedElements.length < 2 || allInSameGroup;
  groupBtn.classList.toggle('disabled', groupBtn.disabled);
  
  // Enable ungroup button if selection contains grouped elements
  ungroupBtn.disabled = !hasGroupedElement;
  ungroupBtn.classList.toggle('disabled', ungroupBtn.disabled);
}

