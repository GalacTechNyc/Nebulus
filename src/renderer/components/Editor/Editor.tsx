import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as monaco from 'monaco-editor';
import { useAppState, useCurrentFile, useOpenFiles } from '../../hooks/useAppState';

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
`;

const Tab = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background-color: ${props => props.active ? props.theme.colors.background : 'transparent'};
  border-right: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  user-select: none;
  min-width: 120px;
  max-width: 200px;
  position: relative;
  
  &:hover {
    background-color: ${props => props.active ? props.theme.colors.background : props.theme.colors.surfaceHover};
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

  // Initialize Monaco Editor
  useEffect(() => {
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
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        }
      });

      // Handle content changes
      monacoRef.current.onDidChangeModelContent(() => {
        if (currentFile && monacoRef.current) {
          const content = monacoRef.current.getValue();
          dispatch({
            type: 'UPDATE_FILE_CONTENT',
            payload: { id: currentFile, content }
          });
        }
      });

      setIsEditorReady(true);
    }

    return () => {
      if (monacoRef.current) {
        monacoRef.current.dispose();
        monacoRef.current = null;
        setIsEditorReady(false);
      }
    };
  }, []);

  // Listen for AI code insertion events to insert generated code at cursor
  useEffect(() => {
    if (monacoRef.current && window.electronAPI) {
      window.electronAPI.on('editor:insert-code', (code: string) => {
        const editor = monacoRef.current!;
        editor.focus();
        const pos = editor.getPosition();
        if (!pos) return;
        const range = new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
        editor.executeEdits('ai-insert', [{ range, text: code, forceMoveMarkers: true }]);
      });
    }
  }, [monacoRef.current]);

  // Update editor content when current file changes
  useEffect(() => {
    if (monacoRef.current && isEditorReady) {
      const file = openFiles.find(f => f.id === currentFile);
      if (file) {
        const model = monacoRef.current.getModel();
        if (model) {
          model.setValue(file.content);
          
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
        }
      } else {
        monacoRef.current.setValue('');
      }
    }
  }, [currentFile, openFiles, isEditorReady]);

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

  return (
    <EditorContainer>
      {openFiles.length > 0 && (
        <TabBar>
          {openFiles.map(file => (
            <Tab
              key={file.id}
              active={file.id === currentFile}
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
          <div ref={editorRef} style={{ height: '100%', width: '100%' }} />
        )}
      </EditorWrapper>
    </EditorContainer>
  );
};

export default Editor;