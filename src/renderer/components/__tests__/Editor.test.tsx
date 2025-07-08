/**
 * Editor Component Tests
 * Tests for the Monaco Editor integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Editor } from '../Editor/Editor';

// Mock Monaco Editor
jest.mock('monaco-editor', () => ({
  editor: {
    create: jest.fn(() => ({
      getValue: jest.fn(() => 'test content'),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      getModel: jest.fn(() => ({
        getLanguageId: jest.fn(() => 'typescript'),
        setValue: jest.fn(),
      })),
      setModel: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
    })),
    createModel: jest.fn(() => ({
      setValue: jest.fn(),
      getValue: jest.fn(() => 'test content'),
      getLanguageId: jest.fn(() => 'typescript'),
      dispose: jest.fn(),
    })),
    setTheme: jest.fn(),
    defineTheme: jest.fn(),
  },
  languages: {
    typescript: {
      typescriptDefaults: {
        setCompilerOptions: jest.fn(),
        setDiagnosticsOptions: jest.fn(),
      },
    },
    registerCompletionItemProvider: jest.fn(),
    registerHoverProvider: jest.fn(),
  },
}));

// Mock IPC
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
};

(global as any).window = {
  electronAPI: mockIpcRenderer,
};

describe('Editor Component', () => {
  const defaultProps = {
    value: 'console.log("Hello World");',
    language: 'typescript',
    onChange: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders editor container', () => {
    render(<Editor {...defaultProps} />);
    
    const editorContainer = screen.getByTestId('monaco-editor-container');
    expect(editorContainer).toBeInTheDocument();
  });

  test('initializes Monaco editor with correct options', async () => {
    const monaco = require('monaco-editor');
    
    render(<Editor {...defaultProps} />);
    
    await waitFor(() => {
      expect(monaco.editor.create).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          value: defaultProps.value,
          language: defaultProps.language,
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          tabSize: 2,
          insertSpaces: true,
        })
      );
    });
  });

  test('calls onChange when editor content changes', async () => {
    const monaco = require('monaco-editor');
    const mockEditor = {
      getValue: jest.fn(() => 'new content'),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      getModel: jest.fn(() => ({
        getLanguageId: jest.fn(() => 'typescript'),
      })),
      setModel: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
    };
    
    monaco.editor.create.mockReturnValue(mockEditor);
    
    render(<Editor {...defaultProps} />);
    
    // Simulate content change
    const changeHandler = mockEditor.onDidChangeModelContent.mock.calls[0][0];
    changeHandler();
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('new content');
  });

  test('handles save command (Ctrl+S)', async () => {
    const monaco = require('monaco-editor');
    const mockEditor = {
      getValue: jest.fn(() => 'content to save'),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      getModel: jest.fn(() => ({
        getLanguageId: jest.fn(() => 'typescript'),
      })),
      setModel: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
    };
    
    monaco.editor.create.mockReturnValue(mockEditor);
    
    render(<Editor {...defaultProps} />);
    
    // Simulate save command
    const saveCommand = mockEditor.addCommand.mock.calls.find(
      call => call[1] === 'editor.action.save'
    );
    
    expect(saveCommand).toBeDefined();
    
    // Execute save command
    if (saveCommand) {
      const saveHandler = saveCommand[2];
      saveHandler();
      expect(defaultProps.onSave).toHaveBeenCalledWith('content to save');
    }
  });

  test('updates editor value when prop changes', async () => {
    const monaco = require('monaco-editor');
    const mockEditor = {
      getValue: jest.fn(() => 'old content'),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      getModel: jest.fn(() => ({
        getLanguageId: jest.fn(() => 'typescript'),
      })),
      setModel: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
    };
    
    monaco.editor.create.mockReturnValue(mockEditor);
    
    const { rerender } = render(<Editor {...defaultProps} />);
    
    // Update value prop
    rerender(<Editor {...defaultProps} value="new content" />);
    
    expect(mockEditor.setValue).toHaveBeenCalledWith('new content');
  });

  test('changes language when language prop changes', async () => {
    const monaco = require('monaco-editor');
    const mockModel = {
      setValue: jest.fn(),
      getValue: jest.fn(() => 'test content'),
      getLanguageId: jest.fn(() => 'typescript'),
      dispose: jest.fn(),
    };
    
    const mockEditor = {
      getValue: jest.fn(() => 'test content'),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      getModel: jest.fn(() => mockModel),
      setModel: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
    };
    
    monaco.editor.create.mockReturnValue(mockEditor);
    monaco.editor.createModel.mockReturnValue(mockModel);
    
    const { rerender } = render(<Editor {...defaultProps} />);
    
    // Change language
    rerender(<Editor {...defaultProps} language="javascript" />);
    
    expect(monaco.editor.createModel).toHaveBeenCalledWith(
      'test content',
      'javascript'
    );
    expect(mockEditor.setModel).toHaveBeenCalledWith(mockModel);
  });

  test('disposes editor on unmount', () => {
    const monaco = require('monaco-editor');
    const mockEditor = {
      getValue: jest.fn(() => 'test content'),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      getModel: jest.fn(() => ({
        getLanguageId: jest.fn(() => 'typescript'),
      })),
      setModel: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
    };
    
    monaco.editor.create.mockReturnValue(mockEditor);
    
    const { unmount } = render(<Editor {...defaultProps} />);
    
    unmount();
    
    expect(mockEditor.dispose).toHaveBeenCalled();
  });

  test('handles resize events', async () => {
    const monaco = require('monaco-editor');
    const mockEditor = {
      getValue: jest.fn(() => 'test content'),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      getModel: jest.fn(() => ({
        getLanguageId: jest.fn(() => 'typescript'),
      })),
      setModel: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
    };
    
    monaco.editor.create.mockReturnValue(mockEditor);
    
    render(<Editor {...defaultProps} />);
    
    // Simulate window resize
    fireEvent(window, new Event('resize'));
    
    await waitFor(() => {
      expect(mockEditor.layout).toHaveBeenCalled();
    });
  });

  test('supports AI-powered features', async () => {
    const monaco = require('monaco-editor');
    const mockEditor = {
      getValue: jest.fn(() => 'test content'),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      dispose: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      getModel: jest.fn(() => ({
        getLanguageId: jest.fn(() => 'typescript'),
      })),
      setModel: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
    };
    
    monaco.editor.create.mockReturnValue(mockEditor);
    
    render(<Editor {...defaultProps} />);
    
    // Check if AI actions are registered
    const aiActions = mockEditor.addAction.mock.calls.filter(call =>
      call[0].id.includes('ai')
    );
    
    expect(aiActions.length).toBeGreaterThan(0);
  });
});

