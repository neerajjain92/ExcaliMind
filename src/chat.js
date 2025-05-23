import { getElements, setElements } from './canvas.js';
import { updateJsonEditor } from './jsonEditor.js';

// Chat state
let apiKey = '';
let isConnected = false;
let chatHistory = [];

// Environment-aware API base URL
const CLAUDE_API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001/api' 
  : '/api'; // For production (Netlify), use relative path

export function setupChat() {
  const apiKeyInput = document.getElementById('claude-api-key');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatContent = document.getElementById('chat-content');
  const connectionStatus = document.getElementById('connection-status');
  const connectionText = document.getElementById('connection-text');

  // Load saved API key
  const savedApiKey = localStorage.getItem('claudeApiKey');
  if (savedApiKey) {
    apiKey = savedApiKey;
    apiKeyInput.value = apiKey;
    updateConnectionStatus(true);
  }

  // API key input handler
  apiKeyInput.addEventListener('input', (e) => {
    apiKey = e.target.value.trim();
    if (apiKey) {
      localStorage.setItem('claudeApiKey', apiKey);
      updateConnectionStatus(true);
    } else {
      localStorage.removeItem('claudeApiKey');
      updateConnectionStatus(false);
    }
    updateSendButtonState();
  });

  // Chat input handlers
  chatInput.addEventListener('input', () => {
    updateSendButtonState();
    // Auto-resize textarea
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  chatSend.addEventListener('click', sendMessage);

  function updateConnectionStatus(connected) {
    isConnected = connected;
    connectionStatus.className = `status-indicator ${connected ? 'connected' : ''}`;
    connectionText.textContent = connected ? 'Connected' : 'Not connected';
  }

  function updateSendButtonState() {
    const hasInput = chatInput.value.trim().length > 0;
    const canSend = hasInput && isConnected && !isSending;
    chatSend.disabled = !canSend;
  }

  let isSending = false;

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !isConnected || isSending) return;

    isSending = true;
    updateSendButtonState();

    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Show typing indicator
    const typingIndicator = addTypingIndicator();

    try {
      // Get current Excalidraw context
      const currentElements = getElements();
      const excalidrawContext = {
        type: "excalidraw",
        version: 2,
        source: "https://excalidraw.com",
        elements: currentElements,
        appState: {
          gridSize: null,
          viewBackgroundColor: "#ffffff"
        },
        files: {}
      };

      // Prepare system prompt with context
      const systemPrompt = `You are an AI assistant helping with Excalidraw diagrams. You have access to the current diagram's JSON and can modify it.

Current Excalidraw JSON:
${JSON.stringify(excalidrawContext, null, 2)}

Guidelines:
1. When modifying the diagram, return the complete updated JSON in a code block marked with \`\`\`json
2. You can add, remove, or modify elements (rectangles, ellipses, arrows, text, etc.)
3. Maintain proper Excalidraw format with all required properties
4. Generate unique IDs for new elements
5. Explain what changes you're making before providing the JSON
6. If no JSON changes are needed, just provide helpful information

User capabilities in this editor:
- Drawing shapes (rectangle, diamond, ellipse, arrow, line, freedraw)
- Adding text and images
- Selection and manipulation tools
- Pan and zoom
- Properties panel for colors, stroke width, etc.

Be helpful, concise, and always provide working JSON when making changes.`;

      // Send to Claude API via backend server
      const response = await fetch(`${CLAUDE_API_BASE_URL}/claude/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-claude-api-key': apiKey
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            ...chatHistory,
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;

      // Remove typing indicator
      removeTypingIndicator(typingIndicator);

      // Add assistant response to chat
      addMessageToChat('assistant', assistantMessage);

      // Update chat history
      chatHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage }
      );

      // Keep only last 10 exchanges to manage token usage
      if (chatHistory.length > 20) {
        chatHistory = chatHistory.slice(-20);
      }

      // Check if response contains JSON and apply it
      const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const newExcalidrawData = JSON.parse(jsonMatch[1]);
          if (newExcalidrawData.elements && Array.isArray(newExcalidrawData.elements)) {
            // Apply the new elements to the canvas
            setElements(newExcalidrawData.elements);
            
            // Update the JSON editor
            updateJsonEditor(newExcalidrawData.elements);
            
            // Show success message
            addMessageToChat('system', '✅ Diagram updated successfully!');
          }
        } catch (jsonError) {
          console.error('Error parsing JSON from response:', jsonError);
          addMessageToChat('system', '⚠️ JSON in response was malformed and could not be applied.');
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove typing indicator
      removeTypingIndicator(typingIndicator);
      
      // Show error message with helpful guidance
      let errorMessage = '';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (import.meta.env.DEV) {
          errorMessage = `🔒 <strong>Backend Server Not Running</strong><br><br>
          The backend server is not accessible. Please:<br><br>
          <strong>1. Start the backend server:</strong><br>
          • Open a new terminal<br>
          • Run: <code>cd backend && npm install && npm start</code><br>
          • Server should start on http://localhost:3001<br><br>
          <strong>2. Or try demo mode:</strong><br>
          <button onclick="window.chatDemo && window.chatDemo()" style="background: #007aff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Try Demo Mode</button>`;
        } else {
          errorMessage = `🔒 <strong>API Server Error</strong><br><br>
          Unable to connect to the AI service. This could be a temporary issue.<br><br>
          <strong>Try:</strong><br>
          • Refresh the page and try again<br>
          • Check your internet connection<br>
          • Or try demo mode:<br>
          <button onclick="window.chatDemo && window.chatDemo()" style="background: #007aff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Try Demo Mode</button>`;
        }
      } else if (error.message.includes('401')) {
        errorMessage = '🔑 Invalid API key. Please check your Claude API key.';
        updateConnectionStatus(false);
      } else if (error.message.includes('429')) {
        errorMessage = '⏱️ Rate limit exceeded. Please wait a moment before trying again.';
      } else if (error.message.includes('400')) {
        errorMessage = '📝 Invalid request format. Please try again.';
      } else if (error.message.includes('500')) {
        errorMessage = '🔧 Backend server error. Check the server logs for details.';
      } else {
        errorMessage = `❓ Unexpected error: ${error.message}`;
      }
      
      addMessageToChat('system', errorMessage);
      
      // For debugging - show detailed error in console
      console.log('Detailed error info:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } finally {
      isSending = false;
      updateSendButtonState();
    }
  }

  function addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    
    if (role === 'assistant') {
      // Convert markdown-style formatting to HTML
      content = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    }
    
    messageDiv.innerHTML = content;
    chatContent.appendChild(messageDiv);
    
    // Scroll to bottom
    chatContent.scrollTop = chatContent.scrollHeight;
    
    return messageDiv;
  }

  function addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
      <span>Claude is thinking</span>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    chatContent.appendChild(indicator);
    chatContent.scrollTop = chatContent.scrollHeight;
    return indicator;
  }

  function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  // Initialize send button state
  updateSendButtonState();

  // Add demo mode to global scope
  window.chatDemo = function() {
    const currentElements = getElements();
    
    const demoResponse = `I'll demonstrate by adding a colorful title and some example shapes to your diagram!`;
    const demoJson = {
      "type": "excalidraw",
      "version": 2,
      "source": "https://excalidraw.com",
      "elements": [
        ...currentElements,
        {
          "id": "demo-title-" + Date.now(),
          "type": "text",
          "x": 200,
          "y": 50,
          "width": 300,
          "height": 40,
          "angle": 0,
          "strokeColor": "#e03131",
          "backgroundColor": "transparent",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "text": "🚀 Claude AI Demo",
          "fontSize": 28,
          "fontFamily": 1,
          "textAlign": "center",
          "verticalAlign": "middle",
          "baseline": 24,
          "seed": Math.floor(Math.random() * 2000000000),
          "groupIds": [],
          "frameId": null,
          "roundness": null,
          "boundElements": [],
          "updated": Date.now(),
          "link": null,
          "locked": false
        },
        {
          "id": "demo-rect-" + Date.now(),
          "type": "rectangle",
          "x": 150,
          "y": 120,
          "width": 200,
          "height": 100,
          "angle": 0,
          "strokeColor": "#1971c2",
          "backgroundColor": "#d3f3fd",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "seed": Math.floor(Math.random() * 2000000000),
          "groupIds": [],
          "frameId": null,
          "roundness": { "type": 2 },
          "boundElements": [],
          "updated": Date.now(),
          "link": null,
          "locked": false
        },
        {
          "id": "demo-circle-" + Date.now(),
          "type": "ellipse",
          "x": 400,
          "y": 120,
          "width": 120,
          "height": 120,
          "angle": 0,
          "strokeColor": "#2f9e44",
          "backgroundColor": "#dbf4dd",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "seed": Math.floor(Math.random() * 2000000000),
          "groupIds": [],
          "frameId": null,
          "roundness": null,
          "boundElements": [],
          "updated": Date.now(),
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

    addMessageToChat('assistant', demoResponse);
    
    // Apply the demo JSON
    setElements(demoJson.elements);
    updateJsonEditor(demoJson.elements);
    addMessageToChat('system', '✅ Demo shapes added! This shows how Claude would modify your diagram.');
  };
} 