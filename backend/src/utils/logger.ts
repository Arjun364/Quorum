/** Minimal leveled logger writing timestamped lines to the console. */
export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

/** Creates a logger whose lines are prefixed with the given context name. */
export function createLogger(context: string): Logger {
  const line = (level: string, message: string): string =>
    `${new Date().toISOString()} ${level.padEnd(5)} [${context}] ${message}`;
  return {
    info: (message) => console.log(line('INFO', message)),
    warn: (message) => console.warn(line('WARN', message)),
    error: (message, error) =>
      console.error(line('ERROR', message), error instanceof Error ? (error.stack ?? error.message) : (error ?? '')),
  };
}
