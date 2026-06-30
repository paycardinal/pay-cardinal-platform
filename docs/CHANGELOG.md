

# Changelog

All notable changes to the Pay Cardinal Platform project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added
- Completed Sprint 3.2 – Elavon SFTP Connectivity.
- Validated Elavon TEST SFTP authentication.
- Validated retrieval of SSH private key from Secret Manager.
- Validated retrieval of SFTP User ID from Secret Manager.
- Added `/ready` validation for Secret Manager and SFTP connectivity.
- Confirmed clean SFTP disconnect behavior.
- Completed Sprint 3.1 – Secret Manager Integration.
- Integrated Google Secret Manager for secure runtime credential retrieval.
- Configured dedicated Cloud Run runtime service account (`pc-elavon-runtime`).
- Standardized Cloud Run deployment configuration using GitHub Repository Variables.
- Adopted Workload Identity Federation (OIDC) for keyless GitHub Actions deployments.
- Validated authenticated Cloud Run `/health` endpoint.

### Changed
- Clarified the approved Payments365 ingestion architecture.
- Identified Payments365 as the transaction domain and Elavon Secure File Transfer as the transport layer.
- Adopted Cloud Storage as the raw archive strategy for Payments365 daily files.
- Adopted Cloud SQL PostgreSQL as the operational transaction datastore.
- Activated Sprint 3.3 – Remote Directory Discovery as the active implementation sprint.
- Updated Elavon File Gateway readiness checks to validate Secret Manager access, authenticated SFTP connection establishment, and clean disconnect.
- Updated deployment automation to pass Elavon TEST SFTP runtime configuration through Cloud Run environment variables.
- Updated deployment, security, and platform documentation to reflect the current production foundation.
