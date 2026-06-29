import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

import type { ServiceConfig } from "../config.js";
import { getMissingSecretConfig } from "../config.js";
import { logger } from "../logger.js";

export type SecretRetrievalFailureReason =
  | "missing_configuration"
  | "secret_not_found"
  | "permission_denied"
  | "empty_secret_payload"
  | "client_error";

type SecretRetrievalResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: SecretRetrievalFailureReason;
      message: string;
      missingConfiguration?: string[];
    };

type GoogleClientError = {
  code?: number | string;
  message?: string;
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

const normalizeClientError = (
  error: unknown,
): Pick<Extract<SecretRetrievalResult, { ok: false }>, "reason" | "message"> => {
  const clientError = error as GoogleClientError;

  if (
    clientError.code === googleErrorCode.notFound ||
    clientError.code === String(googleErrorCode.notFound) ||
    clientError.code === "NOT_FOUND"
  ) {
    return {
      reason: "secret_not_found",
      message: "Elavon SSH private key secret was not found",
    };
  }

  if (
    clientError.code === googleErrorCode.permissionDenied ||
    clientError.code === String(googleErrorCode.permissionDenied) ||
    clientError.code === "PERMISSION_DENIED"
  ) {
    return {
      reason: "permission_denied",
      message: "Access to Elavon SSH private key secret was denied",
    };
  }

  return {
    reason: "client_error",
    message: "Google Secret Manager client error",
  };
};

export class ElavonSecretManager {
  private readonly client: SecretManagerServiceClient;

  constructor(client = new SecretManagerServiceClient()) {
    this.client = client;
  }

  async verifyElavonSshPrivateKey(config: ServiceConfig): Promise<SecretRetrievalResult> {
    const missingConfiguration = getMissingSecretConfig(config);

    if (missingConfiguration.length > 0) {
      logger.warn("missing configuration for secret retrieval", {
        service: config.serviceName,
        missingConfiguration,
      });

      return {
        ok: false,
        reason: "missing_configuration",
        message: "Missing required Secret Manager configuration",
        missingConfiguration,
      };
    }

    const projectId = config.gcpProjectId;
    const secretName = config.elavonSshPrivateKeySecretName;

    if (!projectId || !secretName) {
      return {
        ok: false,
        reason: "missing_configuration",
        message: "Missing required Secret Manager configuration",
        missingConfiguration,
      };
    }

    const secretVersionName = toSecretVersionName(
      projectId,
      secretName,
    );

    logger.info("secret retrieval started", {
      service: config.serviceName,
      secretName,
    });

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
          secretName,
          reason: "empty_secret_payload",
        });

        return {
          ok: false,
          reason: "empty_secret_payload",
          message: "Secret payload is empty",
        };
      }

      logger.info("secret retrieval succeeded", {
        service: config.serviceName,
        secretName,
      });

      return { ok: true };
    } catch (error) {
      const normalizedError = normalizeClientError(error);

      logger.error("secret retrieval failed", {
        service: config.serviceName,
        secretName,
        reason: normalizedError.reason,
      });

      return {
        ok: false,
        ...normalizedError,
      };
    }
  }
}
