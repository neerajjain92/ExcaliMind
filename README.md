# 🧠 ExcaliMind: The Intelligent Excalidraw Editor

**ExcaliMind is an advanced Excalidraw editor supercharged with AI capabilities, powered by Claude. It seamlessly integrates with GitHub for file hosting and version control, allowing you to edit, store, and version your diagrams, and use a real-time AI assistant to modify and enhance your creations through natural language.**

## ✨ Features

🎨 **Full Excalidraw Editor** - Complete drawing tools with professional UI  
📝 **Live JSON Editing** - Real-time sync between canvas and JSON  
🔗 **GitHub Integration** - Load diagrams directly from GitHub URLs  
🤖 **ExcaliMind AI Assistant (powered by Claude)** - Intelligent diagram modification and creation  
⚡ **High Performance** - Optimized rendering with caching  
🎛️ **Properties Panel** - Comprehensive shape customization  
📱 **Responsive Design** - Works beautifully on all screen sizes  

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)

**Mac/Linux:**
```bash
./start-both.sh
```

**Windows:**
```bash
start-both.bat
```

### Option 2: Manual Setup

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

3. **Start chatting with Claude:**
   - "Add a red rectangle"
   - "Change all shapes to blue"
   - "Create a flowchart for user login"
   - "Make this diagram more colorful"

## 🎮 Demo Mode

Want to see Claude in action without an API key? Try the demo mode:
- Type any message in the chat
- Click "Try Demo Mode" when you see the error
- Watch Claude add example shapes to your canvas!

## 🛠️ Project Structure

```
├── src/                 # Frontend source code
│   ├── canvas.js       # Canvas rendering and interactions
│   ├── chat.js         # Claude AI integration
│   ├── elements.js     # Shape creation and management
│   ├── toolbar.js      # Tool selection and properties
│   ├── jsonEditor.js   # JSON editing functionality
│   └── style.css       # Comprehensive styling
├── backend/            # Backend server
│   ├── server.js       # Express.js API proxy
│   ├── package.json    # Backend dependencies
│   └── README.md       # Backend documentation
├── start-both.sh       # Auto-start script (Mac/Linux)
├── start-both.bat      # Auto-start script (Windows)
└── README.md          # This file
```

## 💡 Usage Examples

### Drawing Tools
- **Selection Tool (V)** - Select and manipulate shapes
- **Hand Tool (H)** - Pan around the canvas
- **Rectangle (R)** - Draw rectangles and squares
- **Diamond (D)** - Draw diamond shapes
- **Ellipse (E)** - Draw circles and ellipses
- **Arrow (A)** - Draw arrows between elements
- **Line (L)** - Draw straight lines
- **Draw (P)** - Freehand drawing
- **Text (T)** - Add text elements
- **Image (I)** - Insert image placeholders

### Claude AI Commands
- **"Add a title saying 'System Architecture'"** - Adds text elements
- **"Connect these boxes with arrows"** - Creates connecting arrows
- **"Change the background to light blue"** - Updates shape properties
- **"Reorganize this into a grid layout"** - Restructures positioning
- **"Add labels to each component"** - Inserts descriptive text
- **"Make this look like a flowchart"** - Converts to flowchart format

### JSON Editing
- Live sync between canvas and JSON editor
- Load diagrams from GitHub URLs
- Export/import Excalidraw format
- Real-time validation and error handling

## 🔧 Development

### Prerequisites
- Node.js 16+ and npm
- Modern browser with ES6+ support

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd excalidraw_json_editor_with_interactive_canvas

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Development Scripts
```bash
# Start frontend only
npm run dev

# Start backend only
cd backend && npm run dev

# Start both (automatic)
./start-both.sh   # Mac/Linux
start-both.bat    # Windows
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

## 🔒 Security Notes

- API keys are stored locally in browser storage
- Backend server runs locally (no data sent to external servers except Claude API)
- CORS is properly configured for local development
- For production deployment, configure HTTPS and environment variables

## 📚 API Documentation

### Backend Endpoints

- `GET /health` - Server health check
- `POST /api/claude/chat` - Claude AI proxy endpoint

### Frontend Architecture

- **Canvas System** - High-performance rendering with offscreen caching
- **Element Management** - Immutable state with efficient updates
- **Tool System** - Extensible tool architecture
- **Properties Panel** - Dynamic property editing interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

## 🎯 What Makes This Special?

This isn't just another drawing tool - it's a complete diagramming solution with AI superpowers:

✨ **Professional Grade** - Matches excalidraw.com in look and feel  
🧠 **ExcaliMind AI (Claude Engine)** - Understands your diagrams and can modify them intelligently  
🔄 **Live Sync** - Perfect harmony between visual editing and JSON manipulation  
⚡ **Blazing Fast** - Optimized rendering handles complex diagrams smoothly  
🛠️ **Developer Friendly** - Clean, modular codebase with comprehensive documentation  

Perfect for architects, developers, designers, and anyone who wants to create beautiful diagrams with the power of AI assistance!

---

**ExcaliMind - Diagramming evolved with Excalidraw, GitHub, and Claude AI** 