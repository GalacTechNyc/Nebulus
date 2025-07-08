import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { URL } from 'url';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
// Try to import node-pty, gracefully fall back if not available
let pty: any = null;
try {
  pty = require('node-pty');
} catch (error) {
  console.warn('node-pty not available, terminal will run in fallback mode:', (error as Error).message);
}

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
});

// Force production mode for now to avoid webpack dev server issues
const isDevelopment = false; // Temporarily disabled
console.log('Main process NODE_ENV:', process.env.NODE_ENV);
console.log('Forced isDevelopment:', isDevelopment);

if (isDevelopment) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (error) {
    console.log('electron-reload not available, skipping');
  }
}

class GalactusIDE {
  private mainWindow: BrowserWindow | null = null;
  private terminals: Map<string, any> = new Map();

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupIpcHandlers();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private createMainWindow(): void {
    console.log('Creating main window...');
    this.mainWindow = new BrowserWindow({
      width: 1600,
      height: 1000,
      minWidth: 800,
      minHeight: 600,
      maxWidth: 3840, // Support 4K displays
      maxHeight: 2160, // Support 4K displays
      resizable: true, // Explicitly ensure window is resizable
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: false,
        allowRunningInsecureContent: true,
        webviewTag: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      show: true
    });

    // Load the renderer
    console.log('Environment:', isDevelopment ? 'development' : 'production');
    
    if (isDevelopment) {
      console.log('Loading development URL: http://localhost:3000');
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      const rendererPath = path.join(__dirname, '..', 'dist', 'renderer', 'index.html');
      console.log('Loading production file:', rendererPath);
      this.mainWindow.loadFile(rendererPath);
      this.mainWindow.webContents.openDevTools(); // Open DevTools to debug renderer
    }

    this.mainWindow.once('ready-to-show', () => {
      console.log('Window ready to show');
      this.mainWindow?.show();
      
      // Focus on the window
      if (isDevelopment) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private setupIpcHandlers(): void {
    // File system operations
    ipcMain.handle('file:read', async (_, filePath: string) => {
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return { success: true, content };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('file:write', async (_, filePath: string, content: string) => {
      try {
        console.log('Main process: Writing file', { filePath, contentLength: content.length, cwd: process.cwd() });
        
        // Convert relative paths to absolute paths
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        console.log('Absolute path:', absolutePath);
        
        await fs.promises.writeFile(absolutePath, content, 'utf-8');
        console.log('File written successfully:', absolutePath);
        return { success: true };
      } catch (error) {
        console.error('File write error:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('file:exists', async (_, filePath: string) => {
      try {
        await fs.promises.access(filePath);
        return true;
      } catch {
        return false;
      }
    });

    ipcMain.handle('directory:read', async (_, dirPath: string) => {
      try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const files = entries.map(entry => ({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          path: path.join(dirPath, entry.name)
        }));
        return { success: true, files };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Hardening: restrict navigation to HTTP/S URLs only
    this.mainWindow?.webContents.on('will-navigate', (event, url) => {
      const { protocol } = new URL(url);
      if (protocol !== 'http:' && protocol !== 'https:') {
        event.preventDefault();
      }
    });
    this.mainWindow?.webContents.on('will-redirect', (event, url) => {
      const { protocol } = new URL(url);
      if (protocol !== 'http:' && protocol !== 'https:') {
        event.preventDefault();
      }
    });

    // Dialog operations
    ipcMain.handle('dialog:openFile', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Web Files', extensions: ['html', 'css', 'js', 'ts', 'jsx', 'tsx'] },
          { name: 'Text Files', extensions: ['txt', 'md', 'json', 'xml', 'yaml'] }
        ]
      });
      return result;
    });

    ipcMain.handle('dialog:openDirectory', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory']
      });
      return result;
    });

    ipcMain.handle('dialog:saveFile', async (_, defaultPath?: string) => {
      const result = await dialog.showSaveDialog(this.mainWindow!, {
        defaultPath,
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Web Files', extensions: ['html', 'css', 'js', 'ts', 'jsx', 'tsx'] }
        ]
      });
      return result;
    });

    // Terminal operations - Legacy one-off command execution (keep for backward compatibility)
    ipcMain.handle('terminal:execute', async (_, command: string, cwd?: string) => {
      return new Promise((resolve) => {
        const workingDir = cwd || process.cwd();
        console.log('Main process: Executing command', { command, cwd: workingDir });
        
        const { spawn } = require('child_process');
        const childProcess = spawn('bash', ['-c', command], {
          cwd: workingDir,
          shell: true
        });

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        childProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        childProcess.on('close', (code: number) => {
          console.log('Command completed', { command, code, stdout, stderr });
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code
          });
        });
      });
    });

