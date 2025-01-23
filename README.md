# Dive AI Agent

A desktop AI chat application built with Electron and React.

## Development Requirements

- Node.js LTS+

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server
npm run dev:electron
```

## Build

```bash
# Build for production
npm run build:electron
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
