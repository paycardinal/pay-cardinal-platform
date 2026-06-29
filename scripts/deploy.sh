#!/usr/bin/env bash

set -euo pipefail

# Cloud Run manual deployment helper.
# Replace these placeholder values before running the script.
PROJECT_ID="your-google-cloud-project-id"
REGION="us-central1"
SERVICE_NAME="your-cloud-run-service-name"
REPOSITORY_NAME="your-artifact-registry-repository"
IMAGE_NAME="your-container-image-name"

# Optional deployment tag. Defaults to the current Git commit when available.
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

# The service directory containing the Dockerfile to build.
SERVICE_DIR="${SERVICE_DIR:-services/elavon-file-gateway}"

# Fully qualified Artifact Registry image path.
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY_NAME}/${IMAGE_NAME}:${IMAGE_TAG}"

# Authentication occurs before build and push operations.
# For manual use, authenticate with Google Cloud outside this script, for example:
#   gcloud auth login
#   gcloud auth configure-docker "${REGION}-docker.pkg.dev"
# Future GitHub Actions automation should authenticate with Workload Identity
# Federation and short-lived credentials instead of service account keys.

echo "Building Docker image for ${SERVICE_NAME}..."

# Build the Docker image from the service directory.
docker build \
  --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
  "${SERVICE_DIR}"

echo "Tagging image as ${IMAGE_URI}..."

# Artifact Registry is used as the container image destination.
# Tag the local image using the fully qualified Artifact Registry image path.
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${IMAGE_URI}"

echo "Pushing image to Artifact Registry..."

# Push the tagged image to Artifact Registry after Docker authentication has
# been configured for the selected region.
docker push "${IMAGE_URI}"

echo "Deploying image to Cloud Run..."

# Cloud Run deployment occurs here.
# Runtime environment variables and secrets should be supplied explicitly by the
# operator or through future deployment automation.
gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE_URI}" \
  --platform managed

echo "Deployment submitted for ${SERVICE_NAME} using image ${IMAGE_URI}."
