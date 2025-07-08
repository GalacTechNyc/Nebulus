// IPC service for renderer process communication with main process

import { IpcMessage } from '../../shared/types';
import * as monaco from 'monaco-editor';

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      readFile: (filePath: string) => Promise<{success: boolean, content?: string, error?: string}>;
      writeFile: (filePath: string, content: string) => Promise<{success: boolean, error?: string}>;
      executeCommand: (command: string, cwd?: string) => Promise<{success: boolean, stdout?: string, stderr?: string, exitCode?: number}>;
      openFileDialog: () => Promise<{canceled: boolean, filePaths: string[]}>;
      openDirectoryDialog: () => Promise<{canceled: boolean, filePaths: string[]}>;
      readDirectory: (dirPath: string) => Promise<{success: boolean, files?: Array<{name: string, isDirectory: boolean, path: string}>, error?: string}>;
      aiChat: (messages: any[]) => Promise<any>;
      createTerminal: (options: { id: string; cwd?: string; cols?: number; rows?: number }) => Promise<{success: boolean, id?: string, error?: string}>;
      writeToTerminal: (id: string, data: string) => Promise<{success: boolean, error?: string}>;
      resizeTerminal: (id: string, cols: number, rows: number) => Promise<{success: boolean, error?: string}>;
      killTerminal: (id: string) => Promise<{success: boolean, error?: string}>;
      onTerminalData: (callback: (data: { id: string; data: string }) => void) => void;
      onTerminalExit: (callback: (data: { id: string; exitCode: number }) => void) => void;
      browserNavigate: (url: string) => Promise<void>;
      platform: string;
      arch: string;
      versions: any;
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
    return await window.electronAPI.invoke('execute-command', command, cwd);
  }

  // PTY Terminal operations
  async createTerminal(sessionId: string, cwd?: string): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('terminal-create', sessionId, cwd);
  }

  async writeToTerminal(sessionId: string, data: string): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('terminal-write', sessionId, data);
  }

  async resizeTerminal(sessionId: string, cols: number, rows: number): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('terminal-resize', sessionId, cols, rows);
  }

  async killTerminal(sessionId: string): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('terminal-kill', sessionId);
  }

  async getTerminalCwd(sessionId: string): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('terminal-get-cwd', sessionId);
  }

  async listTerminalSessions(): Promise<any> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    return await window.electronAPI.invoke('terminal-list-sessions');
  }

  // Terminal event listeners
  onTerminalData(callback: (sessionId: string, data: string) => void): void {
    if (window.electronAPI) {
      window.electronAPI.on('terminal-data', callback);
    }
  }

  onTerminalExit(callback: (sessionId: string, exitCode: number) => void): void {
    if (window.electronAPI) {
      window.electronAPI.on('terminal-exit', callback);
    }
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

  // Retrieve editor context for AI integration, including diagnostics/errors
  async getEditorContext(): Promise<{
    fileName?: string;
    content?: string;
    cursorPosition?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
    selectedText?: string;
    errors?: Array<{
      message: string;
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
      severity: number;
    }>;
  }> {
    // Attempt to gather context from the active Monaco editor instance
    const editor = (window as any).__galactusEditor as monaco.editor.IStandaloneCodeEditor | undefined;
    const fileName = (window as any).__galactusCurrentFileName as string | undefined;
    let content: string | undefined;
    let selectedText: string | undefined;
    let cursorPosition: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } | undefined;
    let errors: Array<{
      message: string;
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
      severity: number;
    }> = [];
    if (editor) {
      const model = editor.getModel();
      if (model) {
        content = model.getValue();
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        errors = markers.map(m => ({
          message: m.message,
          startLineNumber: m.startLineNumber,
          startColumn: m.startColumn,
          endLineNumber: m.endLineNumber,
          endColumn: m.endColumn,
          severity: m.severity
        }));
      }
      const sel = editor.getSelection();
      if (sel && editor.getModel()) {
        cursorPosition = {
          startLineNumber: sel.startLineNumber,
          startColumn: sel.startColumn,
          endLineNumber: sel.endLineNumber,
          endColumn: sel.endColumn
        };
        selectedText = editor.getModel()!.getValueInRange(sel);
      }
    }
    return { fileName, content, selectedText, cursorPosition, errors };
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

  async selectAllEditorText(): Promise<void> {
    if (window.electronAPI) {
      window.electronAPI.send('editor:select-all');
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