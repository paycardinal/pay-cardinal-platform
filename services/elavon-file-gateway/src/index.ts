import { createHash } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import {
  getConfig,
  getMissingArchiveConfig,
  getMissingSecretConfig,
} from "./config.js";
import { logger } from "./logger.js";
import { ElavonSecretManager } from "./secrets/secretManager.js";
import {
  ElavonSftpClient,
  type SftpFailureReason,
} from "./sftp/elavonSftpClient.js";
import {
  RawArchiveStorage,
  type StorageFailureReason,
} from "./storage/rawArchiveStorage.js";

const config = getConfig();
const secretManager = new ElavonSecretManager();
const sftpClient = new ElavonSftpClient();
const rawArchiveStorage = new RawArchiveStorage();

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

type ArchiveFailureReason =
  | SftpFailureReason
  | StorageFailureReason
  | "invalid_environment"
  | "invalid_filename"
  | "secret_unavailable"
  | "checksum_failed";

const archiveStatusCode = (reason: ArchiveFailureReason): number => {
  if (reason === "invalid_environment" || reason === "invalid_filename") {
    return 400;
  }

  if (reason === "file_not_found") {
    return 404;
  }

  if (
    reason === "missing_config" ||
    reason === "secret_unavailable" ||
    reason === "sftp_auth_failed" ||
    reason === "sftp_connection_failed" ||
    reason === "sftp_directory_unavailable" ||
    reason === "sftp_list_failed" ||
    reason === "sftp_download_failed" ||
    reason === "sftp_disconnect_failed" ||
    reason === "storage_upload_failed" ||
    reason === "storage_verification_failed"
  ) {
    return 503;
  }

  return 500;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readJsonBody = async (request: IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");

      if (Buffer.byteLength(body, "utf8") > 64 * 1024) {
        reject(new Error("request_body_too_large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("invalid_json"));
      }
    });

    request.on("error", reject);
  });

const isSafeFilename = (filename: string): boolean =>
  filename.length > 0 &&
  filename.trim() === filename &&
  !filename.includes("/") &&
  !filename.includes("\\") &&
  !filename.includes("..");

const calculateSha256 = (rawBytes: Buffer): string => {
  try {
    return createHash("sha256").update(rawBytes).digest("hex");
  } catch {
    throw new Error("checksum_failed");
  }
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

  if (request.method === "POST" && request.url === "/archive") {
    let body: unknown;

    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, {
        status: "rejected",
        reason: "invalid_filename",
      });
      return;
    }

    const environment = isRecord(body) ? body.environment : undefined;
    const filename = isRecord(body) ? body.filename : undefined;

    if (environment !== "test") {
      logger.warn("archive request rejected", {
        service: config.serviceName,
        operation: "archive",
        status: "rejected",
        reason: "invalid_environment",
      });

      sendJson(response, 400, {
        status: "rejected",
        reason: "invalid_environment",
      });
      return;
    }

    if (typeof filename !== "string" || !isSafeFilename(filename)) {
      logger.warn("archive request rejected", {
        service: config.serviceName,
        environment,
        operation: "archive",
        status: "rejected",
        reason: "invalid_filename",
      });

      sendJson(response, 400, {
        status: "rejected",
        reason: "invalid_filename",
      });
      return;
    }

    const missingConfiguration = getMissingArchiveConfig(config);

    if (missingConfiguration.length > 0) {
      logger.warn("archive configuration validation failed", {
        service: config.serviceName,
        environment,
        operation: "archive",
        filename,
        reason: "missing_config",
      });

      sendJson(response, 503, {
        status: "degraded",
        reason: "missing_config",
      });
      return;
    }

    const credentialResult = await getElavonCredentials();

    if (!credentialResult.ok) {
      const reason = String(
        credentialResult.body.reason ?? "secret_unavailable",
      ) as ArchiveFailureReason;

      sendJson(response, archiveStatusCode(reason), {
        status: "degraded",
        reason,
      });
      return;
    }

    const downloadResult = await sftpClient.downloadInboxFile(
      config,
      {
        privateKey: credentialResult.privateKey,
        userId: credentialResult.userId,
      },
      filename,
    );

    if (!downloadResult.ok) {
      sendJson(response, archiveStatusCode(downloadResult.reason), {
        status: "degraded",
        reason: downloadResult.reason,
      });
      return;
    }

    let sha256: string;

    try {
      sha256 = calculateSha256(downloadResult.file.rawBytes);
    } catch {
      logger.error("archive checksum failed", {
        service: config.serviceName,
        environment,
        operation: "archive",
        filename,
        reason: "checksum_failed",
      });

      sendJson(response, 500, {
        status: "degraded",
        reason: "checksum_failed",
      });
      return;
    }

    const downloadedAt = new Date().toISOString();
    const uploadResult = await rawArchiveStorage.uploadRawFile(config, {
      environment,
      filename: downloadResult.file.filename,
      size: downloadResult.file.size,
      lastModifiedAt: downloadResult.file.lastModifiedAt,
      downloadedAt,
      sha256,
      rawBytes: downloadResult.file.rawBytes,
    });

    if (!uploadResult.ok) {
      sendJson(response, archiveStatusCode(uploadResult.reason), {
        status: "degraded",
        reason: uploadResult.reason,
      });
      return;
    }

    sendJson(response, 200, {
      status: "ok",
      archive: uploadResult.archive,
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
