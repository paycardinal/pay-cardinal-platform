


# CURRENT TASK

## Active Phase

**Phase 4 – Elavon File Gateway Foundation**

---

## Current Sprint

**Sprint 3.4 – File Download Pipeline**

---

## Current Objective

Implementation is complete and Architecture has approved the Sprint 3.4 implementation.

Sprint 3.4 remains open while controlled production archive validation is paused pending explicit confirmation from JD/Elavon before downloading a one-time production Payments365 file.

The remote directory being explored contains Payments365 daily transaction files delivered through Elavon Secure File Transfer.

This sprint must not parse files, write Cloud SQL, use Google Drive, schedule jobs, or rename, delete, move, or create folders on Elavon SFTP.

---

## Current State

### Completed Sprints

- Sprint 3.2 – Elavon SFTP Connectivity complete.
- Sprint 3.1 – Secret Manager Integration.
- Sprint 3.3 – Remote Directory Discovery complete.

### Completed

- Platform Foundation complete.
- Google Cloud Platform implementation complete.
- Cloud Run deployment pipeline operational.
- Artifact Registry configured.
- GitHub Actions deployment configured.
- Workload Identity Federation configured.
- Runtime service account configured.
- Secret Manager integration complete.
- Secret retrieval validated.
- Elavon TEST SFTP authentication validated.
- SFTP connection established and disconnected cleanly.
- `/ready` validates Secret Manager and Elavon TEST connectivity.
- Authenticated Cloud Run health endpoint validated.
- `/discover/inbox` lists Elavon TEST `/Inbox` file metadata only.
- Sprint 3.4 implementation complete.
- Architecture approval received for the Sprint 3.4 implementation.
- TEST `/Inbox` validation returned `fileCount: 0`.
- Production runtime configuration has been updated for validation:
  - `ELAVON_SFTP_ENV=production`
  - `ELAVON_SFTP_HOST=filegateway.elavon.com`
  - `ELAVON_SFTP_PORT=20022`
- Production `/health` returns HTTP 200.
- Production `/ready` returns HTTP 200.
- Production metadata discovery validation is pending unless separately recorded in operator validation notes.

### Paused

- Controlled production archive validation is paused pending explicit confirmation from JD/Elavon before downloading a one-time production file.
- `POST /archive` must not be executed against a production file before approval.
- The release tag `v0.5.0-file-download-pipeline` must not be created until Sprint 3.4 closes.

---

## Scope

### In Scope

- Accept `POST /archive` requests for `environment: "test"` only.
- Allow `GET /discover/inbox` to inspect metadata for the configured SFTP runtime environment.
- Validate requested filenames before any SFTP download.
- Require the operator to discover candidate files with `GET /discover/inbox` first.
- Perform a fresh Elavon TEST `/Inbox` listing before download.
- Download exactly the selected `/Inbox/<filename>` only when confirmed by the fresh listing.
- Calculate SHA-256 from the exact downloaded raw bytes.
- Archive unchanged raw bytes to Cloud Storage bucket `pc-payments365-raw`.
- Use canonical object layout `test/YYYY/MM/<original-filename>`.
- Attach archive object metadata:
  - `source=elavon-sftp`
  - `processor=payments365`
  - `environment=test`
  - `downloadedAt=<ISO-8601>`
  - `originalFilename=<filename>`
  - `sha256=<checksum>`
- Verify uploaded object size matches downloaded size.
- Return archive metadata only.
- Structured logging.
- Error handling.
- Clean disconnect.
- Controlled production metadata discovery through `GET /discover/inbox` after production runtime configuration is applied.

### Out of Scope

- Production archive writes.
- Production file download before explicit approval.
- File parsing.
- Cloud SQL writes.
- Google Drive integration.
- Cloud Scheduler.
- Business logic.
- File deletion.
- File renaming.
- File moving.
- Folder creation.

---

## Acceptance Criteria

