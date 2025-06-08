import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    overflow: hidden;
  }

  body {
    font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 
                 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    font-size: ${props => props.theme.fontSizes.medium};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.borderHover};
  }

  /* Selection styling */
  ::selection {
    background-color: ${props => props.theme.colors.primary}40;
  }

  /* Focus outline */
  *:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }

  /* Button reset */
  button {
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
  }

  /* Input reset */
  input, textarea {
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
  }

  /* Link reset */
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Code styling */
  code, pre {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  }

  /* Utility classes */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Monaco Editor overrides */
  .monaco-editor {
    .margin {
      background-color: ${props => props.theme.colors.surface} !important;
    }
    
    .monaco-editor-background {
      background-color: ${props => props.theme.colors.background} !important;
    }
  }

  /* React Split Pane styling */
  .Resizer {
    background: ${props => props.theme.colors.border};
    opacity: 0.3;
    z-index: 1;
    box-sizing: border-box;
    background-clip: padding-box;
    transition: opacity 0.2s ease;
  }

  .Resizer:hover {
    opacity: 0.6;
  }

  .Resizer.horizontal {
    height: 4px;
    margin: -2px 0;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
    cursor: row-resize;
  }

  .Resizer.vertical {
    width: 4px;
    margin: 0 -2px;
    border-left: 2px solid transparent;
    border-right: 2px solid transparent;
    cursor: col-resize;
  }

  .Resizer.disabled {
    cursor: not-allowed;
  }

  .Resizer.disabled:hover {
    opacity: 0.3;
  }

  /* Loading screen */
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${props => props.theme.colors.background};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .loading-logo {
    width: 64px;
    height: 64px;
    background: linear-gradient(45deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.primaryHover});
    border-radius: ${props => props.theme.borderRadius.large};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${props => props.theme.fontSizes.xxlarge};
    font-weight: bold;
    color: ${props => props.theme.colors.text};
    margin-bottom: ${props => props.theme.spacing.md};
  }

  .loading-text {
    font-size: ${props => props.theme.fontSizes.xlarge};
    color: ${props => props.theme.colors.text};
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  .loading-subtext {
    font-size: ${props => props.theme.fontSizes.small};
    color: ${props => props.theme.colors.textSecondary};
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid ${props => props.theme.colors.border};
    border-top: 3px solid ${props => props.theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-top: ${props => props.theme.spacing.lg};
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;