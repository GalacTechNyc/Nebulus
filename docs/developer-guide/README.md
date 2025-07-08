# 👨‍💻 Developer Guide - GalactusIDE

## 🎯 Overview

Welcome to the GalactusIDE developer documentation. This guide provides comprehensive information for developers who want to contribute to, extend, or understand the inner workings of our AI-powered development environment.

GalactusIDE is built using modern web technologies and follows industry best practices for security, performance, and maintainability. The architecture leverages Electron for desktop integration, React for the user interface, and TypeScript for type safety and developer experience.

---

## 🏗️ Architecture Overview

### **High-Level Architecture**

GalactusIDE follows a multi-process architecture typical of Electron applications, with additional layers for AI integration and security:

```
┌─────────────────────────────────────────────────────────────┐
│                    GalactusIDE Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  Main Process (Node.js)                                    │
│  ├── Window Management                                      │
│  ├── IPC Communication Hub                                  │
│  ├── File System Operations                                 │
│  ├── Security Layer                                         │
│  └── AI Service Orchestration                               │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (Chromium)                               │
│  ├── React Application                                      │
│  ├── Monaco Editor Integration                              │
│  ├── Terminal Component (XTerm.js)                          │
│  ├── AI Assistant Interface                                 │
│  └── Vision Analysis Panel                                  │
├─────────────────────────────────────────────────────────────┤
│  External Services                                          │
│  ├── OpenAI GPT-4 (Code Generation)                        │
│  ├── Anthropic Claude (Analysis)                            │
│  ├── Google Gemini (Vision)                                 │
│  └── Deployment Services (Vercel, Netlify)                  │
└─────────────────────────────────────────────────────────────┘
```

### **Core Components**

#### **Main Process Components**
- **Window Manager**: Handles application windows and lifecycle
- **IPC Hub**: Secure inter-process communication
- **File System**: Sandboxed file operations with security controls
- **AI Orchestrator**: Manages AI service integrations
- **Security Layer**: Input validation and access control

#### **Renderer Process Components**
- **App Shell**: Main React application container
- **Editor**: Monaco Editor with custom extensions
- **Terminal**: Integrated terminal with XTerm.js
- **AI Assistant**: Chat interface and code generation
- **Vision Panel**: Screenshot analysis and UI understanding
- **File Explorer**: Project navigation and management

---

## 🚀 Development Setup

### **Prerequisites**

Before setting up the development environment, ensure you have the following installed:

- **Node.js** (v18.x or v20.x) - JavaScript runtime
- **npm** (v9.x or later) - Package manager
- **Git** (v2.30 or later) - Version control
- **Python** (v3.8 or later) - Required for native dependencies
- **Build Tools** - Platform-specific build tools

#### **Platform-Specific Requirements**

**Windows:**
```bash
# Install Visual Studio Build Tools
npm install -g windows-build-tools

# Or install Visual Studio Community with C++ workload
```

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
# Install build essentials
sudo apt-get update
sudo apt-get install build-essential libnss3-dev libatk-bridge2.0-dev libdrm2-dev libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev libxss-dev libasound2-dev
```

### **Initial Setup**

1. **Clone the Repository**
```bash
git clone https://github.com/stephonbridges/nebulus.git
cd nebulus
```

2. **Install Dependencies**
```bash
# Install all dependencies
npm install

# Rebuild native dependencies for Electron
npm run postinstall
```

3. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Add API keys for AI services (optional for development)
```

4. **Verify Installation**
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm test
```

### **Development Workflow**

#### **Starting Development Server**
```bash
# Start all development processes
npm run dev

# This starts:
# - Main process compilation (webpack watch)
# - Renderer process dev server (webpack-dev-server)
# - Electron application
```

#### **Individual Process Management**
```bash
# Start only main process compilation
npm run dev:main

# Start only renderer dev server
npm run dev:renderer

