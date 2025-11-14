#!/bin/bash
set -e

# Install system dependencies
apt-get update
apt-get install -y yt-dlp ffmpeg
rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
npm install

# Build TypeScript
npm run build

