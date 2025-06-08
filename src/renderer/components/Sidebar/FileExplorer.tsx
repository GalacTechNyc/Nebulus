import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppState } from '../../hooks/useAppState';

const ExplorerContainer = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const ToolbarButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: transparent;
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    color: ${props => props.theme.colors.text};
  }
`;

const FileTree = styled.div`
  padding: ${props => props.theme.spacing.sm};
`;

const FileItem = styled.div<{ level: number; isDirectory: boolean; selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 2px 4px;
  padding-left: ${props => props.level * 16 + 4}px;
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.selected ? props.theme.colors.primary + '40' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.selected ? props.theme.colors.primary + '40' : props.theme.colors.surfaceHover};
  }
`;

const FileIcon = styled.span`
  margin-right: ${props => props.theme.spacing.xs};
  font-size: 12px;
`;

const FileName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyState = styled.div`
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.small};
`;

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  expanded?: boolean;
}

const FileExplorer: React.FC = () => {
  const { dispatch } = useAppState();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  
  // Mock file tree - in real app, this would come from file system
  const [fileTree] = useState<FileNode[]>([
    {
      name: 'src',
      path: '/src',
      isDirectory: true,
      expanded: true,
      children: [
        {
          name: 'components',
          path: '/src/components',
          isDirectory: true,
          children: [
            { name: 'App.tsx', path: '/src/components/App.tsx', isDirectory: false },
            { name: 'Header.tsx', path: '/src/components/Header.tsx', isDirectory: false }
          ]
        },
        { name: 'utils', path: '/src/utils', isDirectory: true, children: [] },
        { name: 'index.ts', path: '/src/index.ts', isDirectory: false },
        { name: 'App.css', path: '/src/App.css', isDirectory: false }
      ]
    },
    {
      name: 'public',
      path: '/public',
      isDirectory: true,
      children: [
        { name: 'index.html', path: '/public/index.html', isDirectory: false },
        { name: 'favicon.ico', path: '/public/favicon.ico', isDirectory: false }
      ]
    },
    { name: 'package.json', path: '/package.json', isDirectory: false },
    { name: 'tsconfig.json', path: '/tsconfig.json', isDirectory: false },
    { name: 'README.md', path: '/README.md', isDirectory: false }
  ]);

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return expandedDirs.has(fileName) ? '📂' : '📁';
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'tsx': '🔷',
      'ts': '🔵',
      'jsx': '🔷',
      'js': '🟨',
      'html': '🟧',
      'css': '🎨',
      'json': '🟫',
      'md': '📝',
      'ico': '🖼️'
    };
    
    return iconMap[extension || ''] || '📄';
  };

  const handleFileClick = (file: FileNode) => {
    if (file.isDirectory) {
      const newExpanded = new Set(expandedDirs);
      if (newExpanded.has(file.path)) {
        newExpanded.delete(file.path);
      } else {
        newExpanded.add(file.path);
      }
      setExpandedDirs(newExpanded);
    } else {
      setSelectedFile(file.path);
      
      // Add file to open files and set as current
      const mockFile = {
        id: file.path,
        name: file.name,
        path: file.path,
        content: `// ${file.name}\n// This is a mock file content\n\nconst example = "Hello from ${file.name}";`,
        language: 'typescript',
        modified: false,
        lastModified: new Date()
      };
      
      dispatch({ type: 'ADD_OPEN_FILE', payload: mockFile });
      dispatch({ type: 'SET_CURRENT_FILE', payload: file.path });
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedDirs.has(node.path);
      const showChildren = node.isDirectory && isExpanded && node.children;
      
      return (
        <div key={node.path}>
          <FileItem
            level={level}
            isDirectory={node.isDirectory}
            selected={selectedFile === node.path}
            onClick={() => handleFileClick(node)}
          >
            <FileIcon>{getFileIcon(node.name, node.isDirectory)}</FileIcon>
            <FileName>{node.name}</FileName>
          </FileItem>
          
          {showChildren && renderFileTree(node.children!, level + 1)}
        </div>
      );
    });
  };

  const handleNewFile = () => {
    // In real app, this would open a dialog to create new file
    console.log('Create new file');
  };

  const handleNewFolder = () => {
    // In real app, this would open a dialog to create new folder
    console.log('Create new folder');
  };

  const handleRefresh = () => {
    // In real app, this would refresh the file tree
    console.log('Refresh file tree');
  };

  const handleOpenFolder = () => {
    // In real app, this would open folder dialog
    console.log('Open folder');
  };

  return (
    <ExplorerContainer>
      <ToolbarContainer>
        <div style={{ display: 'flex', gap: '4px' }}>
          <ToolbarButton onClick={handleNewFile} title="New File">
            📄
          </ToolbarButton>
          <ToolbarButton onClick={handleNewFolder} title="New Folder">
            📁
          </ToolbarButton>
          <ToolbarButton onClick={handleRefresh} title="Refresh">
            ↻
          </ToolbarButton>
        </div>
        <ToolbarButton onClick={handleOpenFolder} title="Open Folder">
          📂
        </ToolbarButton>
      </ToolbarContainer>
      
      <FileTree>
        {fileTree.length === 0 ? (
          <EmptyState>
            <div>No folder opened</div>
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              Click the folder icon to open a project
            </div>
          </EmptyState>
        ) : (
          renderFileTree(fileTree)
        )}
      </FileTree>
    </ExplorerContainer>
  );
};

export default FileExplorer;