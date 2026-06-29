import { createServer, type ServerResponse } from "node:http";

import { getConfig } from "./config.js";
import { logger } from "./logger.js";
import { ElavonSecretManager } from "./secrets/secretManager.js";

const config = getConfig();
const secretManager = new ElavonSecretManager();

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
    const result = await secretManager.verifyElavonSshPrivateKey(config);

    if (result.ok) {
      sendJson(response, 200, {
        status: "ok",
        service: config.serviceName,
        checks: {
          elavonSshPrivateKey: "available",
        },
      });
      return;
    }

    sendJson(response, 503, {
      status: "degraded",
      service: config.serviceName,
      checks: {
        elavonSshPrivateKey: result.reason,
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
