FROM node:18-bookworm

# Install system dependencies and Python 3.11 for yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip (--break-system-packages needed for Python 3.11+ PEP 668)
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Start the server
CMD ["npm", "start"]

