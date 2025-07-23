#!/bin/bash

# Healing Temple Community App - Expo Development Server with Tunnel
# This script starts Expo with tunnel mode for external access

echo "🏛️  Starting The Healing Temple Community App with Tunnel"
echo "=============================================================="
echo "🌐 Tunnel mode allows access from any network"
echo "📱 Perfect for testing on mobile devices"
echo ""

# Change to project directory
cd /home/koh/Documents/HealingTemple/communityapp

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Start Expo development server with tunnel
echo "🚀 Starting Expo development server with tunnel..."
echo "🔗 Creating secure tunnel for external access..."
echo "📲 Scan QR code with Expo Go app"
echo "Press Ctrl+C to stop the server"
echo ""

npm start -- --tunnel

# Keep terminal open if server stops unexpectedly
echo ""
echo "📱 Expo tunnel server stopped. Press Enter to close terminal..."
read