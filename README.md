# Dive AI Agent

A desktop AI chat application built with Electron and React.

## Development Requirements

- Node.js LTS+

## Development

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev:electron
```

## Build for production

```bash
npm run package
```

### Cross-platform Build for Windows

If you are on macOS or Linux and want to build for Windows:

1. Download Windows Node.js binary
```bash
npm run download-node:win-x64
```

2. Build using Docker
```bash
npm run docker:build-win
```

## Scripts

- `dev` - Start Vite development server
- `dev:electron` - Start Electron development server
- `build` - Build web assets
- `build:electron` - Build Electron application
- `download-node:win-x64` - Download Windows Node.js binary for cross-platform build

## Package Scripts

- `package` - Create application directory
- `package:windows` - Create Windows distributable package
- `package:linux` - Create Linux distributable package
- `docker:build-win` - Build Windows version using Docker

## MCP Server Setup

After first launch, you can find the `config.json` file in these locations:

- macOS: `~/Library/Preferences/dive`
- Windows: `C:\Users\USERNAME\AppData\Local\Dive\Data`
- Linux: `~/.config/dive`

There are three ways to configure MCP servers:

### 1. Edit config.json directly

You can edit the `config.json` file directly in the above locations following each MCP server's documentation.

### 2. Using GUI Interface

1. Click the menu button in the top-left corner to open the sidebar
2. Click "MCP Server Management" at the bottom
3. Click the "Edit Config" button on the page

### 3. Custom Scripts

You can add your own MCP server scripts in the `.dive/scripts` directory in your home folder, then update the `config.json` accordingly.

Example:

1. Create a new file `echo.js` in `~/.dive/scripts`
2. Update `config.json`:

```json
{
  "mcpServers": {
    "echo": {
      "enabled": true,
      "command": "node",
      "args": [
        "echo.js"
      ]
    }
  }
}
```

## Project Architecture

```
src/
├── atoms/              # Global state management
│   ├── configState.ts    # Model configuration state
│   ├── interfaceState.ts # UI interface state
│   └── historyState.ts   # Chat history state
│
├── components/         # Reusable UI components
│   ├── ModelConfigForm  # Model settings form
│   ├── Toast           # Toast notifications
│   └── Header          # App header
│
├── views/             # Page components
│   ├── Chat/           # Chat interface
│   ├── Setup/          # Initial setup
│   └── Welcome/        # Welcome page
│
├── styles/            # SCSS stylesheets
│   ├── components/     # Component styles
│   └── pages/         # Page-specific styles
│
└── hooks/             # Custom React hooks

electron/
├── main/             # Main process
│   └── index.ts       # Main entry
└── preload/          # Preload scripts
    └── index.ts       # Bridge between main and renderer

services/            # Backend services
```