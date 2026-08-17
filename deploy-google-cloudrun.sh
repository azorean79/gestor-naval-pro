#!/bin/bash
# ──────────────────────────────────────────────────────────────
# Deploy to Google Cloud Run (Free Tier)
# ──────────────────────────────────────────────────────────────
# Prerequisites:
#   1. gcloud CLI installed: https://cloud.google.com/sdk/docs/install
#   2. gcloud auth login
#   3. gcloud config set project YOUR_PROJECT_ID
#   4. Neon database created at https://neon.tech (get DATABASE_URL)
#
# Usage:
#   chmod +x deploy-google-cloudrun.sh
#   ./deploy-google-cloudrun.sh
# ──────────────────────────────────────────────────────────────
set -e

# ── Configuration ────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-}"
SERVICE_NAME="gestor-naval-pro"
REGION="${GCP_REGION:-europe-west1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
MEMORY="512Mi"
CPU="1"
MIN_INSTANCES="0"
MAX_INSTANCES="2"

# ── Validate ─────────────────────────────────────────────────
if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: Set GCP_PROJECT_ID env var or edit this script."
  echo "  export GCP_PROJECT_ID=your-project-id"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: Set DATABASE_URL env var (from Neon)."
  echo "  export DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require"
  exit 1
fi

echo "=========================================="
echo "  Deploying ${SERVICE_NAME} to Cloud Run"
echo "  Region: ${REGION}"
echo "  Project: ${PROJECT_ID}"
echo "=========================================="

# ── Configure Docker for GCR ─────────────────────────────────
echo "[1/5] Configuring Docker authentication..."
gcloud auth configure-docker --quiet

# ── Build and push image ─────────────────────────────────────
echo "[2/5] Building Docker image..."
docker build \
  -f Dockerfile.cloudrun \
  -t "${IMAGE_NAME}:latest" \
  --platform linux/amd64 \
  .

echo "[3/5] Pushing image to Google Container Registry..."
docker push "${IMAGE_NAME}:latest"

# ── Deploy to Cloud Run ──────────────────────────────────────
echo "[4/5] Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}:latest" \
  --region "${REGION}" \
  --platform managed \
  --memory "${MEMORY}" \
  --cpu "${CPU}" \
  --min-instances "${MIN_INSTANCES}" \
  --max-instances "${MAX_INSTANCES}" \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest" \
  --set-secrets "NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest" \
  --set-env-vars "NEXTAUTH_URL=https://${SERVICE_NAME}-${PROJECT_ID}.a.run.app"

# ── Get URL ──────────────────────────────────────────────────
echo "[5/5] Getting service URL..."
URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format 'value(status.url)')

echo ""
echo "=========================================="
echo "  Deploy complete!"
echo "  URL: ${URL}"
echo "=========================================="
