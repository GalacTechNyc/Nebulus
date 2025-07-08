import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAppState } from '../../hooks/useAppState';
import { ipcService } from '../../services/ipc';

const ExplorerContainer = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const WorkspaceHeader = styled.div`
  padding: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.surface};
`;

const WorkspaceTitle = styled.div`
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const ProjectName = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  padding: 2px 0;
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
  }
`;

const ProjectActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    color: ${props => props.theme.colors.text};
  }
`;

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  gap: 4px;
`;

const ToolbarButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const FileTree = styled.div`
  padding: ${props => props.theme.spacing.sm};
`;

const FileItem = styled.div<{ $level: number; $isDirectory: boolean; $selected?: boolean; $renaming?: boolean }>`
  display: flex;
  align-items: center;
  padding: 2px 4px;
  padding-left: ${props => props.$level * 16 + 4}px;
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.$selected ? props.theme.colors.primary + '40' : 'transparent'};
  position: relative;
  
  &:hover {
    background-color: ${props => props.$selected ? props.theme.colors.primary + '40' : props.theme.colors.surfaceHover};
  }
  
  ${props => props.$renaming && `
    background-color: ${props.theme.colors.surface};
    border: 1px solid ${props.theme.colors.primary};
  `}
`;

const FileIcon = styled.span`
  margin-right: ${props => props.theme.spacing.xs};
  font-size: 12px;
  min-width: 16px;
`;

const FileName = styled.span<{ $renaming?: boolean }>`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  ${props => props.$renaming && `
    display: none;
  `}
`;

const RenameInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.small};
  font-family: inherit;
`;

const FileActions = styled.div`
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${FileItem}:hover & {
    opacity: 1;
  }
`;

const FileActionButton = styled.button`
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    color: ${props => props.theme.colors.text};
  }
`;

const EmptyState = styled.div`
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.small};
`;

const ContextMenu = styled.div<{ $visible: boolean; $x: number; $y: number }>`
  position: fixed;
  top: ${props => props.$y}px;
  left: ${props => props.$x}px;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  padding: 4px;
  box-shadow: ${props => props.theme.shadows.large};
  z-index: 1000;
  display: ${props => props.$visible ? 'block' : 'none'};
  min-width: 120px;
`;

const ContextMenuItem = styled.div`
  padding: 6px 12px;
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
  }
