# Elavon File Gateway

Pay Cardinal Platform Elavon file gateway service.

## Runtime

- TypeScript
- Node.js 20+
- Cloud Run compatible HTTP listener
- Uses `process.env.PORT`, defaulting to `8080` locally
- Reads the Elavon SSH private key from Google Secret Manager during controlled readiness checks

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | HTTP listener port. Defaults to `8080`. |
| `GCP_PROJECT_ID` | Yes for readiness | Google Cloud project containing the secret. |
| `ELAVON_SSH_PRIVATE_KEY_SECRET_NAME` | Yes for readiness | Secret Manager secret name or full secret resource path. |

The service relies on the Cloud Run runtime service account for Google Secret Manager access. Do not provide private key material through environment variables.

## Endpoints

`GET /health`

```json
{
  "status": "ok",
  "service": "elavon-file-gateway"
}
```

This endpoint does not retrieve secrets.

`GET /ready`

Verifies that the Elavon SSH private key can be retrieved from Secret Manager without logging or returning the secret value.

Success:

```json
{
  "status": "ok",
  "service": "elavon-file-gateway",
  "checks": {
    "elavonSshPrivateKey": "available"
  }
}
```

Failure:

```json
{
  "status": "degraded",
  "service": "elavon-file-gateway",
  "checks": {
    "elavonSshPrivateKey": "missing_configuration"
  }
}
```

## Commands

```sh
npm install
npm run build
npm start
```

## Scope

This service intentionally contains no SFTP, Google Drive, Elavon business logic, credentials, or secret values.
