

# Service Boundaries

## Purpose

This document defines the ownership and responsibilities of each Platform service. Every service must have a clear purpose, well-defined inputs and outputs, and minimal dependencies on other services.

## Service Design Principles

- Each service has a single responsibility.
- Services are independently deployable.
- Services communicate through stable interfaces.
- Services do not contain business logic for consuming modules.
- Shared functionality belongs in `/shared`, not duplicated across services.

## Initial Platform Services

### Elavon File Gateway

**Purpose**
- Retrieve files from Elavon using secure SFTP.
- Store files in the Platform document repository.
- Record transfer status and operational logs.

**Consumes**
- Cloud Scheduler
- Secret Manager
- Elavon SFTP

**Produces**
- Files in Google Drive
- Structured logs
- Job status

---

### Payments365 Sync

**Purpose**
- Connect to Payments365.
- Retrieve platform-approved reporting data.
- Normalize data for downstream consumers.

**Consumes**
- Scheduled jobs
- Secret Manager
- Payments365 APIs

**Produces**
- Standardized datasets
- Structured logs
- Synchronization status

---

### Drive Document Service

**Purpose**
- Provide a single interface for document storage and retrieval.
- Manage folder conventions and metadata.

**Consumes**
- Platform services
- Google Drive API

**Produces**
- Document references
- Metadata
- Audit logs

---

### Shared API Gateway

**Purpose**
- Expose approved Platform APIs to consuming modules.
- Provide a stable contract independent of implementation details.

**Consumes**
- Internal Platform services

**Produces**
- Versioned APIs
- Standard responses
- Authentication and authorization enforcement

## Future Services

Future Platform services should be documented here before implementation. Each entry should define:

- Purpose
- Consumers
- Inputs
- Outputs
- Dependencies
- Security considerations

## Governance

No new Platform service should be implemented until its boundary is documented and approved. Service responsibilities should remain focused and should not overlap with other Platform services.