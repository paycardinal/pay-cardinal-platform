

# Pay Cardinal Platform Architecture

## Purpose

Pay Cardinal Platform is the shared technical foundation for the Pay Cardinal Program.

This repository provides the infrastructure, integration services, shared APIs, security standards, logging, scheduling, and reusable platform libraries that future Pay Cardinal modules will consume.

This project is not the CRM project. The CRM will exist as one module within the larger Pay Cardinal Program and may consume services provided by this Platform.

## Platform Mission

The mission of Pay Cardinal Platform is to provide reusable, secure, independently deployable services that support multiple Pay Cardinal business modules without embedding module-specific business logic.

The Platform should make common capabilities available once, instead of duplicating integrations or infrastructure across individual modules.

## Program Relationship

The Pay Cardinal Program may include multiple modules over time, including:

- CRM Module
- ISO Portal Module
- Merchant Portal
- Agent Portal
- Residuals Module
- Billing Module
- Reporting Module
- Future internal tools and applications

These modules are consumers of the Platform. They should not define the Platform architecture.

## Platform Ownership

Pay Cardinal Platform owns:

- Google Cloud infrastructure
- Cloud Run services
- Shared APIs
- Shared integrations
- Google Drive integration
- Secret Manager usage
- Cloud Scheduler jobs
- Logging and monitoring standards
- Shared TypeScript libraries
- Deployment standards
- IAM patterns
- CI/CD standards
- Cross-module integration services

## Platform Does Not Own

Pay Cardinal Platform does not own module-specific business workflows.

The Platform should not implement:

- CRM customer management logic
- CRM application workflow logic
- CRM pricing logic
- CRM document workflow logic
- CRM signature workflow logic
- Merchant Portal UI logic
- Agent Portal UI logic
- Residual calculation business rules
- Billing business rules
- Dashboard presentation logic
- Module-specific authentication screens or user experiences

Those responsibilities belong to the appropriate consuming module.

## Architectural Principle

The Platform provides capabilities. Modules use capabilities.

The Platform should answer questions such as:

- How do we run scheduled jobs securely?
- How do we store secrets?
- How do we deploy Cloud Run services?
- How do we log and monitor integrations?
- How do we store and retrieve shared documents?
- How do modules consume shared integrations?
- How do we avoid duplicate integration code?

The Platform should not answer questions such as:

- How should a CRM user edit an application?
- How should a merchant view a dashboard?
- How should an agent review residuals?
- How should a billing screen look?
- How should a CRM workflow be approved?

## Repository Structure

The recommended repository structure is:

```text
pay-cardinal-platform/
  services/
    elavon-file-gateway/
    payments365-sync/
    drive-document-service/
    shared-api-gateway/

  shared/
    logging/
    secrets/
    google-drive/
    api-clients/
    security/
    types/
    errors/
    config/

  infrastructure/
    cloud-run/
    scheduler/
    secret-manager/
    iam/
    monitoring/
    logging/
    environments/

  docs/
    CURRENT_TASK.md
    ARCHITECTURE.md
    REPOSITORY_STRUCTURE.md
    SERVICE_BOUNDARIES.md
    SECURITY.md
    DEPLOYMENT.md
    STANDARDS.md
    DECISIONS.md
```

## Services

Services are independently deployable Cloud Run applications.

Each service must own its own:

- `package.json`
- source code
- runtime dependencies
- service-specific configuration
- deployment definition
- README or service contract

Services should be loosely coupled and should communicate through stable interfaces.

Initial platform services may include:

- `elavon-file-gateway`
- `payments365-sync`
- `drive-document-service`
- `shared-api-gateway`

Services should not import business logic from consuming modules.

## Shared Libraries

Shared libraries belong under `/shared`.

Shared libraries may include reusable platform utilities such as:

- structured logging
- Secret Manager access
- Google Drive helpers
- API client wrappers
- error handling
- retry logic
- configuration helpers
- shared TypeScript types
- security helpers

