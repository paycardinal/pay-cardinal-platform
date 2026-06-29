import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

import type { ServiceConfig } from "../config.js";
import { logger } from "../logger.js";

export type SecretPurpose = "elavonSshPrivateKey" | "elavonSftpUserId";

export type SecretFailureReason =
  | "missing_config"
  | "secret_unavailable"
  | "unexpected_error";

export type SecretValueResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      reason: SecretFailureReason;
    };

type GoogleClientError = {
  code?: number | string;
};

const googleErrorCode = {
  notFound: 5,
  permissionDenied: 7,
} as const;

const toSecretVersionName = (projectId: string, secretName: string): string => {
  if (secretName.startsWith("projects/")) {
    return secretName.includes("/versions/")
      ? secretName
      : `${secretName}/versions/latest`;
  }

  return `projects/${projectId}/secrets/${secretName}/versions/latest`;
};

const normalizeClientError = (error: unknown): SecretFailureReason => {
  const clientError = error as GoogleClientError;

  if (
    clientError.code === googleErrorCode.notFound ||
    clientError.code === String(googleErrorCode.notFound) ||
    clientError.code === "NOT_FOUND" ||
    clientError.code === googleErrorCode.permissionDenied ||
    clientError.code === String(googleErrorCode.permissionDenied) ||
    clientError.code === "PERMISSION_DENIED"
  ) {
    return "secret_unavailable";
  }

  return "unexpected_error";
};

export class ElavonSecretManager {
  private readonly client: SecretManagerServiceClient;

  constructor(client = new SecretManagerServiceClient()) {
    this.client = client;
  }

  async getElavonSshPrivateKey(
    config: ServiceConfig,
  ): Promise<SecretValueResult> {
    return this.getSecretValue(
      config,
      config.elavonSshPrivateKeySecretName,
      "elavonSshPrivateKey",
    );
  }

  async getElavonSftpUserId(config: ServiceConfig): Promise<SecretValueResult> {
    return this.getSecretValue(
      config,
      config.elavonSftpUserIdSecretName,
      "elavonSftpUserId",
    );
  }

  private async getSecretValue(
    config: ServiceConfig,
    secretName: string | undefined,
    purpose: SecretPurpose,
  ): Promise<SecretValueResult> {
    if (!config.gcpProjectId || !secretName) {
      logger.warn("secret retrieval failed", {
        service: config.serviceName,
        purpose,
        reason: "missing_config",
      });

      return {
        ok: false,
        reason: "missing_config",
      };
    }

    const secretVersionName = toSecretVersionName(config.gcpProjectId, secretName);

    try {
      const [version] = await this.client.accessSecretVersion({
        name: secretVersionName,
      });
      const payloadData = version.payload?.data;
      const payload =
        typeof payloadData === "string"
          ? payloadData
          : payloadData
            ? Buffer.from(payloadData).toString("utf8")
            : undefined;

      if (!payload) {
        logger.error("secret retrieval failed", {
          service: config.serviceName,
          purpose,
          reason: "secret_unavailable",
        });

        return {
          ok: false,
          reason: "secret_unavailable",
        };
      }

      logger.info("secret retrieval succeeded", {
        service: config.serviceName,
        purpose,
      });

      return {
        ok: true,
        value: payload,
      };
    } catch (error) {
      const reason = normalizeClientError(error);

      logger.error("secret retrieval failed", {
        service: config.serviceName,
        purpose,
        reason,
      });

      return {
        ok: false,
        reason,
      };
    }
  }
}
