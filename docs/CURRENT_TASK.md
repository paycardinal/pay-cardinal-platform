


# CURRENT TASK

## Active Phase

**Phase 4 – Elavon File Gateway Foundation**

---

## Current Sprint

**Sprint 3.4 – TEST File Download Pipeline**

---

## Current Objective

Download one operator-approved Payments365 TEST file from the Elavon TEST `/Inbox` directory and archive the unchanged raw bytes in Cloud Storage.

The remote directory being explored contains Payments365 daily transaction files delivered through Elavon Secure File Transfer.

This sprint must not parse files, write Cloud SQL, use Google Drive, use production SFTP, schedule jobs, or rename, delete, move, or create folders on Elavon SFTP.

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

---

## Scope

### In Scope

- Accept `POST /archive` requests for `environment: "test"` only.
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

### Out of Scope

- Production SFTP usage.
- Production archive writes.
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
- Architecture documentation remains accurate.
- No architecture rules are violated.

---

## Next Sprint Preview

**Sprint 3.5 – Payments365 Raw Archive Operationalization**

Planned objectives:

- Harden archive validation and IAM.
- Prepare production-safe streaming implementation.
- Define parser handoff contract.
- Do not process business contents yet.
