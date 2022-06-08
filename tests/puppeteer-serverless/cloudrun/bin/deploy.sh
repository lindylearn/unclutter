#!/bin/sh

PROJECT=lindylearn2
IMAGE=gcr.io/${PROJECT}/puppeteer-serverless

env_vars="ENV=production,"
# env_vars="${env_vars}GH_APP_IDENTIFIER=${GH_APP_IDENTIFIER},"

cp -r ../../../distribution ./extension
gcloud builds submit --tag $IMAGE --project=$PROJECT --gcs-log-dir=gs://${PROJECT}_cloudbuild/logs && \
gcloud run deploy puppeteer-serverless \
  --image $IMAGE \
  --set-env-vars="$env_vars" \
  --project=$PROJECT \
  --platform managed \
  --allow-unauthenticated \
  --region=us-west1 \
  --timeout=60 \
  --memory 1G

# gcloud run services update puppeteer-serverless --concurrency 1 --cpu 2 \
#   --platform managed \
#   --region=us-west1
