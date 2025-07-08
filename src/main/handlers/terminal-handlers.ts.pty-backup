/**
 * Terminal IPC Handlers
 * Provides real terminal functionality using node-pty
 */

import { ipcMain, BrowserWindow } from 'electron';
import * as pty from 'node-pty';
import * as os from 'os';
import * as path from 'path';

interface TerminalSession {
  id: string;
  ptyProcess: pty.IPty;
  cwd: string;
}

class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  createSession(sessionId: string, cwd?: string): TerminalSession {
    // Default to user's home directory or provided cwd
    const workingDir = cwd || process.env.HOME || process.env.USERPROFILE || os.homedir();
    
    // Determine shell based on platform
    const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash';
    
    // Create PTY process
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: workingDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      }
    });

    const session: TerminalSession = {
      id: sessionId,
      ptyProcess,
      cwd: workingDir
    };

    // Handle data from terminal
    ptyProcess.onData((data: string) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('terminal-data', sessionId, data);
      }
    });

    // Handle terminal exit
    ptyProcess.onExit((exitCode: number) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send('terminal-exit', sessionId, exitCode);
      }
      this.sessions.delete(sessionId);
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  writeToSession(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.write(data);
      return true;
    }
    return false;
  }

  resizeSession(sessionId: string, cols: number, rows: number): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.resize(cols, rows);
      return true;
    }
    return false;
  }

  killSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.kill();
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  getSessionCwd(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    return session ? session.cwd : null;
  }

  updateSessionCwd(sessionId: string, newCwd: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.cwd = newCwd;
    }
  }

  getAllSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  cleanup(): void {
    for (const session of this.sessions.values()) {
      session.ptyProcess.kill();
    }
    this.sessions.clear();
  }
}

// Global terminal manager instance
const terminalManager = new TerminalManager();

// IPC Handlers
export function setupTerminalHandlers(mainWindow: BrowserWindow) {
  terminalManager.setMainWindow(mainWindow);

  // Create new terminal session
  ipcMain.handle('terminal-create', async (event, sessionId: string, cwd?: string) => {
    try {
      const session = terminalManager.createSession(sessionId, cwd);
      return {
        success: true,
        sessionId: session.id,
        cwd: session.cwd
      };
    } catch (error) {
      console.error('Failed to create terminal session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Write data to terminal
  ipcMain.handle('terminal-write', async (event, sessionId: string, data: string) => {
    try {
      const success = terminalManager.writeToSession(sessionId, data);
      return { success };
    } catch (error) {
      console.error('Failed to write to terminal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Resize terminal
  ipcMain.handle('terminal-resize', async (event, sessionId: string, cols: number, rows: number) => {
    try {
      const success = terminalManager.resizeSession(sessionId, cols, rows);
      return { success };
    } catch (error) {
      console.error('Failed to resize terminal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Kill terminal session
  ipcMain.handle('terminal-kill', async (event, sessionId: string) => {
    try {
      const success = terminalManager.killSession(sessionId);
      return { success };
    } catch (error) {
      console.error('Failed to kill terminal session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get session info
  ipcMain.handle('terminal-get-cwd', async (event, sessionId: string) => {
    try {
      const cwd = terminalManager.getSessionCwd(sessionId);
      return {
        success: true,
        cwd
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // List all sessions
  ipcMain.handle('terminal-list-sessions', async () => {
    try {
      const sessions = terminalManager.getAllSessions();
      return {
        success: true,
        sessions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Execute single command (for compatibility)
  ipcMain.handle('execute-command', async (event, command: string, cwd?: string) => {
    try {
      // Create temporary session for single command
      const tempSessionId = `temp-${Date.now()}`;
      const session = terminalManager.createSession(tempSessionId, cwd);
      
      return new Promise((resolve) => {
        let output = '';
        let errorOutput = '';
        
        // Collect output
        const dataHandler = (data: string) => {
          output += data;
        };
        
        const exitHandler = (exitCode: number) => {
          session.ptyProcess.off('data', dataHandler);
          session.ptyProcess.off('exit', exitHandler);
          terminalManager.killSession(tempSessionId);
          
          resolve({
            success: exitCode === 0,
            stdout: output,
            stderr: exitCode !== 0 ? output : '',
            exitCode
          });
        };
        
        session.ptyProcess.on('data', dataHandler);
        session.ptyProcess.on('exit', exitHandler);
        
        // Execute command
        session.ptyProcess.write(command + '\r');
        
        // Timeout after 30 seconds
        setTimeout(() => {
          terminalManager.killSession(tempSessionId);
          resolve({
            success: false,
            stdout: output,
            stderr: 'Command timed out after 30 seconds',
            exitCode: -1
          });
        }, 30000);
      });
    } catch (error) {
      console.error('Failed to execute command:', error);
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1
      };
    }
  });

  // Cleanup on app quit
  process.on('exit', () => {
    terminalManager.cleanup();
  });

  process.on('SIGINT', () => {
    terminalManager.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    terminalManager.cleanup();
    process.exit(0);
  });
}

export { terminalManager };

