import React, { useState, useEffect } from 'react';
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
`;

const ToolbarButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid #666;
  border-radius: 4px;
  background-color: #333;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  margin: 2px;
  outline: none;
  
  &:hover {
    background-color: #555;
    border-color: #888;
  }
  
  &:active {
    background-color: #222;
    transform: scale(0.95);
  }
`;

const FileTree = styled.div`
  padding: ${props => props.theme.spacing.sm};
`;

const FileItem = styled.div<{ $level: number; $isDirectory: boolean; $selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 2px 4px;
  padding-left: ${props => props.$level * 16 + 4}px;
  cursor: pointer;
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.$selected ? props.theme.colors.primary + '40' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$selected ? props.theme.colors.primary + '40' : props.theme.colors.surfaceHover};
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
        // Fallback to empty tree
        setFileTree([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectFiles();
  }, [currentWorkspace.path]);

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

  const handleFileClick = async (file: FileNode) => {
    console.log('=== File Click Debug ===');
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
      console.log('Directory toggled:', file.name);
    } else {
      setSelectedFile(file.path);
      console.log('Selected file set to:', file.path);
      
      try {
        console.log('Attempting to read file:', file.path);
        // Read actual file content
        const result = await ipcService.readFile(file.path);
        console.log('File read result:', result);
        
        if (!result.success) {
          console.error('File read failed:', result.error);
          alert(`Failed to read file ${file.name}: ${result.error}`);
          return;
        }
        
        const fileContent = result.content || '';
        console.log('File content length:', fileContent.length);
        console.log('File content preview:', fileContent.substring(0, 100) + '...');
        
        // Add file to open files and set as current
        const realFile = {
          id: file.path,
          name: file.name,
          path: file.path,
          content: fileContent,
          language: getLanguageFromExtension(file.name),
          modified: false,
          lastModified: new Date()
        };
        
        console.log('Dispatching ADD_OPEN_FILE with:', realFile.name);
        dispatch({ type: 'ADD_OPEN_FILE', payload: realFile });
        
        console.log('Dispatching SET_CURRENT_FILE with:', file.path);
        dispatch({ type: 'SET_CURRENT_FILE', payload: file.path });
        
        console.log('File opening completed successfully');
        
        // Show success message to user
        console.log(`✅ File ${file.name} opened successfully in editor`);
        
      } catch (error) {
        console.error('Unexpected error reading file:', error);
        alert(`Unexpected error reading file ${file.name}: ${error}`);
        
        // Fallback to mock content
        const mockFile = {
          id: file.path,
          name: file.name,
          path: file.path,
          content: `// Error loading ${file.name}\n// ${error}`,
          language: getLanguageFromExtension(file.name),
          modified: false,
          lastModified: new Date()
        };
        
        console.log('Using fallback content for:', file.name);
        dispatch({ type: 'ADD_OPEN_FILE', payload: mockFile });
        dispatch({ type: 'SET_CURRENT_FILE', payload: file.path });
      }
    }
    console.log('=== End File Click Debug ===');
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

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedDirs.has(node.path);
      const showChildren = node.isDirectory && isExpanded && node.children;
      
      return (
        <div key={node.path}>
          <FileItem
            $level={level}
            $isDirectory={node.isDirectory}
            $selected={selectedFile === node.path}
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

  const handleNewFile = async () => {
    try {
      console.log('handleNewFile called');
      
      // Check if electronAPI exists
      if (!window.electronAPI) {
        console.error('Electron API not available');
        alert('Electron API not available');
        return;
      }
      
      // Use Electron's save dialog to get custom filename
      const saveResult = await window.electronAPI.invoke('dialog:saveFile', 'untitled.js');
      console.log('Save dialog result:', saveResult);
      
      if (saveResult.canceled || !saveResult.filePath) {
        console.log('File creation canceled by user');
        return;
      }
      
      const filePath = saveResult.filePath;
      const fileName = filePath.split('/').pop() || 'untitled.js';
      console.log('Creating file:', fileName, 'at path:', filePath);
      
      // Create content based on file extension
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      let defaultContent = '';
      
      switch (extension) {
        case 'js':
          defaultContent = `// ${fileName}\n// Created: ${new Date().toISOString()}\n\nconsole.log("Hello from ${fileName}");`;
          break;
        case 'ts':
          defaultContent = `// ${fileName}\n// Created: ${new Date().toISOString()}\n\nconst message: string = "Hello from ${fileName}";\nconsole.log(message);`;
          break;
        case 'html':
          defaultContent = `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${fileName.replace('.html', '')}</title>\n</head>\n<body>\n    <h1>Hello from ${fileName}</h1>\n</body>\n</html>`;
          break;
        case 'css':
          defaultContent = `/* ${fileName} */\n/* Created: ${new Date().toISOString()} */\n\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}`;
          break;
        case 'py':
          defaultContent = `# ${fileName}\n# Created: ${new Date().toISOString()}\n\ndef main():\n    print("Hello from ${fileName}")\n\nif __name__ == "__main__":\n    main()`;
          break;
        case 'md':
          defaultContent = `# ${fileName.replace('.md', '')}\n\nCreated: ${new Date().toISOString()}\n\nYour content here...`;
          break;
        default:
          defaultContent = `// ${fileName}\n// Created: ${new Date().toISOString()}\n\n// Your code here...`;
      }
      
      const result = await window.electronAPI.invoke('file:write', filePath, defaultContent);
      console.log('Write result:', result);
      
      if (result && result.success) {
        console.log('File created successfully');
        alert('File "' + fileName + '" created successfully!');
        
        // Add the new file to the editor
        const newFile = {
          id: filePath,
          name: fileName,
          path: filePath,
          content: defaultContent,
          language: getLanguageFromExtension(fileName),
          modified: false,
          lastModified: new Date()
        };
        
        dispatch({ type: 'ADD_OPEN_FILE', payload: newFile });
        dispatch({ type: 'SET_CURRENT_FILE', payload: filePath });
        
        // Refresh file tree to show new file
        handleRefresh();
      } else {
        console.error('File creation failed:', result ? result.error : 'Unknown error');
        alert('Failed to create file: ' + (result ? result.error : 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in handleNewFile:', error);
      alert('Error creating file: ' + String(error));
    }
  };

  const handleNewFolder = async () => {
    try {
      console.log('handleNewFolder called');
      
      if (!window.electronAPI) {
        console.error('Electron API not available');
        alert('Electron API not available');
        return;
      }
      
      // Use a simple prompt alternative - this is a workaround for now
      const folderName = window.prompt('Enter folder name:', 'new-folder');
      if (!folderName || folderName.trim() === '') {
        console.log('Folder creation canceled by user');
        return;
      }
      
      const sanitizedFolderName = folderName.trim().replace(/[<>:"/\\|?*]/g, '-');
      console.log('Creating folder:', sanitizedFolderName);
      
      // Use mkdir command
      const result = await window.electronAPI.invoke('terminal:execute', 'mkdir "' + sanitizedFolderName + '"', './');
      console.log('Folder creation result:', result);
      
      if (result && result.success) {
        console.log('Folder created successfully');
        alert('Folder "' + folderName + '" created successfully!');
        
        // Refresh file tree to show new folder
        handleRefresh();
      } else {
        console.error('Folder creation failed:', result ? result.stderr : 'Unknown error');
        alert('Failed to create folder: ' + (result ? result.stderr || 'Unknown error' : 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in handleNewFolder:', error);
      alert('Error creating folder: ' + String(error));
    }
  };

  const handleRefresh = async () => {
    try {
      console.log('Refresh clicked - reloading files');
      setIsLoading(true);
      const result = await ipcService.readDirectory(currentWorkspace.path);
      if (result.success && result.files) {
        // Filter out irrelevant directories
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
        console.log('File tree refreshed, found', fileNodes.length, 'items');
      }
    } catch (error) {
      console.error('Error refreshing file tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      console.log('handleOpenFolder called');
      
      if (!window.electronAPI) {
        console.error('Electron API not available');
        alert('Electron API not available');
        return;
      }
      
      const result = await window.electronAPI.invoke('dialog:openDirectory');
      console.log('Open directory result:', result);
      
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        const folderName = folderPath.split('/').pop() || 'Unknown Project';
        
        const newWorkspace = {
          name: folderName,
          path: folderPath
        };

        // Update current workspace
        setCurrentWorkspace(newWorkspace);

        // Add to recent projects (avoid duplicates)
        setRecentProjects(prev => {
          const filtered = prev.filter(p => p.path !== folderPath);
          return [newWorkspace, ...filtered].slice(0, 10); // Keep only 10 recent projects
        });

        // Clear current open files when switching workspace
        dispatch({ type: 'CLEAR_OPEN_FILES' });
        
        console.log('Switched to workspace:', newWorkspace);
        alert(`Opened project: ${folderName}`);
      } else {
        console.log('Dialog was canceled');
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      alert('Error opening folder: ' + String(error));
    }
  };

  const handleSwitchProject = (project: {name: string, path: string}) => {
    setCurrentWorkspace(project);
    dispatch({ type: 'CLEAR_OPEN_FILES' });
    
    // Move to front of recent projects
    setRecentProjects(prev => {
      const filtered = prev.filter(p => p.path !== project.path);
      return [project, ...filtered];
    });
  };

  const handleCloseFolder = () => {
    setCurrentWorkspace({
      name: 'No Folder Open',
      path: ''
    });
    setFileTree([]);
    dispatch({ type: 'CLEAR_OPEN_FILES' });
  };

  return (
    <ExplorerContainer>
      <WorkspaceHeader>
        <WorkspaceTitle>Explorer</WorkspaceTitle>
        <ProjectName onClick={handleOpenFolder}>
          <span>{currentWorkspace.name}</span>
          <ProjectActions>
            {recentProjects.length > 0 && (
              <ActionButton 
                title="Recent Projects" 
                onClick={(e) => {
                  e.stopPropagation();
                  // Show recent projects dropdown (for now just show alert)
                  const projectList = recentProjects.map(p => p.name).join('\n');
                  alert('Recent Projects:\n' + projectList);
                }}
              >
                📋
              </ActionButton>
            )}
            <ActionButton title="Open Folder" onClick={handleOpenFolder}>
              📂
            </ActionButton>
            {currentWorkspace.path && (
              <ActionButton title="Close Folder" onClick={handleCloseFolder}>
                ✕
              </ActionButton>
            )}
          </ProjectActions>
        </ProjectName>
      </WorkspaceHeader>
      <ToolbarContainer>
        <div style={{ display: 'flex', gap: '4px' }}>
          <ToolbarButton onClick={() => {
            console.log('New File button clicked!');
            alert('New File button was clicked!');
            handleNewFile();
          }} title="New File">
            📄
          </ToolbarButton>
          <ToolbarButton onClick={() => {
            console.log('New Folder button clicked!');
            alert('New Folder button was clicked!');
            handleNewFolder();
          }} title="New Folder">
            📁
          </ToolbarButton>
          <ToolbarButton onClick={() => {
            console.log('Refresh button clicked!');
            alert('Refresh button was clicked!');
            handleRefresh();
          }} title="Refresh">
            ↻
          </ToolbarButton>
        </div>
        <ToolbarButton onClick={() => {
          console.log('Open Folder button clicked!');
          alert('Open Folder button was clicked!');
          handleOpenFolder();
        }} title="Open Folder">
          📂
        </ToolbarButton>
      </ToolbarContainer>
      
      <FileTree>
        {isLoading ? (
          <EmptyState>
            <div>Loading project files...</div>
          </EmptyState>
        ) : fileTree.length === 0 ? (
          <EmptyState>
            <div>No files found</div>
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              Click the refresh button to reload files
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