    // Real Terminal operations - Connect to actual system shell
    ipcMain.handle('terminal:create', async (event, options: { id: string; cwd?: string; cols?: number; rows?: number }) => {
      try {
        const { id, cwd = process.cwd(), cols = 80, rows = 30 } = options;
        console.log('Creating real terminal session:', { id, cwd, cols, rows });

        // Determine the user's shell
        const userShell = process.env.SHELL || '/bin/bash';
        console.log('Using shell:', userShell);
        
        // Try to use node-pty if available, otherwise use enhanced fallback
        if (pty) {
          try {
            const ptyProcess = pty.spawn(userShell, [], {
              name: 'xterm-256color',
              cols,
              rows,
              cwd,
              env: {
                ...process.env,
                TERM: 'xterm-256color',
                COLORTERM: 'truecolor',
                FORCE_COLOR: '1'
              }
            });

            this.terminals.set(id, ptyProcess);

            // Handle data from PTY (terminal output)
            ptyProcess.onData((data: string) => {
              event.sender.send('terminal:data', { id, data });
            });

            // Handle PTY exit
            ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
              console.log(`Terminal ${id} exited with code ${exitCode}`);
              this.terminals.delete(id);
              event.sender.send('terminal:exit', { id, exitCode });
            });

            console.log(`Real PTY terminal ${id} created successfully`);
            return { success: true, id, mode: 'pty', shell: userShell };
          } catch (ptyError) {
            console.warn('PTY creation failed, using enhanced fallback:', ptyError);
          }
        }
        
        // Enhanced Fallback: Create a persistent shell session with proper TTY emulation
        const { spawn } = require('child_process');
        
        // Use unbuffer (from expect package) or script command to create a PTY-like environment
        let shellCommand = userShell;
        let shellArgs = ['-i'];
        
        if (process.platform !== 'win32') {
          // First try unbuffer (from expect package) which provides better PTY emulation
          try {
            // Test if unbuffer is available
            require('child_process').execSync('which unbuffer', { stdio: 'ignore' });
            shellCommand = 'unbuffer';
            shellArgs = [userShell, '-i'];
            console.log('Using unbuffer for PTY emulation');
          } catch {
            // Fallback to script command
            shellCommand = 'script';
            shellArgs = ['-q', '/dev/null', userShell, '-i'];
            console.log('Using script command for PTY emulation');
          }
        }
        
        const shellProcess = spawn(shellCommand, shellArgs, {
          cwd,
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
            FORCE_COLOR: '1',
            // Set environment variables that help with interactive tools
            COLUMNS: cols.toString(),
            LINES: rows.toString()
          },
          stdio: ['pipe', 'pipe', 'pipe'],
          // Enable pseudo-terminal features
          detached: false
        });

        this.terminals.set(id, shellProcess);

        // Handle stdout
        shellProcess.stdout.on('data', (data: Buffer) => {
          event.sender.send('terminal:data', { id, data: data.toString() });
        });

        // Handle stderr
        shellProcess.stderr.on('data', (data: Buffer) => {
          event.sender.send('terminal:data', { id, data: data.toString() });
        });

        // Handle process exit
        shellProcess.on('close', (code: number) => {
          console.log(`Terminal ${id} shell exited with code ${code}`);
          this.terminals.delete(id);
          event.sender.send('terminal:exit', { id, exitCode: code });
        });

