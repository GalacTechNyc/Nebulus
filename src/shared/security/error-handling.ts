/**
 * Enhanced Error Handling and Recovery System
 * Provides comprehensive error handling, logging, and recovery mechanisms
 */

import React from 'react';
import { ipcRenderer } from 'electron';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  FILESYSTEM = 'FILESYSTEM',
  VALIDATION = 'VALIDATION',
  RUNTIME = 'RUNTIME',
  SECURITY = 'SECURITY',
  IPC = 'IPC',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Enhanced error interface
export interface EnhancedError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  recoverable: boolean;
  retryCount?: number;
}

// Error recovery strategies
export interface RecoveryStrategy {
  canRecover: (error: EnhancedError) => boolean;
  recover: (error: EnhancedError) => Promise<boolean>;
  maxRetries: number;
}

// Error logging service
class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: EnhancedError[] = [];
  private maxLogs = 1000;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: EnhancedError): void {
    this.logs.push(error);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send to main process for persistent logging
    if (typeof ipcRenderer !== 'undefined') {
      ipcRenderer.send('log-error', {
        message: error.message,
        stack: error.stack,
        type: error.type,
        severity: error.severity,
        context: error.context,
        timestamp: error.timestamp
      });
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Enhanced Error:', error);
    }
  }

  getLogs(filter?: { type?: ErrorType; severity?: ErrorSeverity }): EnhancedError[] {
    if (!filter) return [...this.logs];
    
    return this.logs.filter(log => {
      if (filter.type && log.type !== filter.type) return false;
      if (filter.severity && log.severity !== filter.severity) return false;
      return true;
    });
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Enhanced error creation utility
export function createEnhancedError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, any>,
  originalError?: Error
): EnhancedError {
  const error = new Error(message) as EnhancedError;
  
  error.type = type;
  error.severity = severity;
  error.context = context;
  error.timestamp = new Date();
  error.recoverable = severity !== ErrorSeverity.CRITICAL;
  error.retryCount = 0;

  if (originalError) {
    error.stack = originalError.stack;
    error.cause = originalError;
  }

  return error;
}

// Error recovery manager
class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private strategies: RecoveryStrategy[] = [];

  static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  async attemptRecovery(error: EnhancedError): Promise<boolean> {
    if (!error.recoverable) {
      return false;
    }

    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          const recovered = await strategy.recover(error);
          if (recovered) {
            return true;
          }
        } catch (recoveryError) {
          console.error('Recovery strategy failed:', recoveryError);
        }
      }
    }

    return false;
  }
}

// Default recovery strategies
const networkRetryStrategy: RecoveryStrategy = {
  canRecover: (error) => error.type === ErrorType.NETWORK && (error.retryCount || 0) < 3,
  recover: async (error) => {
    error.retryCount = (error.retryCount || 0) + 1;
    await new Promise(resolve => setTimeout(resolve, 1000 * error.retryCount!));
    return true;
  },
  maxRetries: 3
};

const fileSystemRetryStrategy: RecoveryStrategy = {
  canRecover: (error) => error.type === ErrorType.FILESYSTEM && (error.retryCount || 0) < 2,
  recover: async (error) => {
    error.retryCount = (error.retryCount || 0) + 1;
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  },
  maxRetries: 2
};

// Initialize recovery manager with default strategies
const recoveryManager = ErrorRecoveryManager.getInstance();
recoveryManager.addStrategy(networkRetryStrategy);
recoveryManager.addStrategy(fileSystemRetryStrategy);

// Global error handler
export function handleError(error: Error | EnhancedError, context?: Record<string, any>): void {
  let enhancedError: EnhancedError;

  if ('type' in error && 'severity' in error) {
    enhancedError = error as EnhancedError;
  } else {
    enhancedError = createEnhancedError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      context,
      error
    );
  }

  // Log the error
  ErrorLogger.getInstance().log(enhancedError);

  // Attempt recovery if possible
  if (enhancedError.recoverable) {
    recoveryManager.attemptRecovery(enhancedError).catch(recoveryError => {
      console.error('Failed to recover from error:', recoveryError);
    });
  }
}

// React Error Boundary HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  return class ErrorBoundary extends React.Component<P, { hasError: boolean; error?: Error }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      const enhancedError = createEnhancedError(
        error.message,
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        {
          componentStack: errorInfo.componentStack,
          errorBoundary: Component.name
        },
        error
      );

      handleError(enhancedError);
    }

    render() {
      if (this.state.hasError) {
        if (fallbackComponent) {
          const FallbackComponent = fallbackComponent;
          return (
            <FallbackComponent
              error={this.state.error!}
              retry={() => this.setState({ hasError: false, error: undefined })}
            />
          );
        }

        return (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
            <button onClick={() => this.setState({ hasError: false, error: undefined })}>
              Try again
            </button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}

// Async error wrapper for better error handling
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, context);
      throw error;
    }
  };
};

// Export instances for use throughout the application
export const errorLogger = ErrorLogger.getInstance();
export const errorRecoveryManager = ErrorRecoveryManager.getInstance();

// Export types and utilities
export { ErrorLogger, ErrorRecoveryManager };

