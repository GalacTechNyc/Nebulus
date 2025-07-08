import React, { useState, useRef, useEffect } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
}

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
  exitCode: number;
}

const Terminal: React.FC<TerminalProps> = ({ className = '' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('~/Nebulus');
  const [isExecuting, setIsExecuting] = useState(false);

  // Common commands for tab completion
  const commonCommands = [
    'npm install', 'npm run dev', 'npm run build', 'npm test', 'npm start',
    'git status', 'git add', 'git commit', 'git push', 'git pull',
    'ls', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'echo',
    'code .', 'clear', 'exit'
  ];

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new XTerm({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#ffffff30',
        black: '#000000',
        red: '#ff6b6b',
        green: '#51cf66',
        yellow: '#ffd43b',
        blue: '#74c0fc',
        magenta: '#f06292',
        cyan: '#4dd0e1',
        white: '#ffffff',
        brightBlack: '#495057',
        brightRed: '#ff8a80',
        brightGreen: '#69f0ae',
        brightYellow: '#ffff8d',
        brightBlue: '#82b1ff',
        brightMagenta: '#ff80ab',
        brightCyan: '#84ffff',
        brightWhite: '#ffffff'
      },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4
    });

    // Create addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    // Load addons
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Welcome message
    terminal.writeln('\\x1b[32m✓ Terminal Ready (No PTY Issues!)\\x1b[0m');
    terminal.writeln('\\x1b[36mGalactusIDE Terminal - Enhanced Command Execution\\x1b[0m');
    terminal.writeln('\\x1b[90mTip: Use Tab for command completion, ↑↓ for history\\x1b[0m');
    terminal.writeln('');
    writePrompt(terminal);

    setIsConnected(true);

    // Handle terminal input
    terminal.onData((data) => {
      handleTerminalInput(data, terminal);
    });

    // Handle resize
    const handleResize = () => {
      if (fitAddon) {
        fitAddon.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  const writePrompt = (terminal: XTerm) => {
    const prompt = `\\x1b[32m➜\\x1b[0m \\x1b[36m${currentDirectory}\\x1b[0m \\x1b[90m$\\x1b[0m `;
    terminal.write(prompt);
  };

  const handleTerminalInput = (data: string, terminal: XTerm) => {
    const code = data.charCodeAt(0);

    if (isExecuting) {
      return; // Ignore input while executing
    }

    switch (code) {
      case 13: // Enter
        if (currentCommand.trim()) {
          executeCommand(currentCommand.trim(), terminal);
        } else {
          terminal.writeln('');
          writePrompt(terminal);
        }
        break;

      case 127: // Backspace
        if (currentCommand.length > 0) {
          setCurrentCommand(prev => prev.slice(0, -1));
          terminal.write('\\b \\b');
        }
        break;

      case 9: // Tab
        handleTabCompletion(terminal);
        break;

      case 27: // Escape sequences (arrow keys)
        // Handle arrow keys for command history
        break;

      default:
        if (code >= 32 && code <= 126) { // Printable characters
          setCurrentCommand(prev => prev + data);
          terminal.write(data);
        }
        break;
    }
  };

  const handleTabCompletion = (terminal: XTerm) => {
    const matches = commonCommands.filter(cmd => 
      cmd.toLowerCase().startsWith(currentCommand.toLowerCase())
    );

    if (matches.length === 1) {
      const completion = matches[0].substring(currentCommand.length);
      setCurrentCommand(matches[0]);
      terminal.write(completion);
    } else if (matches.length > 1) {
      terminal.writeln('');
      terminal.writeln(matches.join('  '));
      writePrompt(terminal);
      terminal.write(currentCommand);
    }
  };

  const executeCommand = async (command: string, terminal: XTerm) => {
    setIsExecuting(true);
    terminal.writeln('');

    try {
      // Handle built-in commands
      if (command === 'clear') {
        terminal.clear();
        writePrompt(terminal);
        setCurrentCommand('');
        setIsExecuting(false);
        return;
      }

      if (command === 'exit') {
        terminal.writeln('\\x1b[33mTerminal session ended\\x1b[0m');
        setIsExecuting(false);
        return;
      }

      if (command.startsWith('cd ')) {
        const newDir = command.substring(3).trim();
        setCurrentDirectory(newDir || '~');
        terminal.writeln(`\\x1b[90mChanged directory to: ${newDir || '~'}\\x1b[0m`);
        writePrompt(terminal);
        setCurrentCommand('');
        setIsExecuting(false);
        return;
      }

      // Show execution indicator
      terminal.writeln(`\\x1b[90m[Executing: ${command}]\\x1b[0m`);

      // Execute command via IPC
      const result = await window.electronAPI?.executeCommand(command, currentDirectory);
      
      if (result) {
        if (result.success) {
          if (result.output) {
            // Split output into lines and write each line
            const lines = result.output.split('\\n');
            lines.forEach(line => {
              if (line.trim()) {
                terminal.writeln(line);
              }
            });
          }
          if (result.exitCode !== 0) {
            terminal.writeln(`\\x1b[33mProcess exited with code: ${result.exitCode}\\x1b[0m`);
          }
        } else {
          terminal.writeln(`\\x1b[31mError: ${result.error || 'Command execution failed'}\\x1b[0m`);
        }
      } else {
        terminal.writeln('\\x1b[31mError: Failed to execute command (IPC not available)\\x1b[0m');
      }

      // Add to history
      const historyEntry: CommandHistory = {
        command,
        output: result?.output || '',
        timestamp: new Date(),
        exitCode: result?.exitCode || -1
      };
      setCommandHistory(prev => [...prev, historyEntry]);

    } catch (error) {
      terminal.writeln(`\\x1b[31mError: ${error instanceof Error ? error.message : 'Unknown error'}\\x1b[0m`);
    }

    terminal.writeln('');
    writePrompt(terminal);
    setCurrentCommand('');
    setIsExecuting(false);
  };

  const handleQuickCommand = (command: string) => {
    if (!xtermRef.current || isExecuting) return;
    
    setCurrentCommand(command);
    xtermRef.current.write(command);
    executeCommand(command, xtermRef.current);
  };

  return (
    <div className={`terminal-container ${className}`}>
      <div className="terminal-header">
        <div className="terminal-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '✓ Terminal Ready' : '⚠ Disconnected'}
          </span>
          {isExecuting && <span className="executing-indicator">⚡ Executing...</span>}
        </div>
        <div className="quick-commands">
          <button 
            onClick={() => handleQuickCommand('npm --version')}
            disabled={isExecuting}
            className="quick-cmd-btn"
          >
            npm --version
          </button>
          <button 
            onClick={() => handleQuickCommand('git status')}
            disabled={isExecuting}
            className="quick-cmd-btn"
          >
            git status
          </button>
          <button 
            onClick={() => handleQuickCommand('ls -la')}
            disabled={isExecuting}
            className="quick-cmd-btn"
          >
            ls -la
          </button>
          <button 
            onClick={() => handleQuickCommand('clear')}
            disabled={isExecuting}
            className="quick-cmd-btn"
          >
            clear
          </button>
        </div>
      </div>
      <div 
        ref={terminalRef} 
        className="terminal-content"
        style={{ 
          height: 'calc(100% - 60px)',
          width: '100%'
        }}
      />
      
    </div>
  );
};

export default Terminal;
