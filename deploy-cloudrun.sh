#!/usr/bin/env bash
# Usage: ./deploy-cloudrun.sh YOUR_GOOGLE_CLOUD_PROJECT_ID
set -euo pipefail
PROJECT="${1:?Please supply your Google Cloud project ID as the first argument}"
gcloud config set project "$PROJECT"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud run deploy sizemate \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 2 \
  --timeout 300 \
  --max-instances 3 \
  --set-env-vars MAX_UPLOAD_MB=24
