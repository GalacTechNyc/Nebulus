/**
 * Terminal IPC Handlers (Working Implementation)
 * Provides command execution without PTY dependencies
 */

import { ipcMain, BrowserWindow } from 'electron';
import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import { IpcChannels, CommandResult } from '../../shared/types';

class TerminalManager {
  private mainWindow: BrowserWindow | null = null;
  private activeCommands = new Map<string, any>();

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    // Execute command handler
    ipcMain.handle(IpcChannels.EXECUTE_COMMAND, async (event, command: string, cwd?: string) => {
      return this.executeCommand(command, cwd);
    });

    // Legacy execute command handler for compatibility
    ipcMain.handle('execute-command', async (event, command: string, cwd?: string) => {
      return this.executeCommand(command, cwd);
    });
  }

  private async executeCommand(command: string, cwd?: string): Promise<CommandResult> {
    return new Promise((resolve) => {
      const workingDir = cwd || process.cwd();
      const isWindows = os.platform() === 'win32';
      
      // Determine shell and command format
      let shell: string;
      let shellArgs: string[];
      
      if (isWindows) {
        shell = 'cmd.exe';
        shellArgs = ['/c', command];
      } else {
        shell = '/bin/bash';
        shellArgs = ['-c', command];
      }

      const childProcess = spawn(shell, shellArgs, {
        cwd: workingDir,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      // Collect stdout
      childProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
      });

      // Collect stderr
      childProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
      });

      // Handle process completion
      childProcess.on('close', (code) => {
        const result: CommandResult = {
          success: code === 0,
          output: output.trim(),
          error: errorOutput.trim() || undefined,
          exitCode: code || 0
        };

        resolve(result);
      });

      // Handle process errors
      childProcess.on('error', (error) => {
        const result: CommandResult = {
          success: false,
          output: '',
          error: error.message,
          exitCode: -1
        };

        resolve(result);
      });

      // Set timeout for long-running commands
      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill();
          resolve({
            success: false,
            output: output.trim(),
            error: 'Command timed out after 30 seconds',
            exitCode: -1
          });
        }
      }, 30000);
    });
  }

  // Quick command execution for common operations
  async executeQuickCommand(command: string): Promise<CommandResult> {
    const commonCommands: Record<string, string> = {
      'npm-version': 'npm --version',
      'node-version': 'node --version',
      'git-status': 'git status --porcelain',
      'list-files': 'ls -la',
      'current-dir': 'pwd'
    };

    const actualCommand = commonCommands[command] || command;
    return this.executeCommand(actualCommand);
  }

  // Get system information
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      homeDir: os.homedir(),
      tmpDir: os.tmpdir(),
      cwd: process.cwd()
    };
  }

  // Cleanup method
  cleanup() {
    // Kill any active commands
    this.activeCommands.forEach((process, id) => {
      if (process && !process.killed) {
        process.kill();
      }
    });
    this.activeCommands.clear();
  }
}

// Export the setup function
export function setupTerminalHandlers(mainWindow: BrowserWindow): TerminalManager {
  return new TerminalManager(mainWindow);
}

// Export for testing
export { TerminalManager };

