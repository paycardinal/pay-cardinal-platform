# Pay Cardinal Platform

## Overview
Pay Cardinal Platform is the shared technical foundation for the broader Pay Cardinal program. It provides a consistent, secure, and maintainable environment for capabilities that can be reused across modules and future initiatives.

The platform ingests Payments365 transaction files delivered through Elavon Secure File Transfer. Elavon provides the transport layer, while Payments365 transaction data is the business domain.

The platform storage model separates operational data from generated documents:

- Cloud Storage stores raw Payments365 daily files.
- Cloud SQL stores normalized transaction data.
- Google Drive stores generated documents such as statement PDFs, agreements, exported reports, and customer-accessible documents.

## Mission
The mission of this repository is to establish a reusable platform layer for common capabilities, operational consistency, and governance while keeping module-specific business logic separate from shared platform responsibilities.

## Architecture Principles
- Separate platform capabilities from module-specific workflows.
- Promote reusable services and shared libraries.
- Emphasize security, reliability, and maintainability.
- Keep services independently deployable and well documented.

## Repository Structure
The repository is organized into documentation, shared platform assets, platform services, infrastructure configuration, and supporting scripts. This structure helps maintain clear ownership and reduce duplication across the program.

## Technology Stack
This platform is built around modern, cloud-friendly tooling and standards appropriate for secure, scalable service delivery. The repository is intended to support containerized services, shared libraries, and consistent operational practices.

## Current Services
The repository includes the initial platform services and supporting assets that form the foundation for shared integrations and reusable capabilities. Services are treated as independently deployable components within the platform.

## Current Status
- Platform Foundation complete.
- Google Cloud Foundation complete.
- Secret Manager integration complete.
- Elavon TEST SFTP connectivity complete.
- Sprint 3.3 – Remote Directory Discovery active.

## Development Standards
Contributions should follow repository conventions for readability, consistency, and cross-platform compatibility. Shared standards help maintain a reliable developer experience and sustainable long-term evolution.

## Documentation
The documentation in this repository describes the architecture, standards, security posture, deployment model, and repository guidance. These materials support alignment across platform teams and future contributors.

## Deployment
Cloud Run deployment conventions are documented in `docs/DEPLOYMENT.md`.

Deployments are automated through GitHub Actions, publish service images to Artifact Registry, deploy to Cloud Run, and verify deployment health.

## Roadmap
The roadmap focuses on expanding reusable platform capabilities, strengthening governance, and evolving the repository into a dependable foundation for future Pay Cardinal modules.
