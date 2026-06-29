


# CURRENT TASK

## Active Phase

**Phase 4 – Elavon File Gateway Foundation**

---

## Current Sprint

**Sprint 3.2 – Elavon SFTP Connectivity**

---

## Current Objective

Establish an authenticated SSH/SFTP connection to the Elavon File Gateway using the SSH private key retrieved from Google Secret Manager.

The goal of this sprint is to validate secure connectivity only.

No file downloads, uploads, or business processing are included.

---

## Current State

### Completed Sprints

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
- Authenticated Cloud Run health endpoint validated.

---

## Scope

### In Scope

- Load SSH private key from Secret Manager.
- Create SSH/SFTP client.
- Authenticate with Elavon.
- Verify remote connectivity.
- Gracefully disconnect.
- Structured logging.
- Error handling.

### Out of Scope

- File listing.
- File downloads.
- Google Drive uploads.
- Cloud Scheduler.
- File processing.
- Business logic.

---

## Acceptance Criteria

- Secret retrieved successfully from Secret Manager.
- SSH authentication succeeds.
- SFTP connection established.
- Connection closes cleanly.
- Errors handled gracefully.
- CI pipeline succeeds.
- Deployment pipeline succeeds.
- Cloud Run deployment remains healthy.

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

**Sprint 3.3 – Remote Directory Discovery**

Planned objectives:

- List available remote files.
- Capture metadata only.
- No file downloads.
- No business processing.
