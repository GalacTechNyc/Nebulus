import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, PanelLayout } from '../../shared/types';

// Initial state
const initialState: AppState = {
  project: {
    currentFile: 'welcome',
    openFiles: [
      {
        id: 'welcome',
        name: 'Welcome.md',
        path: '/Welcome.md',
        content: `# Welcome to GalactusIDE! 🌌

This is a professional AI-powered development environment.

## Features:
- Monaco Editor with IntelliSense
- Integrated Terminal
- AI Code Assistant
- File Explorer
- Browser Integration

## Getting Started:
1. Open files from the File Explorer on the left
2. Use the Terminal at the bottom for commands
3. Chat with the AI Assistant for coding help
4. Browse websites in the Browser panel

Start coding and enjoy the experience!`,
        language: 'markdown',
        lastModified: new Date(),
        modified: false
      }
    ],
    projectFiles: {
      id: 'root',
      name: 'root',
      path: '/',
      children: [],
      expanded: true
    },
    dependencies: [],
    framework: 'react'
  },
  layout: [
    { id: 'explorer', type: 'explorer', title: 'Explorer', visible: true, size: 20, position: 'left' },
    { id: 'editor', type: 'editor', title: 'Editor', visible: true, size: 40, position: 'center' },
    { id: 'browser', type: 'browser', title: 'Browser', visible: true, size: 30, position: 'right' },
    { id: 'ai', type: 'ai', title: 'AI Assistant', visible: true, size: 25, position: 'right' },
    { id: 'terminal', type: 'terminal', title: 'Terminal', visible: true, size: 25, position: 'bottom' }
  ],
  ai: {
    messages: [
      {
        id: '1',
        role: 'system',
        content: 'Welcome to GalactusIDE! I\'m your AI development assistant. How can I help you build something amazing today?',
        timestamp: new Date(),
        type: 'chat'
      }
    ],
    isProcessing: false,
    selectedModel: 'gpt-4'
  },
  terminal: {
    terminals: [
      {
        id: 'main-terminal',
        name: 'Terminal 1',
        cwd: '/Users/stephonbridges/Nebulus',
        isActive: true,
        splitGroup: 1
      }
    ],
    activeTerminal: 'main-terminal',
    showTerminalPanel: true,
    splitGroups: 1
  },
  deployment: {
    history: []
  },
  settings: {
    theme: 'dark',
    fontSize: 14,
    aiModel: 'gpt-4',
    autoSave: true,
    enableVoice: false
  }
};

