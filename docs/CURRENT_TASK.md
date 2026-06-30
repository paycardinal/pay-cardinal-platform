


# CURRENT TASK

## Active Phase

**Phase 4 – Elavon File Gateway Foundation**

---

## Current Sprint

**Sprint 3.3 – Remote Directory Discovery**

---

## Current Objective

Discover available files in the Elavon TEST `/Inbox` directory by listing remote file metadata only.

The remote directory being explored contains Payments365 daily transaction files delivered through Elavon Secure File Transfer.

This sprint must not download, rename, delete, move, or process files.

---

## Current State

### Completed Sprints

- Sprint 3.2 – Elavon SFTP Connectivity complete.
- Sprint 3.1 – Secret Manager Integration.

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

---

## Scope

### In Scope

- Connect to Elavon TEST SFTP using existing Secret Manager credentials.
- Change to `/Inbox`.
- List available remote files.
- Capture safe metadata only:
  - filename
  - size
  - last modified timestamp
- Return safe readiness or discovery status.
- Structured logging.
- Error handling.
- Clean disconnect.

### Out of Scope

- File downloads.
- File uploads.
- Google Drive integration.
- Cloud Scheduler.
- File processing.
- Business logic.
- File deletion.
- File renaming.
- Folder creation.

---

## Acceptance Criteria

- Existing Secret Manager integration remains functional.
- Existing Elavon TEST SFTP connection remains functional.
- `/Inbox` directory can be accessed.
- Remote file metadata can be listed safely.
- No files are downloaded.
- No files are modified.
- No files are deleted.
- CI pipeline succeeds.
- Deployment pipeline succeeds.
- Cloud Run remains healthy.
- Logs contain no credentials or secret values.

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
- Architecture documentation remains accurate.
- No architecture rules are violated.

---

## Next Sprint Preview

**Sprint 3.4 – File Download Pipeline**

Planned objectives:

- Download eligible files from Elavon TEST `/Inbox`.
- Store files temporarily or pass them to the next processing stage.
- Do not upload to Google Drive yet.
- Do not process business contents yet.
