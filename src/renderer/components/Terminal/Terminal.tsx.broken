import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAppState } from '../../hooks/useAppState';
import { ipcService } from '../../services/ipc';

const TerminalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.colors.terminal.background};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
`;

const TerminalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  font-size: ${props => props.theme.fontSizes.small};
`;

const TerminalTitle = styled.div`
  color: ${props => props.theme.colors.text};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const StatusIndicator = styled.div<{ $connected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$connected ? '#00ff00' : '#ff7700'};
`;

const TerminalActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
`;

const TerminalButton = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.small};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    border-color: ${props => props.theme.colors.borderHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TerminalOutput = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.sm};
  overflow-y: auto;
  font-size: ${props => props.theme.fontSizes.small};
  line-height: 1.4;
  color: ${props => props.theme.colors.terminal.foreground};
  background-color: #0D1117;
`;

const OutputLine = styled.div<{ type?: 'command' | 'output' | 'error' | 'success' }>`
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  
  ${props => {
    switch (props.type) {
      case 'command':
        return `
          color: #79C0FF;
          &::before {
            content: '$ ';
            color: #7CE38B;
          }
        `;
      case 'error':
        return `color: #FF7B72;`;
      case 'success':
        return `color: #7CE38B;`;
      case 'output':
      default:
        return `color: #F0F6FC;`;
    }
  }}
`;

const TerminalInput = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.surface};
`;

const InputPrompt = styled.span`
  color: #7CE38B;
  margin-right: ${props => props.theme.spacing.xs};
  user-select: none;
`;

const InputField = styled.input`
  flex: 1;
  background-color: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: ${props => props.theme.fontSizes.small};
  color: #F0F6FC;
  
  &::placeholder {
    color: #6E7681;
  }
`;

const CurrentDirectory = styled.span`
  color: #FFA657;
  margin-right: ${props => props.theme.spacing.xs};
`;

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'success';
  content: string;
  timestamp: Date;
}