// Action types
type AppAction = 
  | { type: 'SET_CURRENT_FILE'; payload: string | null }
  | { type: 'ADD_OPEN_FILE'; payload: any }
  | { type: 'REMOVE_OPEN_FILE'; payload: string }
  | { type: 'CLEAR_OPEN_FILES' }
  | { type: 'UPDATE_FILE_CONTENT'; payload: { id: string; content: string } }
  | { type: 'TOGGLE_PANEL'; payload: string }
  | { type: 'RESIZE_PANEL'; payload: { id: string; size: number } }
  | { type: 'ADD_AI_MESSAGE'; payload: any }
  | { type: 'SET_AI_PROCESSING'; payload: boolean }
  | { type: 'ADD_TERMINAL_OUTPUT'; payload: string }
  | { type: 'SET_TERMINAL_DIRECTORY'; payload: string }
  | { type: 'TOGGLE_TERMINAL_PANEL' }
  | { type: 'ADD_TERMINAL'; payload: { id: string; name: string; cwd: string; splitGroup?: number } }
  | { type: 'REMOVE_TERMINAL'; payload: string }
  | { type: 'SET_ACTIVE_TERMINAL'; payload: string }
  | { type: 'SPLIT_TERMINAL'; payload: string }
  | { type: 'UNSPLIT_TERMINALS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_FILE':
      return {
        ...state,
        project: { ...state.project, currentFile: action.payload }
      };
      
    case 'ADD_OPEN_FILE': {
      // Check if file is already open
      const existingFileIndex = state.project.openFiles.findIndex(f => f.id === action.payload.id);
      if (existingFileIndex >= 0) {
        // Update existing file content
        const updatedFiles = [...state.project.openFiles];
        updatedFiles[existingFileIndex] = action.payload;
        return {
          ...state,
          project: {
            ...state.project,
            openFiles: updatedFiles
          }
        };
      } else {
        // Add new file
        return {
          ...state,
          project: {
            ...state.project,
            openFiles: [...state.project.openFiles, action.payload]
          }
        };
      }
    }
      
    case 'REMOVE_OPEN_FILE':
      return {
        ...state,
        project: {
          ...state.project,
          openFiles: state.project.openFiles.filter(f => f.id !== action.payload),
          currentFile: state.project.currentFile === action.payload ? null : state.project.currentFile
        }
      };
      
    case 'CLEAR_OPEN_FILES':
      return {
        ...state,
        project: {
          ...state.project,
          openFiles: [],
          currentFile: null
        }
      };
      
    case 'UPDATE_FILE_CONTENT':
      return {
        ...state,
        project: {
          ...state.project,
          openFiles: state.project.openFiles.map(f => 
            f.id === action.payload.id 
              ? { ...f, content: action.payload.content, modified: true }
              : f
          )
        }
      };
      
    case 'TOGGLE_PANEL':
      return {
        ...state,
        layout: state.layout.map(panel => 
          panel.id === action.payload 
            ? { ...panel, visible: !panel.visible }
            : panel
        )
      };
      
    case 'RESIZE_PANEL':
      return {
        ...state,
        layout: state.layout.map(panel => 
          panel.id === action.payload.id 
            ? { ...panel, size: action.payload.size }
            : panel
        )
      };
      
    case 'ADD_AI_MESSAGE':
      return {
        ...state,
        ai: {
          ...state.ai,
          messages: [...state.ai.messages, action.payload]
        }
      };
      
    case 'SET_AI_PROCESSING':
      return {
        ...state,
        ai: { ...state.ai, isProcessing: action.payload }
      };
      
    case 'ADD_TERMINAL_OUTPUT':
      return state; // Legacy support - output is now handled per terminal
      
    case 'SET_TERMINAL_DIRECTORY':
      return state; // Legacy support - directory is now handled per terminal
      
    case 'TOGGLE_TERMINAL_PANEL':
      return {
        ...state,
        terminal: {
          ...state.terminal,
          showTerminalPanel: !state.terminal.showTerminalPanel
        }
      };
      
    case 'ADD_TERMINAL': {
      // Set all terminals as inactive, then add new active terminal
      const updatedTerminals = state.terminal.terminals.map(t => ({ ...t, isActive: false }));
      const splitGroup = action.payload.splitGroup || 1;
      return {
        ...state,
        terminal: {
          ...state.terminal,
          terminals: [...updatedTerminals, { ...action.payload, splitGroup, isActive: true }],
          activeTerminal: action.payload.id
        }
      };
    }
      
    case 'REMOVE_TERMINAL': {
      const filteredTerminals = state.terminal.terminals.filter(t => t.id !== action.payload);
      const newActiveTerminal = filteredTerminals.length > 0 ? filteredTerminals[0].id : null;
      return {
        ...state,
        terminal: {
          ...state.terminal,
          terminals: filteredTerminals.map(t => ({ 
            ...t, 
            isActive: t.id === newActiveTerminal 
          })),
          activeTerminal: newActiveTerminal
        }
      };
    }
      
    case 'SET_ACTIVE_TERMINAL':
      return {
        ...state,
        terminal: {
          ...state.terminal,
          terminals: state.terminal.terminals.map(t => ({ 
            ...t, 
            isActive: t.id === action.payload 
          })),
          activeTerminal: action.payload
        }
      };
      
    case 'SPLIT_TERMINAL': {
      // Split the terminal with the given ID into a new group
      const terminalToSplit = state.terminal.terminals.find(t => t.id === action.payload);
      if (!terminalToSplit) return state;
      
      const newSplitId = `${action.payload}-split-${Date.now()}`;
      const maxGroup = Math.max(...state.terminal.terminals.map(t => t.splitGroup), 1);
      const newGroup = maxGroup + 1;
      
      return {
        ...state,
        terminal: {
          ...state.terminal,
          terminals: [
            ...state.terminal.terminals.map(t => ({ ...t, isActive: false })),
            {
              id: newSplitId,
              name: `${terminalToSplit.name} (Split)`,
              cwd: terminalToSplit.cwd,
              isActive: true,
              splitGroup: newGroup
            }
          ],
          activeTerminal: newSplitId,
          splitGroups: Math.max(state.terminal.splitGroups, newGroup)
        }
      };
    }
      
    case 'UNSPLIT_TERMINALS': {
      // Merge all terminals back to group 1
      return {
        ...state,
        terminal: {
          ...state.terminal,
          terminals: state.terminal.terminals.map(t => ({ ...t, splitGroup: 1 })),
          splitGroups: 1
        }
      };
    }
      
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    }
      
    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
};

// Selector hooks for performance
export const useCurrentFile = () => {
  const { state } = useAppState();
  return state.project.currentFile;
};

export const useOpenFiles = () => {
  const { state } = useAppState();
  return state.project.openFiles;
};

export const useLayout = () => {
  const { state } = useAppState();
  return state.layout;
};

export const useAIMessages = () => {
  const { state } = useAppState();
  return state.ai.messages;
};

export const useTerminalHistory = () => {
  const { state } = useAppState();
  return []; // Legacy support - terminal history is now handled per terminal instance
};