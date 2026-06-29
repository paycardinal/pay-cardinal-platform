export type ServiceConfig = {
  serviceName: string;
  port: number;
  gcpProjectId?: string;
  elavonSshPrivateKeySecretName?: string;
};

const parsePort = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? "8080", 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 8080;
  }

  return parsed;
};

const readOptionalEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value === "" ? undefined : value;
};

export const getConfig = (): ServiceConfig => ({
  serviceName: "elavon-file-gateway",
  port: parsePort(process.env.PORT),
  gcpProjectId: readOptionalEnv("GCP_PROJECT_ID"),
  elavonSshPrivateKeySecretName: readOptionalEnv(
    "ELAVON_SSH_PRIVATE_KEY_SECRET_NAME",
  ),
});

export const getMissingSecretConfig = (config: ServiceConfig): string[] => {
  const missing: string[] = [];

  if (!config.gcpProjectId) {
    missing.push("GCP_PROJECT_ID");
  }

  if (!config.elavonSshPrivateKeySecretName) {
    missing.push("ELAVON_SSH_PRIVATE_KEY_SECRET_NAME");
  }

  return missing;
};
