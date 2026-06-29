

# Architecture Decision Records (ADR)

## Purpose

This document records significant architectural decisions for the Pay Cardinal Platform. Each decision captures the context, the decision made, and the rationale behind it.

Only long-term architectural decisions belong here. Sprint tasks and implementation details belong elsewhere.

---

## ADR-001: Platform Scope

**Status:** Accepted

### Decision

Pay Cardinal Platform is the shared technical foundation for the Pay Cardinal Program.

It owns shared infrastructure, integrations, reusable services, security, deployment standards, and shared libraries. It does not contain module-specific business logic.

### Rationale

Separating the Platform from business modules promotes reuse, reduces duplication, and allows independent evolution of Platform capabilities and consuming modules.

---

## ADR-002: Deployment Model

**Status:** Accepted

### Decision

All Platform services will be independently deployed to Google Cloud Run.

### Rationale

Independent deployments improve scalability, reduce coupling, and allow services to evolve on separate release cycles.

---

## ADR-003: Repository Organization

**Status:** Accepted

### Decision

The repository is organized into `/services`, `/shared`, `/infrastructure`, and `/docs`.

### Rationale

Separating responsibilities improves maintainability, ownership, and long-term scalability.

---

## ADR-004: Shared Code

**Status:** Accepted

### Decision

Only reusable infrastructure components belong under `/shared`.

Business logic remains within the appropriate consuming module or Platform service.

### Rationale

This prevents tight coupling and preserves clear ownership boundaries.

---

## ADR-005: Secret Management

**Status:** Accepted

### Decision

Production secrets will be stored in Google Secret Manager and retrieved at runtime.

### Rationale

Centralized secret management improves security, auditing, and operational consistency.

---

## ADR-006: Integration Strategy

**Status:** Accepted

### Decision

Third-party integrations that may be used by multiple modules will be implemented once within the Platform and exposed through stable service interfaces.

### Rationale

A single implementation reduces duplication, simplifies maintenance, and provides a consistent integration layer for all consuming modules.

---

## Future ADRs

Future architecture decisions should follow this format:

- ADR Number
- Status
- Context (optional)
- Decision
- Rationale
- Consequences (optional)

Only decisions with long-term architectural impact should be recorded in this document.