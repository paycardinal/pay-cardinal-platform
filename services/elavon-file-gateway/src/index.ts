import { createServer, type ServerResponse } from "node:http";

import { getConfig, getMissingSecretConfig } from "./config.js";
import { logger } from "./logger.js";
import { ElavonSecretManager } from "./secrets/secretManager.js";
import {
  ElavonSftpClient,
  type SftpFailureReason,
} from "./sftp/elavonSftpClient.js";

const config = getConfig();
const secretManager = new ElavonSecretManager();
const sftpClient = new ElavonSftpClient();

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
): void => {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
};

type CredentialResult =
  | {
      ok: true;
      privateKey: string;
      userId: string;
    }
  | {
      ok: false;
      statusCode: number;
      body: Record<string, unknown>;
    };

const getElavonCredentials = async (): Promise<CredentialResult> => {
  const missingConfiguration = getMissingSecretConfig(config);

  if (missingConfiguration.length > 0) {
    logger.warn("elavon credential validation failed", {
      service: config.serviceName,
      reason: "missing_config",
    });

    return {
      ok: false,
      statusCode: 503,
      body: {
        status: "degraded",
        service: config.serviceName,
        checks: {},
        reason: "missing_config",
      },
    };
  }

  const privateKeyResult = await secretManager.getElavonSshPrivateKey(config);

  if (!privateKeyResult.ok) {
    return {
      ok: false,
      statusCode: 503,
      body: {
        status: "degraded",
        service: config.serviceName,
        checks: {
          elavonSshPrivateKey: "unavailable",
        },
        reason: privateKeyResult.reason,
      },
    };
  }

  const userIdResult = await secretManager.getElavonSftpUserId(config);

  if (!userIdResult.ok) {
    return {
      ok: false,
      statusCode: 503,
      body: {
        status: "degraded",
        service: config.serviceName,
        checks: {
          elavonSshPrivateKey: "available",
          elavonSftpUserId: "unavailable",
        },
        reason: userIdResult.reason,
      },
    };
  }

  return {
    ok: true,
    privateKey: privateKeyResult.value,
    userId: userIdResult.value,
  };
};

const discoveryStatusCode = (reason: SftpFailureReason): number => {
  if (
    reason === "missing_config" ||
    reason === "sftp_auth_failed" ||
    reason === "sftp_connection_failed" ||
    reason === "sftp_directory_unavailable" ||
    reason === "sftp_disconnect_failed"
  ) {
    return 503;
  }

  return 500;
};

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: config.serviceName,
    });
    return;
  }

  if (request.method === "GET" && request.url === "/ready") {
    const credentialResult = await getElavonCredentials();

    if (!credentialResult.ok) {
      sendJson(response, credentialResult.statusCode, credentialResult.body);
      return;
    }

    const sftpResult = await sftpClient.verifyInboxAvailable(config, {
      privateKey: credentialResult.privateKey,
      userId: credentialResult.userId,
    });

    if (!sftpResult.ok) {
      sendJson(response, 503, {
        status: "degraded",
        service: config.serviceName,
        checks: {
          elavonSshPrivateKey: "available",
          elavonSftpUserId: "available",
          elavonSftpConnection: "unavailable",
          elavonInboxDirectory: "unavailable",
        },
        reason: sftpResult.reason,
      });
      return;
    }

    sendJson(response, 200, {
      status: "ok",
      service: config.serviceName,
      checks: {
        elavonSshPrivateKey: "available",
        elavonSftpUserId: "available",
        elavonSftpConnection: "available",
        elavonInboxDirectory: "available",
      },
    });
    return;
  }

  if (request.method === "GET" && request.url === "/discover/inbox") {
    const credentialResult = await getElavonCredentials();

    if (!credentialResult.ok) {
      sendJson(response, credentialResult.statusCode, {
        status: "degraded",
        directory: "/Inbox",
        reason: credentialResult.body.reason ?? "unexpected_error",
      });
      return;
    }

    const discoveryResult = await sftpClient.listInboxMetadata(config, {
      privateKey: credentialResult.privateKey,
      userId: credentialResult.userId,
    });

    if (!discoveryResult.ok) {
      sendJson(response, discoveryStatusCode(discoveryResult.reason), {
        status: "degraded",
        directory: "/Inbox",
        reason: discoveryResult.reason,
      });
      return;
    }

    sendJson(response, 200, {
      status: "ok",
      directory: "/Inbox",
      fileCount: discoveryResult.files.length,
      files: discoveryResult.files,
    });
    return;
  }

  sendJson(response, 404, { error: "not_found" });
});

server.listen(config.port, "0.0.0.0", () => {
  logger.info("service listening", {
    service: config.serviceName,
    port: config.port,
  });
});
