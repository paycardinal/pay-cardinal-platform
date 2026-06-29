type LogLevel = "info" | "warn" | "error";

type LogMetadata = Record<string, string | number | boolean | string[] | undefined>;

const writeLog = (
  level: LogLevel,
  message: string,
  metadata: LogMetadata = {},
): void => {
  const entry = {
    severity: level.toUpperCase(),
    message,
    ...metadata,
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
};

export const logger = {
  info(message: string, metadata?: LogMetadata): void {
    writeLog("info", message, metadata);
  },

  warn(message: string, metadata?: LogMetadata): void {
    writeLog("warn", message, metadata);
  },

  error(message: string, metadata?: LogMetadata): void {
    writeLog("error", message, metadata);
  },
};
