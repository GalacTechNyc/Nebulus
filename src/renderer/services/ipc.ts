// IPC service for renderer process communication with main process

import { IpcMessage } from '../../shared/types';

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

class IPCService {
  // File system operations
  async readFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('file:read', filePath);
  }

  async writeFile(filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('file:write', filePath, content);
  }

  async fileExists(filePath: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    return await window.electronAPI.invoke('file:exists', filePath);
  }

  async readDirectory(dirPath: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('directory:read', dirPath);
  }

  // Dialog operations
  async openFileDialog(): Promise<any> {
    if (!window.electronAPI) {
      return { canceled: true };
    }
    return await window.electronAPI.invoke('dialog:openFile');
  }

  async openDirectoryDialog(): Promise<any> {
    if (!window.electronAPI) {
      return { canceled: true };
    }
    return await window.electronAPI.invoke('dialog:openDirectory');
  }

  async saveFileDialog(defaultPath?: string): Promise<any> {
    if (!window.electronAPI) {
      return { canceled: true };
    }
    return await window.electronAPI.invoke('dialog:saveFile', defaultPath);
  }

  // Terminal operations
  async executeCommand(command: string, cwd?: string): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('terminal:execute', command, cwd);
  }

  // AI operations
  async chatWithAI(messages: any[]): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('ai:chat', messages);
  }

  // AI streaming events
  onAIStream(callback: (data: { content: string; isComplete: boolean; error?: string }) => void): void {
    if (window.electronAPI) {
      window.electronAPI.on('ai:stream', callback);
    }
  }


  // Deployment operations
  async deployToVercel(config: any): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('deploy:vercel', config);
  }

  // Window operations
  async minimizeWindow(): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.invoke('window:minimize');
    }
  }

  async maximizeWindow(): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.invoke('window:maximize');
    }
  }

  async closeWindow(): Promise<void> {
    if (window.electronAPI) {
      await window.electronAPI.invoke('window:close');
    }
  }

  // Editor insertion: insert generated code into the active editor
  sendEditorInsertCode(code: string): void {
    if (window.electronAPI) {
      window.electronAPI.send('editor:insert-code', code);
    }
  }

  // Enhanced editor operations for AI integration
  async getEditorContext(): Promise<{ fileName?: string; content?: string; cursorPosition?: any; selectedText?: string }> {
    if (!window.electronAPI) {
      return {};
    }
    return await window.electronAPI.invoke('editor:get-context');
  }

  async insertCodeAtPosition(code: string, position?: any): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('editor:insert-at-position', { code, position });
    }
  }

  async replaceSelectedText(newText: string): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('editor:replace-selection', newText);
    }
  }

  async formatEditorCode(): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('editor:format-code');
    }
  }

  // Live preview and hot-reload functionality
  async startFileWatcher(path: string): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('file-watcher:start', path);
    }
  }

  async stopFileWatcher(): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('file-watcher:stop');
    }
  }

  onFileChange(callback: (event: { path: string; type: string }) => void): void {
    if (window.electronAPI) {
      window.electronAPI.on('file-watcher:change', callback);
    }
  }

  // Event listeners
  onFileSystemChange(callback: (event: any) => void): void {
    if (window.electronAPI) {
      window.electronAPI.on('filesystem:change', callback);
    }
  }

  onTerminalOutput(callback: (output: string) => void): void {
    if (window.electronAPI) {
      window.electronAPI.on('terminal:output', callback);
    }
  }

  onAIResponse(callback: (response: any) => void): void {
    if (window.electronAPI) {
      window.electronAPI.on('ai:response', callback);
    }
  }

  removeAllListeners(channel: string): void {
    if (window.electronAPI) {
      window.electronAPI.removeAllListeners(channel);
    }
  }
}

export const ipcService = new IPCService();
export default ipcService;