import SftpClient from "ssh2-sftp-client";

import type { ServiceConfig } from "../config.js";
import { logger } from "../logger.js";

export type SftpFailureReason =
  | "missing_config"
  | "sftp_auth_failed"
  | "sftp_connection_failed"
  | "sftp_directory_unavailable"
  | "sftp_list_failed"
  | "sftp_download_failed"
  | "sftp_disconnect_failed"
  | "file_not_found"
  | "unexpected_error";

export type SftpConnectivityResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: SftpFailureReason;
    };

export type InboxFileMetadata = {
  filename: string;
  size: number;
  lastModifiedAt: string;
};

export type InboxMetadataResult =
  | {
      ok: true;
      files: InboxFileMetadata[];
    }
  | {
      ok: false;
      reason: SftpFailureReason;
    };

export type DownloadedInboxFile = InboxFileMetadata & {
  rawBytes: Buffer;
};

export type InboxDownloadResult =
  | {
      ok: true;
      file: DownloadedInboxFile;
    }
  | {
      ok: false;
      reason: SftpFailureReason;
    };

type SftpConnectionSecrets = {
  privateKey: string;
  userId: string;
};

const inboxDirectory = "/Inbox";

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

const hasRequiredSftpConfig = (config: ServiceConfig): boolean =>
  Boolean(
    config.elavonSftpEnvironment &&
      config.elavonSftpHost &&
      config.elavonSftpPort,
  );

const isSafeRemoteFilename = (filename: string): boolean =>
  filename.length > 0 &&
  !filename.includes("/") &&
  !filename.includes("\\") &&
  !filename.includes("..");