# Start Electron (requires built main process)
npm run electron
```

#### **Development Tools**

**Hot Reload**: The development setup includes hot reload for both main and renderer processes. Changes to the code will automatically reload the application.

**DevTools**: Chromium DevTools are available in development mode:
- **F12** or **Ctrl+Shift+I** (Windows/Linux)
- **Cmd+Option+I** (macOS)

**Debug Mode**: Enable additional logging and debug features:
```bash
# Set debug environment
export DEBUG=galactus:*
npm run dev
```

---

## 📁 Project Structure

### **Directory Layout**

```
nebulus/
├── src/                          # Source code
│   ├── main/                     # Main process (Node.js)
│   │   ├── handlers/             # IPC request handlers
│   │   ├── security/             # Security implementations
│   │   ├── services/             # Core services
│   │   └── main.ts               # Main process entry point
│   ├── renderer/                 # Renderer process (React)
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # Frontend services
│   │   ├── styles/               # CSS and styling
│   │   └── index.tsx             # Renderer entry point
│   └── shared/                   # Shared code
│       ├── types/                # TypeScript type definitions
│       ├── constants/            # Application constants
│       └── utils/                # Utility functions
├── docs/                         # Documentation
├── scripts/                      # Build and deployment scripts
├── tests/                        # Test files
├── webpack.*.config.js           # Webpack configurations
├── jest.config.js                # Jest test configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies and scripts
```

### **Key Files and Their Purpose**

#### **Configuration Files**
- `package.json` - Project metadata, dependencies, and scripts
- `tsconfig.json` - TypeScript compiler configuration
- `jest.config.js` - Test framework configuration
- `webpack.*.config.js` - Build system configuration
- `.eslintrc.js` - Code linting rules
- `.prettierrc` - Code formatting rules

#### **Entry Points**
- `src/main/main.ts` - Main process entry point
- `src/renderer/index.tsx` - Renderer process entry point
- `src/renderer/App.tsx` - Main React application component

#### **Core Modules**
- `src/main/handlers/` - IPC communication handlers
- `src/renderer/components/` - React UI components
- `src/shared/types/` - TypeScript type definitions
- `src/shared/constants/` - Application-wide constants

---

## 🔧 Build System

### **Webpack Configuration**

GalactusIDE uses Webpack for building both main and renderer processes with optimized configurations for development and production.

#### **Main Process Build** (`webpack.main.config.js`)
```javascript
// Key features:
// - TypeScript compilation
// - Node.js externals handling
// - Source map generation
// - Development/production optimization
```

#### **Renderer Process Build** (`webpack.renderer.config.js`)
```javascript
// Key features:
// - React and TypeScript support
// - Monaco Editor integration
// - CSS and asset handling
// - Hot module replacement
// - Bundle optimization
```

### **Build Commands**

```bash
# Development builds (with source maps and watch mode)
npm run build:dev
npm run dev:main
npm run dev:renderer

# Production builds (optimized and minified)
npm run build
npm run build:main
npm run build:renderer

# Staging builds (production-like with debug info)
npm run build:staging
```

### **Build Optimization**

The build system includes several optimizations:

- **Code Splitting**: Automatic code splitting for better loading performance
- **Tree Shaking**: Removal of unused code
- **Minification**: Code minification for production builds
- **Asset Optimization**: Image and asset optimization
- **Bundle Analysis**: Bundle size analysis and optimization recommendations

---

## 🧪 Testing Strategy

### **Testing Framework**

GalactusIDE uses Jest as the primary testing framework with additional tools for comprehensive testing:

- **Jest** - Unit and integration testing
- **React Testing Library** - React component testing
- **Playwright** - End-to-end testing
- **Electron Testing** - Electron-specific testing utilities

### **Test Categories**

#### **Unit Tests**
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

#### **Integration Tests**
```bash
# Run integration tests
npm run test:integration

# Test IPC communication
npm run test:ipc
```

#### **End-to-End Tests**
```bash
# Run E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --grep "editor functionality"
```

#### **Performance Tests**
```bash
# Run performance tests
npm run test:performance

# Memory leak detection
npm run test:memory
```

### **Test Structure**

```
src/
├── main/
│   └── __tests__/               # Main process tests
├── renderer/
│   ├── components/
│   │   └── __tests__/           # Component tests
│   └── services/
│       └── __tests__/           # Service tests
└── shared/
    └── __tests__/               # Shared code tests

tests/
├── e2e/                         # End-to-end tests
├── integration/                 # Integration tests
├── performance/                 # Performance tests
└── fixtures/                    # Test fixtures and data
```

### **Writing Tests**

#### **Component Testing Example**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Editor } from '../Editor';

describe('Editor Component', () => {
  it('should render Monaco editor', () => {
    render(<Editor />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle file content changes', async () => {
    const onContentChange = jest.fn();
    render(<Editor onContentChange={onContentChange} />);
    
    // Simulate typing
    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: 'console.log("test");' } });
    
    expect(onContentChange).toHaveBeenCalledWith('console.log("test");');
  });
});
```

