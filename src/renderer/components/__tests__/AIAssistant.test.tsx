/**
 * AI Assistant Component Tests
 * Tests for the AI-powered assistant functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { AIAssistant } from '../Sidebar/AIAssistant';

// Mock IPC
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  send: jest.fn(),
};

(global as any).window = {
  electronAPI: mockIpcRenderer,
};

describe('AIAssistant Component', () => {
  const defaultProps = {
    onCodeGenerated: jest.fn(),
    onCodeExplained: jest.fn(),
    currentCode: 'const x = 1;',
    selectedText: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIpcRenderer.invoke.mockResolvedValue('AI response');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders AI assistant interface', () => {
    render(<AIAssistant {...defaultProps} />);
    
    expect(screen.getByTestId('ai-assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask ai assistant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  test('displays chat history', () => {
    render(<AIAssistant {...defaultProps} />);
    
    const chatHistory = screen.getByTestId('chat-history');
    expect(chatHistory).toBeInTheDocument();
  });

  test('sends message to AI when form is submitted', async () => {
    const user = userEvent.setup();
    render(<AIAssistant {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Explain this code');
    await user.click(sendButton);
    
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
      'ai-chat',
      'Explain this code'
    );
  });

  test('sends message with Enter key', async () => {
    const user = userEvent.setup();
    render(<AIAssistant {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    
    await user.type(input, 'Generate a React component');
    await user.keyboard('{Enter}');
    
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
      'ai-chat',
      'Generate a React component'
    );
  });

  test('prevents sending empty messages', async () => {
    const user = userEvent.setup();
    render(<AIAssistant {...defaultProps} />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.click(sendButton);
    
    expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
  });

  test('displays loading state while waiting for AI response', async () => {
    const user = userEvent.setup();
    mockIpcRenderer.invoke.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('AI response'), 1000))
    );
    
    render(<AIAssistant {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  test('displays AI response in chat history', async () => {
    const user = userEvent.setup();
    mockIpcRenderer.invoke.mockResolvedValue('This is an AI response');
    
    render(<AIAssistant {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test question');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument();
      expect(screen.getByText('This is an AI response')).toBeInTheDocument();
    });
  });

  test('handles code generation requests', async () => {
    const user = userEvent.setup();
    const generatedCode = 'const Component = () => <div>Hello</div>;';
    mockIpcRenderer.invoke.mockResolvedValue(generatedCode);
    
    render(<AIAssistant {...defaultProps} />);
    
    const generateButton = screen.getByRole('button', { name: /generate code/i });
    await user.click(generateButton);
    
    const input = screen.getByPlaceholderText(/describe what you want to create/i);
    await user.type(input, 'Create a React component');
    
    const submitButton = screen.getByRole('button', { name: /generate/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'ai-generate-code',
        'Create a React component'
      );
      expect(defaultProps.onCodeGenerated).toHaveBeenCalledWith(generatedCode);
    });
  });

  test('handles code explanation requests', async () => {
    const user = userEvent.setup();
    const explanation = 'This code declares a constant variable x with value 1';
    mockIpcRenderer.invoke.mockResolvedValue(explanation);
    
    render(<AIAssistant {...defaultProps} />);
    
    const explainButton = screen.getByRole('button', { name: /explain code/i });
    await user.click(explainButton);
    
    await waitFor(() => {
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'ai-explain-code',
        defaultProps.currentCode
      );
      expect(defaultProps.onCodeExplained).toHaveBeenCalledWith(explanation);
    });
  });

  test('explains selected text when available', async () => {
    const user = userEvent.setup();
    const selectedText = 'const y = 2;';
    const explanation = 'This declares a constant y with value 2';
    mockIpcRenderer.invoke.mockResolvedValue(explanation);
    
    render(<AIAssistant {...defaultProps} selectedText={selectedText} />);
    
    const explainButton = screen.getByRole('button', { name: /explain selected/i });
    await user.click(explainButton);
    
    await waitFor(() => {
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'ai-explain-code',
        selectedText
      );
    });
  });

  test('handles AI service errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockIpcRenderer.invoke.mockRejectedValue(new Error('AI service unavailable'));
    
    render(<AIAssistant {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error: ai service unavailable/i)).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  test('clears chat history when requested', async () => {
    const user = userEvent.setup();
    render(<AIAssistant {...defaultProps} />);
    
    // Add some messages first
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    
    // Clear history
    const clearButton = screen.getByRole('button', { name: /clear history/i });
    await user.click(clearButton);
    
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  test('supports different AI models', async () => {
    const user = userEvent.setup();
    render(<AIAssistant {...defaultProps} />);
    
    const modelSelect = screen.getByTestId('ai-model-select');
    await user.selectOptions(modelSelect, 'gpt-4');
    
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    await user.type(input, 'Test with GPT-4');
    await user.keyboard('{Enter}');
    
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
      'ai-chat',
      'Test with GPT-4',
      { model: 'gpt-4' }
    );
  });

  test('saves and restores chat history', async () => {
    const user = userEvent.setup();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify([
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' }
      ])),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    render(<AIAssistant {...defaultProps} />);
    
    // Check if previous history is restored
    expect(screen.getByText('Previous message')).toBeInTheDocument();
    expect(screen.getByText('Previous response')).toBeInTheDocument();
    
    // Add new message
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    await user.type(input, 'New message');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai-chat-history',
        expect.stringContaining('New message')
      );
    });
  });

  test('handles context-aware conversations', async () => {
    const user = userEvent.setup();
    render(<AIAssistant {...defaultProps} />);
    
    // First message
    const input = screen.getByPlaceholderText(/ask ai assistant/i);
    await user.type(input, 'What is React?');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'ai-chat',
        'What is React?'
      );
    });
    
    // Follow-up message should include context
    await user.clear(input);
    await user.type(input, 'How do I use hooks?');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'ai-chat',
        'How do I use hooks?',
        expect.objectContaining({
          context: expect.arrayContaining([
            expect.objectContaining({ content: 'What is React?' })
          ])
        })
      );
    });
  });
});

