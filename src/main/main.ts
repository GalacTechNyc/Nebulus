import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { URL } from 'url';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
});

// Enable live reload for development
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Main process NODE_ENV:', process.env.NODE_ENV);
console.log('isDevelopment:', isDevelopment);

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
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return { success: true };
      } catch (error) {
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

    // Terminal operations
    ipcMain.handle('terminal:execute', async (_, command: string, cwd?: string) => {
      return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const childProcess = spawn('bash', ['-c', command], {
          cwd: cwd || process.cwd(),
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
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code
          });
        });
      });
    });

    // AI service communication - Streaming
    ipcMain.handle('ai:chat', async (event, messages: any[]) => {
      try {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
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

    // Forward editor insertion events back to renderer for direct code insertion
    ipcMain.on('editor:insert-code', (event, code: string) => {
      event.sender.send('editor:insert-code', code);
    });
  }
}

// Initialize the application
new GalactusIDE();