#### **IPC Testing Example**
```typescript
import { ipcMain, ipcRenderer } from 'electron';
import { validateFileOperation } from '../security/filesystem';

describe('File Operations IPC', () => {
  it('should validate file paths before operations', async () => {
    const mockHandler = jest.fn();
    ipcMain.handle('file:read', mockHandler);

    // Test valid path
    await ipcRenderer.invoke('file:read', '/safe/path/file.txt');
    expect(mockHandler).toHaveBeenCalled();

    // Test invalid path
    await expect(
      ipcRenderer.invoke('file:read', '../../../etc/passwd')
    ).rejects.toThrow('Invalid file path');
  });
});
```

---

## 🔒 Security Guidelines

### **Security Architecture**

GalactusIDE implements multiple layers of security to protect users and their code:

#### **Process Isolation**
- Main process handles sensitive operations
- Renderer process runs in sandboxed environment
- IPC communication with validation and sanitization

#### **Input Validation**
- All user inputs are validated and sanitized
- File paths are restricted to project directories
- AI service inputs are filtered for sensitive data

#### **Access Control**
- File system operations are sandboxed
- Network requests are controlled and monitored
- External service communications are encrypted

### **Security Best Practices**

#### **For Developers**

1. **Input Validation**
```typescript
// Always validate inputs
function validateFilePath(path: string): boolean {
  // Check for path traversal attempts
  if (path.includes('..') || path.includes('~')) {
    return false;
  }
  
  // Ensure path is within project directory
  return path.startsWith(getProjectRoot());
}
```

2. **IPC Security**
```typescript
// Use typed IPC channels
interface FileReadRequest {
  path: string;
  encoding?: string;
}

// Validate all IPC requests
ipcMain.handle('file:read', async (event, request: FileReadRequest) => {
  if (!validateFileReadRequest(request)) {
    throw new Error('Invalid file read request');
  }
  
  return await readFile(request.path, request.encoding);
});
```

3. **Sensitive Data Handling**
```typescript
// Never log sensitive data
function logRequest(request: any) {
  const sanitized = { ...request };
  delete sanitized.apiKey;
  delete sanitized.token;
  console.log('Request:', sanitized);
}
```

#### **Security Testing**

```bash
# Run security tests
npm run test:security

# Audit dependencies
npm audit

# Check for vulnerabilities
npm run audit:security
```

---

## 🎨 UI/UX Guidelines

### **Design System**

GalactusIDE follows a consistent design system based on modern development tools:

#### **Color Palette**
```css
:root {
  /* Primary Colors */
  --primary-bg: #1e1e1e;
  --secondary-bg: #252526;
  --accent-bg: #2d2d30;
  
  /* Text Colors */
  --primary-text: #cccccc;
  --secondary-text: #969696;
  --accent-text: #569cd6;
  
  /* Status Colors */
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --info: #2196f3;
}
```

#### **Typography**
```css
/* Font Stack */
--font-family-mono: 'Fira Code', 'Monaco', 'Menlo', monospace;
--font-family-sans: 'Segoe UI', 'Roboto', 'Arial', sans-serif;

/* Font Sizes */
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
```

### **Component Guidelines**

#### **React Component Structure**
```typescript
// Component template
interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ 
  // Destructured props
}) => {
  // Hooks
  // State
  // Effects
  // Handlers
  
  return (
    // JSX
  );
};

// Styled components
const StyledComponent = styled.div`
  // Styles
`;
```

#### **Accessibility Standards**
- All interactive elements must be keyboard accessible
- Proper ARIA labels and roles
- Color contrast ratios meet WCAG 2.1 AA standards
- Screen reader compatibility

---

## 🔌 Plugin Development

### **Plugin Architecture**

GalactusIDE supports a plugin system for extending functionality:

#### **Plugin Structure**
```
my-plugin/
├── package.json              # Plugin metadata
├── src/
│   ├── main.ts              # Main process plugin code
│   ├── renderer.tsx         # Renderer process plugin code
│   └── types.ts             # Plugin type definitions
├── assets/                  # Plugin assets
└── README.md               # Plugin documentation
```

#### **Plugin Manifest** (`package.json`)
```json
{
  "name": "my-galactus-plugin",
  "version": "1.0.0",
  "galactusPlugin": {
    "displayName": "My Plugin",
    "description": "Plugin description",
    "main": "dist/main.js",
    "renderer": "dist/renderer.js",
    "activationEvents": [
      "onLanguage:typescript",
      "onCommand:myPlugin.activate"
    ],
    "contributes": {
      "commands": [
        {
          "command": "myPlugin.doSomething",
          "title": "Do Something"
        }
      ],
      "menus": {
        "editor/context": [
          {
            "command": "myPlugin.doSomething",
            "when": "editorTextFocus"
          }
        ]
      }
    }
  }
}
```

