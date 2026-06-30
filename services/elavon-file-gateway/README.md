# Elavon File Gateway

Pay Cardinal Platform Elavon file gateway service.

## Runtime

- TypeScript
- Node.js 20+
- Cloud Run compatible HTTP listener
- Uses `process.env.PORT`, defaulting to `8080` locally
- Reads the Elavon SSH private key and SFTP user ID from Google Secret Manager during controlled readiness checks
- Verifies SFTP connectivity to the configured Elavon File Gateway environment
- Verifies `/Inbox` availability and lists metadata only through controlled discovery
- Archives one operator-approved TEST file from `/Inbox` to Cloud Storage without parsing file contents

Sprint 3.4 implementation is complete and Architecture has approved the implementation. Sprint 3.4 remains open while controlled production archive validation is paused pending explicit confirmation from JD/Elavon before downloading a one-time production Payments365 file.

Production runtime configuration has been updated for validation. Production `/health` and `/ready` return HTTP 200. Production metadata discovery through `GET /discover/inbox` is pending unless separately recorded in operator validation notes.

WARNING: Elavon production files may be available for only one download and may have limited retention.

`GET /discover/inbox` is safe.

`POST /archive` may permanently consume the available download unless Elavon re-flags the file. Do not execute `POST /archive` until all validation prerequisites and explicit user approval have been completed.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | HTTP listener port. Defaults to `8080`. |
| `GCP_PROJECT_ID` | Yes for readiness and discovery | Google Cloud project containing the secrets. |
| `ELAVON_SFTP_ENV` | Yes for readiness and discovery | Elavon SFTP environment. Supported runtime values are `test` and `production`. |
| `ELAVON_SFTP_HOST` | Yes for readiness and discovery | Elavon SFTP host for the configured runtime environment. |
| `ELAVON_SFTP_PORT` | Yes for readiness and discovery | Elavon SFTP port for the configured runtime environment. |
| `ELAVON_SFTP_USER_ID_SECRET_NAME` | Yes for readiness and discovery | Secret Manager secret name or full secret resource path for the SFTP user ID. |
| `ELAVON_SSH_PRIVATE_KEY_SECRET_NAME` | Yes for readiness and discovery | Secret Manager secret name or full secret resource path. |
| `PAYMENTS365_RAW_BUCKET` | Yes for archive | Cloud Storage bucket for immutable raw Payments365 file archives. |

The service relies on the Cloud Run runtime service account for Google Secret Manager access. Do not provide private key material through environment variables.

Current intended production SFTP runtime configuration:

```text
ELAVON_SFTP_ENV=production
ELAVON_SFTP_HOST=filegateway.elavon.com
ELAVON_SFTP_PORT=20022
```

The same Secret Manager credential references are currently used unless repository documentation records a different approved credential set. Do not invent undocumented credential names.

`PAYMENTS365_RAW_BUCKET` is intentionally a non-secret runtime variable. The SFTP user ID and SSH private key values remain in Google Secret Manager.

## Endpoints

`GET /health`

```json
{
  "status": "ok",
  "service": "elavon-file-gateway"
}
```

This endpoint does not retrieve secrets.

`GET /ready`

Verifies that the Elavon SSH private key and SFTP user ID can be retrieved from Secret Manager, then opens an authenticated SFTP session, validates `/Inbox` availability, and disconnects cleanly. This endpoint does not list files and does not return file metadata. Secret values, secret names, host names, and usernames are not logged or returned.

Success:

```json
{
  "status": "ok",
  "service": "elavon-file-gateway",
  "checks": {
    "elavonSshPrivateKey": "available",
    "elavonSftpUserId": "available",
    "elavonSftpConnection": "available",
    "elavonInboxDirectory": "available"
  }
}
```

Failure:

```json
{
  "status": "degraded",
  "service": "elavon-file-gateway",
  "checks": {
    "elavonSftpConnection": "unavailable"
  },
  "reason": "sftp_connection_failed"
}
```

