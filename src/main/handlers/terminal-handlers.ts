/**
 * Terminal IPC Handlers (Fixed - No PTY)
 * Provides terminal functionality using simple command execution
 */

import { ipcMain, BrowserWindow } from 'electron';
import { spawn, exec } from 'child_process';
import * as os from 'os';
import * as path from 'path';

class TerminalManager {
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  // Simple command execution without PTY
  async executeCommand(command: string, cwd?: string): Promise<any> {
    return new Promise((resolve) => {
      const workingDir = cwd || process.env.HOME || process.env.USERPROFILE || os.homedir();
      
      // Use exec for simple commands
      exec(command, { 
        cwd: workingDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor'
        },
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            stdout: stdout || '',
            stderr: stderr || error.message,
            exitCode: error.code || -1
          });
        } else {
          resolve({
            success: true,
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: 0
          });
        }
      });
    });
  }

  cleanup(): void {
    // No cleanup needed for simple command execution
  }
}

// Global terminal manager instance
const terminalManager = new TerminalManager();

// IPC Handlers
export function setupTerminalHandlers(mainWindow: BrowserWindow) {
  terminalManager.setMainWindow(mainWindow);

  // Execute single command (main handler)
  ipcMain.handle('execute-command', async (event, command: string, cwd?: string) => {
    try {
      console.log(`Executing command: ${command} in ${cwd || 'default directory'}`);
      const result = await terminalManager.executeCommand(command, cwd);
      console.log(`Command result:`, { 
        success: result.success, 
        exitCode: result.exitCode,
        stdoutLength: result.stdout?.length || 0,
        stderrLength: result.stderr?.length || 0
      });
      return result;
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

  // Legacy PTY handlers (for compatibility) - all redirect to simple execution
  ipcMain.handle('terminal-create', async (event, sessionId: string, cwd?: string) => {
    console.log(`Terminal create request (legacy): ${sessionId}`);
    return {
      success: true,
      sessionId: sessionId,
      cwd: cwd || process.env.HOME || '/home/ubuntu'
    };
  });

  ipcMain.handle('terminal-write', async (event, sessionId: string, data: string) => {
    console.log(`Terminal write request (legacy): ${sessionId}, data: ${data.substring(0, 50)}...`);
    // For legacy compatibility, treat write as command execution
    if (data.endsWith('\r') || data.endsWith('\n')) {
      const command = data.replace(/[\r\n]+$/, '');
      if (command.trim()) {
        const result = await terminalManager.executeCommand(command);
        // Send result back to renderer
        if (terminalManager.mainWindow) {
          terminalManager.mainWindow.webContents.send('terminal-data', sessionId, 
            `${result.stdout}${result.stderr}`);
          if (!result.success) {
            terminalManager.mainWindow.webContents.send('terminal-exit', sessionId, result.exitCode);
          }
        }
      }
    }
    return { success: true };
  });

  ipcMain.handle('terminal-resize', async (event, sessionId: string, cols: number, rows: number) => {
    console.log(`Terminal resize request (legacy): ${sessionId}`);
    return { success: true };
  });

  ipcMain.handle('terminal-kill', async (event, sessionId: string) => {
    console.log(`Terminal kill request (legacy): ${sessionId}`);
    return { success: true };
  });

  ipcMain.handle('terminal-get-cwd', async (event, sessionId: string) => {
    return {
      success: true,
      cwd: process.env.HOME || '/home/ubuntu'
    };
  });

  ipcMain.handle('terminal-list-sessions', async () => {
    return {
      success: true,
      sessions: ['main-terminal']
    };
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

