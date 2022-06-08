#!/bin/sh

PROJECT=lindylearn2
IMAGE=gcr.io/${PROJECT}/puppeteer-serverless

env_vars="ENV=production,"
# env_vars="${env_vars}GH_APP_IDENTIFIER=${GH_APP_IDENTIFIER},"

rm -r ./extension && cp -r ../../../distribution ./extension

# patch manifest to always inject enhance.js (puppeteer doesn't seem to allow service worker communication inside docker)
tmp=$(mktemp) && jq '.content_scripts[0].js[0] = "content-script/enhance.js" | .content_scripts[0].run_at = "document_idle"' ./extension/manifest.json > "$tmp" && mv "$tmp" ./extension/manifest.json

# gcloud builds submit --tag $IMAGE --project=$PROJECT --gcs-log-dir=gs://${PROJECT}_cloudbuild/logs && \
docker build . -t gcr.io/lindylearn2/puppeteer-serverless
docker push gcr.io/lindylearn2/puppeteer-serverless

gcloud run deploy puppeteer-serverless \
  --image $IMAGE \
  --set-env-vars="$env_vars" \
  --project=$PROJECT \
  --platform managed \
  --allow-unauthenticated \
  --region=us-west1 \
  --timeout=300 \
  --memory 1G

# gcloud run services update puppeteer-serverless --concurrency 1 --cpu 2 \
#   --platform managed \
#   --region=us-west1
