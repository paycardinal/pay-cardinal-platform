

# Platform Security

## Purpose

This document defines the security architecture and operational security standards for the Pay Cardinal Platform. These standards apply to every Platform service, shared library, deployment pipeline, and infrastructure component.

## Security Principles

- Security is designed into the Platform from the beginning.
- Apply the principle of least privilege.
- Default to secure configurations.
- Separate infrastructure from business logic.
- Audit security-relevant operations.
- Never trade security for convenience.

## Identity and Access Management

- Use Google Cloud IAM for access control.
- Grant only the minimum permissions required.
- Each Cloud Run service should use its own service account when practical.
- Review IAM permissions regularly.
- Avoid shared administrative accounts.
- Runtime identity must use least-privilege IAM.
- GitHub authenticates to Google Cloud using Workload Identity Federation.

## Secret Management

Production secrets must be stored in Google Secret Manager.
Secret Manager is the only approved source for runtime credentials.
Runtime credentials must be retrieved at execution time.

Examples include:

- API keys
- OAuth credentials
- SSH private keys
- SFTP credentials
- Database credentials
- Webhook secrets
- Third-party integration credentials

Secrets must never be:

- committed to Git
- hardcoded in source code
- stored in documentation
- written to logs

Secrets must never be logged.

## Service Authentication

Platform services should authenticate using managed Google Cloud identities whenever possible.

Internal service-to-service communication should require authentication and authorization appropriate to the service boundary.

## Data Protection

Platform services should:

- Encrypt data in transit using HTTPS or secure protocols.
- Rely on managed encryption for supported Google Cloud services.
- Minimize storage of sensitive information.
- Avoid unnecessary duplication of data.

Sensitive payment information must not be written to logs or retained outside approved systems.

## Logging and Auditing

Security-relevant events should be logged, including:

- Authentication failures
- Authorization failures
- Secret access failures
- Scheduled job failures
- External integration failures
- Administrative operations

Logs should support auditing while excluding secrets and sensitive payment data.

## Google Drive Security

When Google Drive is used as the document repository:

- Use controlled folders.
- Apply least-privilege sharing.
- Restrict service account access to required folders.
- Record document operations through structured logs.

## Cloud Run Security

Platform services deployed to Cloud Run should:

- Run with dedicated service accounts where appropriate.
- Retrieve secrets at runtime.
- Validate all external inputs.
- Fail securely when required dependencies are unavailable.

## Dependency Security

- Prefer actively maintained libraries.
- Remove unused dependencies.
- Apply security updates promptly.
- Review new dependencies before adoption.

## Incident Response

Security incidents should:

- Be logged.
- Be investigated.
- Be documented.
- Result in corrective actions when appropriate.

## Governance

Security requirements are mandatory for all Platform services. Any exception must be reviewed by Platform Architecture and documented in `docs/DECISIONS.md` before implementation.
