# Nebulus Project Analysis

## Project Purpose

Based on the file names and the directory structure, this project appears to be a desktop-based IDE (Integrated Development Environment) named "Nebulus", built using Electron, React, and TypeScript. It includes features like a code editor (Monaco), a terminal (XTerm), a file explorer, and an AI assistant.

## Tech Stack

*   **Framework:** Electron
*   **Frontend:** React, TypeScript, styled-components
*   **Build System:** Webpack, Babel
*   **Testing:** Jest, ts-jest
*   **Code Editor:** Monaco Editor
*   **Terminal:** XTerm.js
*   **UI Components:**
    *   `react-resizable-panels` for layout management.
    *   `styled-components` for styling.
    *   `@xterm/addon-fit`, `@xterm/addon-web-links` for terminal enhancements.
*   **State Management:** `zustand`
*   **Other Libraries:** `openai`, `date-fns`, `lodash`, `axios`

## Project Structure

The project is organized into a few main directories:

*   `src/`: Contains the source code for the Electron application.
    *   `src/main/`: The Electron main process code (`main.ts`, `preload.ts`).
    *   `src/renderer/`: The Electron renderer process code (the React application).
        *   `src/renderer/components/`: React components, which are further organized by feature (Editor, Sidebar, Terminal, etc.).
        *   `src/renderer/hooks/`: Custom React hooks.
        *   `src/renderer/services/`: Services for things like IPC communication.
        *   `src/renderer/styles/`: Global styles and theme configuration.
    *   `src/shared/`: Code shared between the main and renderer processes (e.g., type definitions).
*   `galactus-ide/`: Seems to be another IDE-related project, but it's much smaller and might be a submodule or a separate experiment. It also has a `main` and `renderer` structure.
*   `dist/`: The output directory for the Webpack build.
*   `.github/workflows/`: Contains a CI configuration file (`ci.yml`), suggesting automated builds and tests.
*   **Configuration Files:** The project has a standard set of configuration files for a modern JavaScript project, including `package.json`, `tsconfig.json`, `webpack.config.js`, `jest.config.js`, and `.eslintrc.js`.

## Potential Issues & Observations

*   **Duplicate/Old Files:** There are several `.bak` files (`CustomizableLayout.tsx.bak`, `ProfessionalIDE.tsx.bak`, `index.html.bak`) and some ambiguously named files (`new-file-*.js`, `test-new-file.js`, `test.py`, `goo.py`, `goog.py`, `google.py`). These should probably be removed or renamed to avoid confusion.
*   **Inconsistent Component Naming:** Some components are in their own directories (e.g., `Browser/Browser.tsx`), while others are directly in the `components` directory (e.g., `MonacoEditor.tsx`). A more consistent structure would be beneficial.
*   **Redundant Components:** There are multiple `SimpleEditor.tsx` files. One is in `src/renderer/components/` and another in `src/renderer/components/Editor/`. This could be a source of bugs.
*   **Unused Files:** There are several HTML files in the root directory (`debug-test.html`, `simple-test.html`, `test-editor.html`, `test-file.html`, `test.html`) that might be for testing or debugging but are not part of the main application.
*   **Large `node_modules` directory:** This is expected for a project of this type, but it's worth noting.
