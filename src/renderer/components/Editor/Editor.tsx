import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as monaco from 'monaco-editor';
import { useAppState, useCurrentFile, useOpenFiles } from '../../hooks/useAppState';
import { ipcService } from '../../services/ipc';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.colors.background};
`;

const TabBar = styled.div`
  display: flex;
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  overflow-x: auto;
  min-height: 32px;
  align-items: center;
`;

const RunButtonsContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-left: auto;
  padding: 0 ${props => props.theme.spacing.sm};
`;

const RunButton = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.primary};
  color: #000000;
  font-size: ${props => props.theme.fontSizes.small};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: ${props => props.theme.shadows.small};
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryHover || props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.neonCyan};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Tab = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.$active ? props.theme.colors.background : 'transparent'};
  border-right: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  user-select: none;
  min-width: 120px;
  max-width: 200px;
  position: relative;
  
  &:hover {
    background-color: ${props => props.$active ? props.theme.colors.background : props.theme.colors.surfaceHover};
  }
`;

const TabTitle = styled.span`
  font-size: ${props => props.theme.fontSizes.small};
  color: ${props => props.theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const TabClose = styled.button`
  margin-left: ${props => props.theme.spacing.xs};
  width: 16px;
  height: 16px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  
  &:hover {
    background-color: ${props => props.theme.colors.surfaceHover};
    color: ${props => props.theme.colors.text};
  }
`;

const ModifiedIndicator = styled.span`
  color: ${props => props.theme.colors.warning};
  margin-left: ${props => props.theme.spacing.xs};
  font-size: 10px;
`;

const EditorWrapper = styled.div`
  flex: 1;
  position: relative;
  min-height: 300px;
  
  .monaco-editor {
    pointer-events: auto !important;
  }
  
  .monaco-editor .inputarea {
    pointer-events: auto !important;
  }
`;

const EmptyState = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.large};
  gap: ${props => props.theme.spacing.md};
