import SftpClient from "ssh2-sftp-client";

import type { ServiceConfig } from "../config.js";
import { logger } from "../logger.js";

export type SftpFailureReason =
  | "missing_config"
  | "sftp_auth_failed"
  | "sftp_connection_failed"
  | "sftp_disconnect_failed"
  | "unexpected_error";

export type SftpConnectivityResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: SftpFailureReason;
    };

type SftpConnectionSecrets = {
  privateKey: string;
  userId: string;
};

const classifyConnectionError = (error: unknown): SftpFailureReason => {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    message.includes("authentication") ||
    message.includes("auth failed") ||
    message.includes("permission denied")
  ) {
    return "sftp_auth_failed";
  }

  return "sftp_connection_failed";
};

export class ElavonSftpClient {
  async verifyConnectivity(
    config: ServiceConfig,
    secrets: SftpConnectionSecrets,
  ): Promise<SftpConnectivityResult> {
    if (
      !config.elavonSftpEnvironment ||
      !config.elavonSftpHost ||
      !config.elavonSftpPort
    ) {
      return {
        ok: false,
        reason: "missing_config",
      };
    }

    const client = new SftpClient();
    let connected = false;

    logger.info("sftp connectivity check started", {
      service: config.serviceName,
      environment: config.elavonSftpEnvironment,
    });

    try {
      await client.connect({
        host: config.elavonSftpHost,
        port: config.elavonSftpPort,
        username: secrets.userId,
        privateKey: secrets.privateKey,
        readyTimeout: 30_000,
        retries: 0,
      });
      connected = true;

      logger.info("sftp authentication and connectivity succeeded", {
        service: config.serviceName,
        environment: config.elavonSftpEnvironment,
      });
    } catch (error) {
      const reason = classifyConnectionError(error);

      logger.error("sftp connectivity failed", {
        service: config.serviceName,
        environment: config.elavonSftpEnvironment,
        reason,
      });

      return {
        ok: false,
        reason,
      };
    }

    if (connected) {
      try {
        await client.end();

        logger.info("sftp disconnected cleanly", {
          service: config.serviceName,
          environment: config.elavonSftpEnvironment,
        });
      } catch {
        logger.error("sftp connectivity failed", {
          service: config.serviceName,
          environment: config.elavonSftpEnvironment,
          reason: "sftp_disconnect_failed",
        });

        return {
          ok: false,
          reason: "sftp_disconnect_failed",
        };
      }
    }

    return { ok: true };
  }
}
