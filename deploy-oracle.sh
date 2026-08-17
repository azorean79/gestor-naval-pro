#!/bin/bash
# ──────────────────────────────────────────────────────────────
# Deploy to Oracle Cloud VPS via Docker
# Run this ON the Oracle Cloud server via SSH
# ──────────────────────────────────────────────────────────────
set -e

REPO_URL="https://SEU_GITHUB_REPO.git"
APP_DIR="/var/www/acores"

echo "=== Installing Docker + Docker Compose ==="
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker --now
sudo usermod -aG docker $USER

echo "=== Cloning app ==="
sudo mkdir -p $APP_DIR
cd $APP_DIR
sudo git clone $REPO_URL . 2>/dev/null || sudo git pull

echo "=== Creating .env from template ==="
if [ ! -f .env.production.local ]; then
  cp .env.example .env.production.local 2>/dev/null || true
  echo ">>> Edit .env.production.local with your secrets! <<<"
fi

echo "=== Building & starting ==="
docker compose down 2>/dev/null || true
docker compose up -d --build

echo "=== Done ==="
echo "App running at: http://$(curl -s ifconfig.me):3000"
