

# Changelog

All notable changes to the Pay Cardinal Platform project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added
- Completed Sprint 3.1 – Secret Manager Integration.
- Integrated Google Secret Manager for secure runtime credential retrieval.
- Configured dedicated Cloud Run runtime service account (`pc-elavon-runtime`).
- Standardized Cloud Run deployment configuration using GitHub Repository Variables.
- Adopted Workload Identity Federation (OIDC) for keyless GitHub Actions deployments.
- Validated authenticated Cloud Run `/health` endpoint.

### Changed
- Activated Sprint 3.2 – Elavon SFTP Connectivity as the active implementation sprint.
- Updated deployment, security, and platform documentation to reflect the current production foundation.