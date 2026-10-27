# Usage: .\deploy-cloudrun.ps1 -ProjectId YOUR_GOOGLE_CLOUD_PROJECT_ID
param([Parameter(Mandatory=$true)][string]$ProjectId)
$ErrorActionPreference = 'Stop'
gcloud config set project $ProjectId
if ($LASTEXITCODE -ne 0) { throw 'Could not set Google Cloud project.' }
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
if ($LASTEXITCODE -ne 0) { throw 'Could not enable Google Cloud services.' }
gcloud run deploy sizemate --source . --region asia-south1 --allow-unauthenticated --memory 2Gi --cpu 2 --concurrency 2 --timeout 300 --max-instances 3 --set-env-vars MAX_UPLOAD_MB=24
if ($LASTEXITCODE -ne 0) { throw 'Deployment failed. Review the Cloud Build / Cloud Run output.' }
