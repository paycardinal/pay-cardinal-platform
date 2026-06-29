

# Platform Standards

This document defines the engineering, deployment, and governance standards for all services within the Pay Cardinal Platform.

---

## Sprint Completion Standard

Every implementation sprint must satisfy the following completion criteria before it is considered complete:

1. All CI workflows complete successfully.
2. The Cloud Run deployment completes successfully.
3. Runtime behavior is validated against the sprint's acceptance criteria.
4. Required documentation is updated, including `docs/CURRENT_TASK.md`, `docs/CHANGELOG.md`, and any affected architecture or operational documentation.
5. The `main` branch remains in a clean, deployable state.
6. Significant platform milestones should be identified with a Git tag after successful validation.

This standard applies to all platform services and is intended to ensure consistent quality, traceability, and operational readiness.

---

## Coding Standards

- Use TypeScript for all platform services.
- Keep services independently deployable.
- Prefer reusable code under `/shared`.
- Never embed secrets in source code.
- Follow least-privilege principles.
- Favor composition over tight coupling.
- Keep implementation focused on the active sprint.

---

## Repository Standards

- Every service owns its own `package.json`.
- Shared libraries belong under `/shared`.
- Infrastructure assets belong under `/infrastructure`.
- Documentation belongs under `/docs`.
- Keep commits small, focused, and descriptive.

---

## Deployment Standards

- Cloud Run is the deployment target.
- Artifact Registry stores container images.
- GitHub Actions performs CI/CD.
- Workload Identity Federation is required for deployments.
- Runtime configuration is managed through GitHub Repository Variables.
- Runtime secrets are retrieved from Secret Manager.

---

## Security Standards

- Secret Manager is the only approved source for runtime secrets.
- Secrets must never be committed to Git.
- Secrets must never be written to logs.
- Runtime identities must use least-privilege IAM roles.
- Long-lived service account keys are prohibited.

---

## Documentation Standards

- `docs/CURRENT_TASK.md` defines the active sprint contract.
- `docs/CHANGELOG.md` records notable project changes.
- Architecture decisions belong in `docs/DECISIONS.md`.
- Documentation should be updated as part of every completed sprint.

---

## Architecture Governance

- Architecture owns platform standards and shared infrastructure.
- Sprint owns implementation within the approved architecture.
- Platform services must remain loosely coupled.
- Business logic must not be introduced into shared infrastructure services without architectural approval.
- Significant architectural changes should be documented through Architecture Decision Records (ADRs).