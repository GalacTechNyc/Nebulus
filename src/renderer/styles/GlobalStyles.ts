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
    font-family: 'Orbitron', 'Roboto Mono', 'Courier New', monospace;
    background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, #1a0033 50%, #000000 100%);
    background-attachment: fixed;
    color: ${props => props.theme.colors.text};
    font-size: ${props => props.theme.fontSizes.medium};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
  }

  #root {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
  }

  /* Cyberpunk Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.surface};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.border});
    border-radius: 4px;
    box-shadow: ${props => props.theme.shadows.small};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, ${props => props.theme.colors.primaryHover}, ${props => props.theme.colors.borderHover});
    box-shadow: ${props => props.theme.shadows.neonCyan};
  }

  /* Cyberpunk Selection styling */
  ::selection {
    background-color: ${props => props.theme.colors.primary}40;
    text-shadow: 0 0 10px ${props => props.theme.colors.primary};
  }

  /* Neon Focus outline */
  *:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
    box-shadow: ${props => props.theme.shadows.neonCyan};
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

  @keyframes neonPulse {
    0%, 100% { 
      text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
    }
    50% { 
      text-shadow: 0 0 2px currentColor, 0 0 5px currentColor, 0 0 8px currentColor;
    }
  }

  @keyframes borderGlow {
    0%, 100% { 
      box-shadow: 0 0 5px ${props => props.theme.colors.primary}, 0 0 10px ${props => props.theme.colors.primary};
    }
    50% { 
      box-shadow: 0 0 10px ${props => props.theme.colors.primary}, 0 0 20px ${props => props.theme.colors.primary}, 0 0 30px ${props => props.theme.colors.primary};
    }
  }

  @keyframes dataFlow {
    0% { transform: translateX(-100%); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateX(100%); opacity: 0; }
  }

  /* Cyberpunk utility classes */
  .neon-text {
    animation: neonPulse 2s ease-in-out infinite;
  }

  .cyber-border {
    animation: borderGlow 3s ease-in-out infinite;
  }

  .data-stream::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, ${props => props.theme.colors.primary}40, transparent);
    animation: dataFlow 2s linear infinite;
  }
`;