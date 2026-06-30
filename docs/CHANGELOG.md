

# Changelog

All notable changes to the Pay Cardinal Platform project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added
- Added documentation-only Sprint 3.4 production validation gate guidance.
- Added operational warning that Elavon production files may be one-time downloads with limited retention.
- Added explicit endpoint responsibility documentation for safe `GET /discover/inbox` metadata inspection and gated `POST /archive` file retrieval.
- Added canonical raw archive layout:
  - `gs://pc-payments365-raw/test/YYYY/MM/<original-filename>`
  - `gs://pc-payments365-raw/production/YYYY/MM/<original-filename>`
- Added Sprint 3.4 `POST /archive` endpoint contract for operator-approved Elavon TEST file archival.
- Added Cloud Storage raw archive preparation for Payments365 files retrieved through Elavon SFTP.
- Added Sprint 3.3 `/discover/inbox` endpoint for metadata-only Elavon TEST `/Inbox` discovery.
- Added `/Inbox` availability validation to Elavon File Gateway readiness checks without returning file metadata.
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
- Documented that Sprint 3.4 implementation is complete and Architecture has approved it, while Sprint 3.4 remains open pending controlled production archive validation.
- Documented that TEST `/Inbox` validation returned `fileCount: 0`.
- Documented that production runtime configuration has been updated for validation and that production `/health` and `/ready` return HTTP 200.
- Documented production metadata discovery as pending unless separately recorded in operator validation notes.
- Clarified GitHub Repository Variables, GitHub Repository Secrets, Secret Manager credential ownership, and `PAYMENTS365_RAW_BUCKET` as intentionally non-secret runtime configuration.
- Documented current intended production runtime configuration: `ELAVON_SFTP_ENV=production`, `ELAVON_SFTP_HOST=filegateway.elavon.com`, and `ELAVON_SFTP_PORT=20022`.
- Documented that `v0.5.0-file-download-pipeline` must not be tagged until Sprint 3.4 closes.
- Completed Sprint 3.3 – Remote Directory Discovery.
- Activated Sprint 3.4 – TEST File Download Pipeline.
- Documented canonical Cloud Storage object layout for Payments365 raw archives.
- Clarified the approved Payments365 ingestion architecture.
- Identified Payments365 as the transaction domain and Elavon Secure File Transfer as the transport layer.
- Adopted Cloud Storage as the raw archive strategy for Payments365 daily files.
- Adopted Cloud SQL PostgreSQL as the operational transaction datastore.
- Activated Sprint 3.3 – Remote Directory Discovery as the active implementation sprint.
- Updated Elavon File Gateway readiness checks to validate Secret Manager access, authenticated SFTP connection establishment, and clean disconnect.
- Updated deployment automation to pass Elavon TEST SFTP runtime configuration through Cloud Run environment variables.
- Updated deployment, security, and platform documentation to reflect the current production foundation.
