import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ipcService from '../../services/ipc';

const BrowserContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.colors.background};
`;

const AddressBar = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  gap: ${props => props.theme.spacing.sm};
`;

const DevToolsButton = styled.button<{ $active?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.surfaceHover};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: ${props => props.$active ? props.theme.colors.primaryHover : props.theme.colors.borderHover};
  }
`;

const PreviewModeIndicator = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.$active ? props.theme.colors.success + '20' : props.theme.colors.surface};
  border: 1px solid ${props => props.$active ? props.theme.colors.success : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.$active ? props.theme.colors.success : props.theme.colors.text};
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
`;

const NavButton = styled.button<{ disabled?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.disabled ? props.theme.colors.surface : props.theme.colors.surfaceHover};
  color: ${props => props.disabled ? props.theme.colors.textMuted : props.theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:hover {
    background-color: ${props => props.disabled ? props.theme.colors.surface : props.theme.colors.borderHover};
  }
`;

const UrlInput = styled.input`
  flex: 1;
  height: 28px;
  padding: 0 ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.small};
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
`;

const WebviewContainer = styled.div`
  flex: 1;
  background-color: white;
  position: relative;
`;

const Webview = styled.div`
  width: 100%;
  height: 100%;
  border: none;
  
  webview {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const LoadingOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.colors.background};
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.textSecondary};
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${props => props.theme.colors.border};
  border-top: 3px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  gap: ${props => props.theme.spacing.md};
`;

const QuickActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.lg};
`;

const QuickAction = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  color: #FFFFFF;
  font-size: ${props => props.theme.fontSizes.small};
  font-weight: 600;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background-color: ${props => props.theme.colors.primary};
    border-color: ${props => props.theme.colors.primary};
    color: #000000;
    box-shadow: ${props => props.theme.shadows.neonCyan};
    transform: translateY(-2px);
  }
