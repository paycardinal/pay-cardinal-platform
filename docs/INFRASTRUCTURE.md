# Platform Infrastructure

## Purpose

This document defines the infrastructure conventions for deploying Pay Cardinal Platform services to Google Cloud Run.

The goal is to establish shared deployment expectations without committing credentials or introducing infrastructure-as-code tooling.

## Google Cloud Project Conventions

Pay Cardinal Platform environments should use separate Google Cloud projects for Development, Test, and Production.

Project IDs should be explicit, environment-specific, and easy to distinguish during manual operations. A recommended pattern is:

```text
PROJECT_ID-dev
PROJECT_ID-test
PROJECT_ID-prod
```

Repository scripts must not hardcode production project IDs. Operators should provide the correct project ID for the target environment before deploying.

## Cloud Run Service Conventions

Each platform service should map to one Cloud Run service per environment.

Cloud Run service names should:

- Match the repository service name when practical.
- Use lowercase kebab-case.
- Avoid embedding secrets, customer names, or temporary branch names.
- Remain stable across releases.

Example:

```text
elavon-file-gateway
```

Each service should be independently deployable and should not require changes to unrelated services during release.

## Region Strategy

Cloud Run services should be deployed to a single primary region per environment unless a documented operational requirement exists for another region.

Region value placeholder:

```text
GCP_REGION
```

Region selection should consider:

- Proximity to dependent Google Cloud services.
- Availability of required Google Cloud products.
- Operational simplicity.
- Latency requirements for consuming modules.

All related runtime resources for a service, including Artifact Registry repositories and Secret Manager secrets, should be located or replicated consistently with the selected environment strategy.

Artifact Registry repositories should use the same primary region as the Cloud Run services that consume their images unless an explicit multi-region strategy is approved.

Artifact Registry region placeholder:

```text
GCP_REGION
```

Regional values should be supplied through deployment configuration or operator input. Scripts and workflow templates must not hardcode Production-only assumptions.

## Artifact Registry Naming Convention

Container images should be stored in Google Artifact Registry.

Artifact Registry repositories should be environment-specific or project-specific. For the initial platform shape, each Google Cloud environment project should contain one Docker repository for platform service images.

Repository name placeholder:

```text
GAR_REPOSITORY
```

Repository names should:

- Use lowercase kebab-case.
- Describe the image grouping, not an individual runtime environment secret or customer.
- Remain stable across services.
- Avoid branch names, personal names, or temporary labels.

Image names should match the service name:

```text
elavon-file-gateway
```

The full image path follows this pattern:

```text
REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY_NAME/IMAGE_NAME:TAG
```

Tags should be traceable to source control. Recommended tag values include:

- A short Git commit SHA.
- A release version.
- A manually supplied deployment label for non-production testing.

Avoid relying on `latest` for Production deployment traceability.

## Artifact Registry Structure

The expected Artifact Registry structure is:

```text
PROJECT_ID
  Artifact Registry repository: GAR_REPOSITORY
    Image: elavon-file-gateway
      Tags: short SHA, release version, or approved deployment label
```

As more services are added, they should publish images into the same environment repository unless operational scale, access boundaries, or compliance requirements justify separate repositories.

## Image Naming Convention

Image names should align with repository service directory names and Cloud Run service names.

Preferred mapping:

```text
services/elavon-file-gateway
  -> Artifact Registry image: elavon-file-gateway
  -> Cloud Run service: elavon-file-gateway
```

This keeps deployment logs, image references, and service ownership easy to correlate.

## Container Tagging Strategy

Every pushed container image should have a tag that can be traced back to source control or an approved release event.

Recommended tags:

- Short Git SHA for continuous delivery candidates.
- Semantic version or release label for reviewed releases.
- Environment-specific validation label for manual non-production testing.

Production deployments should use immutable, reviewable tags. Production should not depend on a moving `latest` tag.

When a deployment system adds multiple tags, at least one tag must identify the exact source revision that produced the image.

## Runtime Environment Variable Strategy

Runtime configuration must be externalized from source code and Docker images.

Environment variables should be used for non-secret service configuration such as:

- Environment name.
- Log level.
- Feature flags.
- Service URLs.
- Scheduler or job settings.
- Non-sensitive integration settings.

Environment variable names should use uppercase snake case.

Example:

```text
NODE_ENV=production
LOG_LEVEL=info
```

Secrets must not be stored directly in environment variables in source-controlled files or scripts.

## Secret Manager Integration Strategy

Google Secret Manager is the standard location for service secrets.

At a high level:

- Secrets should be created outside application source code.
- Services should receive only the secrets required for their runtime responsibilities.
- Secret names should be environment-aware and service-oriented.
- Secret access should be granted through service accounts, not user credentials.
- Secret values must never be committed to the repository.

This sprint does not configure Secret Manager resources, IAM bindings, or service account access.

## Cloud Storage Raw Archive

Payments365 raw files retrieved through Elavon SFTP are archived unchanged in Cloud Storage before any future parsing step.

| Setting | Value |
| --- | --- |
| Bucket | `pc-payments365-raw` |
| Purpose | Immutable raw archive for Payments365 files retrieved via Elavon SFTP |
| Region | `us-east1` |
| Runtime variable | `PAYMENTS365_RAW_BUCKET` |
| Access | Cloud Run runtime service account only |

The canonical object prefixes are:

```text
test/YYYY/MM/
production/YYYY/MM/
```

The canonical object layout is:

```text
test/YYYY/MM/<original-filename>
production/YYYY/MM/<original-filename>
```

Archive objects must include this metadata:

```text
source=elavon-sftp
processor=payments365
environment=test
downloadedAt=<ISO-8601>
originalFilename=<filename>
sha256=<checksum>
```

