/**
 * Secure Webview Component
 * Provides hardened webview with security controls and monitoring
 */

import React, { useEffect, useRef, useState } from 'react';
import { errorLogger as logger } from '../../shared/security/error-handling';

export interface SecureWebviewProps {
  src?: string;
  onNavigate?: (url: string) => void;
  onSecurityViolation?: (violation: SecurityViolation) => void;
  allowedDomains?: string[];
  enableDevTools?: boolean;
  className?: string;
}

export interface SecurityViolation {
  type: 'navigation' | 'csp' | 'permission' | 'download';
  url: string;
  details: string;
  timestamp: Date;
}

/**
 * Default allowed domains for development IDE
 */
const DEFAULT_ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'github.com',
  'stackoverflow.com',
  'developer.mozilla.org',
  'nodejs.org',
  'npmjs.com',
];

/**
 * Secure webview component with enhanced security controls
 */
export const SecureWebview: React.FC<SecureWebviewProps> = ({
  src,
  onNavigate,
  onSecurityViolation,
  allowedDomains = DEFAULT_ALLOWED_DOMAINS,
  enableDevTools = process.env.NODE_ENV === 'development',
  className,
}) => {
  const webviewRef = useRef<any>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(src || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [securityStatus, setSecurityStatus] = useState<'secure' | 'warning' | 'blocked'>('secure');

  /**
   * Validate URL against allowed domains
   */
  const isUrlAllowed = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      
      // Allow file:// protocol for local development
      if (urlObj.protocol === 'file:') {
        return true;
      }
      
      // Allow data: URLs for inline content
      if (urlObj.protocol === 'data:') {
        return true;
      }
      
      // Check against allowed domains
      return allowedDomains.some(domain => {
        return urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`);
      });
    } catch (error) {
      logger.warn('Invalid URL provided to webview', 'SecureWebview', { url, error });
      return false;
    }
  };

  /**
   * Handle navigation attempts
   */
  const handleWillNavigate = (event: any) => {
    const { url } = event;
    
    logger.debug('Webview navigation attempt', 'SecureWebview', { url });
    
    if (!isUrlAllowed(url)) {
      event.preventDefault();
      
      const violation: SecurityViolation = {
        type: 'navigation',
        url,
        details: 'Navigation blocked - domain not in allowlist',
        timestamp: new Date(),
      };
      
      logger.warn('Blocked navigation to unauthorized domain', 'SecureWebview', violation);
      onSecurityViolation?.(violation);
      setSecurityStatus('blocked');
      
      return;
    }
    
    setCurrentUrl(url);
    setSecurityStatus('secure');
    onNavigate?.(url);
  };

  /**
   * Handle new window requests
   */
  const handleNewWindow = (event: any) => {
    const { url } = event;
    
    // Block all new window requests for security
    event.preventDefault();
    
    const violation: SecurityViolation = {
      type: 'navigation',
      url,
      details: 'New window blocked for security',
      timestamp: new Date(),
    };
    
    logger.warn('Blocked new window request', 'SecureWebview', violation);
    onSecurityViolation?.(violation);
  };

  /**
   * Handle permission requests
   */
  const handlePermissionRequest = (event: any) => {
    const { permission } = event;
    
    // Block all permission requests by default
    event.preventDefault();
    
    const violation: SecurityViolation = {
      type: 'permission',
      url: currentUrl,
      details: `Permission request blocked: ${permission}`,
      timestamp: new Date(),
    };
    
    logger.warn('Blocked permission request', 'SecureWebview', violation);
    onSecurityViolation?.(violation);
  };

  /**
   * Handle console messages from webview
   */
  const handleConsoleMessage = (event: any) => {
    const { level, message, line, sourceId } = event;
    
    // Log console messages for debugging
    logger.debug('Webview console message', 'SecureWebview', {
      level,
      message,
      line,
      sourceId,
      url: currentUrl,
    });
    
    // Check for potential security issues in console messages
    if (message.includes('CSP') || message.includes('Content Security Policy')) {
      const violation: SecurityViolation = {
        type: 'csp',
        url: currentUrl,
        details: message,
        timestamp: new Date(),
      };
      
      logger.warn('CSP violation detected', 'SecureWebview', violation);
      onSecurityViolation?.(violation);
      setSecurityStatus('warning');
    }
  };

  /**
   * Setup webview security event listeners
   */
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // Navigation security
    webview.addEventListener('will-navigate', handleWillNavigate);
    webview.addEventListener('new-window', handleNewWindow);
    
    // Permission security
    webview.addEventListener('permission-request', handlePermissionRequest);
    
    // Console monitoring
    webview.addEventListener('console-message', handleConsoleMessage);
    
    // Loading state
    webview.addEventListener('did-start-loading', () => setIsLoading(true));
    webview.addEventListener('did-stop-loading', () => setIsLoading(false));
    
    // Error handling
    webview.addEventListener('did-fail-load', (event: any) => {
      logger.error('Webview failed to load', 'SecureWebview', {
        errorCode: event.errorCode,
        errorDescription: event.errorDescription,
        url: event.validatedURL,
      });
      setIsLoading(false);
    });

    return () => {
      webview.removeEventListener('will-navigate', handleWillNavigate);
      webview.removeEventListener('new-window', handleNewWindow);
      webview.removeEventListener('permission-request', handlePermissionRequest);
      webview.removeEventListener('console-message', handleConsoleMessage);
    };
  }, [allowedDomains, onNavigate, onSecurityViolation]);

  /**
   * Navigate to URL with security validation
   */
  const navigateToUrl = (url: string) => {
    if (!isUrlAllowed(url)) {
      const violation: SecurityViolation = {
        type: 'navigation',
        url,
        details: 'Navigation blocked - domain not in allowlist',
        timestamp: new Date(),
      };
      
      logger.warn('Blocked programmatic navigation', 'SecureWebview', violation);
      onSecurityViolation?.(violation);
      return;
    }
    
    setCurrentUrl(url);
    if (webviewRef.current) {
      webviewRef.current.src = url;
    }
  };

  /**
   * Get security status indicator
   */
  const getSecurityIndicator = () => {
    switch (securityStatus) {
      case 'secure':
        return <span className="security-indicator secure">🔒 Secure</span>;
      case 'warning':
        return <span className="security-indicator warning">⚠️ Warning</span>;
      case 'blocked':
        return <span className="security-indicator blocked">🚫 Blocked</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`secure-webview-container ${className || ''}`}>
      <div className="webview-toolbar">
        <div className="url-bar">
          <input
            type="url"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                navigateToUrl(currentUrl);
              }
            }}
            placeholder="Enter URL..."
          />
          <button onClick={() => navigateToUrl(currentUrl)}>Go</button>
        </div>
        <div className="security-status">
          {getSecurityIndicator()}
          {isLoading && <span className="loading-indicator">Loading...</span>}
        </div>
      </div>
      
      <webview
        ref={webviewRef}
        src={src}
        className="secure-webview"
        // Security settings
        data-nodeintegration="false"
        data-contextIsolation="true"
        data-enableremotemodule="false"
        data-sandbox="true"
        data-webSecurity="true"
        data-allowRunningInsecureContent="false"
        data-experimentalFeatures="false"
        // Development settings
        data-devtools={enableDevTools}
        // CSP will be injected by the main process
      />
      
    </div>
  );
};

export default SecureWebview;