- Existing Secret Manager integration remains functional.
- Existing Elavon TEST SFTP connection remains functional.
- `/Inbox` directory can be accessed.
- Remote file metadata can be listed safely.
- `POST /archive` accepts only `environment: "test"`.
- `POST /archive` rejects missing or unsafe filenames.
- Archive flow performs a fresh SFTP `/Inbox` listing before download.
- Filename must be confirmed in the fresh listing before download.
- Exactly one approved TEST file is downloaded.
- Raw file exists at `gs://pc-payments365-raw/test/YYYY/MM/<original-filename>`.
- Uploaded object size equals downloaded file size.
- SHA-256 checksum is calculated and returned as lowercase hex.
- Object metadata is attached.
- No file contents are returned.
- No files are parsed.
- No Cloud SQL writes occur.
- No Google Drive interaction occurs.
- No files are modified.
- No files are deleted.
- No files are renamed or moved.
- CI pipeline succeeds.
- Deployment pipeline succeeds.
- Cloud Run remains healthy.
- Logs contain no credentials or secret values.
- Logs contain no raw file contents.

---

## Files to Review

- services/elavon-file-gateway/
- shared/secrets/
- .github/workflows/deploy.yml
- docs/ARCHITECTURE.md
- docs/SECURITY.md
- docs/DEPLOYMENT.md
- docs/STANDARDS.md
- docs/DECISIONS.md

---

## Architecture Constraints

- Cloud Run is the deployment target.
- Secret Manager is the only source for sensitive credentials.
- No secrets stored in Git.
- No business logic during this sprint.
- Keep services independently deployable.
- Follow Platform Architecture and ADRs.

---

## Definition of Done

- Implementation satisfies all acceptance criteria.
- CI pipeline succeeds.
- Deployment pipeline succeeds.
- Cloud Run deployment is healthy.
- `/health` returns 200.
- `/ready` returns 200.
- `/discover/inbox` returns metadata only.
- `POST /archive` validates environment and filename guardrails.
- Cloud Storage archive object and metadata are validated.
- Controlled production metadata discovery is completed or remains explicitly documented as pending.
- Controlled production archive validation is completed only after JD/Elavon confirmation and exact filename approval.
- Architecture documentation remains accurate.
- No architecture rules are violated.

---

## Endpoint Responsibilities

### `GET /discover/inbox`

- Metadata only.
- Directory listing only.
- Safe to execute for the configured SFTP runtime environment.
- Does not download files.
- Does not archive files.
- Does not parse files.
- Does not mutate Elavon SFTP.

### `POST /archive`

- First endpoint that retrieves file contents.
- May consume a one-time Elavon download.
- Uploads unchanged bytes to Cloud Storage.
- Must only be executed after explicit approval.
- Current implementation accepts only `environment: "test"`.

## Controlled Production Validation Gate

WARNING: Elavon production files may be available for only one download and may have limited retention.

`GET /discover/inbox` is safe for production metadata inspection because it lists `/Inbox` metadata only.

`POST /archive` may permanently consume the available download unless Elavon re-flags the file. Do not execute `POST /archive` until all validation prerequisites and explicit user approval have been completed.

Validation prerequisites:

- Production `/health` returns HTTP 200.
- Production `/ready` returns HTTP 200.
- Production `/discover/inbox` has been validated successfully or is explicitly recorded as pending.
- JD/Elavon confirms that downloading one production file is approved.
- The user approves one exact production filename.
- Exactly one approved production file may be archived.
- The validation should complete in one uninterrupted execution.

## Cloud Storage Archive Layout

Cloud Storage is the immutable raw archive for Payments365 files retrieved through Elavon SFTP.

Canonical object layout:

```text
gs://pc-payments365-raw/test/YYYY/MM/<original-filename>
gs://pc-payments365-raw/production/YYYY/MM/<original-filename>
```

Sprint 3.4 currently defines the `test` archive path. Production archive execution remains gated.

## Follow-up Recommendations

- Reduce Cloud Storage IAM from `storage.objectAdmin` to least privilege after archive validation completes.
- Consider separate Cloud Run services for TEST and PRODUCTION through a future ADR.
- Consider an ADR for immutable raw archive naming policy.
- Consider an ADR for archive idempotency policy.
- Do not enable scheduler until controlled archive validation has completed successfully.

---

## Next Sprint Preview

**Sprint 3.5 – Payments365 Raw Archive Operationalization**

Planned objectives:

- Harden archive validation and IAM.
- Prepare production-safe streaming implementation.
- Define parser handoff contract.
- Do not process business contents yet.