Sprint 3.4 supports only the `test` archive prefix. Production implementation must transition to streaming:

```text
Elavon SFTP -> Stream -> Cloud Storage
```

Production files must not be buffered entirely in memory.

## Logging Standards

Cloud Run services should write structured logs to standard output and standard error so Google Cloud Logging can ingest them automatically.

Logs should include enough context to support operational troubleshooting, such as:

- Service name.
- Environment.
- Severity.
- Request or job identifier when available.
- Error details without sensitive values.

Logs must not include:

- Credentials.
- Secret values.
- Payment data.
- Full file payloads.
- Sensitive customer or merchant data.

## GitHub Actions Deployment Configuration

The active deployment workflow lives at:

```text
.github/workflows/deploy.yml
```

It runs on pushes to `main` and can also be started manually with `workflow_dispatch`.

The workflow must be configured with GitHub repository variables and secrets before it can deploy. Cloud-specific values must not be hardcoded in workflow files, scripts, Dockerfiles, or service code.

### Required GitHub Variables

Configure these GitHub Actions repository variables:

```text
GCP_PROJECT_ID
GCP_REGION
GAR_REPOSITORY
CLOUD_RUN_SERVICE
```

`GCP_PROJECT_ID` is the target Google Cloud project ID.

`GCP_REGION` is the Google Cloud region used for Artifact Registry and Cloud Run.

`GAR_REPOSITORY` is the Artifact Registry Docker repository name.

`CLOUD_RUN_SERVICE` is the target Cloud Run service name.

### Required GitHub Secrets

Configure these GitHub Actions repository secrets:

```text
WIF_PROVIDER
WIF_SERVICE_ACCOUNT
```

`WIF_PROVIDER` is the full Workload Identity Federation provider resource name.

`WIF_SERVICE_ACCOUNT` is the Google service account email that GitHub Actions impersonates.

Do not use service account key JSON files for repository deployments.

## Required Google Cloud Resources

The deployment workflow does not create Google Cloud resources. Before the first deployment, provision and configure:

- Google Cloud project matching `GCP_PROJECT_ID`.
- Cloud Run API enabled in the target project.
- Artifact Registry API enabled in the target project.
- IAM Credentials API enabled for Workload Identity Federation.
- Artifact Registry Docker repository matching `GAR_REPOSITORY` in `GCP_REGION`.
- Cloud Run service matching `CLOUD_RUN_SERVICE` in `GCP_REGION`, or permission for the deployment service account to create it.
- Workload Identity Pool and Provider matching `WIF_PROVIDER`.
- Deployment service account matching `WIF_SERVICE_ACCOUNT`.
- IAM binding allowing the GitHub repository identity to impersonate the deployment service account.
- Artifact Registry permissions for the deployment service account to push images.
- Cloud Run permissions for the deployment service account to deploy revisions.
- Any runtime service account and runtime IAM permissions required by the Cloud Run service.

Runtime secrets, environment variables, and integration credentials must be configured outside source control.

## Deployment Workflow

Automated and manual deployments should follow the same sequence:

1. Check out the repository revision.
2. Authenticate to Google Cloud.
3. Configure Docker authentication for Artifact Registry.
4. Build the service Docker image with a source-controlled tag.
5. Push the image to Artifact Registry.
6. Deploy the pushed image to Cloud Run.
7. Verify Cloud Run revision health and logs.
8. Record any operational notes or follow-up decisions.

The manual helper script lives at:

```text
scripts/deploy.sh
```

The script uses the same required variable names as GitHub Actions:

```text
GCP_PROJECT_ID
GCP_REGION
GAR_REPOSITORY
CLOUD_RUN_SERVICE
```

Operators must authenticate with Google Cloud before running the script locally. The script configures Docker for Artifact Registry, builds the image, pushes the image, and deploys it to Cloud Run.

## Deployment Failure Points

Deployment can fail before application startup if:

- Required GitHub variables or secrets are missing.
- The Workload Identity Federation provider is misconfigured.
- The deployment service account cannot be impersonated by GitHub Actions.
- Required Google Cloud APIs are disabled.
- The Artifact Registry repository does not exist in the configured region.
- Docker authentication to Artifact Registry fails.
- The service Docker image fails to build.
- The deployment service account lacks Artifact Registry write permissions.
- The deployment service account lacks Cloud Run deployment permissions.
- The Cloud Run service or region values do not match provisioned resources.

Deployment can fail after Cloud Run accepts a revision if:

- Runtime environment variables or secrets are missing.
- The runtime service account lacks required permissions.
- The container fails to start or bind to the expected port.
- Health checks or startup behavior fail.
- Logs reveal runtime configuration or dependency errors.

## Rollback Strategy

Cloud Run keeps revision history for deployed services. If a deployment causes operational issues:

1. Identify the last known good Cloud Run revision.
2. Shift traffic back to that revision using Cloud Run traffic management.
3. Confirm service health and logs after traffic is restored.
4. Keep the failed revision available for investigation unless it contains a security issue.
5. Revert or fix the source change, then deploy a new traceable image tag.

Rollback should use Cloud Run revisions, not a moving `latest` image tag. Production rollback decisions should record the failed image tag, restored revision, operator, and reason.

## Environments

### Development

Development is used for early service validation, integration checks, and non-production operational testing.

Development may change frequently and should not contain production secrets or production data.

### Test

Test is used for release validation before Production.

Test should be more stable than Development and should use environment-specific configuration and credentials.

### Production

Production is the live operational environment.

Production deployments should be traceable, reviewed, and performed with explicit confirmation of project, region, service, image tag, and runtime configuration.

Production must not rely on local-only assumptions or untracked configuration.

## Future Automation

Future CI/CD work may add deployment verification gates, environment approvals, automated rollback assistance, and infrastructure provisioning.
