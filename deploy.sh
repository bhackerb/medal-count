#!/bin/bash
# ─── Medal Tracker — Deploy to Cloud Run ─────────────────
# Usage: ./deploy.sh [project-id] [region]
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Docker installed (or use Cloud Build)
#   - A GCP project with Cloud Run and Artifact Registry enabled

set -e

# ─── CONFIG ──────────────────────────────
PROJECT_ID="${1:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${2:-us-central1}"
SERVICE_NAME="medal-tracker"
REPO_NAME="medal-tracker"
IMAGE_NAME="medal-tracker"
TAG="latest"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ No project ID. Usage: ./deploy.sh <project-id> [region]"
  exit 1
fi

echo "🏅 Deploying Medal Tracker"
echo "   Project:  $PROJECT_ID"
echo "   Region:   $REGION"
echo "   Service:  $SERVICE_NAME"
echo ""

# ─── STEP 1: Enable APIs (first time only) ──────────────
echo "📦 Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project="$PROJECT_ID" \
  --quiet

# ─── STEP 2: Create Artifact Registry repo (first time) ─
echo "📦 Ensuring Artifact Registry repo exists..."
gcloud artifacts repositories create "$REPO_NAME" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID" \
  --quiet 2>/dev/null || true

# ─── STEP 3: Build with Cloud Build ─────────────────────
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${TAG}"

echo "🔨 Building container image..."
gcloud builds submit \
  --tag="$IMAGE_URL" \
  --project="$PROJECT_ID" \
  --quiet

# ─── STEP 4: Deploy to Cloud Run ────────────────────────
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE_URL" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --concurrency=80 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production" \
  --quiet

# ─── STEP 5: Get URL ────────────────────────────────────
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Medal Tracker deployed!"
echo ""
echo "   URL: $SERVICE_URL"
echo ""
echo "   To map to medals.bhackerb.com:"
echo "   1. gcloud run domain-mappings create \\"
echo "        --service=$SERVICE_NAME \\"
echo "        --domain=medals.bhackerb.com \\"
echo "        --region=$REGION"
echo "   2. Add the CNAME record shown to your DNS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
