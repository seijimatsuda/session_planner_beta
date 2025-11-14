FROM node:18-bullseye

# Install yt-dlp and ffmpeg
RUN apt-get update && apt-get install -y \
    yt-dlp \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy backend source code
COPY backend/ .

# Build TypeScript
RUN npm run build

# Start the server
CMD ["npm", "start"]

