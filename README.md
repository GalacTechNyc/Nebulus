# 🌌 GalactusIDE

> "Design. Code. Debug. Deploy. All without leaving the tab."

An AI-powered development browser that combines VS Code functionality with Chrome DevTools and intelligent deployment - all unified into a single, revolutionary development experience.

![GalactusIDE Preview](preview.png)

## 🚀 Features

### 🧠 AI-Powered Development
- **Smart Code Generation**: Natural language to code conversion
- **Intelligent Debugging**: AI analyzes errors and suggests fixes
- **Code Explanation**: Understand complex code with AI assistance
- **Optimization Suggestions**: Performance and best practice recommendations

### 💻 Integrated Development Environment
- **Monaco Editor**: Full VS Code editor experience with IntelliSense
- **File Explorer**: Complete project navigation and management
- **Integrated Terminal**: Execute commands without leaving the IDE
- **Live Preview**: Real-time preview of your web applications

### 🌐 Built-in Browser
- **Chromium Engine**: Full-featured web browsing capabilities
- **Developer Tools**: Inspect, debug, and optimize web applications
- **Live Reload**: Automatic refresh on code changes
- **Responsive Testing**: Test on different screen sizes

### 🚀 One-Click Deployment
- **Vercel Integration**: Deploy to Vercel with automatic configuration
- **Netlify Support**: Seamless Netlify deployment workflow
- **GitHub Pages**: Static site deployment to GitHub Pages
- **Environment Management**: Handle environment variables and settings

### 🎨 Modern Interface
- **Dark Theme**: Professional dark mode interface
- **Resizable Panels**: Customize your workspace layout
- **Split Views**: Work with multiple files and tools simultaneously
- **Responsive Design**: Optimized for all screen sizes

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Styled Components
- **Editor**: Monaco Editor (VS Code core)
- **Desktop**: Electron 28
- **Build**: Webpack 5 + Babel
- **AI**: OpenAI GPT-4 Integration
- **Deployment**: Vercel CLI, Netlify API, GitHub Actions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/stephonbridges/nebulus.git
cd nebulus

# Install dependencies
npm install

# Start development
npm run dev
```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Package as desktop app
npm run pack

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check

# Watch front-end for file changes
npm run watch:frontend
```

## 📁 Project Structure

```
galactus-ide/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts          # Application entry point
│   │   └── preload.ts       # Security bridge
│   ├── renderer/            # React frontend
│   │   ├── components/      # UI components
│   │   │   ├── Editor/      # Monaco editor integration
│   │   │   ├── Browser/     # Chromium webview
│   │   │   ├── Layout/      # Panel system
│   │   │   ├── Sidebar/     # File explorer & AI chat
│   │   │   └── Terminal/    # Integrated terminal
│   │   ├── hooks/          # React hooks
│   │   ├── services/       # API and IPC services
│   │   └── styles/         # Theme and styling
│   └── shared/             # Shared types and utilities
├── webpack.*.config.js     # Webpack configurations
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🎯 Development Roadmap

### Phase 1: Foundation ✅
- [x] Electron application setup
- [x] React frontend with TypeScript
- [x] Monaco Editor integration
- [x] Basic layout system
- [x] File explorer functionality

### Phase 2: AI Integration 🔄
- [x] OpenAI API integration
- [ ] Code generation from prompts
- [ ] Error analysis and suggestions
- [ ] Code explanation features

### Phase 3: Browser & Tools 🔄
- [ ] Chromium webview integration
- [ ] Developer tools access
- [ ] Live reload functionality
- [ ] Responsive design testing

### Phase 4: Deployment 🚀
- [ ] Vercel deployment integration
- [ ] Netlify deployment support
- [ ] Environment variable management
- [ ] Build optimization

### Phase 5: Advanced Features 🌟
- [ ] Voice commands
- [ ] Screen capture AI analysis
- [ ] Plugin system
- [ ] Collaborative editing

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/stephonbridges/nebulus/issues)
- **Discord**: [Join our community](https://discord.gg/galactus-ide)
- **Twitter**: [@GalactusIDE](https://twitter.com/GalactusIDE)

## 🏆 Acknowledgments

- Monaco Editor team for the incredible editor
- Electron team for the desktop framework
- React team for the UI library
- OpenAI for AI capabilities
- All our contributors and community members

---

**Built with ❤️ by the GalactusIDE team**

*"The future of development is here. Welcome to GalactusIDE."*