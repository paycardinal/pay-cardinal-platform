import { Storage } from "@google-cloud/storage";

import type { ServiceConfig } from "../config.js";
import { logger } from "../logger.js";
import type { InboxFileMetadata } from "../sftp/elavonSftpClient.js";

export type StorageFailureReason =
  | "missing_config"
  | "storage_upload_failed"
  | "storage_verification_failed";

export type RawArchiveMetadata = InboxFileMetadata & {
  downloadedAt: string;
  sha256: string;
  bucket: string;
  objectPath: string;
};

export type RawArchiveUploadResult =
  | {
      ok: true;
      archive: RawArchiveMetadata;
    }
  | {
      ok: false;
      reason: StorageFailureReason;
    };

type UploadInput = InboxFileMetadata & {
  environment: "test";
  downloadedAt: string;
  sha256: string;
  rawBytes: Buffer;
};

const storage = new Storage();

const objectPathFor = (
  environment: "test",
  downloadedAt: string,
  filename: string,
): string => {
  const date = new Date(downloadedAt);
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${environment}/${year}/${month}/${filename}`;
};

export class RawArchiveStorage {
  async uploadRawFile(
    config: ServiceConfig,
    input: UploadInput,
  ): Promise<RawArchiveUploadResult> {
    if (!config.payments365RawBucket) {
      return {
        ok: false,
        reason: "missing_config",
      };
    }

    const objectPath = objectPathFor(
      input.environment,
      input.downloadedAt,
      input.filename,
    );
    const bucket = storage.bucket(config.payments365RawBucket);
    const file = bucket.file(objectPath);

    logger.info("raw archive upload started", {
      service: config.serviceName,
      environment: input.environment,
      operation: "archive_upload",
      filename: input.filename,
      size: input.size,
      bucket: config.payments365RawBucket,
      objectPath,
    });

    try {
      await file.save(input.rawBytes, {
        resumable: false,
        preconditionOpts: {
          ifGenerationMatch: 0,
        },
        metadata: {
          contentType: "application/octet-stream",
          metadata: {
            source: "elavon-sftp",
            processor: "payments365",
            environment: input.environment,
            downloadedAt: input.downloadedAt,
            originalFilename: input.filename,
            sha256: input.sha256,
          },
        },
      });
    } catch {
      logger.error("raw archive upload failed", {
        service: config.serviceName,
        environment: input.environment,
        operation: "archive_upload",
        filename: input.filename,
        bucket: config.payments365RawBucket,
        objectPath,
        reason: "storage_upload_failed",
      });

      return {
        ok: false,
        reason: "storage_upload_failed",
      };
    }

    try {
      const [metadata] = await file.getMetadata();
      const uploadedSize = Number(metadata.size);

      if (uploadedSize !== input.size) {
        logger.error("raw archive verification failed", {
          service: config.serviceName,
          environment: input.environment,
          operation: "archive_upload",
          filename: input.filename,
          size: input.size,
          bucket: config.payments365RawBucket,
          objectPath,
          reason: "storage_verification_failed",
        });

        return {
          ok: false,
          reason: "storage_verification_failed",
        };
      }
    } catch {
      logger.error("raw archive verification failed", {
        service: config.serviceName,
        environment: input.environment,
        operation: "archive_upload",
        filename: input.filename,
        bucket: config.payments365RawBucket,
        objectPath,
        reason: "storage_verification_failed",
      });

      return {
        ok: false,
        reason: "storage_verification_failed",
      };
    }

    logger.info("raw archive upload completed", {
      service: config.serviceName,
      environment: input.environment,
      operation: "archive_upload",
      filename: input.filename,
      size: input.size,
      bucket: config.payments365RawBucket,
      objectPath,
    });

    return {
      ok: true,
      archive: {
        filename: input.filename,
        size: input.size,
        lastModifiedAt: input.lastModifiedAt,
        downloadedAt: input.downloadedAt,
        sha256: input.sha256,
        bucket: config.payments365RawBucket,
        objectPath,
      },
    };
  }
}