#### **Plugin API**
```typescript
import { GalactusAPI } from '@galactus/api';

export function activate(api: GalactusAPI) {
  // Register commands
  api.commands.registerCommand('myPlugin.doSomething', () => {
    api.window.showInformationMessage('Hello from plugin!');
  });

  // Register editor providers
  api.languages.registerCompletionItemProvider('typescript', {
    provideCompletionItems: (document, position) => {
      // Provide completions
    }
  });
}

export function deactivate() {
  // Cleanup
}
```

---

## 📊 Performance Guidelines

### **Performance Monitoring**

GalactusIDE includes built-in performance monitoring:

```typescript
import { PerformanceMonitor } from '@/shared/services/performance-monitor';

// Monitor function performance
const monitor = new PerformanceMonitor();

async function expensiveOperation() {
  const timer = monitor.startTimer('expensiveOperation');
  
  try {
    // Perform operation
    await doSomething();
  } finally {
    timer.end();
  }
}
```

### **Optimization Strategies**

#### **React Performance**
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Use useMemo and useCallback for expensive computations
- Implement virtual scrolling for large lists

#### **Electron Performance**
- Minimize IPC communication overhead
- Use streaming for large data transfers
- Implement proper memory management
- Optimize bundle sizes

#### **AI Service Performance**
- Implement request caching
- Use request batching where possible
- Implement timeout and retry logic
- Monitor API rate limits

---

## 🤝 Contributing Guidelines

### **Code Standards**

#### **TypeScript Guidelines**
- Use strict TypeScript configuration
- Provide explicit type annotations for public APIs
- Use interfaces for object shapes
- Prefer type unions over enums where appropriate

#### **React Guidelines**
- Use functional components with hooks
- Implement proper error boundaries
- Use React.StrictMode in development
- Follow React best practices for state management

#### **Code Style**
```typescript
// Use Prettier for formatting
// Use ESLint for code quality
// Follow naming conventions:

// PascalCase for components and types
interface UserProfile {}
const UserCard: React.FC = () => {};

// camelCase for variables and functions
const userName = 'john';
const getUserProfile = () => {};

// UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
```

### **Git Workflow**

#### **Branch Naming**
```bash
# Feature branches
feature/add-ai-vision-panel
feature/improve-editor-performance

# Bug fix branches
fix/memory-leak-in-terminal
fix/ipc-communication-error

# Hotfix branches
hotfix/security-vulnerability
hotfix/critical-crash-fix
```

#### **Commit Messages**
```bash
# Format: type(scope): description

feat(editor): add syntax highlighting for new languages
fix(terminal): resolve memory leak in terminal component
docs(api): update IPC communication documentation
test(security): add tests for input validation
refactor(ui): improve component organization
perf(ai): optimize AI service request caching
```

### **Pull Request Process**

1. **Create Feature Branch**
```bash
git checkout -b feature/my-new-feature
```

2. **Make Changes and Test**
```bash
# Make your changes
npm run lint
npm run type-check
npm test
```

3. **Commit Changes**
```bash
git add .
git commit -m "feat(component): add new feature"
```

4. **Push and Create PR**
```bash
git push origin feature/my-new-feature
# Create pull request on GitHub
```

5. **PR Requirements**
- All tests must pass
- Code coverage must not decrease
- Documentation must be updated
- Security review for sensitive changes

---

## 🚀 Release Process

### **Version Management**

GalactusIDE follows semantic versioning (SemVer):

- **Major** (1.0.0) - Breaking changes
- **Minor** (0.1.0) - New features, backward compatible
- **Patch** (0.0.1) - Bug fixes, backward compatible

### **Release Workflow**

1. **Prepare Release**
```bash
# Update version
npm version minor

# Update changelog
npm run changelog

# Run full test suite
npm run test:all
```

2. **Create Release Branch**
```bash
git checkout -b release/v1.2.0
git push origin release/v1.2.0
```

3. **Automated Release**
- CI/CD pipeline builds and tests
- Security scanning and validation
- Automated deployment to staging
- Manual approval for production

4. **Post-Release**
- Tag release in Git
- Update documentation
- Notify community
- Monitor for issues

---

## 📚 Additional Resources

### **External Documentation**
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/)

### **Community Resources**
- [GitHub Discussions](https://github.com/stephonbridges/nebulus/discussions)
- [Discord Server](https://discord.gg/galactus-ide)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/galactus-ide)

### **Development Tools**
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=galactus.galactus-ide-dev)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [React Developer Tools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html)

---

*This developer guide is continuously updated. For the latest information, please check the [documentation repository](https://github.com/stephonbridges/nebulus/tree/main/docs).*

*Last updated: January 8, 2025*  
*Version: 1.0.0*