export class ElavonSftpClient {
  async verifyConnectivity(
    config: ServiceConfig,
    secrets: SftpConnectionSecrets,
  ): Promise<SftpConnectivityResult> {
    if (!hasRequiredSftpConfig(config)) {
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

  async verifyInboxAvailable(
    config: ServiceConfig,
    secrets: SftpConnectionSecrets,
  ): Promise<SftpConnectivityResult> {
    if (!hasRequiredSftpConfig(config)) {
      return {
        ok: false,
        reason: "missing_config",
      };
    }

    const client = new SftpClient();
    let connected = false;
    let result: SftpConnectivityResult = { ok: true };

    logger.info("sftp inbox availability check started", {
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

      const directoryType = await client.exists(inboxDirectory);

      if (directoryType !== "d") {
        result = {
          ok: false,
          reason: "sftp_directory_unavailable",
        };

        logger.error("sftp inbox availability check failed", {
          service: config.serviceName,
          environment: config.elavonSftpEnvironment,
          reason: result.reason,
        });
      } else {
        logger.info("sftp inbox available", {
          service: config.serviceName,
          environment: config.elavonSftpEnvironment,
        });
      }
    } catch (error) {
      const reason = connected
        ? "sftp_directory_unavailable"
        : classifyConnectionError(error);

      logger.error("sftp inbox availability check failed", {
        service: config.serviceName,
        environment: config.elavonSftpEnvironment,
        reason,
      });

      result = {
        ok: false,
        reason,
      };
    }

    if (connected) {
      const disconnectResult = await this.disconnect(client, config);

      if (!disconnectResult.ok) {
        return disconnectResult;
      }
    }

    return result;
  }

  async listInboxMetadata(
    config: ServiceConfig,
    secrets: SftpConnectionSecrets,
  ): Promise<InboxMetadataResult> {
    if (!hasRequiredSftpConfig(config)) {
      return {
        ok: false,
        reason: "missing_config",
      };
    }

    const client = new SftpClient();
    let connected = false;
    let operationStage: "directory" | "list" = "directory";
    let result: InboxMetadataResult = { ok: true, files: [] };

    logger.info("sftp inbox discovery started", {
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

      const directoryType = await client.exists(inboxDirectory);

      if (directoryType !== "d") {
        result = {
          ok: false,
          reason: "sftp_directory_unavailable",
        };

        logger.error("sftp inbox discovery failed", {
          service: config.serviceName,
          environment: config.elavonSftpEnvironment,
          reason: result.reason,
        });
      } else {
        operationStage = "list";
        const directoryEntries = await client.list(inboxDirectory);
        const files = directoryEntries
          .filter((entry) => entry.type === "-")
          .map((entry) => ({
            filename: entry.name,
            size: entry.size,
            lastModifiedAt: new Date(entry.modifyTime).toISOString(),
          }));

        logger.info("sftp inbox metadata listing completed", {
          service: config.serviceName,
          environment: config.elavonSftpEnvironment,
          fileCount: files.length,
        });

        result = {
          ok: true,
          files,
        };
      }
    } catch (error) {
      const reason = connected
        ? operationStage === "directory"
          ? "sftp_directory_unavailable"
          : "sftp_list_failed"
        : classifyConnectionError(error);

      logger.error("sftp inbox discovery failed", {
        service: config.serviceName,
        environment: config.elavonSftpEnvironment,
        reason,
      });

      result = {
        ok: false,
        reason,
      };
    }

    if (connected) {
      const disconnectResult = await this.disconnect(client, config);

      if (!disconnectResult.ok) {
        return disconnectResult;
      }
    }

    return result;
  }

  async downloadInboxFile(
    config: ServiceConfig,
    secrets: SftpConnectionSecrets,
    filename: string,
  ): Promise<InboxDownloadResult> {
    if (!hasRequiredSftpConfig(config)) {
      return {
        ok: false,
        reason: "missing_config",
      };
    }

    if (!isSafeRemoteFilename(filename)) {
      return {
        ok: false,
        reason: "file_not_found",
      };
    }

    const client = new SftpClient();
    let connected = false;
    let operationStage: "directory" | "list" | "download" = "directory";
    let result: InboxDownloadResult = {
      ok: false,
      reason: "unexpected_error",
    };

    logger.info("sftp inbox archive download started", {
      service: config.serviceName,
      environment: config.elavonSftpEnvironment,
      operation: "archive_download",
      filename,
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

      const directoryType = await client.exists(inboxDirectory);

      if (directoryType !== "d") {
        result = {
          ok: false,
          reason: "sftp_directory_unavailable",
        };

        logger.error("sftp inbox archive download failed", {
          service: config.serviceName,
          environment: config.elavonSftpEnvironment,
          operation: "archive_download",
          filename,
          reason: result.reason,
        });
      } else {
        operationStage = "list";
        const directoryEntries = await client.list(inboxDirectory);
        const fileEntry = directoryEntries.find(
          (entry) => entry.type === "-" && entry.name === filename,
        );

        logger.info("sftp inbox archive fresh listing completed", {
          service: config.serviceName,
          environment: config.elavonSftpEnvironment,
          operation: "archive_download",
          filename,
          fileCount: directoryEntries.filter((entry) => entry.type === "-")
            .length,
        });

        if (!fileEntry) {
          result = {
            ok: false,
            reason: "file_not_found",
          };

          logger.warn("sftp inbox archive file not confirmed", {
            service: config.serviceName,
            environment: config.elavonSftpEnvironment,
            operation: "archive_download",
            filename,
            reason: result.reason,
          });
        } else {
          operationStage = "download";
          const remotePath = `${inboxDirectory}/${filename}`;
          const downloadResult = await client.get(remotePath);

          if (!Buffer.isBuffer(downloadResult)) {
            result = {
              ok: false,
              reason: "sftp_download_failed",
            };
          } else if (downloadResult.byteLength !== fileEntry.size) {
            result = {
              ok: false,
              reason: "sftp_download_failed",
            };

            logger.error("sftp inbox archive download failed", {
              service: config.serviceName,
              environment: config.elavonSftpEnvironment,
              operation: "archive_download",
              filename,
              size: fileEntry.size,
              reason: result.reason,
            });
          } else {
            result = {
              ok: true,
              file: {
                filename: fileEntry.name,
                size: downloadResult.byteLength,
                lastModifiedAt: new Date(fileEntry.modifyTime).toISOString(),
                rawBytes: downloadResult,
              },
            };

            logger.info("sftp inbox archive download completed", {
              service: config.serviceName,
              environment: config.elavonSftpEnvironment,
              operation: "archive_download",
              filename,
              size: fileEntry.size,
            });
          }
        }
      }
    } catch (error) {
      const reason = connected
        ? operationStage === "directory"
          ? "sftp_directory_unavailable"
          : operationStage === "list"
            ? "sftp_list_failed"
            : "sftp_download_failed"
        : classifyConnectionError(error);

      logger.error("sftp inbox archive download failed", {
        service: config.serviceName,
        environment: config.elavonSftpEnvironment,
        operation: "archive_download",
        filename,
        reason,
      });

      result = {
        ok: false,
        reason,
      };
    }

    if (connected) {
      const disconnectResult = await this.disconnect(client, config);

      if (!disconnectResult.ok) {
        return disconnectResult;
      }
    }

    return result;
  }

  private async disconnect(
    client: SftpClient,
    config: ServiceConfig,
  ): Promise<SftpConnectivityResult> {
    try {
      await client.end();

      logger.info("sftp disconnected cleanly", {
        service: config.serviceName,
        environment: config.elavonSftpEnvironment,
      });

      return { ok: true };
    } catch {
      logger.error("sftp disconnect failed", {
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
}
