

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

Future production deployment for Payments365 daily processing will include:

- Cloud Storage for the immutable archive of original Payments365 daily files
- Cloud SQL PostgreSQL for normalized operational transaction records
- Cloud Run Ingestion Service for retrieving Payments365 files delivered through Elavon Secure File Transfer

Google Drive is not part of the operational ingestion pipeline and must not be used as the transaction datastore.

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

Cloud Run deployments use GitHub Actions with Workload Identity Federation.
Deployments are keyless and must not use JSON service account keys.

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

Runtime configuration is controlled through GitHub Repository Variables.

The Elavon File Gateway runtime service account is `pc-elavon-runtime`.

Elavon File Gateway deployment uses GitHub Repository Variables for non-secret runtime configuration:

- `ELAVON_SFTP_ENV`
- `ELAVON_SFTP_HOST`
- `ELAVON_SFTP_PORT`
- `ELAVON_SFTP_USER_ID_SECRET_NAME`
- `ELAVON_SSH_PRIVATE_KEY_SECRET_NAME`
- `PAYMENTS365_RAW_BUCKET`

The SFTP environment, host, port, and `PAYMENTS365_RAW_BUCKET` are runtime configuration, not secrets. `PAYMENTS365_RAW_BUCKET` is intentionally a non-secret runtime variable.

The SFTP user ID and SSH private key values remain in Google Secret Manager. GitHub Repository Variables may reference the Secret Manager secret names or full secret resource paths, but must not contain the credential values.

The active deployment workflow uses GitHub Repository Secrets only for deployment authentication:

- `WIF_PROVIDER`
- `WIF_SERVICE_ACCOUNT`

These are deployment credentials for Workload Identity Federation. They are not Elavon credentials.

`PAYMENTS365_RAW_BUCKET` is required for Sprint 3.4 archive behavior. It identifies the Cloud Storage bucket used for immutable raw Payments365 files retrieved through Elavon SFTP. GitHub Actions must propagate `PAYMENTS365_RAW_BUCKET` to Cloud Run during deployment. The bucket name must remain runtime configuration and must not be hardcoded in service source code.

Cloud Storage is the immutable raw archive for Payments365 files retrieved through Elavon SFTP.

Canonical object layout:

```text
gs://pc-payments365-raw/test/YYYY/MM/<original-filename>
gs://pc-payments365-raw/production/YYYY/MM/<original-filename>
```

Current intended production SFTP runtime configuration:

```text
ELAVON_SFTP_ENV=production
ELAVON_SFTP_HOST=filegateway.elavon.com
ELAVON_SFTP_PORT=20022
```

The same Secret Manager credential references are currently used unless repository documentation records a different approved credential set. Do not invent undocumented credential names.

## Production Validation Gate

Sprint 3.4 implementation is complete and Architecture has approved the implementation. Sprint 3.4 remains open while controlled production archive validation is paused pending explicit confirmation from JD/Elavon before downloading a one-time production Payments365 file.

Production `/health` and `/ready` have returned HTTP 200 after production runtime configuration was applied. Production metadata discovery through `GET /discover/inbox` is documented as pending unless separately recorded in operator validation notes.

WARNING: Elavon production files may be available for only one download and may have limited retention.

`GET /discover/inbox` is safe for production metadata inspection because it performs directory listing only and returns metadata only. It does not download files, archive files, parse files, or mutate Elavon SFTP.

`POST /archive` is the first endpoint that retrieves file contents. It may permanently consume the available download unless Elavon re-flags the file. Do not execute `POST /archive` until JD/Elavon confirmation has been received, the user has approved one exact filename, and the validation can complete in one uninterrupted execution.

Do not enable scheduler until controlled archive validation has completed successfully.

Do not create the `v0.5.0-file-download-pipeline` tag until Sprint 3.4 closes.

## Environments

As the Platform grows, maintain separate environments such as:

- Development
- Test
- Production

Each environment should have independent configuration and credentials.

## Scheduled Services

Cloud Scheduler is the standard mechanism for recurring Platform jobs.

Scheduler should invoke Cloud Run services using authenticated requests.

## Regional Deployment Standard

The default regional deployment standard for Platform resources is us-east1 (South Carolina).

| Resource | Standard |
| --- | --- |
| Cloud Run | us-east1 |
| Artifact Registry | us-east1 |
| Cloud Scheduler | us-east1 |
| Secret Manager | Global |
| IAM | Global |
| Cloud Logging | Global |
| Cloud Monitoring | Global |

All future regional Platform resources should default to us-east1 unless Architecture approves an exception.

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
