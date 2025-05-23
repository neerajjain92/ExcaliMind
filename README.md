# 🧠 ExcaliMind: The Intelligent Excalidraw Editor

**ExcaliMind is an advanced Excalidraw editor supercharged with AI capabilities, powered by Claude 3.5 Sonnet. It seamlessly integrates with GitHub for file hosting and version control, allowing you to edit, store, and version your diagrams, and use a real-time AI assistant to modify and enhance your creations through natural language.**

🚀 **[Try ExcaliMind Live](https://incomparable-llama-0d827c.netlify.app/)** - No installation required!

## ✨ Features

🎨 **Full Excalidraw Editor** - Complete drawing tools with professional UI  
📝 **Live JSON Editing** - Real-time sync between canvas and JSON  
🔗 **GitHub Integration** - Load diagrams directly from GitHub URLs  
🤖 **ExcaliMind AI Assistant (Claude 3.5 Sonnet)** - Intelligent diagram modification and creation  
⚡ **High Performance** - Optimized rendering with caching  
🎛️ **Properties Panel** - Comprehensive shape customization  
📱 **Responsive Design** - Works beautifully on all screen sizes  
☁️ **Production Ready** - Deployed on Netlify with serverless functions  

## 🚀 Quick Start

### Option 1: Use Online (Recommended)

🌐 **[Open ExcaliMind](https://incomparable-llama-0d827c.netlify.app/)**

1. **Enter your Claude API key** in the chat panel
2. **Start creating** diagrams with AI assistance
3. **Load existing diagrams** from GitHub URLs

### Option 2: Local Development

**Quick Start Script:**
```bash
./start-simple.sh
```

**Manual Setup:**
1. **Start the backend server:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Start the frontend (in a new terminal):**
   ```bash
   npm install
   npm run dev
   ```

3. **Open your browser:** http://localhost:5174

## 🤖 Claude AI Setup

1. **Get your Claude API key:**
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create an account and generate an API key

2. **Enter your API key:**
   - Look for the chat panel at the bottom
   - Enter your API key in the input field
   - Wait for the green "Connected" status

3. **Start chatting with Claude 3.5 Sonnet:**
   - "Add a red rectangle"
   - "Change all shapes to blue"
   - "Create a flowchart for user login"
   - "Make this diagram more colorful"
   - "Convert this into a system architecture diagram"

## 🎮 Demo Mode

Want to see Claude in action without an API key? Try the demo mode:
- Type any message in the chat
- Click "Try Demo Mode" when prompted
- Watch Claude add example shapes to your canvas!

## 🌐 Deployment

ExcaliMind is deployed on Netlify with serverless functions for the Claude API proxy.

### Deploy Your Own

1. **Fork this repository**
2. **Connect to Netlify:**
   - Import your forked repository
   - Netlify will auto-detect the build settings
3. **Deploy automatically** - No additional configuration needed!

The app works seamlessly in both development and production environments.

## 🛠️ Project Structure

```
├── src/                     # Frontend source code
│   ├── canvas.js           # Canvas rendering and interactions
│   ├── chat.js             # Claude AI integration (3.5 Sonnet)
│   ├── elements.js         # Shape creation and management
│   ├── toolbar.js          # Tool selection and properties
│   ├── jsonEditor.js       # JSON editing functionality
│   └── style.css           # Comprehensive styling
├── backend/                # Local development server
│   ├── server.js           # Express.js API proxy
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend documentation
├── netlify/                # Production deployment
│   └── functions/          # Serverless functions
│       └── claude-proxy.js # Claude API proxy for production
├── netlify.toml            # Netlify configuration
├── start-simple.sh         # Auto-start script
└── README.md              # This file
```

## 💡 Usage Examples

### Drawing Tools
- **Selection Tool (1)** - Select and manipulate shapes
- **Hand Tool (2)** - Pan around the canvas
- **Rectangle (3)** - Draw rectangles and squares
- **Diamond (4)** - Draw diamond shapes
- **Ellipse (5)** - Draw circles and ellipses
- **Arrow (6)** - Draw arrows between elements
- **Line (7)** - Draw straight lines
- **Draw (8)** - Freehand drawing
- **Text (9)** - Add text elements
- **Image (0)** - Insert image placeholders

### Claude AI Commands
- **"Add a title saying 'System Architecture'"** - Adds text elements
- **"Connect these boxes with arrows"** - Creates connecting arrows
- **"Change the background colors to match our brand"** - Updates shape properties
- **"Reorganize this into a grid layout"** - Restructures positioning
- **"Add labels to each component"** - Inserts descriptive text
- **"Make this look like a flowchart"** - Converts to flowchart format
- **"Create a database schema diagram"** - Generates complex diagrams

### JSON Editing
- Live sync between canvas and JSON editor
- Load diagrams from GitHub URLs (auto-converts to raw format)
- Export/import Excalidraw format
- Real-time validation and error handling

## 🔧 Development

### Prerequisites
- Node.js 16+ and npm
- Modern browser with ES6+ support

### Installation
```bash
# Clone the repository
git clone https://github.com/neerajjain92/ExcaliMind.git
cd ExcaliMind

# Install frontend dependencies
npm install

# Install backend dependencies (for local development)
cd backend
npm install
```

### Development Scripts
```bash
# Start both frontend and backend
./start-simple.sh

# Or manually:
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
npm run dev

# Build for production
npm run build
```

## 🎨 Customization

The editor is built with CSS custom properties for easy theming:

```css
:root {
  --color-accent: #007aff;
  --color-background: #ffffff;
  --color-text-primary: #333;
  /* ... and many more */
}
```

## 🔒 Security & Privacy

- **User-Controlled API Keys** - Users provide their own Claude API keys
- **Local Storage Only** - API keys stored locally in browser
- **No Server-Side Key Storage** - Your API key never leaves your browser
- **Serverless Architecture** - Secure proxy functions on Netlify
- **CORS Properly Configured** - Safe cross-origin requests
- **HTTPS Enforced** - Secure connections in production

## 📚 API Documentation

### Netlify Functions (Production)

- `GET /api/health` - Service health check
- `POST /api/claude/chat` - Claude 3.5 Sonnet proxy endpoint

### Local Development Endpoints

- `GET http://localhost:3001/health` - Local server health check
- `POST http://localhost:3001/api/claude/chat` - Local Claude API proxy

### Frontend Architecture

- **Canvas System** - High-performance rendering with offscreen caching
- **Element Management** - Immutable state with efficient updates
- **Tool System** - Extensible tool architecture
- **Properties Panel** - Dynamic property editing interface
- **Environment Awareness** - Works in both development and production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both locally and in production build
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

## 🎯 What Makes ExcaliMind Special?

This isn't just another drawing tool - it's a complete diagramming solution with AI superpowers:

✨ **Professional Grade** - Matches excalidraw.com in look and feel  
🧠 **Claude 3.5 Sonnet AI** - Latest and most advanced AI model for intelligent diagram creation  
🔄 **Live Sync** - Perfect harmony between visual editing and JSON manipulation  
⚡ **Blazing Fast** - Optimized rendering handles complex diagrams smoothly  
🌐 **Production Ready** - Deployed and accessible worldwide  
🛠️ **Developer Friendly** - Clean, modular codebase with comprehensive documentation  
🔐 **Privacy First** - User-controlled API keys, no server-side storage  

Perfect for architects, developers, designers, and anyone who wants to create beautiful diagrams with the power of AI assistance!

## 🌟 Recent Updates

- ✅ **Claude 3.5 Sonnet Integration** - Latest AI model with enhanced capabilities
- ✅ **Netlify Deployment** - Production-ready hosting with serverless functions  
- ✅ **Environment Awareness** - Seamless dev/production switching
- ✅ **User-Provided API Keys** - Sustainable, privacy-first approach
- ✅ **Performance Optimizations** - Faster rendering and better UX

---

**ExcaliMind - Diagramming evolved with Excalidraw, GitHub, and Claude 3.5 Sonnet AI** 

🚀 **[Start Creating Now →](https://incomparable-llama-0d827c.netlify.app/)** 