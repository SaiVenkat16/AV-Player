/**
 * Centralized logging utility for error tracking and debugging
 */

const LOG_LEVEL = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

type LogLevel = keyof typeof LOG_LEVEL;

const logs: Array<{
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  error?: unknown;
}> = [];
const MAX_LOGS = 100;

function formatLog(
  level: LogLevel,
  module: string,
  message: string,
  error?: unknown,
): string {
  const errorMsg =
    error instanceof Error
      ? `\n${error.message}\n${error.stack}`
      : error
      ? `\n${JSON.stringify(error)}`
      : '';
  return `[${new Date().toISOString()}] [${level}] [${module}] ${message}${errorMsg}`;
}

function store(
  level: LogLevel,
  module: string,
  message: string,
  error?: unknown,
) {
  logs.push({ timestamp: new Date(), level, module, message, error });
  // Keep only recent logs
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
}

export const Logger = {
  error(module: string, message: string, error?: unknown) {
    const formatted = formatLog(LOG_LEVEL.ERROR as LogLevel, module, message, error);
    console.error(formatted);
    store(LOG_LEVEL.ERROR as LogLevel, module, message, error);
  },

  warn(module: string, message: string, error?: unknown) {
    const formatted = formatLog(LOG_LEVEL.WARN as LogLevel, module, message, error);
    console.warn(formatted);
    store(LOG_LEVEL.WARN as LogLevel, module, message, error);
  },

  info(module: string, message: string) {
    const formatted = formatLog(LOG_LEVEL.INFO as LogLevel, module, message);
    console.log(formatted);
    store(LOG_LEVEL.INFO as LogLevel, module, message);
  },

  debug(module: string, message: string, error?: unknown) {
    const formatted = formatLog(LOG_LEVEL.DEBUG as LogLevel, module, message, error);
    if (__DEV__) {
      console.log(formatted);
    }
    store(LOG_LEVEL.DEBUG as LogLevel, module, message, error);
  },

  getLogs() {
    return [...logs];
  },

  clearLogs() {
    logs.length = 0;
  },

  exportLogs(): string {
    return logs
      .map(
        log =>
          `[${log.timestamp.toISOString()}] [${log.level}] [${log.module}] ${
            log.message
          }${
            log.error
              ? ` - ${
                  log.error instanceof Error
                    ? log.error.message
                    : JSON.stringify(log.error)
                }`
              : ''
          }`,
      )
      .join('\n');
  },
};
