#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
  echo "Erreur : le fichier .env est introuvable dans $SCRIPT_DIR"
  exit 1
fi

echo "📦 Build image..."
TURNSTILE_SITE_KEY="$(grep -m1 '^TURNSTILE_SITE_KEY=' .env | cut -d= -f2-)"
DOCKER_BUILDKIT=1 docker build \
  --build-arg VITE_TURNSTILE_SITE_KEY="$TURNSTILE_SITE_KEY" \
  -t pokeflip-image .

echo "🛑 Stop container si existant..."
docker stop pokeflip 2>/dev/null || true

echo "🗑️ Suppression container..."
docker rm pokeflip 2>/dev/null || true

echo "🚀 Lancement container..."
docker run -d \
  -p 127.0.0.1:3456:3000 \
  --env-file .env \
  --network mariadb-network \
  --name pokeflip \
  --restart unless-stopped \
  pokeflip-image:latest

echo "📋 Logs du container..."
docker logs --tail 50 pokeflip

echo "✅ Done ! pokeflip restarted."
