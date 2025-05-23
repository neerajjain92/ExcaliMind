import './style.css';
import { initCanvas } from './canvas.js';
import { setupToolbar, setupKeyboardShortcuts } from './toolbar.js';
import { setupJsonEditor } from './jsonEditor.js';
import { setupChat } from './chat.js';

document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="main-content">
      <div class="editor-panel">
        <div class="url-loader">
          <div class="url-input-container">
            <input 
              type="url" 
              id="url-input" 
              class="url-input" 
              placeholder="Enter GitHub URL or direct JSON URL - GitHub URLs will be auto-converted to raw format"
            />
            <button class="load-url-btn" id="load-url-btn">
              <span id="btn-text">Load URL</span>
            </button>
          </div>
          <div class="url-status" id="url-status"></div>
        </div>
        <div class="panel-header">
          <div>
            <span>JSON Editor</span>
            <span class="status"> - .excalidraw format</span>
          </div>
          <div class="panel-header-actions">
            <button class="panel-toggle-btn" id="toggle-json-panel-btn" title="Toggle JSON Panel">
              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='15 18 9 12 15 6'></polyline></svg>
            </button>
            <button class="load-sample-btn" id="load-sample-btn">Load Sample</button>
            <button class="render-btn" id="render-btn">Render</button>
          </div>
        </div>
        <div id="error-container"></div>
        <textarea 
          id="json-editor" 
          class="editor" 
          placeholder="Paste your Excalidraw JSON data here..."
          spellcheck="false"
        ></textarea>
      </div>
      
      <div class="preview-panel">
        <div class="panel-header">
          <span>Excalidraw Editor</span>
          <span class="status" id="element-count">0 elements</span>
        </div>
        <div class="toolbar" id="toolbar"></div>
        <div class="canvas-container">
          <canvas id="excalidraw-canvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Chat Panel -->
    <div class="chat-panel" id="chat-panel">
      <div class="chat-header">
        <div class="chat-header-left">
          <h3>Claude AI Assistant</h3>
          <input 
            type="password" 
            id="claude-api-key" 
            class="api-key-input" 
            placeholder="Enter Claude API Key"
          />
          <div class="connection-status">
            <div class="status-indicator" id="connection-status"></div>
            <span id="connection-text">Not connected</span>
          </div>
        </div>
        <button class="chat-toggle" id="chat-toggle" title="Toggle Chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>
      
      <div class="chat-content" id="chat-content">
        <div class="chat-message system">
          Welcome! I'm Claude AI and I can help modify your Excalidraw diagrams.<br><br>
          🚀 <strong>Quick Setup:</strong><br>
          1. Enter your Claude API key above<br>
          2. Start chatting!<br><br>
          💡 Or try the demo mode to see how it works!<br><br>
          I can add shapes, change colors, reorganize layouts, and more. Just describe what you want!
        </div>
      </div>
      
      <div class="chat-input-area">
        <div class="chat-input-container">
          <textarea 
            id="chat-input" 
            class="chat-input" 
            placeholder="Ask me to modify your diagram, add shapes, change colors, etc..."
            rows="1"
          ></textarea>
          <button id="chat-send" class="chat-send-btn" disabled>
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
`;

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
  setupToolbar();
  setupKeyboardShortcuts(); // Setup keyboard shortcuts once
  setupJsonEditor();
  setupChat();
  // Initialize canvas after DOM is fully loaded
  setTimeout(() => {
    initCanvas();
  }, 0);

  // JSON panel toggle functionality
  const toggleJsonPanelBtn = document.getElementById('toggle-json-panel-btn');
  const editorPanel = document.querySelector('.editor-panel');
  const container = document.querySelector('.container');
  const toggleIcon = toggleJsonPanelBtn.querySelector('svg');

  // Function to apply panel state
  function applyPanelState(isCollapsed) {
    if (isCollapsed) {
      editorPanel.classList.add('collapsed');
      container.classList.add('json-panel-collapsed');
      toggleIcon.style.transform = 'rotate(180deg)';
      toggleJsonPanelBtn.title = 'Expand JSON Panel';
    } else {
      editorPanel.classList.remove('collapsed');
      container.classList.remove('json-panel-collapsed');
      toggleIcon.style.transform = 'rotate(0deg)';
      toggleJsonPanelBtn.title = 'Collapse JSON Panel';
    }
    // Trigger a resize event to allow canvas to readjust if necessary
    window.dispatchEvent(new Event('resize'));
  }

  // Load saved state and apply
  const isJsonPanelCollapsed = localStorage.getItem('jsonPanelCollapsed') === 'true';
  applyPanelState(isJsonPanelCollapsed);

  toggleJsonPanelBtn.addEventListener('click', () => {
    const willCollapse = !editorPanel.classList.contains('collapsed');
    applyPanelState(willCollapse);
    localStorage.setItem('jsonPanelCollapsed', willCollapse);
  });

  // Chat panel toggle functionality
  const chatToggle = document.getElementById('chat-toggle');
  const chatPanel = document.getElementById('chat-panel');

  function applyChatState(isCollapsed) {
    if (isCollapsed) {
      chatPanel.classList.add('collapsed');
      container.classList.add('chat-collapsed');
      chatToggle.title = 'Expand Chat';
    } else {
      chatPanel.classList.remove('collapsed');
      container.classList.remove('chat-collapsed');
      chatToggle.title = 'Collapse Chat';
    }
    // Trigger a resize event to allow canvas to readjust
    window.dispatchEvent(new Event('resize'));
  }

  // Load saved chat state
  const isChatCollapsed = localStorage.getItem('chatCollapsed') === 'true';
  applyChatState(isChatCollapsed);

  chatToggle.addEventListener('click', () => {
    const willCollapse = !chatPanel.classList.contains('collapsed');
    applyChatState(willCollapse);
    localStorage.setItem('chatCollapsed', willCollapse);
  });
});