`;

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  expanded?: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetPath: string;
  isDirectory: boolean;
}

const FileExplorerEnhanced: React.FC = () => {
  const { dispatch } = useAppState();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetPath: '',
    isDirectory: false
  });
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  // Workspace management
  const [currentWorkspace, setCurrentWorkspace] = useState({
    name: 'Nebulus',
    path: '/Users/stephonbridges/Nebulus'
  });
  const [recentProjects, setRecentProjects] = useState<Array<{name: string, path: string}>>([]);
  
  // Real file tree from project directory
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real files from project directory
  useEffect(() => {
    const loadProjectFiles = async () => {
      try {
        setIsLoading(true);
        const result = await ipcService.readDirectory(currentWorkspace.path);
        if (result.success && result.files) {
          // Filter out node_modules, .git, dist, and other irrelevant directories
          const filteredFiles = result.files.filter(file => 
            !['node_modules', '.git', 'dist', '.DS_Store', '.env'].includes(file.name) &&
            !file.name.startsWith('.')
          );

          const fileNodes: FileNode[] = filteredFiles.map(file => ({
            name: file.name,
            path: file.path,
            isDirectory: file.isDirectory,
            children: file.isDirectory ? [] : undefined
          }));

          setFileTree(fileNodes);
        }
      } catch (error) {
        console.error('Error loading project files:', error);
        setFileTree([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectFiles();
  }, [currentWorkspace.path]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
    };
    
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Focus rename input when renaming starts
  useEffect(() => {
    if (renamingFile && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingFile]);

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
      'py': '🐍',
      'ico': '🖼️'
    };
    
    return iconMap[extension || ''] || '📄';
  };

  const handleFileClick = async (file: FileNode) => {
    console.log('=== File Click Handler ===');
    console.log('File clicked:', file.name);
    console.log('File path:', file.path);
    console.log('Is directory:', file.isDirectory);
    
    if (file.isDirectory) {
      const newExpanded = new Set(expandedDirs);
      if (newExpanded.has(file.path)) {
        newExpanded.delete(file.path);
      } else {
        newExpanded.add(file.path);
      }
      setExpandedDirs(newExpanded);
      console.log('Directory toggled');
    } else {
      setSelectedFile(file.path);
      console.log('Selected file set to:', file.path);
      
      try {
        console.log('Reading file from disk...');
        const result = await ipcService.readFile(file.path);
        console.log('Read result:', { success: result.success, contentLength: result.content?.length || 0 });
        
        if (!result.success) {
          console.error('File read failed:', result.error);
          alert(`Failed to read file: ${result.error}`);
          return;
        }
        
        const fileContent = result.content || '';
        console.log('File content loaded:', fileContent.length, 'characters');
        console.log('Content preview:', fileContent.substring(0, 100) + '...');
        
        const realFile = {
          id: file.path,
          name: file.name,
          path: file.path,
          content: fileContent,
          language: getLanguageFromExtension(file.name),
          modified: false,
          lastModified: new Date()
        };
        
        console.log('Dispatching ADD_OPEN_FILE with file:', realFile.name, 'content length:', realFile.content.length);
        dispatch({ type: 'ADD_OPEN_FILE', payload: realFile });
        
        console.log('Setting current file to:', file.path);
        dispatch({ type: 'SET_CURRENT_FILE', payload: file.path });
        
        console.log('File opening completed successfully');
        
      } catch (error) {
        console.error('Error reading file:', error);
        alert(`Error reading file: ${error}`);
      }
    }
    console.log('=== End File Click Handler ===');
  };

  const handleRightClick = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetPath: file.path,
      isDirectory: file.isDirectory
    });
  };

  const getLanguageFromExtension = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'tsx': 'typescript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'js': 'javascript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python'
    };
    return languageMap[extension || ''] || 'plaintext';
  };

  const handleNewFile = async () => {
    const fileName = window.prompt('Enter file name (with extension):', 'new-file.js');
    if (!fileName || fileName.trim() === '') return;
    
    const filePath = `${currentWorkspace.path}/${fileName.trim()}`;
    
    // Create default content based on extension
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    let defaultContent = '';
    
    switch (extension) {
      case 'js':
        defaultContent = `console.log("Hello from ${fileName}");`;
        break;
      case 'ts':
        defaultContent = `const message: string = "Hello from ${fileName}";\nconsole.log(message);`;
        break;
      case 'tsx':
        defaultContent = `import React from 'react';\n\nconst Component = () => {\n  return <div>Hello from ${fileName}</div>;\n};\n\nexport default Component;`;
        break;
      case 'html':
        defaultContent = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${fileName.replace('.html', '')}</title>\n</head>\n<body>\n  <h1>Hello from ${fileName}</h1>\n</body>\n</html>`;
        break;
      case 'css':
        defaultContent = `/* ${fileName} */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}`;
        break;
      case 'py':
        defaultContent = `# ${fileName}\ndef main():\n    print("Hello from ${fileName}")\n\nif __name__ == "__main__":\n    main()`;
        break;
      case 'json':
        defaultContent = `{\n  "name": "${fileName.replace('.json', '')}",\n  "version": "1.0.0"\n}`;
        break;
      default:
        defaultContent = `// ${fileName}\n// Your code here...`;
    }
    
    try {
      const result = await ipcService.writeFile(filePath, defaultContent);
      if (result.success) {
        handleRefresh();
        
        // Open the new file in editor
        const newFile = {
          id: filePath,
          name: fileName.trim(),
          path: filePath,
          content: defaultContent,
          language: getLanguageFromExtension(fileName.trim()),
          modified: false,
          lastModified: new Date()
        };
        
        dispatch({ type: 'ADD_OPEN_FILE', payload: newFile });
        dispatch({ type: 'SET_CURRENT_FILE', payload: filePath });
      }
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const handleNewFolder = async () => {
    const folderName = window.prompt('Enter folder name:', 'new-folder');
    if (!folderName || folderName.trim() === '') return;
    
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('terminal:execute', `mkdir "${folderName.trim()}"`, currentWorkspace.path);
        if (result.success) {
          handleRefresh();
        }
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleRename = async (oldPath: string, newName: string) => {
    if (!newName.trim()) return;
    
    const directory = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${directory}/${newName.trim()}`;
    
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('terminal:execute', `mv "${oldPath}" "${newPath}"`, currentWorkspace.path);
        if (result.success) {
          handleRefresh();
          
          // Update open files if this file was open
          dispatch({ type: 'REMOVE_OPEN_FILE', payload: oldPath });
        }
      }
    } catch (error) {
      console.error('Error renaming:', error);
    }
  };

  const handleDelete = async (path: string) => {
    if (!window.confirm(`Are you sure you want to delete ${path.split('/').pop()}?`)) return;
    
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('terminal:execute', `rm -rf "${path}"`, currentWorkspace.path);
        if (result.success) {
          handleRefresh();
          
          // Remove from open files if it was open
          dispatch({ type: 'REMOVE_OPEN_FILE', payload: path });
        }
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const result = await ipcService.readDirectory(currentWorkspace.path);
      if (result.success && result.files) {
        const filteredFiles = result.files.filter(file => 
          !['node_modules', '.git', 'dist', '.DS_Store', '.env'].includes(file.name) &&
          !file.name.startsWith('.')
        );

        const fileNodes: FileNode[] = filteredFiles.map(file => ({
          name: file.name,
          path: file.path,
          isDirectory: file.isDirectory,
          children: file.isDirectory ? [] : undefined
        }));

        setFileTree(fileNodes);
      }
    } catch (error) {
      console.error('Error refreshing file tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      if (!window.electronAPI) return;
      
      const result = await window.electronAPI.invoke('dialog:openDirectory');
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        const folderName = folderPath.split('/').pop() || 'Unknown Project';
        
        const newWorkspace = {
          name: folderName,
          path: folderPath
        };

        setCurrentWorkspace(newWorkspace);
        dispatch({ type: 'CLEAR_OPEN_FILES' });
        
        // Add to recent projects
        setRecentProjects(prev => {
          const filtered = prev.filter(p => p.path !== folderPath);
          return [newWorkspace, ...filtered].slice(0, 10);
        });
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const startRename = (path: string, currentName: string) => {
    setRenamingFile(path);
    setRenameValue(currentName);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const finishRename = () => {
    if (renamingFile && renameValue.trim() && renameValue.trim() !== renamingFile.split('/').pop()) {
      handleRename(renamingFile, renameValue.trim());
    }
    setRenamingFile(null);
    setRenameValue('');
  };

  const cancelRename = () => {
    setRenamingFile(null);
    setRenameValue('');
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedDirs.has(node.path);
      const isRenaming = renamingFile === node.path;
      
      return (
        <div key={node.path}>
          <FileItem
            $level={level}
            $isDirectory={node.isDirectory}
            $selected={selectedFile === node.path}
            $renaming={isRenaming}
            onClick={() => !isRenaming && handleFileClick(node)}
            onContextMenu={(e) => handleRightClick(e, node)}
          >
            <FileIcon>{getFileIcon(node.name, node.isDirectory)}</FileIcon>
            {isRenaming ? (
              <RenameInput
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={finishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishRename();
                  if (e.key === 'Escape') cancelRename();
                }}
              />
            ) : (
              <FileName $renaming={isRenaming}>{node.name}</FileName>
            )}
            
            {!isRenaming && (
              <FileActions>
                <FileActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(node.path, node.name);
                  }}
                  title="Rename"
                >
                  ✏️
                </FileActionButton>
                <FileActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node.path);
                  }}
                  title="Delete"
                >
                  🗑️
                </FileActionButton>
              </FileActions>
            )}
          </FileItem>
          
          {node.isDirectory && isExpanded && node.children && renderFileTree(node.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <>
      <ExplorerContainer>
        <WorkspaceHeader>
          <WorkspaceTitle>Explorer</WorkspaceTitle>
          <ProjectName onClick={handleOpenFolder}>
            <span>{currentWorkspace.name}</span>
            <ProjectActions>
              <ActionButton title="Open Folder" onClick={handleOpenFolder}>
                📂
              </ActionButton>
            </ProjectActions>
          </ProjectName>
        </WorkspaceHeader>
        
        <ToolbarContainer>
          <ToolbarButton onClick={handleNewFile} title="New File">
            📄
          </ToolbarButton>
          <ToolbarButton onClick={handleNewFolder} title="New Folder">
            📁
          </ToolbarButton>
          <ToolbarButton onClick={handleRefresh} title="Refresh">
            ↻
          </ToolbarButton>
          <ToolbarButton onClick={handleOpenFolder} title="Open Folder">
            📂
          </ToolbarButton>
        </ToolbarContainer>
        
        <FileTree>
          {isLoading ? (
            <EmptyState>Loading project files...</EmptyState>
          ) : fileTree.length === 0 ? (
            <EmptyState>
              <div>No files found</div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                Click "Open Folder" to load a project
              </div>
            </EmptyState>
          ) : (
            renderFileTree(fileTree)
          )}
        </FileTree>
      </ExplorerContainer>

      <ContextMenu
        $visible={contextMenu.visible}
        $x={contextMenu.x}
        $y={contextMenu.y}
      >
        <ContextMenuItem onClick={() => startRename(contextMenu.targetPath, contextMenu.targetPath.split('/').pop() || '')}>
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleDelete(contextMenu.targetPath)}>
          Delete
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}>
          Cancel
        </ContextMenuItem>
      </ContextMenu>
    </>
  );
};

export default FileExplorerEnhanced;