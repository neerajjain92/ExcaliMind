#!/bin/bash

echo "🚀 Starting Excalidraw Claude Editor..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server in background with logs
echo "📡 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
echo "⏳ Waiting 3 seconds for backend to start..."
sleep 3

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server started successfully on http://localhost:3001"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

echo "🎨 Starting frontend server..."
echo ""
echo "💡 Backend logs will appear above any errors"
echo "💡 Frontend logs will appear below:"
echo "📡 Backend: http://localhost:3001"
echo "🎨 Frontend: http://localhost:5174"
echo ""
echo "⏹️  Press Ctrl+C to stop both servers"
echo ""

# Start frontend in foreground
npm run dev 