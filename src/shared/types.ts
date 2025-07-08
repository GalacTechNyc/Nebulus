// Shared TypeScript types for GalactusIDE

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  modified: boolean;
  lastModified: Date;
}

export interface ProjectFolder {
  id: string;
  name: string;
  path: string;
  children: (ProjectFile | ProjectFolder)[];
  expanded: boolean;
}

export interface ProjectContext {
  currentFile: string | null;
  openFiles: ProjectFile[];
  projectFiles: ProjectFolder;
  dependencies: string[];
  framework: 'react' | 'vue' | 'vanilla' | 'next' | 'nuxt';
  packageJson?: any;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'chat' | 'code' | 'error' | 'suggestion';
}

export interface AIService {
  generateCode(prompt: string, context: ProjectContext): Promise<string>;
  fixError(error: string, code: string, context: ProjectContext): Promise<string>;
  explainCode(code: string): Promise<string>;
  optimizeCode(code: string, context: ProjectContext): Promise<string>;
  chat(messages: AIMessage[]): Promise<string>;
}

export interface DeployConfig {
  platform: 'vercel' | 'netlify' | 'github' | 'cloudflare';
  projectName: string;
  buildCommand?: string;
  outputDirectory?: string;
  environmentVariables?: Record<string, string>;
  framework?: string;
}

export interface DeployResult {
  success: boolean;
  deploymentId: string;
  url?: string;
  error?: string;
  logs?: string[];
}

export interface DeploymentStatus {
  id: string;
  status: 'building' | 'ready' | 'error' | 'cancelled';
  progress?: number;
  url?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PanelLayout {
  id: string;
  type: 'editor' | 'browser' | 'ai' | 'terminal' | 'deploy' | 'explorer';
  title: string;
  visible: boolean;
  size: number; // percentage
  position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  minSize?: number;
  maxSize?: number;
}

export interface AppState {
  project: ProjectContext;
  layout: PanelLayout[];
  ai: {
    messages: AIMessage[];
    isProcessing: boolean;
    selectedModel: string;
  };
  terminal: {
    terminals: Array<{
      id: string;
      name: string;
      cwd: string;
      isActive: boolean;
      splitGroup: number;
    }>;
    activeTerminal: string | null;
    showTerminalPanel: boolean;
    splitGroups: number; // Number of split groups (1 = no split, 2 = split)
  };
  deployment: {
    history: DeployResult[];
    current?: DeploymentStatus;
  };
  settings: {
    theme: 'dark' | 'light';
    fontSize: number;
    aiModel: string;
    autoSave: boolean;
    enableVoice: boolean;
  };
}

export interface IpcMessage {
  channel: string;
  data: any;
  requestId?: string;
}

export interface FileSystemEvent {
  type: 'create' | 'update' | 'delete' | 'rename';
  path: string;
  newPath?: string;
  content?: string;
}