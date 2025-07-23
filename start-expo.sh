#!/bin/bash

# Healing Temple Community App - Expo Development Server Startup Script

echo "🏛️  Starting The Healing Temple Community App Development Server"
echo "=============================================================="

# Change to project directory
cd /home/koh/Documents/HealingTemple/communityapp

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start Expo development server
echo "🚀 Starting Expo development server..."
echo "Server will be available at: http://localhost:8081"
echo "Press Ctrl+C to stop the server"
echo ""

npm start

# Keep terminal open if server stops unexpectedly
echo ""
echo "📱 Expo server stopped. Press Enter to close terminal..."
read