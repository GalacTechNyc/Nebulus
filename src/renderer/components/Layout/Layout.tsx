import React from 'react';
import styled from 'styled-components';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAppState, useLayout } from '../../hooks/useAppState';
import Editor from '../Editor/Editor';
import Browser from '../Browser/Browser';
import Sidebar from '../Sidebar/Sidebar';
import TerminalPanel from '../Terminal/TerminalPanel';
import TitleBar from './TitleBar';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: ${props => props.theme.colors.background};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const PanelContainer = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-right: none;
  }
`;

const ResizeHandle = styled(PanelResizeHandle)`
  background-color: ${props => props.theme.colors.border};
  width: 4px;
  cursor: col-resize;
  
  &:hover {
    background-color: ${props => props.theme.colors.borderHover};
  }
  
  &[data-panel-group-direction="horizontal"] {
    height: 4px;
    cursor: row-resize;
  }
`;

const Layout: React.FC = () => {
  const { state } = useAppState();
  const layout = useLayout();

  // Get panel visibility
  const explorerPanel = layout.find(p => p.type === 'explorer');
  const editorPanel = layout.find(p => p.type === 'editor');
  const browserPanel = layout.find(p => p.type === 'browser');
  const aiPanel = layout.find(p => p.type === 'ai');
  const terminalPanel = layout.find(p => p.type === 'terminal');

  const showExplorer = explorerPanel?.visible ?? true;
  const showEditor = editorPanel?.visible ?? true;
  const showBrowser = browserPanel?.visible ?? true;
  const showAI = aiPanel?.visible ?? true;
  const showTerminal = state.terminal.showTerminalPanel;

  return (
    <LayoutContainer>
      <TitleBar />
      
      <MainContent>
        <PanelGroup direction="horizontal">
          {/* Left Sidebar - File Explorer */}
          {showExplorer && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={35}>
                <PanelContainer $visible={showExplorer}>
                  <Sidebar type="explorer" />
                </PanelContainer>
              </Panel>
              <ResizeHandle />
            </>
          )}

          {/* Main Content Area */}
          <Panel defaultSize={showExplorer ? 50 : 70} minSize={30}>
            <PanelGroup direction="horizontal">
              {/* Editor Section */}
              <Panel defaultSize={showTerminal ? 75 : 100} minSize={40}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={100} minSize={30}>
                    <PanelContainer $visible={showEditor}>
                      <Editor />
                    </PanelContainer>
                  </Panel>
                  
                  {/* Terminal */}
                  {showTerminal && (
                    <>
                      <ResizeHandle />
                      <Panel defaultSize={25} minSize={15} maxSize={60}>
                        <PanelContainer $visible={showTerminal}>
                          <TerminalPanel />
                        </PanelContainer>
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>

          {/* Right Side - Browser + AI */}
          <ResizeHandle />
          <Panel defaultSize={30} minSize={25} maxSize={50}>
            <PanelGroup direction="vertical">
              {/* Browser */}
              <Panel defaultSize={60} minSize={30}>
                <PanelContainer $visible={showBrowser}>
                  <Browser />
                </PanelContainer>
              </Panel>
              
              {/* AI Assistant */}
              <ResizeHandle />
              <Panel defaultSize={40} minSize={25}>
                <PanelContainer $visible={showAI}>
                  <Sidebar type="ai" />
                </PanelContainer>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;