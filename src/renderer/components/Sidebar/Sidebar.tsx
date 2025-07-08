import React from 'react';
import styled from 'styled-components';
import FileExplorerEnhanced from './FileExplorerEnhanced';
import AIAssistant from './AIAssistant';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.colors.surface};
`;

const SidebarHeader = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  font-size: ${props => props.theme.fontSizes.small};
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

interface SidebarProps {
  type: 'explorer' | 'ai' | 'deploy';
}

const Sidebar: React.FC<SidebarProps> = ({ type }) => {
  const getTitle = () => {
    switch (type) {
      case 'explorer':
        return 'Explorer';
      case 'ai':
        return 'AI Assistant';
      case 'deploy':
        return 'Deploy';
      default:
        return 'Sidebar';
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'explorer':
        return <FileExplorerEnhanced />;
      case 'ai':
        return <AIAssistant />;
      case 'deploy':
        return <div style={{ padding: '16px', color: '#8B949E' }}>Deploy panel coming soon...</div>;
      default:
        return null;
    }
  };

  return (
    <SidebarContainer>
      <SidebarHeader>{getTitle()}</SidebarHeader>
      <SidebarContent>
        {renderContent()}
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;