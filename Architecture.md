# Dive Architecture

This document provides a high-level and technical overview of the Dive application architecture covering the UI, desktop shell, backend runtime, packaging, and build pipeline.

## Top-level Components

- UI (React + Vite):
  - Location: `src/`, entry `src/main.tsx`, router in `src/router.tsx`.
  - State management: Jotai atoms in `src/atoms/`.
  - UI components in `src/components/` and styles in `src/styles/`.
  - Localization via `src/locales/` and `src/i18n.ts`.

- Desktop Shell (Electron):
  - Main process: `electron/main/` (app lifecycle, tray, IPC bridges, updates).
  - Preload: `electron/preload/` isolates/bridges APIs to renderer.
  - Electron packaging managed by `electron-builder.json` and `scripts/notarizer.js` for macOS notarization.
  - Dev entry orchestrated by `vite.config.electron.ts` and `npm run dev`.

- Native Desktop Runtime (Tauri 2):
  - Location: `src-tauri/`.
  - Rust app logic, permission manifests, and plugin wiring live under `src-tauri/src/`.
  - Bundling configured in `src-tauri/tauri.conf.json` and `src-tauri/tauri.beta.conf.json` (Linux-only profiles for CI/container builds).
  - Build script `src-tauri/build.rs` generates a compile-time hash for `mcp-host/uv.lock` used to validate host deps.

- Host Python Runtime (MCP Host):
  - Git submodule: `mcp-host` (cloned from OpenAgentPlatform/dive-mcp-host).
  - Managed via uv (Python package/deps) and helper scripts under `scripts/` (`download-uv.ts`, `before-package.ts`, etc.).
  - Shipping rules:
    - Tauri bundles include `../mcp-host/*` as resources for Linux.
    - Electron bundles include `bin/{node,python,uv}/darwin-*` and submodule content via `electron-builder.json` extraResources.

## IPC and Process Model

- Electron main ↔ renderer:
  - Custom IPC channels implemented under `electron/main/ipc/`.
  - Preload exposes safe, typed bridges.

- App ↔ MCP Host:
  - Paths resolved in Rust (`src-tauri/src/lib.rs`, `src-tauri/src/host.rs`) against `resources/mcp-host` for packaged mode.
  - During development, scripts in `scripts/` download platform-specific Node/Python/uv to `bin/` and configure the working directory.

## Build and Packaging Paths

- Frontend build: `npm run build` → Vite outputs to `dist/`.
- Electron build: `npm run build:electron` → `dist-electron/*`.
- Electron packaging: `electron-builder` produces `release/${version}/...`.
- Tauri bundling (Linux): `src-tauri/target/release/bundle/{deb,rpm,appimage}/`.

## Notable Configurations

- `src-tauri/tauri.conf.json`:
  - Declares product metadata, window config, plugins, and resource mapping of `../mcp-host/*` into `resources/mcp-host`.
  - Linux `appimage` target is enabled for standard desktop releases but may be disabled in containerized CI builds.

- `src-tauri/tauri.beta.conf.json`:
  - Build-only profile used in container/CI to limit Linux bundle targets to `deb` and `rpm` for robustness.

- `electron-builder.json`:
  - macOS targets: `dmg` and `zip` (arm64 and x64). Hardened runtime enabled.
  - Bundles platform Node, uv, Python under `bin/` into the app resources where applicable.
  - `scripts/notarizer.js` handles notarization with Apple credentials, with an environment-controlled skip path.

## Containerization Overview

- Linux build container (Docker):
  - Dockerfile: `docker/linux-tauri-build/Dockerfile` installs Rust, Tauri CLI, Node 22, and necessary GTK/WebKit/GStreamer libs.
  - Default command runs a simplified build script that installs npm deps and runs `cargo tauri build` with the beta config and `TAURI_BUNDLE_TARGETS=deb,rpm`.
  - Convenience script: `scripts/docker/build-linux-tauri.sh` builds the image and executes it with the workspace mounted.

- Apple container (optional):
  - Script: `scripts/docker/build-with-apple-container.sh` leverages Apple’s `container` CLI to build from the same Dockerfile and run the Linux bundling process. On macOS 15, DNS inside the builder may fail for apt; prefer Docker for reliability.

## Key Decisions and Rationale

- Split Linux `deb/rpm` and `appimage` targets: `appimage` can fail in containerized builds due to linuxdeploy runtime issues; `deb/rpm` proved stable.
- Submodule enforcement: Rust build depends on `mcp-host/uv.lock`; we ensure the submodule is initialized before builds.
- Notarization toggled via environment: local developer builds default to unsigned artifacts; CI or release jobs can enable signing/notarization with Apple credentials.

## Troubleshooting

- Vite/rollup optional dependency error on macOS dev:
  - If you see `Cannot find module @rollup/rollup-darwin-arm64`, remove `node_modules` and restore `package-lock.json`, then run `npm ci`.
- Apple container apt DNS failures on macOS 15:
  - The builder may not resolve `ports.ubuntu.com`. Prefer Docker for Linux packaging on macOS 15.
- AppImage bundling crash in Linux builds:
  - Disable AppImage or stick to `deb/rpm` in containerized contexts.
