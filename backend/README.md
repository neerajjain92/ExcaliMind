# 🚀 Claude API Backend Server

This is a simple Express.js proxy server that handles Claude API requests for the Excalidraw editor, bypassing CORS restrictions.

## 🏃 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Server will be running on:** `http://localhost:3001`

## 🔍 Endpoints

- **Health Check:** `GET /health`
- **Claude Chat:** `POST /api/claude/chat`

## 🔑 API Key

The server expects the Claude API key to be passed in the request headers as `x-claude-api-key`. The frontend automatically handles this.

## 🛠️ Development

The server automatically enables CORS for:
- `http://localhost:5174` (Vite dev server)
- `http://localhost:3000` (Alternative frontend)
- `http://127.0.0.1:5174`

## 📝 Request Format

The `/api/claude/chat` endpoint expects:

```json
{
  "messages": [
    {"role": "user", "content": "Your message"}
  ],
  "system": "System prompt",
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 4000
}
```

## 🔒 Security Notes

- API keys are passed through headers (not logged)
- CORS is configured for local development
- For production, configure proper environment variables and HTTPS

## 📊 Logs

The server logs:
- Incoming requests
- Claude API responses
- Error details for debugging

Perfect for development and testing your Claude-powered Excalidraw editor! 