/**
 * Content Security Policy (CSP) Configuration
 * Provides secure defaults for webview content loading
 */

export interface CSPConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  frameSrc: string[];
  objectSrc: string[];
  baseSrc: string[];
  formAction: string[];
}

/**
 * Default secure CSP configuration for GalactusIDE
 */
export const DEFAULT_CSP_CONFIG: CSPConfig = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Monaco Editor
    "'unsafe-eval'",   // Required for Monaco Editor dynamic loading
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for styled-components
    "https://fonts.googleapis.com",
  ],
  imgSrc: [
    "'self'",
    "data:",
    "https:",
    "blob:", // Required for generated images
  ],
  fontSrc: [
    "'self'",
    "data:",
    "https://fonts.gstatic.com",
  ],
  connectSrc: [
    "'self'",
    "https://api.openai.com",
    "https://api.anthropic.com",
    "https://generativelanguage.googleapis.com", // Gemini API
    "wss:", // WebSocket connections for live reload
  ],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseSrc: ["'self'"],
  formAction: ["'self'"],
};

/**
 * Generate CSP header string from configuration
 */
export const generateCSPHeader = (config: CSPConfig = DEFAULT_CSP_CONFIG): string => {
  const directives = [
    `default-src ${config.defaultSrc.join(' ')}`,
    `script-src ${config.scriptSrc.join(' ')}`,
    `style-src ${config.styleSrc.join(' ')}`,
    `img-src ${config.imgSrc.join(' ')}`,
    `font-src ${config.fontSrc.join(' ')}`,
    `connect-src ${config.connectSrc.join(' ')}`,
    `frame-src ${config.frameSrc.join(' ')}`,
    `object-src ${config.objectSrc.join(' ')}`,
    `base-uri ${config.baseSrc.join(' ')}`,
    `form-action ${config.formAction.join(' ')}`,
  ];

  return directives.join('; ');
};

/**
 * Get development-friendly CSP (less restrictive for hot reload)
 */
export const getDevelopmentCSP = (): string => {
  const devConfig: CSPConfig = {
    ...DEFAULT_CSP_CONFIG,
    connectSrc: [
      ...DEFAULT_CSP_CONFIG.connectSrc,
      "ws://localhost:*", // Webpack dev server
      "http://localhost:*", // Local development
    ],
    scriptSrc: [
      ...DEFAULT_CSP_CONFIG.scriptSrc,
      "'unsafe-eval'", // Required for webpack hot reload
    ],
  };

  return generateCSPHeader(devConfig);
};

/**
 * Get production CSP (most restrictive)
 */
export const getProductionCSP = (): string => {
  return generateCSPHeader(DEFAULT_CSP_CONFIG);
};

/**
 * Validate URL against CSP connect-src policy
 */
export const isURLAllowed = (url: string, config: CSPConfig = DEFAULT_CSP_CONFIG): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Check against connect-src whitelist
    return config.connectSrc.some(src => {
      if (src === "'self'") {
        return urlObj.protocol === 'file:' || urlObj.hostname === 'localhost';
      }
      if (src.startsWith('https://')) {
        return url.startsWith(src);
      }
      if (src === 'wss:' && urlObj.protocol === 'wss:') {
        return true;
      }
      return false;
    });
  } catch (error) {
    console.error('Invalid URL provided for CSP validation:', url);
    return false;
  }
};

/**
 * CSP violation reporting handler
 */
export const handleCSPViolation = (violationReport: any): void => {
  console.error('CSP Violation Report:', {
    blockedURI: violationReport.blockedURI,
    violatedDirective: violationReport.violatedDirective,
    originalPolicy: violationReport.originalPolicy,
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service
  }
};