`;

const Browser: React.FC = () => {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [previewPort, setPreviewPort] = useState(3000);
  const webviewRef = useRef<any>(null);

  // Security: URL validation and navigation restrictions
  const isUrlAllowed = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      
      // Block dangerous protocols
      const blockedProtocols = ['file:', 'ftp:', 'data:', 'javascript:', 'vbscript:'];
      if (blockedProtocols.includes(urlObj.protocol)) {
        return false;
      }
      
      // Block localhost/internal network access (except for development)
      const hostname = urlObj.hostname.toLowerCase();
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
      const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname);
      
      // Allow localhost only in development
      if ((isLocalhost || isPrivateIP) && process.env.NODE_ENV === 'production') {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  };

  const handleNavigate = (targetUrl?: string) => {
    const navigateUrl = targetUrl || url;
    if (!navigateUrl) return;
    
    let fullUrl = navigateUrl;
    if (!navigateUrl.startsWith('http://') && !navigateUrl.startsWith('https://')) {
      fullUrl = `https://${navigateUrl}`;
    }
    
    // Security check
    if (!isUrlAllowed(fullUrl)) {
      console.warn('Navigation blocked: URL not allowed', fullUrl);
      return;
    }
    
    setCurrentUrl(fullUrl);
    setIsLoading(true);
    
    // In a real implementation, you'd use Electron's webview
    // For now, we'll simulate navigation
    // actual navigation will be tracked via webview events
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  const handleBack = () => {
  if (canGoBack && webviewRef.current) {
    webviewRef.current.goBack();
  }
  };

  const handleForward = () => {
  if (canGoForward && webviewRef.current) {
    webviewRef.current.goForward();
  }
  };

  const handleRefresh = () => {
  if (webviewRef.current) {
    webviewRef.current.reload();
  }
  };

  const quickNavigate = (quickUrl: string) => {
    setUrl(quickUrl);
    handleNavigate(quickUrl);
  };

  // Developer Tools functionality
  const toggleDevTools = () => {
    if (webviewRef.current) {
      if (devToolsOpen) {
        webviewRef.current.closeDevTools();
      } else {
        webviewRef.current.openDevTools();
      }
      setDevToolsOpen(!devToolsOpen);
    }
  };

  // Live Preview functionality
  const enableLivePreview = () => {
    const localhostUrl = `http://localhost:${previewPort}`;
    setUrl(localhostUrl);
    handleNavigate(localhostUrl);
    setIsLivePreview(true);
  };

  const disableLivePreview = () => {
    setIsLivePreview(false);
  };

  // Auto-detect localhost URLs for live preview mode
  useEffect(() => {
    const isLocalhost = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
    setIsLivePreview(isLocalhost);
  }, [currentUrl]);

  // Hot-reload functionality for live preview
  useEffect(() => {
    if (isLivePreview) {
      // Start watching for file changes
      ipcService.startFileWatcher('./src');
      
      // Set up file change listener for hot-reload
      ipcService.onFileChange((event) => {
        console.log('File changed:', event.path);
        // Auto-refresh the webview when files change
        if (webviewRef.current && isLivePreview) {
          setTimeout(() => {
            webviewRef.current.reload();
          }, 500); // Small delay to allow build processes to complete
        }
      });
    } else {
      // Stop file watching when not in live preview mode
      ipcService.stopFileWatcher();
    }

    return () => {
      ipcService.stopFileWatcher();
    };
  }, [isLivePreview]);

  // Listen for browser navigation events from main process
  useEffect(() => {
    const handleNavigation = (url: string) => {
      console.log('Browser navigation received:', url.substring(0, 100) + '...');
      console.log('Setting current URL and url state');
      setCurrentUrl(url);
      setUrl(url);
      
      // Force webview to navigate if it exists
      if (webviewRef.current) {
        console.log('Forcing webview navigation');
        webviewRef.current.src = url;
      }
    };

    // Set up IPC listener for browser navigation
    if (window.electronAPI) {
      window.electronAPI.on('browser:navigate', handleNavigation);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('browser:navigate');
      }
    };
  }, []);

  // Expose browser context globally for AI integration
  useEffect(() => {
    (window as any).__galactusBrowserUrl = currentUrl;
  }, [currentUrl]);

  // Attach webview event listeners to update loading and navigation state
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    
    const handleDidStart = () => setIsLoading(true);
    const handleDidStop = () => {
      setIsLoading(false);
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
      const newUrl = webview.getURL();
      setCurrentUrl(newUrl);
      
      // Update global context for AI
      (window as any).__galactusBrowserUrl = newUrl;
      
      // Try to get page title and content for AI context
      try {
        webview.executeJavaScript('document.title').then((title: string) => {
          (window as any).__galactusBrowserTitle = title;
        }).catch(() => {});
        
        webview.executeJavaScript('document.body.innerText.substring(0, 1000)').then((content: string) => {
          (window as any).__galactusBrowserContent = content;
        }).catch(() => {});
      } catch (error) {
        // Ignore errors from cross-origin frames
      }
    };
    
    // Security: Block unauthorized navigation attempts
    const handleWillNavigate = (event: any) => {
      const targetUrl = event.url;
      if (!isUrlAllowed(targetUrl)) {
        console.warn('Navigation blocked by security policy:', targetUrl);
        event.preventDefault();
      }
    };
    
    // Security: Block new window attempts that bypass sandbox
    const handleNewWindow = (event: any) => {
      const targetUrl = event.url;
      if (!isUrlAllowed(targetUrl)) {
        console.warn('New window blocked by security policy:', targetUrl);
        event.preventDefault();
      }
    };
    
    webview.addEventListener('did-start-loading', handleDidStart);
    webview.addEventListener('did-stop-loading', handleDidStop);
    webview.addEventListener('did-navigate', handleDidStop);
    webview.addEventListener('did-navigate-in-page', handleDidStop);
    webview.addEventListener('will-navigate', handleWillNavigate);
    webview.addEventListener('new-window', handleNewWindow);
    
    return () => {
      webview.removeEventListener('did-start-loading', handleDidStart);
      webview.removeEventListener('did-stop-loading', handleDidStop);
      webview.removeEventListener('did-navigate', handleDidStop);
      webview.removeEventListener('did-navigate-in-page', handleDidStop);
      webview.removeEventListener('will-navigate', handleWillNavigate);
      webview.removeEventListener('new-window', handleNewWindow);
    };
  }, [currentUrl]);

  return (
    <BrowserContainer>
      <AddressBar>
        <NavigationButtons>
          <NavButton disabled={!canGoBack} onClick={handleBack}>
            ←
          </NavButton>
          <NavButton disabled={!canGoForward} onClick={handleForward}>
            →
          </NavButton>
          <NavButton onClick={handleRefresh}>
            ↻
          </NavButton>
          <DevToolsButton $active={devToolsOpen} onClick={toggleDevTools} title="Toggle Developer Tools">
            🔧
          </DevToolsButton>
          {!isLivePreview && (
            <DevToolsButton onClick={enableLivePreview} title="Enable Live Preview">
              👁️
            </DevToolsButton>
          )}
        </NavigationButtons>
        
        <UrlInput
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleUrlKeyDown}
          placeholder="Enter URL or paste HTML data URL for preview..."
        />
        
        {isLivePreview && (
          <PreviewModeIndicator $active={true}>
            <span>🔴</span>
            <span>Live Preview</span>
          </PreviewModeIndicator>
        )}
      </AddressBar>
      
      <WebviewContainer>
        {!currentUrl ? (
          <EmptyState>
            <div style={{ fontSize: '48px' }}>🌐</div>
            <div style={{ fontSize: '18px', color: '#000000', fontWeight: 'bold', background: 'linear-gradient(45deg, #00FFFF, #FF006E)', padding: '8px 16px', borderRadius: '8px', textShadow: 'none' }}>Web Browser</div>
            <div style={{ color: '#000000', fontWeight: '600', background: 'rgba(255, 255, 255, 0.9)', padding: '4px 8px', borderRadius: '4px', marginTop: '8px' }}>Navigate to any website to start browsing</div>
            
            <QuickActions>
              <QuickAction onClick={() => quickNavigate('google.com')}>
                Google
              </QuickAction>
              <QuickAction onClick={() => quickNavigate('github.com')}>
                GitHub
              </QuickAction>
              <QuickAction onClick={() => quickNavigate('stackoverflow.com')}>
                Stack Overflow
              </QuickAction>
              <QuickAction onClick={() => quickNavigate('localhost:3000')}>
                Localhost
              </QuickAction>
            </QuickActions>
          </EmptyState>
        ) : (
          <>
            <LoadingOverlay $visible={isLoading}>
              <LoadingSpinner />
              <div>Loading {currentUrl}...</div>
            </LoadingOverlay>
            <Webview style={{ display: isLoading ? 'none' : 'block' }}>
              <webview
                ref={webviewRef}
                src={currentUrl}
                style={{ width: '100%', height: '100%' }}
                data-onload={() => console.log('Webview loaded:', currentUrl.substring(0, 50) + '...')}
                {...({
                  sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads",
                  allowpopups: true,
                  webSecurity: true,
                  nodeIntegration: false,
                  contextIsolation: true,
                  enableWebSQL: false,
                  experimentalFeatures: false
                } as any)}
              />
            </Webview>
          </>
        )}
      </WebviewContainer>
    </BrowserContainer>
  );
};

export default Browser;