import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface XTermTerminalProps {
  id: string;
  cwd?: string;
  onReady?: (terminal: Terminal) => void;
  className?: string;
}

const XTermTerminal: React.FC<XTermTerminalProps> = ({
  id,
  cwd,
  onReady,
  className
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDir, setCurrentDir] = useState(cwd || '/Users/stephonbridges/Nebulus');

  // Store terminal history for AI context
  const [terminalHistory, setTerminalHistory] = useState<string>('');

  // Function to update global terminal content for AI access
  const updateGlobalTerminalContent = (terminalId: string, content: string) => {
    // Initialize global terminal content object if it doesn't exist
    if (!(window as any).__galactusTerminalContent) {
      (window as any).__galactusTerminalContent = {};
    }
    
    // Store content for this specific terminal
    (window as any).__galactusTerminalContent[terminalId] = content;
    
    // Create a combined history from all terminals for easier AI access
    const allTerminals = (window as any).__galactusTerminalContent;
    const combinedHistory = Object.keys(allTerminals)
      .map(id => `\n=== Terminal ${id} ===\n${allTerminals[id]}`)
      .join('\n');
    
    // Store combined history
    (window as any).__galactusTerminalHistory = combinedHistory;
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      theme: {
        background: '#0D1117',
        foreground: '#F0F6FC',
        cursor: '#F0F6FC',
        cursorAccent: '#0D1117',
        selectionBackground: 'rgba(88, 166, 255, 0.3)',
        black: '#0D1117',
        red: '#F85149',
        green: '#56D364',
        yellow: '#E3B341',
        blue: '#58A6FF',
        magenta: '#BC8CFF',
        cyan: '#39D0D8',
        white: '#F0F6FC',
        brightBlack: '#6E7681',
        brightRed: '#FF7B72',
        brightGreen: '#7EE787',
        brightYellow: '#F2CC60',
        brightBlue: '#79C0FF',
        brightMagenta: '#D2A8FF',
        brightCyan: '#56D4DD',
        brightWhite: '#F0F6FC'
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4,
      rightClickSelectsWord: true,
      macOptionIsMeta: true,
      convertEol: true,
      disableStdin: false
    });

    // Add addons
    const fit = new FitAddon();
    const webLinks = new WebLinksAddon();
    
    term.loadAddon(fit);
    term.loadAddon(webLinks);

    // Open terminal in DOM
    term.open(terminalRef.current);
    
    // Fit terminal to container
    fit.fit();

    setTerminal(term);
    setFitAddon(fit);

    // Create terminal session in main process
    const createTerminalSession = async () => {
      try {
        if (window.electronAPI?.createTerminal) {
          const result = await window.electronAPI.createTerminal({
            id,
            cwd,
            cols: term.cols,
            rows: term.rows
          });

          if (result.success) {
            setIsConnected(true);
            term.writeln('\x1b[1;32m✓ Terminal connected\x1b[0m');
            
            // Set up data handler for terminal output
            if (window.electronAPI.onTerminalData) {
              window.electronAPI.onTerminalData((data) => {
                if (data.id === id) {
                  term.write(data.data);
                  // Update terminal history for AI context
                  const newHistory = terminalHistory + data.data;
                  setTerminalHistory(newHistory);
                  updateGlobalTerminalContent(id, newHistory);
                }
              });
            }

            // Set up exit handler
            if (window.electronAPI.onTerminalExit) {
              window.electronAPI.onTerminalExit((data) => {
                if (data.id === id) {
                  term.writeln(`\x1b[1;31mTerminal exited with code ${data.exitCode}\x1b[0m`);
                  setIsConnected(false);
                }
              });
            }
          } else {
            term.writeln(`\x1b[1;31m✗ Failed to create terminal: ${result.error}\x1b[0m`);
          }
        } else {
          // Fallback mode - functional terminal using the legacy execute method
          const welcomeMessage = '\x1b[1;32m✓ GalactusIDE Terminal - Enhanced Mode\x1b[0m\n' +
                                  'Real command execution enabled. Type "help" for available commands.\n\n';
          term.writeln('\x1b[1;32m✓ GalactusIDE Terminal - Enhanced Mode\x1b[0m');
          term.writeln('Real command execution enabled. Type "help" for available commands.');
          term.writeln('');
          const dirName = currentDir.split('/').pop() || currentDir;
          const prompt = `\x1b[1;34m${dirName}\x1b[0m $ `;
          term.write(prompt);
          
          // Initialize terminal history for AI context
          const initialContent = welcomeMessage + prompt;
          setTerminalHistory(initialContent);
          updateGlobalTerminalContent(id, initialContent);
        }
      } catch (error) {
        term.writeln(`\x1b[1;31m✗ Terminal error: ${error}\x1b[0m`);
      }
    };

    createTerminalSession();

    // Handle user input
    let currentLine = '';
    term.onData((data: string) => {
      if (isConnected && window.electronAPI?.writeToTerminal) {
        // Send input directly to PTY
        window.electronAPI.writeToTerminal(id, data);
      } else {
        // Fallback mode - handle input locally with real command execution
        if (data === '\r') {
          // Enter key
          term.writeln('');
          if (currentLine.trim()) {
            const commandToExecute = currentLine.trim();
            currentLine = '';
            executeRealCommand(commandToExecute, term).then(() => {
              const dirName = currentDir.split('/').pop() || currentDir;
              const prompt = `\x1b[1;34m${dirName}\x1b[0m $ `;
              term.write(prompt);
              
              // Update terminal history with the command and prompt
              const commandEntry = `${commandToExecute}\n`;
              const newHistory = terminalHistory + commandEntry + prompt;
              setTerminalHistory(newHistory);
              updateGlobalTerminalContent(id, newHistory);
            });
          } else {
            currentLine = '';
            const dirName = currentDir.split('/').pop() || currentDir;
            term.write(`\x1b[1;34m${dirName}\x1b[0m $ `);
          }
        } else if (data === '\u007F') {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else if (data >= ' ') {
          // Printable characters
          currentLine += data;
          term.write(data);
        }
      }
    });

    // Handle resize
    const handleResize = () => {
      fit.fit();
      if (isConnected && window.electronAPI?.resizeTerminal) {
        window.electronAPI.resizeTerminal(id, term.cols, term.rows);
      }
    };

    // Set up resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Call onReady callback
    onReady?.(term);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (window.electronAPI?.killTerminal && isConnected) {
        window.electronAPI.killTerminal(id);
      }
      term.dispose();
    };
  }, [id, cwd]);

  // Execute real commands using the legacy terminal execute method
  const executeRealCommand = async (command: string, term: Terminal) => {
    let commandOutput = '';
    
    try {
      // Handle only essential built-in commands - let everything else run normally
      const cmd = command.trim().toLowerCase();
      if (cmd === 'clear') {
        term.clear();
        setTerminalHistory('');
        updateGlobalTerminalContent(id, '');
        return;
      }
      
      if (command.trim().startsWith('cd ')) {
        // Handle cd command specially to maintain directory state
        const targetDir = command.trim().substring(3).trim();
        if (!targetDir || targetDir === '~') {
          setCurrentDir('/Users/stephonbridges');
          term.writeln('');
          return;
        }
        
        try {
          let newDir = targetDir;
          if (!targetDir.startsWith('/')) {
            if (targetDir === '..') {
              const pathParts = currentDir.split('/');
              pathParts.pop();
              newDir = pathParts.join('/') || '/';
            } else {
              newDir = currentDir + '/' + targetDir;
            }
          }
          
          const result = await window.electronAPI?.invoke('terminal:execute', `ls "${newDir}"`, currentDir);
          if (result && result.success) {
            setCurrentDir(newDir);
            term.writeln('');
          } else {
            term.writeln(`\x1b[1;31mcd: ${targetDir}: No such file or directory\x1b[0m`);
          }
          return;
        } catch (error) {
          term.writeln(`\x1b[1;31mcd: ${targetDir}: No such file or directory\x1b[0m`);
          return;
        }
      }
      
      // Handle all other commands via IPC
      if (window.electronAPI?.invoke) {
        const result = await window.electronAPI.invoke('terminal:execute', command, currentDir);
        
        if (result.stdout) {
          term.write(result.stdout);
          commandOutput += result.stdout;
        }
        
        if (result.stderr) {
          term.writeln(`\x1b[1;31m${result.stderr}\x1b[0m`);
          commandOutput += result.stderr;
        }
        
        if (!result.success && !result.stdout && !result.stderr) {
          term.writeln(`\x1b[1;31mCommand exited with code ${result.exitCode || 'unknown'}\x1b[0m`);
        }
        
        if ((result.stdout || result.stderr) && !(result.stdout?.endsWith('\n') || result.stderr?.endsWith('\n'))) {
          term.writeln('');
        }
      } else {
        handleFallbackCommand(command, term);
      }
    } catch (error) {
      term.writeln(`\x1b[1;31mError executing command: ${error}\x1b[0m`);
      commandOutput += `Error: ${error}\n`;
    }
    
    // Update terminal history
    if (commandOutput) {
      const newHistory = terminalHistory + commandOutput;
      setTerminalHistory(newHistory);
      updateGlobalTerminalContent(id, newHistory);
    }
  };

  // Handle fallback commands for demo mode
  const handleFallbackCommand = (command: string, term: Terminal) => {
    switch (command) {
      case 'clear':
        term.clear();
        break;
      case 'ls':
        term.writeln('src/     package.json     README.md     tsconfig.json');
        break;
      case 'pwd':
        term.writeln('/Users/stephonbridges/Nebulus');
        break;
      case 'whoami':
        term.writeln('stephonbridges');
        break;
      case 'date':
        term.writeln(new Date().toString());
        break;
      case 'help':
        term.writeln('Available commands: ls, pwd, whoami, date, clear, help');
        term.writeln('Note: Running in fallback mode. Install node-pty for full terminal support.');
        break;
      default:
        if (command.startsWith('echo ')) {
          term.writeln(command.slice(5));
        } else {
          term.writeln(`bash: ${command}: command not found`);
        }
        break;
    }
  };

  // Resize terminal when container size changes
  useEffect(() => {
    if (fitAddon) {
      const handleWindowResize = () => {
        setTimeout(() => fitAddon.fit(), 100);
      };
      
      window.addEventListener('resize', handleWindowResize);
      return () => window.removeEventListener('resize', handleWindowResize);
    }
  }, [fitAddon]);

  return (
    <div 
      className={className}
      style={{ 
        width: '100%', 
        height: '100%',
        padding: '8px',
        backgroundColor: '#0D1117'
      }}
    >
      <div 
        ref={terminalRef} 
        style={{ 
          width: '100%', 
          height: '100%'
        }} 
      />
    </div>
  );
};

export default XTermTerminal;