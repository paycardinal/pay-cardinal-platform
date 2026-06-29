#!/usr/bin/env bash

set -euo pipefail

required_var() {
  local name="$1"

  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

required_var "GCP_PROJECT_ID"
required_var "GCP_REGION"
required_var "GAR_REPOSITORY"
required_var "CLOUD_RUN_SERVICE"
required_var "ELAVON_SFTP_ENV"
required_var "ELAVON_SFTP_HOST"
required_var "ELAVON_SFTP_PORT"
required_var "ELAVON_SFTP_USER_ID_SECRET_NAME"
required_var "ELAVON_SSH_PRIVATE_KEY_SECRET_NAME"

# Optional deployment tag. Defaults to the current Git commit when available.
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

# The service directory containing the Dockerfile to build.
SERVICE_DIR="${SERVICE_DIR:-services/elavon-file-gateway}"
IMAGE_NAME="${IMAGE_NAME:-elavon-file-gateway}"

# Fully qualified Artifact Registry image path.
IMAGE_URI="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GAR_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"

# For manual use, authenticate with Google Cloud before running this script, for example:
#   gcloud auth login
# GitHub Actions authenticates with Workload Identity Federation and short-lived
# credentials instead of service account keys.

echo "Configuring Docker authentication for Artifact Registry..."

gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

echo "Building Docker image for ${CLOUD_RUN_SERVICE}..."

# Build the Docker image from the service directory.
docker build \
  --tag "${IMAGE_URI}" \
  "${SERVICE_DIR}"

echo "Pushing image to Artifact Registry..."

# Push the tagged image to Artifact Registry after Docker authentication has
# been configured for the selected region.
docker push "${IMAGE_URI}"

echo "Deploying image to Cloud Run..."

# Cloud Run deployment occurs here.
# Runtime environment variables and secrets should be supplied explicitly by the
# operator or through future deployment automation.
gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --project "${GCP_PROJECT_ID}" \
  --region "${GCP_REGION}" \
  --image "${IMAGE_URI}" \
  --update-env-vars "GCP_PROJECT_ID=${GCP_PROJECT_ID},ELAVON_SFTP_ENV=${ELAVON_SFTP_ENV},ELAVON_SFTP_HOST=${ELAVON_SFTP_HOST},ELAVON_SFTP_PORT=${ELAVON_SFTP_PORT},ELAVON_SFTP_USER_ID_SECRET_NAME=${ELAVON_SFTP_USER_ID_SECRET_NAME},ELAVON_SSH_PRIVATE_KEY_SECRET_NAME=${ELAVON_SSH_PRIVATE_KEY_SECRET_NAME}" \
  --platform managed

echo "Deployment submitted for ${CLOUD_RUN_SERVICE} using image ${IMAGE_URI}."
