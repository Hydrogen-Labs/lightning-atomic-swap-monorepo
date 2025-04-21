import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { LogEntry } from "./types";

type LogLevel = "info" | "error" | "warn" | "debug";

interface LoggerInterface {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export class Logger implements LoggerInterface {
  private dashboard: {
    addLogEntry: (message: string, level: LogLevel, relatedId?: string) => void;
  } | null = null;
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };
  private winstonLogger: ReturnType<typeof createLogger>;
  private consoleTransport: transports.ConsoleTransportInstance;

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    // Create console transport separately so we can add/remove it
    this.consoleTransport = new transports.Console({
      format: format.simple(),
    });

    // Initialize Winston logger
    this.winstonLogger = createLogger({
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new DailyRotateFile({
          filename: "logs/relay-%DATE%.log",
          datePattern: "YYYY-MM-DD-HH",
          zippedArchive: true, // Compress logs to save space
          maxSize: "20m", // Maximum file size before rotating
          maxFiles: "72h", // Keep logs for the last 72 hours
        }),
        this.consoleTransport, // Add console transport initially
      ],
    });
  }

  // Set dashboard reference for logging
  setDashboard(dashboard: { addLogEntry: (message: string, level: LogLevel, relatedId?: string) => void }): void {
    this.dashboard = dashboard;
    // Remove console transport when dashboard is active
    if (dashboard) {
      this.winstonLogger.remove(this.consoleTransport);
    } else {
      this.winstonLogger.add(this.consoleTransport);
    }
  }

  // Format message from different argument types
  private formatMessage(args: any[]): string {
    return args
      .map(arg => {
        if (typeof arg === "object") {
          try {
            // Use custom replacer to handle BigInt serialization
            return JSON.stringify(arg, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
          } catch (error) {
            // Fallback if JSON stringify fails
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");
  }

  // Extract potential contract ID from a message for related ID
  private extractRelatedId(message: string): string | undefined {
    // Try to find contract IDs in the message (0x followed by 40+ hex chars)
    const contractIdRegex = /0x[a-fA-F0-9]{40,}/g;
    const matches = message.match(contractIdRegex);
    return matches ? matches[0] : undefined;
  }

  // Log to dashboard and original console
  log(...args: any[]): void {
    const message = this.formatMessage(args);
    const relatedId = this.extractRelatedId(message);

    if (this.dashboard) {
      this.dashboard.addLogEntry(message, "info", relatedId);
    } else {
      // Only log to original console if dashboard is not active
      this.originalConsole.log(...args);
    }

    // Log to Winston always
    this.winstonLogger.info(message);
  }

  error(...args: any[]): void {
    const message = this.formatMessage(args);
    const relatedId = this.extractRelatedId(message);

    if (this.dashboard) {
      this.dashboard.addLogEntry(message, "error", relatedId);
    } else {
      // Only log to original console if dashboard is not active
      this.originalConsole.error(...args);
    }

    // Log to Winston always
    this.winstonLogger.error(message);
  }

  warn(...args: any[]): void {
    const message = this.formatMessage(args);
    const relatedId = this.extractRelatedId(message);

    if (this.dashboard) {
      this.dashboard.addLogEntry(message, "warn", relatedId);
    } else {
      // Only log to original console if dashboard is not active
      this.originalConsole.warn(...args);
    }

    // Log to Winston always
    this.winstonLogger.warn(message);
  }

  info(...args: any[]): void {
    const message = this.formatMessage(args);
    const relatedId = this.extractRelatedId(message);

    if (this.dashboard) {
      this.dashboard.addLogEntry(message, "info", relatedId);
    } else {
      // Only log to original console if dashboard is not active
      this.originalConsole.info(...args);
    }

    // Log to Winston always
    this.winstonLogger.info(message);
  }

  debug(...args: any[]): void {
    const message = this.formatMessage(args);
    const relatedId = this.extractRelatedId(message);

    if (this.dashboard) {
      this.dashboard.addLogEntry(message, "debug", relatedId);
    } else {
      // Only log to original console if dashboard is not active
      this.originalConsole.debug(...args);
    }

    // Log to Winston always
    this.winstonLogger.debug(message);
  }

  // Install this logger as the global logger
  install(): void {
    console.log = this.log.bind(this);
    console.error = this.error.bind(this);
    console.warn = this.warn.bind(this);
    console.info = this.info.bind(this);
    console.debug = this.debug.bind(this);
  }

  // Restore original console methods
  uninstall(): void {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
    // Restore console transport
    if (!this.winstonLogger.transports.includes(this.consoleTransport)) {
      this.winstonLogger.add(this.consoleTransport);
    }
  }
}

// Create and export a singleton instance
export const logger = new Logger();