        console.log(`Enhanced shell terminal ${id} created successfully with ${shellCommand}`);
        return { success: true, id, mode: 'enhanced-shell', shell: userShell };
      } catch (error) {
        console.error('Failed to create terminal:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('terminal:write', async (_, id: string, data: string) => {
      try {
        const terminal = this.terminals.get(id);
        if (!terminal) {
          return { success: false, error: `Terminal ${id} not found` };
        }

        // Check if it's a PTY terminal
        if (terminal.write) {
          // PTY terminal
          terminal.write(data);
        } else if (terminal.stdin) {
          // Regular spawn terminal
          terminal.stdin.write(data);
        } else {
          return { success: false, error: 'Terminal not writable' };
        }

        return { success: true };
      } catch (error) {
        console.error('Failed to write to terminal:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('terminal:resize', async (_, id: string, cols: number, rows: number) => {
      try {
        const terminal = this.terminals.get(id);
        if (!terminal) {
          return { success: false, error: `Terminal ${id} not found` };
        }

        // Check if it's a PTY terminal with resize capability
        if (terminal.resize) {
          terminal.resize(cols, rows);
          console.log(`Terminal ${id} resized to ${cols}x${rows}`);
        }
        // For regular spawn terminals, resizing isn't directly supported

        return { success: true };
      } catch (error) {
        console.error('Failed to resize terminal:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('terminal:kill', async (_, id: string) => {
      try {
        if (!pty) {
          return { success: false, error: 'PTY not available' };
        }
        
        const terminal = this.terminals.get(id);
        if (!terminal) {
          return { success: false, error: `Terminal ${id} not found` };
        }
        
        terminal.kill();
        this.terminals.delete(id);
        console.log(`Terminal ${id} killed`);
        return { success: true };
      } catch (error) {
        console.error(`Failed to kill terminal ${id}:`, error);
        return { success: false, error: (error as Error).message };
      }
    });

    // AI service communication - Streaming
    ipcMain.handle('ai:chat', async (event, messages: any[]) => {
      try {
        // Add system message to clarify AI's role
        const systemMessage = {
          role: 'system',
          content: 'You are GalactusAI, an AI assistant integrated into the GalactusIDE development environment. You have access to the user\'s editor content, browser content, and terminal output which are provided as context in user messages. Always provide helpful, specific responses based on the context provided. You can see and analyze code, terminal output, and web content that the user is working with.'
        };
        
        const allMessages = [systemMessage, ...messages.map((m: any) => ({ role: m.role, content: m.content }))];
        
        const stream = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: allMessages,
          stream: true,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            // Send incremental update to renderer
            event.sender.send('ai:stream', { content, isComplete: false });
          }
        }

        // Send completion signal
        event.sender.send('ai:stream', { content: '', isComplete: true });
        return { success: true, response: fullResponse };
      } catch (error: any) {
        console.error('AI chat error:', error);
        event.sender.send('ai:stream', { error: error.message, isComplete: true });
        return { success: false, error: error.message || 'AI service error' };
      }
    });

    // Deployment operations
    ipcMain.handle('deploy:vercel', async (_, config: any) => {
      // This will be implemented in Phase 4
      return { success: true, message: 'Deployment service not yet implemented' };
    });

    // Window operations
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close();
    });

    // Browser navigation
    ipcMain.handle('browser:navigate', async (_, url: string) => {
      try {
        // Send navigation event to browser panel
        this.mainWindow?.webContents.send('browser:navigate', url);
        return { success: true };
      } catch (error) {
        console.error('Browser navigation error:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    // Forward editor events back to renderer for direct code manipulation
    ipcMain.on('editor:insert-code', (event, code: string) => {
      event.sender.send('editor:insert-code', code);
    });

    ipcMain.on('editor:replace-selection', (event, code: string) => {
      event.sender.send('editor:replace-selection', code);
    });

    ipcMain.on('editor:select-all', (event) => {
      event.sender.send('editor:select-all');
    });

    ipcMain.on('editor:format-code', (event) => {
      event.sender.send('editor:format-code');
    });
  }
}

// Initialize the application
new GalactusIDE();