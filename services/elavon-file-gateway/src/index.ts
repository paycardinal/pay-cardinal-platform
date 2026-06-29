import { createServer, type ServerResponse } from "node:http";

import { getConfig, getMissingSecretConfig } from "./config.js";
import { logger } from "./logger.js";
import { ElavonSecretManager } from "./secrets/secretManager.js";
import { ElavonSftpClient } from "./sftp/elavonSftpClient.js";

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

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: config.serviceName,
    });
    return;
  }

  if (request.method === "GET" && request.url === "/ready") {
    const missingConfiguration = getMissingSecretConfig(config);

    if (missingConfiguration.length > 0) {
      logger.warn("readiness check failed", {
        service: config.serviceName,
        reason: "missing_config",
        missingConfiguration,
      });

      sendJson(response, 503, {
        status: "degraded",
        service: config.serviceName,
        checks: {},
        reason: "missing_config",
      });
      return;
    }

    const privateKeyResult = await secretManager.getElavonSshPrivateKey(config);

    if (!privateKeyResult.ok) {
      sendJson(response, 503, {
        status: "degraded",
        service: config.serviceName,
        checks: {
          elavonSshPrivateKey: "unavailable",
        },
        reason: privateKeyResult.reason,
      });
      return;
    }

    const userIdResult = await secretManager.getElavonSftpUserId(config);

    if (!userIdResult.ok) {
      sendJson(response, 503, {
        status: "degraded",
        service: config.serviceName,
        checks: {
          elavonSshPrivateKey: "available",
          elavonSftpUserId: "unavailable",
        },
        reason: userIdResult.reason,
      });
      return;
    }

    const sftpResult = await sftpClient.verifyConnectivity(config, {
      privateKey: privateKeyResult.value,
      userId: userIdResult.value,
    });

    if (!sftpResult.ok) {
      sendJson(response, 503, {
        status: "degraded",
        service: config.serviceName,
        checks: {
          elavonSshPrivateKey: "available",
          elavonSftpUserId: "available",
          elavonSftpConnection: "unavailable",
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
      },
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
