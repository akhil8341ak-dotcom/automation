FROM node:22-bullseye-slim

# Install system dependencies: FFmpeg, Python3, and Pip
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Edge-TTS for free neural voiceover
RUN pip3 install --no-cache-dir edge-tts

WORKDIR /app

# Copy root manifests
COPY package*.json tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/engine/package*.json ./packages/engine/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/ ./packages/
COPY scripts/ ./scripts/
COPY .env.example ./.env

# Build all monorepo workspaces
RUN npm run build

# Expose server port
EXPOSE 3001

# Volumes for persistent database and media storage
VOLUME ["/app/data"]

CMD ["node", "packages/server/dist/index.js"]
