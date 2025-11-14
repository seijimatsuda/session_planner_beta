FROM node:18-bullseye

# Install system dependencies and Python 3.11 for yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3.11 \
    python3.11-pip \
    python3.11-venv \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Install yt-dlp via pip
RUN pip3 install --no-cache-dir yt-dlp

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