Shared libraries must not contain module-specific business rules.

## Infrastructure

Infrastructure belongs under `/infrastructure`.

Infrastructure definitions may include:

- Cloud Run configuration
- Cloud Scheduler configuration
- Secret Manager setup
- IAM roles and permissions
- logging configuration
- monitoring configuration
- environment-specific deployment settings

Infrastructure should be reusable, consistent, and separated from service business code.

## Deployment Model

Cloud Run is the deployment target for Platform services.

Each service should be independently buildable, testable, and deployable.

The preferred deployment model is:

```text
GitHub Repository
  -> CI/CD workflow
  -> Build service container
  -> Deploy to Cloud Run
  -> Use Secret Manager at runtime
  -> Emit structured logs to Cloud Logging
```

## Scheduled Jobs

Scheduled jobs should use Cloud Scheduler to invoke Cloud Run services securely.

The recommended pattern is:

```text
Cloud Scheduler
  -> authenticated Cloud Run request
  -> service executes job
  -> service writes structured logs
  -> service records status
```

Scheduled jobs should not run from developer machines, local scripts, or unmanaged cron jobs.

## Secret Management

All production secrets must be stored in Google Secret Manager.

Secrets include:

- SFTP credentials
- SSH private keys
- API keys
- OAuth credentials
- webhook secrets
- processor credentials
- third-party integration credentials

Secrets must never be committed to Git.

Services should retrieve secrets at runtime using least-privilege IAM.

## Document Storage

Google Drive is the initial document repository for shared documents and integration files.

The recommended document flow is:

```text
Platform service receives or retrieves file
  -> Platform validates file metadata
  -> Platform stores file in controlled Google Drive folder
  -> Platform records file metadata and status
  -> consuming module references the stored file
```

Modules should not create duplicate document storage patterns when a shared Platform document service is available.

## Logging and Monitoring

Platform services must use structured logging.

Logs should include consistent fields such as:

- service name
- environment
- job ID
- correlation ID
- status
- operation name
- file name when applicable
- external system name when applicable
- timestamp
- error code when applicable

Logs must not include:

- secrets
- credentials
- full PAN
- sensitive authentication data
- private keys
- full file contents

Monitoring should be designed around service health, job success, job failure, latency, and integration errors.

## Security Model

The Platform favors security over convenience.

Security principles:

- least-privilege IAM
- no secrets in Git
- runtime secret access through Secret Manager
- authenticated Cloud Run invocations
- controlled Google Drive folders
- structured logs without sensitive data
- independent service permissions
- environment separation
- auditable deployments

## Module Relationship

Modules should consume Platform services through clear contracts.

Examples:

- The CRM module may use Platform document services or shared integrations.
- The ISO Portal module may use Platform reporting, billing, or document services.
- Future modules may reuse the same infrastructure and integration patterns.

Modules should not directly duplicate Platform-owned integrations unless Architecture explicitly approves an exception.

## Integration Strategy

Shared third-party integrations should be implemented once at the Platform level when they may be used by more than one module.

Platform-level integrations may include:

- Elavon File Gateway
- Payments365
- Google Drive
- email services
- future processor integrations
- future reporting integrations

Integration services should expose stable internal contracts to consuming modules.

## Architecture Governance

Architecture decisions must be made before implementation.

New services should not be added until their ownership, inputs, outputs, dependencies, and consumers are documented.

Any proposed implementation must respect these rules:

- Do not place secrets in Git.
- Do not add module-specific business logic to `/shared`.
- Do not duplicate shared integrations.
- Do not tightly couple services to individual modules.
- Do not bypass Secret Manager for production credentials.
- Do not deploy services outside the approved Cloud Run model.
- Do not create unmanaged scheduled jobs.

## Summary

Pay Cardinal Platform is the long-term foundation for the Pay Cardinal Program.

It provides secure, reusable, independently deployable infrastructure and integration services for current and future modules.

The CRM, ISO Portal, and future applications are consumers of the Platform, not the drivers of Platform architecture.