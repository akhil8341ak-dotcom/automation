# CreatorFlow AI — Deployment & Infrastructure Guide

## 1. System Requirements

| Component | Minimum | Recommended (Video Rendering) |
|---|---|---|
| **CPU** | 2 Cores | 4+ Cores (for fast H.264 FFmpeg encoding) |
| **RAM** | 4 GB | 8 GB+ (prevents OOM during video concat) |
| **Disk** | 20 GB SSD | 100 GB+ NVMe (media asset caching) |
| **OS** | Linux / Windows 11 / macOS | Ubuntu 22.04 LTS or Debian 12 |
| **Runtimes** | Node.js v20+, FFmpeg 6.0+ | Node.js v26+, FFmpeg 9.0+, Python 3.10+ |

---

## 2. Option A: Native Server Deployment

### Step 1: Install System Dependencies (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y curl git ffmpeg python3 python3-pip

# Install edge-tts for free high-quality neural voiceover
pip3 install edge-tts
```

### Step 2: Install Node.js v22+
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 3: Clone & Build Monorepo
```bash
git clone https://github.com/your-username/creatorflow-ai.git
cd creatorflow-ai

npm install
cp .env.example .env
# Edit .env with your preferred ports and API keys

npm run build
```

### Step 4: Run with Systemd or PM2
```bash
# Using PM2 process manager
sudo npm install -g pm2
pm2 start packages/server/dist/index.js --name "creatorflow"
pm2 save
pm2 startup
```

The application will be live at `http://your-server-ip:3001` with both backend API and frontend UI served.

---

## 3. Option B: Docker & Docker Compose

A complete multi-stage `Dockerfile` and `docker-compose.yml` are provided in the repository root.

```bash
# Build and run with Docker Compose
docker compose up -d --build

# View container logs
docker compose logs -f creatorflow
```

---

## 4. Production Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name creatorflow.yourdomain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Enable SSE (Server-Sent Events) streaming
    location /api/events {
        proxy_pass http://localhost:3001/api/events;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }
}
```
