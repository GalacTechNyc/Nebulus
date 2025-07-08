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

// IPC Channel definitions
export enum IpcChannels {
  // File operations
  READ_FILE = 'read-file',
  WRITE_FILE = 'write-file',
  CREATE_FILE = 'create-file',
  DELETE_FILE = 'delete-file',
  LIST_DIRECTORY = 'list-directory',
  
  // Terminal operations
  TERMINAL_CREATE = 'terminal-create',
  TERMINAL_WRITE = 'terminal-write',
  TERMINAL_RESIZE = 'terminal-resize',
  TERMINAL_KILL = 'terminal-kill',
  TERMINAL_DATA = 'terminal-data',
  TERMINAL_DESTROY = 'terminal-destroy',
  EXECUTE_COMMAND = 'execute-command',
  
  // Project operations
  PROJECT_OPEN = 'project-open',
  PROJECT_GET_STRUCTURE = 'project-get-structure',
  
  // AI operations
  AI_CHAT = 'ai-chat',
  AI_GENERATE_CODE = 'ai-generate-code',
  AI_FIX_ERROR = 'ai-fix-error',
  AI_EXPLAIN_CODE = 'ai-explain-code',
  
  // Vision operations
  VISION_ANALYZE = 'vision-analyze',
  VISION_GENERATE = 'vision-generate',
  VISION_PROCESS = 'vision-process',
  
  // Deployment operations
  DEPLOY_PROJECT = 'deploy-project',
  GET_DEPLOYMENT_STATUS = 'get-deployment-status',
  
  // System operations
  LOG_ERROR = 'log-error',
  GET_SYSTEM_INFO = 'get-system-info',
  OPEN_EXTERNAL = 'open-external'
}

// Terminal specific types
export interface TerminalSession {
  id: string;
  pid: number;
  cwd: string;
  title: string;
  isActive: boolean;
}

export interface TerminalData {
  sessionId: string;
  data: string;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
}