`;

const Editor: React.FC = () => {
  const { state, dispatch } = useAppState();
  const currentFile = useCurrentFile();
  const openFiles = useOpenFiles();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const isUpdatingContentRef = useRef(false);

  // Initialize Monaco Editor
  useEffect(() => {
    let contentChangeListener: any = null;
    
    // Add small delay to ensure DOM is ready
    const initializeEditor = () => {
      if (editorRef.current && !monacoRef.current) {
        monaco.editor.defineTheme('galactus-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
          { token: 'comment', foreground: '6E7681' },
          { token: 'keyword', foreground: 'FF7B72' },
          { token: 'string', foreground: 'A5C261' },
          { token: 'number', foreground: '79C0FF' },
          { token: 'type', foreground: 'F0F6FC' },
          { token: 'function', foreground: 'D2A8FF' },
          { token: 'variable', foreground: 'FFA657' }
        ],
        colors: {
          'editor.background': '#0D1117',
          'editor.foreground': '#F0F6FC',
          'editor.lineHighlightBackground': '#161B22',
          'editorCursor.foreground': '#58A6FF',
          'editor.selectionBackground': '#58A6FF40',
          'editorLineNumber.foreground': '#6E7681',
          'editorLineNumber.activeForeground': '#F0F6FC'
        }
      });

      // Configure Monaco with TypeScript compiler defaults
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
      });

      // Create editor instance
      monacoRef.current = monaco.editor.create(editorRef.current, {
        value: currentFile ? openFiles.find(f => f.id === currentFile)?.content || '' : '',
        language: 'typescript',
        theme: 'galactus-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "source-code-pro", monospace',
        lineNumbers: 'on',
        rulers: [80, 120],
        wordWrap: 'on',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        readOnly: false, // Explicitly make editor editable
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        }
      });

      // Handle content changes
      contentChangeListener = monacoRef.current.onDidChangeModelContent(() => {
        if (currentFile && monacoRef.current && !isUpdatingContentRef.current) {
          const content = monacoRef.current.getValue();
          console.log('Editor content changed for file:', currentFile, 'new length:', content.length);
          dispatch({
            type: 'UPDATE_FILE_CONTENT',
            payload: { id: currentFile, content }
          });
          
          // Auto-save after a delay
          setTimeout(async () => {
            const file = openFiles.find(f => f.id === currentFile);
            if (file && file.modified) {
              try {
                const result = await ipcService.writeFile(file.path, content);
                if (result.success) {
                  console.log(`Auto-saved: ${file.name}`);
                }
              } catch (error) {
                console.error('Auto-save failed:', error);
              }
            }
          }, 2000); // Auto-save after 2 seconds of no changes
        }
      });

      // Add save keyboard shortcut (Ctrl+S / Cmd+S)
      monacoRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
        if (currentFile) {
          const content = monacoRef.current?.getValue() || '';
          const file = openFiles.find(f => f.id === currentFile);
          if (file) {
            try {
              const result = await ipcService.writeFile(file.path, content);
              if (result.success) {
                console.log(`Saved: ${file.name}`);
                // Reset modified state
                dispatch({
                  type: 'UPDATE_FILE_CONTENT',
                  payload: { id: currentFile, content }
                });
              } else {
                console.error('Save failed:', result.error);
              }
            } catch (error) {
              console.error('Save error:', error);
            }
          }
        }
      });

      setIsEditorReady(true);
      }
    };

    // Initialize immediately if DOM is ready, otherwise wait a bit
    if (editorRef.current) {
      initializeEditor();
    } else {
      setTimeout(initializeEditor, 100);
    }

    return () => {
      if (contentChangeListener) {
        contentChangeListener.dispose();
      }
      if (monacoRef.current) {
        monacoRef.current.dispose();
        monacoRef.current = null;
        setIsEditorReady(false);
      }
    };
  }, []);

  // Expose the Monaco editor instance and current file name globally for AI context
  useEffect(() => {
    if (monacoRef.current) {
      (window as any).__galactusEditor = monacoRef.current;
    }
  }, [monacoRef.current]);

  useEffect(() => {
    (window as any).__galactusCurrentFileName = currentFile
      ? openFiles.find(f => f.id === currentFile)?.name
      : undefined;
  }, [currentFile, openFiles]);

  // Listen for AI code insertion events to insert generated code at cursor
  useEffect(() => {
    if (monacoRef.current && window.electronAPI) {
      // Insert code at cursor position
      window.electronAPI.on('editor:insert-code', (code: string) => {
        const editor = monacoRef.current!;
        editor.focus();
        const pos = editor.getPosition();
        if (!pos) return;
        const range = new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
        editor.executeEdits('ai-insert', [{ range, text: code, forceMoveMarkers: true }]);
      });

      // Replace selected text
      window.electronAPI.on('editor:replace-selection', (code: string) => {
        const editor = monacoRef.current!;
        editor.focus();
        const selection = editor.getSelection();
        if (selection) {
          editor.executeEdits('ai-replace', [{ range: selection, text: code, forceMoveMarkers: true }]);
        }
      });

      // Select all text
      window.electronAPI.on('editor:select-all', () => {
        const editor = monacoRef.current!;
        editor.focus();
        const model = editor.getModel();
        if (model) {
          const fullRange = model.getFullModelRange();
          editor.setSelection(fullRange);
        }
      });

      // Format code
      window.electronAPI.on('editor:format-code', () => {
        const editor = monacoRef.current!;
        editor.focus();
        editor.getAction('editor.action.formatDocument')?.run();
      });

      // Cleanup listeners on unmount
      return () => {
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners('editor:insert-code');
          window.electronAPI.removeAllListeners('editor:replace-selection');
          window.electronAPI.removeAllListeners('editor:select-all');
          window.electronAPI.removeAllListeners('editor:format-code');
        }
      };
    }
  }, [monacoRef.current]);

  // Update editor content when current file changes
  useEffect(() => {
    console.log('=== Editor Content Update Effect ===');
    console.log('currentFile:', currentFile);
    console.log('isEditorReady:', isEditorReady);
    console.log('openFiles count:', openFiles.length);
    
    if (monacoRef.current && isEditorReady && currentFile) {
      const file = openFiles.find(f => f.id === currentFile);
      console.log('Found file in openFiles:', file ? `${file.name} (${file.content?.length || 0} chars)` : 'none');
      
      if (file) {
        // Check if file has empty content but should have content - reload from disk
        if (!file.content || file.content.length === 0) {
          console.log('File has empty content, attempting to reload from disk...');
          const reloadFile = async () => {
            try {
              const result = await ipcService.readFile(file.path);
              if (result.success && result.content) {
                console.log('Reloaded file content:', result.content.length, 'characters');
                // Update the file content in state
                dispatch({
                  type: 'UPDATE_FILE_CONTENT',
                  payload: { id: file.id, content: result.content }
                });
                // Set content in editor immediately
                const model = monacoRef.current?.getModel();
                if (model) {
                  isUpdatingContentRef.current = true;
                  model.setValue(result.content);
                  isUpdatingContentRef.current = false;
                }
              } else {
                console.error('Failed to reload file:', result.error);
              }
            } catch (error) {
              console.error('Error reloading file:', error);
            }
          };
          reloadFile();
          return;
        }
        
        const model = monacoRef.current.getModel();
        if (model) {
          console.log('Setting editor content for:', file.name, 'Content length:', file.content.length);
          isUpdatingContentRef.current = true;
          model.setValue(file.content || '');
          isUpdatingContentRef.current = false;
          
          // Set language based on file extension
          const extension = file.name.split('.').pop();
          const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'md': 'markdown',
            'py': 'python'
          };
          
          const language = languageMap[extension || ''] || 'plaintext';
          monaco.editor.setModelLanguage(model, language);
          console.log('Set language to:', language);
          
          // Force focus and ensure editor is editable
          setTimeout(() => {
            if (monacoRef.current) {
              monacoRef.current.focus();
              monacoRef.current.updateOptions({ readOnly: false });
              console.log('Editor focused and made editable for file:', file.name);
            }
          }, 100);
        } else {
          console.error('Monaco model not found!');
        }
      } else {
        console.log('No file found, clearing editor');
        const model = monacoRef.current.getModel();
        if (model) {
          isUpdatingContentRef.current = true;
          model.setValue('');
          isUpdatingContentRef.current = false;
        }
      }
    } else {
      console.log('Editor not ready, monaco not available, or no current file');
    }
    console.log('=== End Editor Content Update Effect ===');
  }, [currentFile, openFiles, isEditorReady, dispatch]);

  const handleTabClick = (fileId: string) => {
    dispatch({ type: 'SET_CURRENT_FILE', payload: fileId });
  };

  const handleTabClose = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_OPEN_FILE', payload: fileId });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop();
    const iconMap: { [key: string]: string } = {
      'js': '🟨',
      'jsx': '🔷',
      'ts': '🔵',
      'tsx': '🔷',
      'html': '🟧',
      'css': '🟦',
      'scss': '🟪',
      'json': '🟫',
      'md': '📝',
      'py': '🐍'
    };
    return iconMap[extension || ''] || '📄';
  };

  const handleRunPython = async () => {
    console.log('Run Python clicked!', { currentFile, hasEditor: !!monacoRef.current });
    if (!currentFile || !monacoRef.current) return;
    
    const content = monacoRef.current.getValue();
    const file = openFiles.find(f => f.id === currentFile);
    
    if (!file || !file.name.endsWith('.py')) {
      console.log('Error: Please select a Python file to run');
      alert('Error: Please select a Python file to run');
      return;
    }

    // Write the current content to a temporary file and execute
    const tempFilePath = `/tmp/${file.name}`;
    const writeResult = await ipcService.writeFile(tempFilePath, content);
    
    if (writeResult.success) {
      console.log(`Running ${file.name}...`);
      
      const result = await ipcService.executeCommand(`python3 "${tempFilePath}"`);
      if (result.success) {
        if (result.stdout) {
          console.log('Python output:', result.stdout);
          // Set global terminal content for AI to see
          (window as any).__galactusTerminalContent = (window as any).__galactusTerminalContent || '';
          (window as any).__galactusTerminalContent += `$ python3 ${file.name}\n${result.stdout}\n`;
          alert(`Python executed successfully!\nOutput: ${result.stdout.substring(0, 200)}${result.stdout.length > 200 ? '...' : ''}`);
        }
        if (result.stderr) {
          console.error('Python error:', result.stderr);
          alert(`Python execution error: ${result.stderr}`);
        }
      } else {
        console.error('Failed to execute Python script');
        alert('Failed to execute Python script');
      }
    } else {
      console.error('Failed to write temporary file');
      alert('Failed to write temporary file');
    }
  };

  const handleRunHTML = async () => {
    console.log('Run HTML clicked!', { currentFile, hasEditor: !!monacoRef.current });
    if (!currentFile || !monacoRef.current) return;
    
    const content = monacoRef.current.getValue();
    const file = openFiles.find(f => f.id === currentFile);
    
    if (!file || !file.name.endsWith('.html')) {
      console.log('Error: Please select an HTML file to run');
      alert('Error: Please select an HTML file to run');
      return;
    }

    // Create a data URL for the HTML content and navigate the browser to it
    const htmlDataUrl = `data:text/html;base64,${btoa(content)}`;
    
    // Send navigation request to browser panel via IPC
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('browser:navigate', htmlDataUrl);
        if (result && result.success) {
          console.log(`✅ Displaying ${file.name} in browser panel`);
          alert(`✅ HTML preview opened successfully!\n${file.name} is now displayed in the browser panel.`);
        } else {
          console.error(`❌ Browser navigation failed: ${result ? result.error : 'Unknown error'}`);
          alert(`❌ Browser navigation failed: ${result ? result.error : 'Unknown error'}`);
        }
      } else {
        console.error('❌ Electron API not available');
        alert('❌ Electron API not available');
      }
    } catch (error) {
      console.error('HTML run error:', error);
      alert(`❌ Browser navigation error: ${error}`);
    }
  };

  const getCurrentFileExtension = () => {
    if (!currentFile) return null;
    const file = openFiles.find(f => f.id === currentFile);
    return file?.name.split('.').pop() || null;
  };

  const canRunPython = () => getCurrentFileExtension() === 'py';
  const canRunHTML = () => getCurrentFileExtension() === 'html';

  return (
    <EditorContainer>
      {openFiles.length > 0 && (
        <TabBar>
          {openFiles.map(file => (
            <Tab
              key={file.id}
              $active={file.id === currentFile}
              onClick={() => handleTabClick(file.id)}
            >
              <span style={{ marginRight: '4px' }}>{getFileIcon(file.name)}</span>
              <TabTitle>{file.name}</TabTitle>
              {file.modified && <ModifiedIndicator>●</ModifiedIndicator>}
              <TabClose onClick={(e) => handleTabClose(file.id, e)}>
                ×
              </TabClose>
            </Tab>
          ))}
          
          <RunButtonsContainer>
            <RunButton
              onClick={handleRunPython}
              disabled={!canRunPython()}
              title="Run Python code"
            >
              🐍 Run Python
            </RunButton>
            <RunButton
              onClick={handleRunHTML}
              disabled={!canRunHTML()}
              title="Preview HTML in browser"
            >
              🌐 Run HTML
            </RunButton>
            <RunButton
              onClick={() => dispatch({ type: 'TOGGLE_TERMINAL_PANEL' })}
              title={state.terminal.showTerminalPanel ? "Hide Terminal" : "Show Terminal"}
            >
              {state.terminal.showTerminalPanel ? '📱 Hide Terminal' : '🖥️ Show Terminal'}
            </RunButton>
          </RunButtonsContainer>
        </TabBar>
      )}
      
      <EditorWrapper>
        {openFiles.length === 0 ? (
          <EmptyState>
            <div>🌌</div>
            <div>GalactusIDE</div>
            <div style={{ fontSize: '14px' }}>Open a file to start coding</div>
          </EmptyState>
        ) : (
          <div 
            ref={editorRef} 
            style={{ 
              height: '100%', 
              width: '100%', 
              minHeight: '300px',
              position: 'relative'
            }} 
          />
        )}
      </EditorWrapper>
    </EditorContainer>
  );
};

export default Editor;