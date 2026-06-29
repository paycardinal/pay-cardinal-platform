# Platform Authentication

## Purpose

This document defines the authentication foundation for Pay Cardinal Platform automation that runs in GitHub Actions and needs to access Google Cloud.

The platform should use Workload Identity Federation for GitHub Actions authentication instead of long-lived Google Cloud service account keys.

This is documentation only. It does not create Google Cloud resources, add credentials, or enable deployment automation.

## Why Workload Identity Federation

Workload Identity Federation allows GitHub Actions to exchange a short-lived GitHub OIDC token for short-lived Google Cloud credentials.

This approach is preferred because it:

- Avoids storing Google Cloud service account JSON keys in GitHub secrets.
- Reduces the risk of credential leakage.
- Allows access to be scoped by repository, branch, workflow, or environment claims.
- Produces auditable IAM activity in Google Cloud.
- Supports least-privilege deployment identities for each environment.
- Keeps credential rotation in Google Cloud instead of repository configuration.

## Authentication Flow

The expected GitHub Actions to Google Cloud authentication flow is:

1. A GitHub Actions workflow starts for an approved deployment event.
2. GitHub issues an OpenID Connect token for that workflow run.
3. The workflow presents the token to a Google Cloud Workload Identity Pool Provider.
4. Google Cloud validates the token issuer, audience, and configured attribute conditions.
5. Google Cloud allows the workflow identity to impersonate a deployment service account.
6. The workflow receives short-lived Google Cloud credentials.
7. The workflow uses those credentials to authenticate Docker to Artifact Registry.
8. The workflow builds and pushes the container image.
9. The workflow deploys the selected image to Cloud Run.

Future deployment workflows should fail closed if any authentication step is unavailable or if the GitHub OIDC claims do not match the configured provider policy.

## Required Google Cloud Resources

Each environment should have its own Google Cloud identity and deployment boundary.

Required resources include:

- Google Cloud project for the target environment.
- Workload Identity Pool for GitHub Actions identities.
- Workload Identity Pool Provider for GitHub OIDC tokens.
- Deployment service account for GitHub Actions to impersonate.
- Artifact Registry Docker repository for service images.
- Cloud Run service for each deployable platform service.
- IAM bindings that grant only the required deployment permissions.

Recommended environment separation:

```text
pay-cardinal-platform-dev
pay-cardinal-platform-test
pay-cardinal-platform-prod
```

Development, Test, and Production should not share deployment service accounts.

## GitHub OIDC Provider Scope

The Workload Identity Pool Provider should trust GitHub's OIDC issuer and should restrict access using GitHub token claims.

Useful claim restrictions include:

- Repository owner.
- Repository name.
- Branch or tag reference.
- GitHub environment.
- Workflow file path.
- Pull request versus push event.

Production access should be more restrictive than Development access and should require an explicit GitHub environment approval or an equivalent release control before a deployment workflow can impersonate the Production deployment service account.

## Service Account Responsibilities

The GitHub Actions deployment service account is responsible for deployment automation only.

It should be able to:

- Authenticate Docker to Artifact Registry.
- Push approved service images to the environment Artifact Registry repository.
- Deploy selected images to Cloud Run services.
- Read required deployment metadata.
- Act as the configured Cloud Run runtime service account only when necessary for deployment.

It should not:

- Own runtime application permissions.
- Store or expose secrets.
- Have broad project administration permissions.
- Have access to unrelated services.
- Be shared across environments unless explicitly reviewed.

Runtime Cloud Run service accounts should remain separate from GitHub Actions deployment service accounts.

## Required IAM Roles

Exact role assignments should be reviewed per environment before automation is enabled.

Typical deployment service account roles include:

- `roles/artifactregistry.writer` on the Artifact Registry repository or project.
- `roles/run.developer` on the Cloud Run service or project.
- `roles/iam.serviceAccountUser` on the Cloud Run runtime service account that the deployment uses.

The Workload Identity principal for GitHub Actions also needs permission to impersonate the deployment service account:

- `roles/iam.workloadIdentityUser` on the deployment service account.

Avoid granting broad roles such as Owner, Editor, Project IAM Admin, or Service Account Key Admin to deployment automation.

## Security Benefits Over Service Account Keys

Workload Identity Federation improves the platform security posture by removing long-lived private keys from the deployment path.

With service account keys:

- A leaked key can be used outside GitHub Actions.
- Key rotation is manual and operationally fragile.
- Repository secrets can become a hidden production dependency.
- Access is harder to bind to a specific workflow context.

With Workload Identity Federation:

- Credentials are short-lived.
- Access is evaluated for each workflow run.
- Google Cloud can restrict trust using GitHub OIDC claims.
- No JSON key files are created or committed.
- Revocation can happen through IAM binding or provider policy changes.

## Authentication Sequence

Future deployment workflows should follow this sequence:

```text
GitHub Actions workflow
  -> Request GitHub OIDC token
  -> Exchange token through Workload Identity Provider
  -> Impersonate Google Cloud deployment service account
  -> Configure gcloud with short-lived credentials
  -> Configure Docker authentication for Artifact Registry
  -> Build service image
  -> Push image to Artifact Registry
  -> Deploy image to Cloud Run
```

The repository should not contain service account key files, JSON credentials, or committed secret values at any point in this sequence.

## Future Deployment Workflow

The inactive template at `.github/workflows/deploy-template.yml` documents the expected GitHub Actions shape for future deployment automation.

Before enabling an actual deployment workflow:

1. Create environment-specific Google Cloud projects and service accounts.
2. Configure Workload Identity Federation for GitHub Actions.
3. Restrict provider attributes to the approved repository and deployment context.
4. Create Artifact Registry repositories using the platform naming convention.
5. Grant least-privilege IAM roles to the deployment service account.
6. Configure GitHub environments and required approvals for sensitive deployments.
7. Replace placeholder values with reviewed environment configuration.
8. Run a non-production deployment validation before any Production release.

Deployment automation must remain explicit, reviewed, auditable, and free of committed credentials.