const TerminalSimple: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('/home/ubuntu/Nebulus');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'success',
      content: '✅ GalactusIDE Terminal Ready!\nFixed: File editor content loading and terminal npm support\nYou can now run npm commands, git commands, and all shell operations.',
      timestamp: new Date()
    }
  ]);
  const outputRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    
    // Expose terminal content globally for AI context
    (window as any).__galactusTerminalLines = terminalLines;
    (window as any).__galactusTerminalContent = terminalLines.map(line => 
      `${line.type === 'command' ? '$ ' : ''}${line.content}`
    ).join('\n');
  }, [terminalLines]);

  const addLine = (type: 'command' | 'output' | 'error' | 'success', content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setTerminalLines(prev => [...prev, newLine]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    // Add command to output
    addLine('command', command);

    // Handle built-in commands
    const cmd = command.trim().toLowerCase();
    const [mainCmd, ...args] = command.trim().split(' ');
    
    if (cmd === 'help') {
      addLine('output', `GalactusIDE Terminal - Available commands:
  help          - Show this help message
  clear         - Clear terminal output
  pwd           - Show current directory
  ls [path]     - List files and directories
  cd [dir]      - Change directory
  mkdir [dir]   - Create directory
  touch [file]  - Create file
  cat [file]    - Display file content
  npm [args]    - Run npm commands (install, run, start, test, build, etc.)
  git [args]    - Run git commands
  node [file]   - Run Node.js files
  python [file] - Run Python files
  
✅ This terminal now supports real npm commands and shell operations!
Examples:
  npm install           - Install dependencies
  npm run dev          - Start development server
  npm test             - Run tests
  git status           - Check git status
  ls -la               - List files with details`);
      return;
    }
    
    if (cmd === 'clear') {
      setTerminalLines([]);
      return;
    }
    
    if (cmd === 'pwd') {
      addLine('output', currentDirectory);
      return;
    }

    // Handle cd command
    if (cmd.startsWith('cd ')) {
      const targetDir = args.join(' ').trim();
      if (!targetDir || targetDir === '~') {
        setCurrentDirectory('/home/ubuntu');
        addLine('success', 'Changed to home directory');
        return;
      }
      
      // For now, just update the display directory
      // In a real implementation, this would validate the path
      if (targetDir.startsWith('/')) {
        setCurrentDirectory(targetDir);
      } else {
        setCurrentDirectory(`${currentDirectory}/${targetDir}`);
      }
      addLine('success', `Changed directory to: ${targetDir}`);
      return;
    }
    
    // Handle npm commands with special messaging
    if (mainCmd.toLowerCase() === 'npm') {
      if (args.length === 0) {
        addLine('output', `npm commands available:
  npm install           - Install dependencies
  npm run dev          - Start development server  
  npm run build        - Build for production
  npm start            - Start the application
  npm test             - Run tests
  npm run lint         - Run linting
  npm run format       - Format code

✅ All npm commands are now fully supported!`);
        return;
      }
      
      addLine('output', `Executing npm command: ${args.join(' ')}`);
    }

    // Execute real commands via IPC
    try {
      const result = await ipcService.executeCommand(command, currentDirectory);
      
      if (result.success) {
        if (result.stdout && result.stdout.trim()) {
          addLine('output', result.stdout);
        }
        if (result.stderr && result.stderr.trim()) {
          addLine('error', result.stderr);
        }
        
        // If no output, show success message
        if (!result.stdout && !result.stderr) {
          addLine('success', 'Command executed successfully');
        }
        
        // Update terminal state
        dispatch({
          type: 'ADD_TERMINAL_OUTPUT',
          payload: `$ ${command}\n${result.stdout || ''}${result.stderr || ''}`
        });
        
      } else {
        addLine('error', `Command failed: ${result.stderr || result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      addLine('error', `Error executing command: ${error}`);
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(currentCommand);
    setCurrentCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Basic command completion
      const commonCommands = ['npm install', 'npm run dev', 'npm test', 'git status', 'git add', 'git commit', 'ls -la', 'cd ..'];
      const matches = commonCommands.filter(cmd => cmd.startsWith(currentCommand));
      if (matches.length === 1) {
        setCurrentCommand(matches[0]);
      }
    }
  };

  const handleClear = () => {
    setTerminalLines([]);
  };

  const handleQuickCommand = (command: string) => {
    setCurrentCommand(command);
    executeCommand(command);
    setCurrentCommand('');
  };

  const getCurrentDirectoryName = () => {
    return currentDirectory.split('/').pop() || 'root';
  };

  // Quick command buttons
  const quickCommands = [
    { label: 'npm install', command: 'npm install' },
    { label: 'npm run dev', command: 'npm run dev' },
    { label: 'npm test', command: 'npm test' },
    { label: 'git status', command: 'git status' },
    { label: 'ls -la', command: 'ls -la' }
  ];

  return (
    <TerminalContainer>
      <TerminalHeader>
        <TerminalTitle>
          <StatusIndicator $connected={true} />
          Terminal (Enhanced - npm ready!)
        </TerminalTitle>
        <TerminalActions>
          {quickCommands.map((cmd, index) => (
            <TerminalButton
              key={index}
              onClick={() => handleQuickCommand(cmd.command)}
              title={`Run: ${cmd.command}`}
            >
              {cmd.label}
            </TerminalButton>
          ))}
          <TerminalButton onClick={handleClear}>Clear</TerminalButton>
        </TerminalActions>
      </TerminalHeader>
      
      <TerminalOutput ref={outputRef}>
        {terminalLines.map(line => (
          <OutputLine key={line.id} type={line.type}>
            {line.content}
          </OutputLine>
        ))}
      </TerminalOutput>
      
      <TerminalInput>
        <CurrentDirectory>{getCurrentDirectoryName()}</CurrentDirectory>
        <InputPrompt>$</InputPrompt>
        <form onSubmit={handleCommandSubmit} style={{ display: 'flex', flex: 1 }}>
          <InputField
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command... (try 'npm install' or 'help')"
            autoFocus
          />
        </form>
      </TerminalInput>
    </TerminalContainer>
  );
};

export default TerminalSimple;