Safe readiness failure reason codes are `missing_config`, `secret_unavailable`, `sftp_auth_failed`, `sftp_connection_failed`, `sftp_directory_unavailable`, `sftp_disconnect_failed`, and `unexpected_error`.

`GET /discover/inbox`

Connects to the configured Elavon SFTP environment, targets `/Inbox`, lists directory entries, returns file metadata only, and disconnects cleanly.

This endpoint is metadata only and directory listing only. It is safe to execute for production metadata inspection because it does not download, upload, archive, rename, move, delete, parse, or otherwise mutate Elavon SFTP files.

During validation, TEST `/Inbox` returned `fileCount: 0`.

Success:

```json
{
  "status": "ok",
  "directory": "/Inbox",
  "fileCount": 2,
  "files": [
    {
      "filename": "Payments365_20260630.csv",
      "size": 1843291,
      "lastModifiedAt": "2026-06-30T01:22:14.000Z"
    }
  ]
}
```

The `files` array returns only `filename`, `size`, and `lastModifiedAt`.

Safe discovery failure reason codes are `missing_config`, `secret_unavailable`, `sftp_auth_failed`, `sftp_connection_failed`, `sftp_directory_unavailable`, `sftp_list_failed`, `sftp_disconnect_failed`, and `unexpected_error`.

`POST /archive`

Archives exactly one approved Elavon TEST `/Inbox` file to Cloud Storage. The operator must first call `GET /discover/inbox`, select an approved filename from that metadata response, and then call this endpoint. The service performs a fresh `/Inbox` listing before download and downloads only when the requested filename is confirmed in that fresh listing.

This is the first endpoint that retrieves file contents. It uploads unchanged bytes to Cloud Storage and may consume a one-time Elavon download.

Request:

```json
{
  "environment": "test",
  "filename": "approved-test-file.csv"
}
```

Sprint 3.4 accepts only `environment: "test"`. Filenames must not contain `/`, `\`, `..`, or path traversal. This endpoint does not parse files, write Cloud SQL, use Google Drive, rename, delete, move, or create Elavon SFTP folders.

Do not execute `POST /archive` for production validation until JD/Elavon confirms that downloading one production file is approved, the user approves one exact filename, and the validation can complete in one uninterrupted execution. Exactly one approved production file may be archived after approval.

Success:

```json
{
  "status": "ok",
  "archive": {
    "filename": "approved-test-file.csv",
    "size": 12345,
    "lastModifiedAt": "2026-06-30T01:22:14.000Z",
    "downloadedAt": "2026-06-30T15:03:44.000Z",
    "sha256": "lowercase-hex-digest",
    "bucket": "configured-bucket-name",
    "objectPath": "test/2026/06/approved-test-file.csv"
  }
}
```

Safe archive failure reason codes are `missing_config`, `invalid_environment`, `invalid_filename`, `file_not_found`, `secret_unavailable`, `sftp_auth_failed`, `sftp_connection_failed`, `sftp_directory_unavailable`, `sftp_list_failed`, `sftp_download_failed`, `sftp_disconnect_failed`, `storage_upload_failed`, `storage_verification_failed`, `checksum_failed`, and `unexpected_error`.

## Cloud Storage Archive Layout

Cloud Storage is the immutable raw archive for Payments365 files retrieved through Elavon SFTP.

Canonical object layout:

```text
gs://pc-payments365-raw/test/YYYY/MM/<original-filename>
gs://pc-payments365-raw/production/YYYY/MM/<original-filename>
```

Current Sprint 3.4 archive implementation writes approved TEST files only.

## Follow-up Recommendations

- Reduce Cloud Storage IAM from `storage.objectAdmin` to least privilege after archive validation completes.
- Consider separate Cloud Run services for TEST and PRODUCTION through a future ADR.
- Consider an ADR for immutable raw archive naming policy.
- Consider an ADR for archive idempotency policy.
- Do not enable scheduler until controlled archive validation has completed successfully.

## Commands

```sh
npm install
npm run build
npm start
```

## Scope

This service intentionally contains no Google Drive uploads, Cloud SQL writes, file parsing, Elavon business logic, credentials, or secret values.
