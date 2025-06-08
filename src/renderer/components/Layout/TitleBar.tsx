import React from 'react';
import styled from 'styled-components';
import { useAppState } from '../../hooks/useAppState';

const TitleBarContainer = styled.div`
  height: 32px;
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spacing.md};
  -webkit-app-region: drag;
  user-select: none;
`;

const AppTitle = styled.div`
  font-size: ${props => props.theme.fontSizes.medium};
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const AppIcon = styled.div`
  width: 16px;
  height: 16px;
  background: linear-gradient(45deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.primaryHover});
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
`;

const ProjectInfo = styled.div`
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const WindowControls = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  -webkit-app-region: no-drag;
`;

const WindowButton = styled.button`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};
  
  &.close {
    background-color: #ff5f56;
  }
  
  &.minimize {
    background-color: #ffbd2e;
  }
  
  &.maximize {
    background-color: #27ca3f;
  }
  
  &:hover {
    opacity: 0.8;
  }
`;

const TitleBar: React.FC = () => {
  const { state } = useAppState();

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.invoke('window:close');
    }
  };

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.invoke('window:minimize');
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.invoke('window:maximize');
    }
  };

  return (
    <TitleBarContainer>
      <AppTitle>
        <AppIcon>G</AppIcon>
        GalactusIDE
      </AppTitle>
      
      <ProjectInfo>
        {state.project.currentFile ? (
          <>
            <span>{state.project.currentFile}</span>
            {state.project.openFiles.some(f => f.modified) && (
              <span style={{ color: '#D29922' }}>●</span>
            )}
          </>
        ) : (
          <span>No file selected</span>
        )}
      </ProjectInfo>

      <WindowControls>
        <WindowButton className="close" onClick={handleClose} />
        <WindowButton className="minimize" onClick={handleMinimize} />
        <WindowButton className="maximize" onClick={handleMaximize} />
      </WindowControls>
    </TitleBarContainer>
  );
};

export default TitleBar;