/**
 * Error Handling and Logging System
 * Provides structured error handling, logging, and monitoring
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  error?: Error;
  stack?: string;
  processId: number;
  component: string;
}

export interface ErrorContext {
  component: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  metadata?: any;
}

/**
 * Custom error classes for different types of errors
 */
export class SecurityError extends Error {
  constructor(message: string, public context?: ErrorContext) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public context?: ErrorContext) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FileSystemError extends Error {
  constructor(message: string, public context?: ErrorContext) {
    super(message);
    this.name = 'FileSystemError';
  }
}

export class IPCError extends Error {
  constructor(message: string, public context?: ErrorContext) {
    super(message);
    this.name = 'IPCError';
  }
}

export class AIServiceError extends Error {
  constructor(message: string, public context?: ErrorContext) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * Logger class with structured logging
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logEntries: LogEntry[] = [];
  private maxLogEntries: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    component: string,
    context?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      stack: error?.stack,
      processId: process.pid,
      component,
    };
  }

  private log(entry: LogEntry): void {
    if (entry.level < this.logLevel) {
      return;
    }

    // Add to in-memory log
    this.logEntries.push(entry);
    
    // Maintain max log entries
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.shift();
    }

    // Console output
    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}] [${entry.component}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.error || entry.context);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production' && entry.level >= LogLevel.ERROR) {
      this.sendToExternalLogger(entry);
    }
  }

  private sendToExternalLogger(entry: LogEntry): void {
    // Implementation for external logging service
    // This could be Sentry, LogRocket, or custom logging endpoint
    console.log('EXTERNAL_LOG:', JSON.stringify(entry));
  }

  debug(message: string, component: string, context?: any): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, component, context));
  }

  info(message: string, component: string, context?: any): void {
    this.log(this.createLogEntry(LogLevel.INFO, message, component, context));
  }

  warn(message: string, component: string, context?: any): void {
    this.log(this.createLogEntry(LogLevel.WARN, message, component, context));
  }

  error(message: string, component: string, error?: Error, context?: any): void {
    this.log(this.createLogEntry(LogLevel.ERROR, message, component, context, error));
  }

  fatal(message: string, component: string, error?: Error, context?: any): void {
    this.log(this.createLogEntry(LogLevel.FATAL, message, component, context, error));
  }

  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logEntries.slice(-count);
  }

  clearLogs(): void {
    this.logEntries = [];
  }
}

/**
 * Global error handler for unhandled errors
 */
export const setupGlobalErrorHandling = (): void => {
  const logger = Logger.getInstance();

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal(
      'Unhandled Promise Rejection',
      'global',
      reason instanceof Error ? reason : new Error(String(reason)),
      { promise }
    );
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught Exception', 'global', error);
    
    // In production, you might want to restart the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Handle warnings
  process.on('warning', (warning) => {
    logger.warn('Process Warning', 'global', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });
};

/**
 * Error boundary for React components
 */
export const createErrorBoundary = (component: string) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      const logger = Logger.getInstance();
      logger.error(
        'React Component Error',
        component,
        error,
        {
          componentStack: errorInfo.componentStack,
          errorBoundary: component,
        }
      );
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="error-boundary">
            <h2>Something went wrong in {component}</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        );
      }

      return this.props.children;
    }
  };
};

/**
 * Async error wrapper for better error handling
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  component: string,
  operation: string
) => {
  return async (...args: T): Promise<R> => {
    const logger = Logger.getInstance();
    
    try {
      logger.debug(`Starting ${operation}`, component, { args });
      const result = await fn(...args);
      logger.debug(`Completed ${operation}`, component);
      return result;
    } catch (error) {
      logger.error(
        `Failed ${operation}`,
        component,
        error instanceof Error ? error : new Error(String(error)),
        { args }
      );
      throw error;
    }
  };
};

/**
 * Performance monitoring wrapper
 */
export const withPerformanceMonitoring = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  component: string,
  operation: string
) => {
  return async (...args: T): Promise<R> => {
    const logger = Logger.getInstance();
    const startTime = performance.now();
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      
      logger.info(`Performance: ${operation}`, component, {
        duration: `${duration.toFixed(2)}ms`,
        args: args.length,
      });
      
      // Warn about slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation detected: ${operation}`, component, {
          duration: `${duration.toFixed(2)}ms`,
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(
        `Performance: ${operation} failed`,
        component,
        error instanceof Error ? error : new Error(String(error)),
        { duration: `${duration.toFixed(2)}ms` }
      );
      throw error;
    }
  };
};

/**
 * Retry mechanism with exponential backoff
 */
export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  component: string = 'unknown'
) => {
  return async (...args: T): Promise<R> => {
    const logger = Logger.getInstance();
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          logger.error(
            `All retry attempts failed`,
            component,
            lastError,
            { attempts: maxRetries }
          );
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(
          `Attempt ${attempt} failed, retrying in ${delay}ms`,
          component,
          lastError
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };
};

// Export singleton logger instance
export const logger = Logger.getInstance();

