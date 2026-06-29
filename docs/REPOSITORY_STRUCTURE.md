

# Repository Structure

## Purpose

This document defines the standard directory structure for the Pay Cardinal Platform repository and the ownership of each top-level folder.

The repository is organized to separate infrastructure, reusable platform capabilities, and independently deployable services.

## Guiding Principles

- Organize by responsibility, not by technology.
- Keep services independently deployable.
- Separate infrastructure from implementation.
- Keep reusable code centralized.
- Keep documentation close to the architecture.

## Standard Repository Layout

```text
pay-cardinal-platform/
├── docs/
├── infrastructure/
├── services/
├── shared/
├── scripts/
├── .github/
├── .gitignore
├── README.md
└── LICENSE
```

## Folder Ownership

### docs/

Contains architectural, operational, governance, and implementation documentation.

Examples:

- CURRENT_TASK.md
- ARCHITECTURE.md
- SERVICE_BOUNDARIES.md
- STANDARDS.md
- SECURITY.md
- DEPLOYMENT.md
- DECISIONS.md

No executable code belongs in this directory.

---

### infrastructure/

Contains infrastructure configuration and deployment assets.

Examples:

- Cloud Run configuration
- Cloud Scheduler configuration
- IAM configuration
- Secret Manager configuration
- Monitoring configuration
- Environment-specific deployment assets

Infrastructure definitions should remain independent of service business logic.

---

### services/

Contains independently deployable Platform services.

Each service owns its own:

- package.json
- Dockerfile
- source code
- README
- runtime configuration

Example:

```text
services/
  elavon-file-gateway/
  payments365-sync/
  drive-document-service/
```

Services should not depend directly on one another unless explicitly documented.

---

### shared/

Contains reusable Platform libraries.

Examples:

- logging
- secret-manager
- google-drive
- api-clients
- security
- configuration
- types
- error handling

Business logic must not be placed in `/shared`.

---

### scripts/

Contains development and operational scripts.

Examples:

- local development helpers
- build utilities
- maintenance scripts
- migration utilities

Scripts should not contain production credentials.

---

### .github/

Contains GitHub configuration.

Examples:

- GitHub Actions workflows
- issue templates
- pull request templates
- repository automation

## Service Structure Standard

Every service should follow a consistent internal structure.

Example:

```text
services/
  service-name/
    src/
    package.json
    Dockerfile
    README.md
```

Additional folders may be introduced as needed, provided they follow the Platform standards.

## Shared Library Structure

Shared libraries should be organized by responsibility rather than by consumer.

Each shared library should have a clearly defined purpose and minimal external dependencies.

## Governance

Changes to the top-level repository structure require Platform Architecture approval.

New top-level directories should only be introduced when an existing directory cannot reasonably satisfy the requirement.

The repository structure should remain stable to support long-term maintainability and consistent developer experience.