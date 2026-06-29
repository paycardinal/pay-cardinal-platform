# Elavon File Gateway

Sprint 1 bootstrap for the Pay Cardinal Platform Elavon file gateway service.

## Runtime

- TypeScript
- Node.js 20+
- Cloud Run compatible HTTP listener
- Uses `process.env.PORT`, defaulting to `8080` locally

## Endpoint

`GET /health`

```json
{
  "status": "ok",
  "service": "elavon-file-gateway"
}
```

## Commands

```sh
npm install
npm run build
npm start
```

## Scope

This bootstrap intentionally contains no SFTP, Google Drive, Elavon business logic, credentials, secrets, or environment variables beyond `PORT`.
