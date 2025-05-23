#!/bin/bash

echo "🛑 Stopping Excalidraw Claude Editor..."

# Kill processes on specific ports
echo "📡 Stopping backend server (port 3001)..."
lsof -ti :3001 | xargs kill -9 2>/dev/null && echo "✅ Backend stopped" || echo "ℹ️  No backend process found"

echo "🎨 Stopping frontend server (port 5174)..."
lsof -ti :5174 | xargs kill -9 2>/dev/null && echo "✅ Frontend stopped" || echo "ℹ️  No frontend process found"

echo "🧹 Cleaning up any remaining Node processes..."
pkill -f "npm.*dev" 2>/dev/null
pkill -f "npm.*start" 2>/dev/null

echo ""
echo "✅ All servers stopped!"
echo "💡 You can now restart with: ./start-with-logs.sh" 