import React from 'react';
import styled from 'styled-components';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAppState } from '../../hooks/useAppState';
import XTermTerminal from '../XTermTerminal';

const TerminalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.colors.surface};
`;

const TerminalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  min-height: 32px;
`;

const TerminalTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
`;

const TerminalTab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: 4px 8px;
  background-color: ${props => props.$active ? props.theme.colors.surface : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  border: 1px solid ${props => props.$active ? props.theme.colors.border : 'transparent'};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.fontSizes.small};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    color: ${props => props.theme.colors.text};
    box-shadow: ${props => props.theme.shadows.small};
  }
  
  ${props => props.$active && `
    box-shadow: ${props.theme.shadows.neonCyan};
    text-shadow: 0 0 5px ${props.theme.colors.primary};
  `}
`;

const TabClose = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  border-radius: 2px;
  font-size: 12px;
  line-height: 1;
  opacity: 0.6;
  
  &:hover {
    opacity: 1;
    background-color: ${props => props.theme.colors.error};
    color: white;
  }
`;

const TerminalActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 12px;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.small};
    text-shadow: 0 0 5px ${props => props.theme.colors.primary};
  }
`;

const TerminalContent = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const SplitResizeHandle = styled(PanelResizeHandle)`
  background-color: ${props => props.theme.colors.border};
  width: 4px;
  cursor: col-resize;
  
  &:hover {
    background-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.neonCyan};
  }
`;

const TerminalPanel: React.FC = () => {
  const { state, dispatch } = useAppState();
  const { terminals, activeTerminal, showTerminalPanel, splitGroups } = state.terminal;

  const handleNewTerminal = () => {
    const newId = `terminal-${Date.now()}`;
    const newName = `Terminal ${terminals.length + 1}`;
    dispatch({
      type: 'ADD_TERMINAL',
      payload: {
        id: newId,
        name: newName,
        cwd: '/Users/stephonbridges/Nebulus'
      }
    });
  };

  const handleSplitTerminal = () => {
    if (activeTerminal) {
      dispatch({ type: 'SPLIT_TERMINAL', payload: activeTerminal });
    }
  };

  const handleUnsplitTerminals = () => {
    dispatch({ type: 'UNSPLIT_TERMINALS' });
  };

  const handleCloseTerminal = (terminalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (terminals.length > 1) {
      dispatch({ type: 'REMOVE_TERMINAL', payload: terminalId });
    }
  };

  const handleSwitchTerminal = (terminalId: string) => {
    dispatch({ type: 'SET_ACTIVE_TERMINAL', payload: terminalId });
  };

  const toggleTerminalPanel = () => {
    dispatch({ type: 'TOGGLE_TERMINAL_PANEL' });
  };

  // Group terminals by split group
  const terminalGroups = terminals.reduce((groups, terminal) => {
    if (!groups[terminal.splitGroup]) {
      groups[terminal.splitGroup] = [];
    }
    groups[terminal.splitGroup].push(terminal);
    return groups;
  }, {} as Record<number, typeof terminals>);

  const groupKeys = Object.keys(terminalGroups).map(Number).sort();

  if (!showTerminalPanel) {
    return null;
  }

  return (
    <TerminalContainer>
      <TerminalHeader>
        <TerminalTabs>
          {terminals.map(terminal => (
            <TerminalTab
              key={terminal.id}
              $active={terminal.id === activeTerminal}
              onClick={() => handleSwitchTerminal(terminal.id)}
            >
              <span>🖥️</span>
              <span>{terminal.name}</span>
              {terminals.length > 1 && (
                <TabClose onClick={(e) => handleCloseTerminal(terminal.id, e)}>
                  ×
                </TabClose>
              )}
            </TerminalTab>
          ))}
        </TerminalTabs>
        
        <TerminalActions>
          <ActionButton onClick={handleNewTerminal} title="New Terminal">
            ➕
          </ActionButton>
          <ActionButton onClick={handleSplitTerminal} title="Split Terminal">
            ⊞
          </ActionButton>
          {splitGroups > 1 && (
            <ActionButton onClick={handleUnsplitTerminals} title="Unsplit Terminals">
              ⊟
            </ActionButton>
          )}
          <ActionButton onClick={() => {
            // Open external terminal in current directory
            if (window.electronAPI) {
              window.electronAPI.invoke('terminal:execute', 'open -a Terminal .', '/Users/stephonbridges/Nebulus');
            }
          }} title="Open External Terminal">
            🚀
          </ActionButton>
          <ActionButton onClick={toggleTerminalPanel} title="Close Terminal">
            ✕
          </ActionButton>
        </TerminalActions>
      </TerminalHeader>
      
      <TerminalContent>
        {groupKeys.length > 1 ? (
          <PanelGroup direction="horizontal">
            {groupKeys.map((groupKey, index) => {
              const groupTerminals = terminalGroups[groupKey];
              const activeInGroup = groupTerminals.find(t => t.isActive) || groupTerminals[0];
              
              return (
                <React.Fragment key={groupKey}>
                  <Panel defaultSize={100 / groupKeys.length} minSize={20}>
                    {activeInGroup && (
                      <XTermTerminal 
                        key={activeInGroup.id}
                        id={activeInGroup.id} 
                        cwd={activeInGroup.cwd} 
                      />
                    )}
                  </Panel>
                  {index < groupKeys.length - 1 && <SplitResizeHandle />}
                </React.Fragment>
              );
            })}
          </PanelGroup>
        ) : (
          // Single terminal view
          terminals.length > 0 && (
            <XTermTerminal 
              key={terminals.find(t => t.isActive)?.id || terminals[0].id}
              id={terminals.find(t => t.isActive)?.id || terminals[0].id} 
              cwd={terminals.find(t => t.isActive)?.cwd || terminals[0].cwd} 
            />
          )
        )}
      </TerminalContent>
    </TerminalContainer>
  );
};

export default TerminalPanel;