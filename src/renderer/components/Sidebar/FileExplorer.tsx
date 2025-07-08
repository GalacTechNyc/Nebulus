import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppState } from '../../hooks/useAppState';
import { ipcService } from '../../services/ipc';

const ExplorerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.colors.background};
`;

const ExplorerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  font-size: ${props => props.theme.fontSizes.small};
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const ExplorerActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
`;

const ActionButton = styled.button`
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    color: ${props => props.theme.colors.text};
  }
`;

const FileTree = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.xs};
`;

const FileItem = styled.div<{ $level: number; $isDirectory: boolean; $isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: 2px ${props => props.theme.spacing.xs};
  padding-left: ${props => props.$level * 16 + 8}px;
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  user-select: none;
  border-radius: 2px;
  margin: 1px 0;
  
  ${props => props.$isSelected && `
    background-color: ${props.theme.colors.primary}20;
    color: ${props.theme.colors.primary};
  `}
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
  }
`;

const FileIcon = styled.span`
  margin-right: ${props => props.theme.spacing.xs};
  font-size: 12px;
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FileName = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ExpandIcon = styled.span<{ $expanded: boolean }>`
  margin-right: 4px;
  font-size: 10px;
  transition: transform 0.2s;
  transform: ${props => props.$expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  color: ${props => props.theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.small};
  gap: ${props => props.theme.spacing.sm};
`;

interface FileNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  expanded?: boolean;
  parent?: string;
}

const FileExplorer: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load initial directory
  useEffect(() => {
    loadDirectory('/home/ubuntu/Nebulus');
  }, []);

  const loadDirectory = async (dirPath: string, parentNode?: FileNode) => {
    setLoading(true);
    try {
      const result = await ipcService.readDirectory(dirPath);
      if (result.success && result.files) {
        const nodes: FileNode[] = result.files
          .sort((a, b) => {
            // Directories first, then files
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
          })
          .map(file => ({
            id: file.path,
            name: file.name,
            path: file.path,
            isDirectory: file.isDirectory,
            children: file.isDirectory ? [] : undefined,
            expanded: false,
            parent: parentNode?.id
          }));

        if (parentNode) {
          // Update specific node's children
          setFileTree(prev => updateNodeChildren(prev, parentNode.id, nodes));
        } else {
          // Set root nodes
          setFileTree(nodes);
        }
      } else {
        console.error('Failed to load directory:', result.error);
      }
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNodeChildren = (nodes: FileNode[], nodeId: string, children: FileNode[]): FileNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, children, expanded: true };
      }
      if (node.children) {
        return { ...node, children: updateNodeChildren(node.children, nodeId, children) };
      }
      return node;
    });
  };

  const toggleNodeExpansion = async (node: FileNode) => {
    if (!node.isDirectory) return;

    if (node.expanded) {
      // Collapse
      setFileTree(prev => updateNodeExpansion(prev, node.id, false));
    } else {
      // Expand and load children if not loaded
      if (!node.children || node.children.length === 0) {
        await loadDirectory(node.path, node);
      } else {
        setFileTree(prev => updateNodeExpansion(prev, node.id, true));
      }
    }
  };

  const updateNodeExpansion = (nodes: FileNode[], nodeId: string, expanded: boolean): FileNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, expanded };
      }
      if (node.children) {
        return { ...node, children: updateNodeExpansion(node.children, nodeId, expanded) };
      }
      return node;
    });
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.isDirectory) {
      await toggleNodeExpansion(node);
      return;
    }

    // Select the file
    setSelectedFile(node.id);

    // Check if file is already open
    const existingFile = state.project.openFiles.find(f => f.path === node.path);
    if (existingFile) {
      // File is already open, just switch to it
      dispatch({ type: 'SET_CURRENT_FILE', payload: existingFile.id });
      return;
    }

    // Load file content from disk
    try {
      console.log('Loading file from disk:', node.path);
      const result = await ipcService.readFile(node.path);
      
      if (result.success && result.content !== undefined) {
        console.log('File loaded successfully:', node.name, 'Content length:', result.content.length);
        
        // Create file object with loaded content
        const fileObj = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: node.name,
          path: node.path,
          content: result.content,
          language: getLanguageFromExtension(node.name),
          lastModified: new Date(),
          modified: false
        };

        // Add to open files
        dispatch({ type: 'ADD_OPEN_FILE', payload: fileObj });
        
        // Set as current file
        dispatch({ type: 'SET_CURRENT_FILE', payload: fileObj.id });
        
        console.log('File opened successfully:', fileObj.name, 'ID:', fileObj.id);
      } else {
        console.error('Failed to read file:', result.error);
        alert(`Failed to open file: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      alert(`Error opening file: ${error}`);
    }
  };

  const getLanguageFromExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'ps1': 'powershell',
      'sql': 'sql',
      'dockerfile': 'dockerfile'
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  const getFileIcon = (node: FileNode): string => {
    if (node.isDirectory) {
      return node.expanded ? '📂' : '📁';
    }
    
    const extension = node.name.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'js': '🟨',
      'jsx': '🔷',
      'ts': '🔵',
      'tsx': '🔷',
      'html': '🟧',
      'css': '🟦',
      'scss': '🟪',
      'sass': '🟪',
      'json': '🟫',
      'md': '📝',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'xml': '📄',
      'yaml': '📄',
      'yml': '📄',
      'toml': '📄',
      'ini': '📄',
      'sh': '🐚',
      'bash': '🐚',
      'zsh': '🐚',
      'fish': '🐚',
      'ps1': '💙',
      'sql': '🗃️',
      'dockerfile': '🐳',
      'gitignore': '🚫',
      'env': '🔐',
      'lock': '🔒',
      'log': '📋',
      'txt': '📄',
      'pdf': '📕',
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🎨',
      'ico': '🎨',
      'mp4': '🎬',
      'mp3': '🎵',
      'wav': '🎵',
      'zip': '📦',
      'tar': '📦',
      'gz': '📦'
    };
    return iconMap[extension || ''] || '📄';
  };

  const renderFileNode = (node: FileNode, level: number = 0): React.ReactNode => {
    return (
      <React.Fragment key={node.id}>
        <FileItem
          $level={level}
          $isDirectory={node.isDirectory}
          $isSelected={selectedFile === node.id}
          onClick={() => handleFileClick(node)}
        >
          {node.isDirectory && (
            <ExpandIcon $expanded={node.expanded || false}>
              ▶
            </ExpandIcon>
          )}
          <FileIcon>{getFileIcon(node)}</FileIcon>
          <FileName>{node.name}</FileName>
        </FileItem>
        {node.isDirectory && node.expanded && node.children && (
          <>
            {node.children.map(child => renderFileNode(child, level + 1))}
          </>
        )}
      </React.Fragment>
    );
  };

  const handleNewFile = async () => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    try {
      const filePath = `/home/ubuntu/Nebulus/${fileName}`;
      const result = await ipcService.writeFile(filePath, '');
      
      if (result.success) {
        // Reload the directory to show the new file
        await loadDirectory('/home/ubuntu/Nebulus');
      } else {
        alert(`Failed to create file: ${result.error}`);
      }
    } catch (error) {
      alert(`Error creating file: ${error}`);
    }
  };

  const handleNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      // Create folder using mkdir command
      const result = await ipcService.executeCommand(`mkdir -p "${folderName}"`, '/home/ubuntu/Nebulus');
      
      if (result.success) {
        // Reload the directory to show the new folder
        await loadDirectory('/home/ubuntu/Nebulus');
      } else {
        alert(`Failed to create folder: ${result.stderr || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error creating folder: ${error}`);
    }
  };

  const handleRefresh = () => {
    loadDirectory('/home/ubuntu/Nebulus');
  };

  return (
    <ExplorerContainer>
      <ExplorerHeader>
        Explorer
        <ExplorerActions>
          <ActionButton onClick={handleNewFile} title="New File">
            📄
          </ActionButton>
          <ActionButton onClick={handleNewFolder} title="New Folder">
            📁
          </ActionButton>
          <ActionButton onClick={handleRefresh} title="Refresh">
            🔄
          </ActionButton>
        </ExplorerActions>
      </ExplorerHeader>
      
      <FileTree>
        {loading ? (
          <EmptyState>
            <div>⏳</div>
            <div>Loading files...</div>
          </EmptyState>
        ) : fileTree.length === 0 ? (
          <EmptyState>
            <div>📁</div>
            <div>No files found</div>
            <div style={{ fontSize: '12px' }}>Create a new file to get started</div>
          </EmptyState>
        ) : (
          fileTree.map(node => renderFileNode(node))
        )}
      </FileTree>
    </ExplorerContainer>
  );
};

export default FileExplorer;

