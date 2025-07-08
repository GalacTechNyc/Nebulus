/**
 * Terminal Component Tests
 * Tests for the XTerm.js terminal integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Terminal } from '../Terminal/Terminal';

// Mock XTerm.js
const mockTerminal = {
  open: jest.fn(),
  write: jest.fn(),
  writeln: jest.fn(),
  clear: jest.fn(),
  dispose: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
  resize: jest.fn(),
  onData: jest.fn(),
  onResize: jest.fn(),
  onTitleChange: jest.fn(),
  loadAddon: jest.fn(),
  element: document.createElement('div'),
};

const mockFitAddon = {
  fit: jest.fn(),
  proposeDimensions: jest.fn(() => ({ cols: 80, rows: 24 })),
};

const mockWebLinksAddon = {
  activate: jest.fn(),
};

jest.mock('@xterm/xterm', () => ({
  Terminal: jest.fn(() => mockTerminal),
}));

jest.mock('@xterm/addon-fit', () => ({
  FitAddon: jest.fn(() => mockFitAddon),
}));

jest.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: jest.fn(() => mockWebLinksAddon),
}));

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

describe('Terminal Component', () => {
  const defaultProps = {
    id: 'terminal-1',
    onData: jest.fn(),
    onResize: jest.fn(),
    onTitleChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders terminal container', () => {
    render(<Terminal {...defaultProps} />);
    
    const terminalContainer = screen.getByTestId('terminal-container');
    expect(terminalContainer).toBeInTheDocument();
  });

  test('initializes XTerm terminal with correct options', async () => {
    const { Terminal: XTerminal } = require('@xterm/xterm');
    
    render(<Terminal {...defaultProps} />);
    
    await waitFor(() => {
      expect(XTerminal).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: expect.objectContaining({
            background: '#1e1e1e',
            foreground: '#d4d4d4',
          }),
          fontSize: 14,
          fontFamily: 'Consolas, "Courier New", monospace',
          cursorBlink: true,
          allowTransparency: true,
          scrollback: 1000,
        })
      );
    });
  });

  test('loads required addons', async () => {
    render(<Terminal {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockTerminal.loadAddon).toHaveBeenCalledWith(mockFitAddon);
      expect(mockTerminal.loadAddon).toHaveBeenCalledWith(mockWebLinksAddon);
    });
  });

  test('opens terminal in container', async () => {
    render(<Terminal {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockTerminal.open).toHaveBeenCalledWith(
        expect.any(HTMLElement)
      );
    });
  });

  test('fits terminal to container size', async () => {
    render(<Terminal {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockFitAddon.fit).toHaveBeenCalled();
    });
  });

  test('handles terminal data input', async () => {
    render(<Terminal {...defaultProps} />);
    
    // Simulate data input
    const dataHandler = mockTerminal.onData.mock.calls[0][0];
    dataHandler('test command\r');
    
    expect(defaultProps.onData).toHaveBeenCalledWith('test command\r');
  });

  test('handles terminal resize', async () => {
    render(<Terminal {...defaultProps} />);
    
    // Simulate resize
    const resizeHandler = mockTerminal.onResize.mock.calls[0][0];
    resizeHandler({ cols: 100, rows: 30 });
    
    expect(defaultProps.onResize).toHaveBeenCalledWith({ cols: 100, rows: 30 });
  });

  test('handles title change', async () => {
    render(<Terminal {...defaultProps} />);
    
    // Simulate title change
    const titleHandler = mockTerminal.onTitleChange.mock.calls[0][0];
    titleHandler('New Terminal Title');
    
    expect(defaultProps.onTitleChange).toHaveBeenCalledWith('New Terminal Title');
  });

  test('writes data to terminal', async () => {
    const { rerender } = render(<Terminal {...defaultProps} />);
    
    // Update with data to write
    rerender(<Terminal {...defaultProps} data="Hello Terminal!" />);
    
    await waitFor(() => {
      expect(mockTerminal.write).toHaveBeenCalledWith('Hello Terminal!');
    });
  });

  test('clears terminal when requested', async () => {
    const { rerender } = render(<Terminal {...defaultProps} />);
    
    // Trigger clear
    rerender(<Terminal {...defaultProps} clear={true} />);
    
    await waitFor(() => {
      expect(mockTerminal.clear).toHaveBeenCalled();
    });
  });

  test('focuses terminal when requested', async () => {
    const { rerender } = render(<Terminal {...defaultProps} />);
    
    // Trigger focus
    rerender(<Terminal {...defaultProps} focus={true} />);
    
    await waitFor(() => {
      expect(mockTerminal.focus).toHaveBeenCalled();
    });
  });

  test('handles window resize events', async () => {
    render(<Terminal {...defaultProps} />);
    
    // Simulate window resize
    fireEvent(window, new Event('resize'));
    
    await waitFor(() => {
      expect(mockFitAddon.fit).toHaveBeenCalled();
    });
  });

  test('disposes terminal on unmount', () => {
    const { unmount } = render(<Terminal {...defaultProps} />);
    
    unmount();
    
    expect(mockTerminal.dispose).toHaveBeenCalled();
  });

  test('handles IPC communication for terminal operations', async () => {
    render(<Terminal {...defaultProps} />);
    
    // Simulate IPC message for terminal data
    const ipcHandler = mockIpcRenderer.on.mock.calls.find(
      call => call[0] === `terminal-data-${defaultProps.id}`
    );
    
    expect(ipcHandler).toBeDefined();
    
    if (ipcHandler) {
      const handler = ipcHandler[1];
      handler(null, 'Terminal output from main process');
      
      expect(mockTerminal.write).toHaveBeenCalledWith('Terminal output from main process');
    }
  });

  test('sends terminal input to main process via IPC', async () => {
    render(<Terminal {...defaultProps} />);
    
    // Simulate user input
    const dataHandler = mockTerminal.onData.mock.calls[0][0];
    dataHandler('ls -la\r');
    
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
      'terminal-write',
      defaultProps.id,
      'ls -la\r'
    );
  });

  test('handles terminal creation via IPC', async () => {
    render(<Terminal {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'terminal-create',
        defaultProps.id
      );
    });
  });

  test('handles terminal destruction via IPC on unmount', () => {
    const { unmount } = render(<Terminal {...defaultProps} />);
    
    unmount();
    
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
      'terminal-destroy',
      defaultProps.id
    );
  });

  test('supports custom terminal themes', async () => {
    const customTheme = {
      background: '#000000',
      foreground: '#ffffff',
      cursor: '#ff0000',
    };
    
    render(<Terminal {...defaultProps} theme={customTheme} />);
    
    const { Terminal: XTerminal } = require('@xterm/xterm');
    
    await waitFor(() => {
      expect(XTerminal).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: expect.objectContaining(customTheme),
        })
      );
    });
  });

  test('handles terminal errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Simulate terminal error
    mockTerminal.open.mockImplementation(() => {
      throw new Error('Terminal initialization failed');
    });
    
    render(<Terminal {...defaultProps} />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Terminal initialization error:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });
});

