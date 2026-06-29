

# Platform Deployment

## Purpose

This document defines the deployment model, release process, and environment standards for the Pay Cardinal Platform.

The goal is to ensure that every Platform service is deployed consistently, securely, and independently.

## Deployment Principles

- Every service is independently deployable.
- Deployments must be repeatable and automated.
- Infrastructure changes should be version controlled.
- Production deployments should be traceable and auditable.
- Services should not depend on manual configuration after deployment.

## Deployment Target

The standard deployment target for all Platform services is Google Cloud Run.

Each service is responsible for its own deployment lifecycle and runtime configuration.

## Source Control

- GitHub is the source of truth.
- All Platform changes must be committed to Git.
- Main should remain deployable.
- Feature work should be completed through short-lived branches and reviewed before merge.

## Continuous Integration and Delivery

The preferred deployment flow is:

```text
Developer
  -> GitHub
  -> CI pipeline
  -> Build container image
  -> Publish artifact
  -> Deploy to Cloud Run
  -> Verify deployment health
```

Deployment automation should validate builds before release.

## Service Deployment Requirements

Each Platform service should provide:

- package.json
- Dockerfile
- deployment configuration
- runtime configuration
- README
- health endpoint

Services must not rely on configuration stored in source code.

## Environment Configuration

Environment-specific configuration should be externalized.

Examples include:

- Project IDs
- Service URLs
- Scheduler frequency
- Feature flags
- API endpoints

Secrets must be retrieved from Google Secret Manager.

## Environments

As the Platform grows, maintain separate environments such as:

- Development
- Test
- Production

Each environment should have independent configuration and credentials.

## Scheduled Services

Cloud Scheduler is the standard mechanism for recurring Platform jobs.

Scheduler should invoke Cloud Run services using authenticated requests.

## Health and Monitoring

Every deployed service should support operational monitoring.

Recommended capabilities:

- Health endpoint
- Structured logging
- Error reporting
- Deployment verification
- Runtime metrics

## Rollback Strategy

Deployments should support rapid rollback to the last known good revision when operational issues occur.

Deployment procedures should minimize downtime and preserve service integrity.

## Governance

Deployment standards apply to every Platform service. Exceptions require Architecture approval and should be documented in `docs/DECISIONS.md`.