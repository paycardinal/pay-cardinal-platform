# Platform Infrastructure

## Purpose

This document defines the infrastructure conventions for manually deploying Pay Cardinal Platform services to Google Cloud Run.

The goal is to establish shared deployment expectations without introducing automatic deployment, production credentials, or infrastructure-as-code tooling.

## Google Cloud Project Conventions

Pay Cardinal Platform environments should use separate Google Cloud projects for Development, Test, and Production.

Project IDs should be explicit, environment-specific, and easy to distinguish during manual operations. A recommended pattern is:

```text
pay-cardinal-platform-dev
pay-cardinal-platform-test
pay-cardinal-platform-prod
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

Recommended initial region:

```text
us-central1
```

Region selection should consider:

- Proximity to dependent Google Cloud services.
- Availability of required Google Cloud products.
- Operational simplicity.
- Latency requirements for consuming modules.

All related runtime resources for a service, including Artifact Registry repositories and Secret Manager secrets, should be located or replicated consistently with the selected environment strategy.

Artifact Registry repositories should use the same primary region as the Cloud Run services that consume their images unless an explicit multi-region strategy is approved.

Initial convention:

```text
us-central1
```

Regional values should be supplied through deployment configuration or operator input. Scripts and workflow templates must not hardcode Production-only assumptions.

## Artifact Registry Naming Convention

Container images should be stored in Google Artifact Registry.

Artifact Registry repositories should be environment-specific or project-specific. For the initial platform shape, each Google Cloud environment project should contain one Docker repository for platform service images.

Recommended repository name:

```text
platform-services
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

Example:

```text
us-central1-docker.pkg.dev/pay-cardinal-platform-dev/platform-services/elavon-file-gateway:abc1234
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
  Artifact Registry repository: platform-services
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

## Deployment Workflow

Manual deployments should follow a consistent sequence:

1. Select the target environment.
2. Confirm the Google Cloud project, region, Cloud Run service name, Artifact Registry repository, and image name.
3. Build the service Docker image locally.
4. Tag the image for Artifact Registry.
5. Push the image to Artifact Registry.
6. Deploy the image to Cloud Run.
7. Verify Cloud Run revision health and logs.
8. Record any operational notes or follow-up decisions.

The initial manual helper script lives at:

```text
scripts/deploy.sh
```

The script is intentionally configurable and does not contain production values.

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

Future CI/CD work may automate image build, Artifact Registry publishing, Cloud Run deployment, deployment verification, and rollback support.

Until that automation is introduced, deployments remain manual and must be initiated intentionally by an operator.
