


# CURRENT TASK

## Active Phase

**Phase 4 – Elavon File Gateway Foundation**

---

## Current Sprint

**Sprint 3.1 – Secret Manager Integration**

---

## Current Objective

Implement the foundation for securely retrieving the Elavon SSH private key from Google Secret Manager.

This sprint establishes the secure credential retrieval layer that will be used by the Elavon File Gateway.

---

## Current State

### Completed

- Platform Foundation complete.
- Google Cloud Platform implementation complete.
- Cloud Run deployment pipeline operational.
- Artifact Registry configured.
- GitHub Actions deployment configured.
- Workload Identity Federation configured.
- Runtime service account configured.
- Secret Manager baseline established.

### In Progress

- Secret Manager integration.

---

## Scope

### In Scope

- Read the Elavon SSH private key from Google Secret Manager.
- Verify successful secret retrieval.
- Implement appropriate error handling.
- Log success and failure without exposing secret contents.
- Use the Cloud Run runtime service account.

### Out of Scope

- SFTP connectivity.
- File downloads.
- Google Drive uploads.
- Cloud Scheduler.
- Elavon business logic.

---

## Acceptance Criteria

- Secret Manager integration is functional.
- No secret values are logged.
- Errors are handled gracefully.
- Runtime service account uses least-privilege access.
- Service builds and deploys successfully through GitHub Actions.

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

**Sprint 3.2 – Elavon SFTP Connectivity**

Planned objectives:

- Retrieve SSH key from Secret Manager.
- Establish authenticated SFTP connection.
- Verify remote connectivity.
- No file downloads.
- No business processing.