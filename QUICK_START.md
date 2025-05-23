# 🚀 Quick Start Guide

The simplest way to run everything with visible logs:

## Method 1: Two Terminal Windows (Recommended)

### Terminal 1 - Backend Server:
```bash
cd backend
npm install  # (only needed first time)
npm start
```

You'll see:
```
🚀 Claude API Proxy Server running on http://localhost:3001
📋 Health check: http://localhost:3001/health
🤖 Claude endpoint: http://localhost:3001/api/claude/chat
💡 Make sure to set your Claude API key in the frontend!
```

### Terminal 2 - Frontend Server:
```bash
npm install  # (only needed first time)  
npm run dev
```

You'll see:
```
VITE v5.4.8  ready in 127 ms
➜  Local:   http://localhost:5174/
```

## Method 2: One Terminal (Simple Script)

```bash
./start-simple.sh
```

This starts backend in background, frontend in foreground. Press `Ctrl+C` to stop both.

## Method 3: Check Everything is Working

### Test Backend:
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"OK","message":"Claude API Proxy Server is running"}`

### Test Frontend:
Open browser: http://localhost:5174

## Troubleshooting

### "Port already in use" error:
```bash
./stop-all.sh
```

### Check what's running:
```bash
lsof -i :3001  # Backend
lsof -i :5174  # Frontend
```

### Kill specific ports:
```bash
lsof -ti :3001 | xargs kill -9  # Kill backend
lsof -ti :5174 | xargs kill -9  # Kill frontend
```

## Claude AI Setup

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Enter in chat panel at bottom of the app
3. Wait for green "Connected" status
4. Start chatting: "Add a red rectangle"

---

**That's it! No permissions, no complicated scripts.** 🎉 