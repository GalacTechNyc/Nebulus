import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, PanelLayout } from '../../shared/types';

// Initial state
const initialState: AppState = {
  project: {
    currentFile: null,
    openFiles: [],
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
    { id: 'editor', type: 'editor', title: 'Editor', visible: true, size: 50, position: 'center' },
    { id: 'browser', type: 'browser', title: 'Browser', visible: true, size: 30, position: 'right' },
    { id: 'ai', type: 'ai', title: 'AI Assistant', visible: true, size: 25, position: 'right' },
    { id: 'terminal', type: 'terminal', title: 'Terminal', visible: false, size: 25, position: 'bottom' }
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
    history: [],
    currentDirectory: process.cwd?.() || '/',
    isRunning: false
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
  | { type: 'UPDATE_FILE_CONTENT'; payload: { id: string; content: string } }
  | { type: 'TOGGLE_PANEL'; payload: string }
  | { type: 'RESIZE_PANEL'; payload: { id: string; size: number } }
  | { type: 'ADD_AI_MESSAGE'; payload: any }
  | { type: 'SET_AI_PROCESSING'; payload: boolean }
  | { type: 'ADD_TERMINAL_OUTPUT'; payload: string }
  | { type: 'SET_TERMINAL_DIRECTORY'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_FILE':
      return {
        ...state,
        project: { ...state.project, currentFile: action.payload }
      };
      
    case 'ADD_OPEN_FILE':
      return {
        ...state,
        project: {
          ...state.project,
          openFiles: [...state.project.openFiles, action.payload]
        }
      };
      
    case 'REMOVE_OPEN_FILE':
      return {
        ...state,
        project: {
          ...state.project,
          openFiles: state.project.openFiles.filter(f => f.id !== action.payload),
          currentFile: state.project.currentFile === action.payload ? null : state.project.currentFile
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
      return {
        ...state,
        terminal: {
          ...state.terminal,
          history: [...state.terminal.history, action.payload]
        }
      };
      
    case 'SET_TERMINAL_DIRECTORY':
      return {
        ...state,
        terminal: { ...state.terminal, currentDirectory: action.payload }
      };
      
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
      
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
  return state.terminal.history;
};