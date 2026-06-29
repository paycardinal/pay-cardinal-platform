# Elavon File Gateway

Pay Cardinal Platform Elavon file gateway service.

## Runtime

- TypeScript
- Node.js 20+
- Cloud Run compatible HTTP listener
- Uses `process.env.PORT`, defaulting to `8080` locally
- Reads the Elavon SSH private key and SFTP user ID from Google Secret Manager during controlled readiness checks
- Verifies SFTP connectivity to the Elavon TEST File Gateway

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | HTTP listener port. Defaults to `8080`. |
| `GCP_PROJECT_ID` | Yes for readiness | Google Cloud project containing the secret. |
| `ELAVON_SFTP_ENV` | Yes for readiness | Elavon SFTP environment. Sprint 3.2 supports `test`. |
| `ELAVON_SFTP_HOST` | Yes for readiness | Elavon TEST SFTP host. |
| `ELAVON_SFTP_PORT` | Yes for readiness | Elavon TEST SFTP port. |
| `ELAVON_SFTP_USER_ID_SECRET_NAME` | Yes for readiness | Secret Manager secret name or full secret resource path for the SFTP user ID. |
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

Verifies that the Elavon SSH private key and SFTP user ID can be retrieved from Secret Manager, then opens and closes an authenticated SFTP session with the Elavon TEST File Gateway. Secret values, secret names, host names, and usernames are not logged or returned.

Success:

```json
{
  "status": "ok",
  "service": "elavon-file-gateway",
  "checks": {
    "elavonSshPrivateKey": "available",
    "elavonSftpUserId": "available",
    "elavonSftpConnection": "available"
  }
}
```

Failure:

```json
{
  "status": "degraded",
  "service": "elavon-file-gateway",
  "checks": {
    "elavonSftpConnection": "unavailable"
  },
  "reason": "sftp_connection_failed"
}
```

Safe readiness failure reason codes are `missing_config`, `secret_unavailable`, `sftp_auth_failed`, `sftp_connection_failed`, `sftp_disconnect_failed`, and `unexpected_error`.

## Commands

```sh
npm install
npm run build
npm start
```

## Scope

This service intentionally contains no remote directory listing, file downloads, Google Drive uploads, Elavon business logic, credentials, or secret values.
