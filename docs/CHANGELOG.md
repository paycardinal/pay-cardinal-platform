

# Changelog

All notable changes to the Pay Cardinal Platform project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added
- Completed Sprint 3.2 – Elavon SFTP Connectivity.
- Added Elavon TEST SFTP readiness connectivity validation using Secret Manager-provided SSH private key and SFTP user ID.
- Added safe readiness reason codes for Secret Manager and SFTP connectivity failures.
- Completed Sprint 3.1 – Secret Manager Integration.
- Integrated Google Secret Manager for secure runtime credential retrieval.
- Configured dedicated Cloud Run runtime service account (`pc-elavon-runtime`).
- Standardized Cloud Run deployment configuration using GitHub Repository Variables.
- Adopted Workload Identity Federation (OIDC) for keyless GitHub Actions deployments.
- Validated authenticated Cloud Run `/health` endpoint.

### Changed
- Updated Elavon File Gateway readiness checks to validate Secret Manager access, authenticated SFTP connection establishment, and clean disconnect.
- Updated deployment automation to pass Elavon TEST SFTP runtime configuration through Cloud Run environment variables.
- Updated deployment, security, and platform documentation to reflect the current production foundation.
