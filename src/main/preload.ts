import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, callback: (...args: any[]) => void) => {
    // Remove all listeners for this channel first to prevent memory leaks
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  
  // Terminal PTY APIs
  createTerminal: (options: { id: string; cwd?: string; cols?: number; rows?: number }) => 
    ipcRenderer.invoke('terminal:create', options),
  writeToTerminal: (id: string, data: string) => 
    ipcRenderer.invoke('terminal:write', id, data),
  resizeTerminal: (id: string, cols: number, rows: number) => 
    ipcRenderer.invoke('terminal:resize', id, cols, rows),
  killTerminal: (id: string) => 
    ipcRenderer.invoke('terminal:kill', id),
  onTerminalData: (callback: (data: { id: string; data: string }) => void) => {
    ipcRenderer.removeAllListeners('terminal:data');
    ipcRenderer.on('terminal:data', (event, data) => callback(data));
  },
  onTerminalExit: (callback: (data: { id: string; exitCode: number }) => void) => {
    ipcRenderer.removeAllListeners('terminal:exit');
    ipcRenderer.on('terminal:exit', (event, data) => callback(data));
  },
  
  // Expose some Node.js APIs that are safe for the renderer
  platform: process.platform,
  arch: process.arch,
  versions: process.versions
});