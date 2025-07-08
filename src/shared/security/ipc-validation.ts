/**
 * IPC Security and Validation Framework
 * Provides input validation and security controls for IPC communication
 */

import { IpcChannels } from '../types';

export interface IPCValidationRule {
  required?: string[];
  optional?: string[];
  types?: { [key: string]: 'string' | 'number' | 'boolean' | 'object' | 'array' };
  maxLength?: { [key: string]: number };
  patterns?: { [key: string]: RegExp };
  sanitizers?: { [key: string]: (value: any) => any };
}

export interface IPCSecurityConfig {
  maxPayloadSize: number;
  rateLimitWindow: number;
  maxRequestsPerWindow: number;
  allowedOrigins: string[];
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: IPCSecurityConfig = {
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
  rateLimitWindow: 60000, // 1 minute
  maxRequestsPerWindow: 100,
  allowedOrigins: ['file://', 'app://'],
};

/**
 * Validation rules for each IPC channel
 */
export const IPC_VALIDATION_RULES: { [key in IpcChannels]: IPCValidationRule } = {
  [IpcChannels.FILE_READ]: {
    required: ['filePath'],
    types: { filePath: 'string' },
    maxLength: { filePath: 1000 },
    patterns: {
      filePath: /^[a-zA-Z0-9\-_./\\:]+$/, // Basic path validation
    },
    sanitizers: {
      filePath: (path: string) => path.replace(/\.\./g, ''), // Remove path traversal
    },
  },
  
  [IpcChannels.FILE_WRITE]: {
    required: ['filePath', 'content'],
    types: { filePath: 'string', content: 'string' },
    maxLength: { filePath: 1000, content: 1024 * 1024 }, // 1MB max file content
    patterns: {
      filePath: /^[a-zA-Z0-9\-_./\\:]+$/,
    },
    sanitizers: {
      filePath: (path: string) => path.replace(/\.\./g, ''),
    },
  },
  
  [IpcChannels.FILE_DELETE]: {
    required: ['filePath'],
    types: { filePath: 'string' },
    maxLength: { filePath: 1000 },
    patterns: {
      filePath: /^[a-zA-Z0-9\-_./\\:]+$/,
    },
    sanitizers: {
      filePath: (path: string) => path.replace(/\.\./g, ''),
    },
  },
  
  [IpcChannels.TERMINAL_CREATE]: {
    optional: ['options'],
    types: { options: 'object' },
  },
  
  [IpcChannels.TERMINAL_WRITE]: {
    required: ['terminalId', 'data'],
    types: { terminalId: 'string', data: 'string' },
    maxLength: { terminalId: 100, data: 10000 },
    patterns: {
      terminalId: /^[a-zA-Z0-9\-_]+$/,
    },
  },
  
  [IpcChannels.TERMINAL_DESTROY]: {
    required: ['terminalId'],
    types: { terminalId: 'string' },
    maxLength: { terminalId: 100 },
    patterns: {
      terminalId: /^[a-zA-Z0-9\-_]+$/,
    },
  },
  
  [IpcChannels.AI_CHAT]: {
    required: ['message'],
    optional: ['context', 'model'],
    types: { message: 'string', context: 'array', model: 'string' },
    maxLength: { message: 10000, model: 50 },
  },
  
  [IpcChannels.AI_GENERATE_CODE]: {
    required: ['prompt'],
    optional: ['language', 'context'],
    types: { prompt: 'string', language: 'string', context: 'string' },
    maxLength: { prompt: 5000, language: 50, context: 10000 },
  },
  
  [IpcChannels.AI_EXPLAIN_CODE]: {
    required: ['code'],
    optional: ['language'],
    types: { code: 'string', language: 'string' },
    maxLength: { code: 50000, language: 50 },
  },
  
  [IpcChannels.PROJECT_OPEN]: {
    required: ['projectPath'],
    types: { projectPath: 'string' },
    maxLength: { projectPath: 1000 },
    patterns: {
      projectPath: /^[a-zA-Z0-9\-_./\\:]+$/,
    },
    sanitizers: {
      projectPath: (path: string) => path.replace(/\.\./g, ''),
    },
  },
  
  [IpcChannels.PROJECT_GET_STRUCTURE]: {
    optional: ['depth'],
    types: { depth: 'number' },
  },
};

/**
 * Rate limiting tracker
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(identifier: string, config: IPCSecurityConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.rateLimitWindow;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= config.maxRequestsPerWindow) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
}

const rateLimiter = new RateLimiter();

/**
 * Validate IPC input data
 */
export const validateIPCInput = (
  channel: IpcChannels,
  data: any,
  config: IPCSecurityConfig = DEFAULT_SECURITY_CONFIG
): { valid: boolean; errors: string[]; sanitizedData?: any } => {
  const errors: string[] = [];
  const rule = IPC_VALIDATION_RULES[channel];
  
  if (!rule) {
    errors.push(`Unknown IPC channel: ${channel}`);
    return { valid: false, errors };
  }
  
  // Check payload size
  const payloadSize = JSON.stringify(data).length;
  if (payloadSize > config.maxPayloadSize) {
    errors.push(`Payload too large: ${payloadSize} bytes (max: ${config.maxPayloadSize})`);
    return { valid: false, errors };
  }
  
  // Validate required fields
  if (rule.required) {
    for (const field of rule.required) {
      if (!(field in data) || data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  // Validate types
  if (rule.types) {
    for (const [field, expectedType] of Object.entries(rule.types)) {
      if (field in data) {
        const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
        if (actualType !== expectedType) {
          errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
        }
      }
    }
  }
  
  // Validate max lengths
  if (rule.maxLength) {
    for (const [field, maxLen] of Object.entries(rule.maxLength)) {
      if (field in data && typeof data[field] === 'string' && data[field].length > maxLen) {
        errors.push(`Field ${field} exceeds maximum length: ${data[field].length} > ${maxLen}`);
      }
    }
  }
  
  // Validate patterns
  if (rule.patterns) {
    for (const [field, pattern] of Object.entries(rule.patterns)) {
      if (field in data && typeof data[field] === 'string' && !pattern.test(data[field])) {
        errors.push(`Field ${field} does not match required pattern`);
      }
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Apply sanitizers
  const sanitizedData = { ...data };
  if (rule.sanitizers) {
    for (const [field, sanitizer] of Object.entries(rule.sanitizers)) {
      if (field in sanitizedData) {
        sanitizedData[field] = sanitizer(sanitizedData[field]);
      }
    }
  }
  
  return { valid: true, errors: [], sanitizedData };
};

/**
 * Check rate limiting for IPC requests
 */
export const checkRateLimit = (
  identifier: string,
  config: IPCSecurityConfig = DEFAULT_SECURITY_CONFIG
): boolean => {
  return rateLimiter.isAllowed(identifier, config);
};

/**
 * Secure IPC wrapper that validates input and applies security controls
 */
export const secureIPCHandler = <T = any>(
  channel: IpcChannels,
  handler: (event: any, ...args: any[]) => Promise<T>,
  config: IPCSecurityConfig = DEFAULT_SECURITY_CONFIG
) => {
  return async (event: any, ...args: any[]): Promise<T> => {
    const identifier = event.sender.id.toString();
    
    // Check rate limiting
    if (!checkRateLimit(identifier, config)) {
      throw new Error('Rate limit exceeded');
    }
    
    // Validate input
    const inputData = args.length === 1 ? args[0] : args;
    const validation = validateIPCInput(channel, inputData, config);
    
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Call the original handler with sanitized data
    const sanitizedArgs = validation.sanitizedData ? [validation.sanitizedData] : args;
    return handler(event, ...sanitizedArgs);
  };
};

/**
 * Security audit logger for IPC communications
 */
export const auditIPCCall = (
  channel: IpcChannels,
  success: boolean,
  error?: string,
  metadata?: any
): void => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    channel,
    success,
    error,
    metadata,
    processId: process.pid,
  };
  
  // In production, send to secure logging service
  if (process.env.NODE_ENV === 'production') {
    console.log('IPC_AUDIT:', JSON.stringify(auditEntry));
  } else {
    console.debug('IPC_AUDIT:', auditEntry);
  }
};

