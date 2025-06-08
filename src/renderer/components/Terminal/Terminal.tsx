import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAppState, useTerminalHistory } from '../../hooks/useAppState';

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
`;

const TerminalOutput = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.sm};
  overflow-y: auto;
  font-size: ${props => props.theme.fontSizes.small};
  line-height: 1.4;
  color: ${props => props.theme.colors.terminal.foreground};
`;

const OutputLine = styled.div<{ type?: 'command' | 'output' | 'error' }>`
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  
  ${props => {
    switch (props.type) {
      case 'command':
        return `
          color: ${props.theme.colors.primary};
          &::before {
            content: '$ ';
            color: ${props.theme.colors.success};
          }
        `;
      case 'error':
        return `color: ${props.theme.colors.error};`;
      case 'output':
      default:
        return `color: ${props.theme.colors.terminal.foreground};`;
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
  color: ${props => props.theme.colors.success};
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
  color: ${props => props.theme.colors.terminal.foreground};
  
  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
`;

const CurrentDirectory = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  margin-right: ${props => props.theme.spacing.xs};
`;

const EmptyState = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  gap: ${props => props.theme.spacing.md};
`;

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

const Terminal: React.FC = () => {
  const { state, dispatch } = useAppState();
  const terminalHistory = useTerminalHistory();
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'output',
      content: 'Welcome to GalactusIDE Terminal\nType "help" for available commands.',
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
  }, [terminalLines]);

  const addLine = (type: 'command' | 'output' | 'error', content: string) => {
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
    
    if (cmd === 'help') {
      addLine('output', `Available commands:
  help          - Show this help message
  clear         - Clear terminal output
  pwd           - Show current directory
  ls            - List files and directories
  cd [dir]      - Change directory
  mkdir [dir]   - Create directory
  touch [file]  - Create file
  cat [file]    - Display file content
  npm [args]    - Run npm commands
  git [args]    - Run git commands
  
GalactusIDE Commands:
  deploy        - Open deployment panel
  ai [prompt]   - Ask AI assistant
  new [type]    - Create new file/component`);
      return;
    }
    
    if (cmd === 'clear') {
      setTerminalLines([]);
      return;
    }
    
    if (cmd === 'pwd') {
      addLine('output', state.terminal.currentDirectory);
      return;
    }
    
    if (cmd.startsWith('ai ')) {
      const prompt = command.substring(3);
      addLine('output', `Asking AI: "${prompt}"`);
      // In real implementation, this would trigger AI chat
      setTimeout(() => {
        addLine('output', 'AI response would appear here. Use the AI panel for full chat experience.');
      }, 500);
      return;
    }
    
    if (cmd === 'deploy') {
      addLine('output', 'Opening deployment panel...');
      // In real implementation, this would show deploy panel
      return;
    }
    
    if (cmd.startsWith('new ')) {
      const type = command.substring(4);
      addLine('output', `Creating new ${type}...`);
      // In real implementation, this would create files
      return;
    }

    // Simulate executing real commands (in real app, this would use IPC to main process)
    try {
      addLine('output', `Executing: ${command}`);
      
      // Mock command execution
      setTimeout(() => {
        if (cmd.startsWith('ls')) {
          addLine('output', `src/
public/
package.json
tsconfig.json
README.md`);
        } else if (cmd.startsWith('npm')) {
          addLine('output', 'npm command executed successfully');
        } else if (cmd.startsWith('git')) {
          addLine('output', 'git command executed successfully');
        } else {
          addLine('error', `Command not found: ${command}`);
        }
      }, 500);
      
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
      // In real implementation, this would provide command completion
    }
  };

  const handleClear = () => {
    setTerminalLines([]);
  };

  const handleNewTerminal = () => {
    // In real implementation, this would open a new terminal tab
    addLine('output', 'New terminal session started');
  };

  const getCurrentDirectoryName = () => {
    return state.terminal.currentDirectory.split('/').pop() || 'root';
  };

  return (
    <TerminalContainer>
      <TerminalHeader>
        <TerminalTitle>Terminal</TerminalTitle>
        <TerminalActions>
          <TerminalButton onClick={handleClear}>Clear</TerminalButton>
          <TerminalButton onClick={handleNewTerminal}>New</TerminalButton>
        </TerminalActions>
      </TerminalHeader>
      
      <TerminalOutput ref={outputRef}>
        {terminalLines.length === 0 ? (
          <EmptyState>
            <div>💻</div>
            <div>Terminal cleared</div>
            <div style={{ fontSize: '12px' }}>Type "help" for available commands</div>
          </EmptyState>
        ) : (
          terminalLines.map(line => (
            <OutputLine key={line.id} type={line.type}>
              {line.content}
            </OutputLine>
          ))
        )}
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
            placeholder="Enter command..."
            autoFocus
          />
        </form>
      </TerminalInput>
    </TerminalContainer>
  );
};

export default Terminal;