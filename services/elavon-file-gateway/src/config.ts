export type ServiceConfig = {
  serviceName: string;
  port: number;
  gcpProjectId?: string;
  elavonSftpEnvironment?: string;
  elavonSftpHost?: string;
  elavonSftpPort?: number;
  elavonSftpUserIdSecretName?: string;
  elavonSshPrivateKeySecretName?: string;
  payments365RawBucket?: string;
};

const parsePort = (value: string | undefined, defaultPort: number): number => {
  const parsed = Number.parseInt(value ?? String(defaultPort), 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return defaultPort;
  }

  return parsed;
};

const parseOptionalPort = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

const readOptionalEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value === "" ? undefined : value;
};

export const getConfig = (): ServiceConfig => ({
  serviceName: "elavon-file-gateway",
  port: parsePort(process.env.PORT, 8080),
  gcpProjectId: readOptionalEnv("GCP_PROJECT_ID"),
  elavonSftpEnvironment: readOptionalEnv("ELAVON_SFTP_ENV"),
  elavonSftpHost: readOptionalEnv("ELAVON_SFTP_HOST"),
  elavonSftpPort: parseOptionalPort(process.env.ELAVON_SFTP_PORT),
  elavonSftpUserIdSecretName: readOptionalEnv(
    "ELAVON_SFTP_USER_ID_SECRET_NAME",
  ),
  elavonSshPrivateKeySecretName: readOptionalEnv(
    "ELAVON_SSH_PRIVATE_KEY_SECRET_NAME",
  ),
  payments365RawBucket: readOptionalEnv("PAYMENTS365_RAW_BUCKET"),
});

export const getMissingSecretConfig = (config: ServiceConfig): string[] => {
  const missing: string[] = [];

  if (!config.gcpProjectId) {
    missing.push("GCP_PROJECT_ID");
  }

  if (config.elavonSftpEnvironment !== "test") {
    missing.push("ELAVON_SFTP_ENV");
  }

  if (!config.elavonSftpHost) {
    missing.push("ELAVON_SFTP_HOST");
  }

  if (!config.elavonSftpPort) {
    missing.push("ELAVON_SFTP_PORT");
  }

  if (!config.elavonSftpUserIdSecretName) {
    missing.push("ELAVON_SFTP_USER_ID_SECRET_NAME");
  }

  if (!config.elavonSshPrivateKeySecretName) {
    missing.push("ELAVON_SSH_PRIVATE_KEY_SECRET_NAME");
  }

  return missing;
};

export const getMissingArchiveConfig = (config: ServiceConfig): string[] => {
  const missing = getMissingSecretConfig(config);

  if (!config.payments365RawBucket) {
    missing.push("PAYMENTS365_RAW_BUCKET");
  }

  return missing;
};
