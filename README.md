# Dive (UB) - Tauri-first Build, Usage, and Update Guide

This document captures the standard, Tauri-first workflow to build, use, and update Dive locally, while keeping build artifacts and steps separate from normal `git pull` operations.

## Prerequisites

- Node.js >= 18 and npm
- Rust toolchain (required for Tauri)
- Tauri 2 runtime dependencies for your OS
- uv (Python/packaging manager) for MCP servers and tooling
- Git

Recommended:
- macOS 14+ or a modern Linux/Windows host

## One-time setup

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/OpenAgentPlatform/Dive.git
cd Dive

# Install Node dependencies cleanly
rm -rf node_modules
npm ci

# Prepare local MCP host (Python) deps using uv
cd mcp-host
uv sync --frozen
cd ..
```

Notes:
- The project contains an Electron build path. This guide standardizes on the Tauri build path for smaller, faster installers.
- Some build scripts still reference Electron for compatibility; ignore those unless you explicitly need Electron bundles.

## Daily update (no build)

To refresh code without rebuilding installers:

```bash
git pull --rebase
git submodule update --init --recursive
```

This updates sources only. Build steps are manual and separate (see below).

## Tauri build targets

Dive includes a Tauri app alongside Electron. Typical targets:
- macOS: `dmg` (arm64/x64)
- Linux: `deb`, `rpm`
- Windows: `msi` or `nsis` (via cross build, or build on Windows)

Ensure Tauri deps per OS are available (GTK/WebKit for Linux, code signing optional for macOS/Windows).

## Build sequences (manual)

### macOS (Tauri, dmg)

```bash
# Start from repo root
npm run dev:tauri # optional: verify frontend builds

# Build dmg (arm64)
# Uses existing vite build + tauri bundling
# If you also use Electron locally, keep environments separate.

# If you need Python/node bins prepped for runtime, use the existing scripts
# only if you’re packaging Electron bundles. For Tauri, system Python is not required.

# Build release
cargo --version >/dev/null 2>&1 || echo "Install Rust toolchain first"

# Tauri bundling is invoked via Vite/Tauri config in this repo. If you use the Tauri CLI directly:
# npx @tauri-apps/cli build --target aarch64-apple-darwin

# Recommended: Use vite build then tauri build
npm run build
npx @tauri-apps/cli build

# Artifacts:
#   src-tauri/target/aarch64-apple-darwin/release/bundle/macos/*.dmg
```

Signing/notarization (optional): configure Apple credentials in env and follow Tauri docs.

### Linux (Tauri, deb/rpm)

```bash
# Install distro deps for Tauri (GTK/WebKit/GStreamer)
# See docker/linux-tauri-build/Dockerfile for exact packages

npm run build
npx @tauri-apps/cli build --bundles deb rpm

# Artifacts:
#   src-tauri/target/release/bundle/deb/*.deb
#   src-tauri/target/release/bundle/rpm/*.rpm
```

Tip: You can also use the provided container to reproduce `deb/rpm` builds. See `docker/linux-tauri-build/Dockerfile` and `scripts/docker/build-linux-tauri.sh` for reference.

### Windows (Tauri)

Run on Windows for the smoothest experience:

```powershell
npm ci
npm run build
npx @tauri-apps/cli build # produces .msi or .nsis based on config
```

Cross-compiling from macOS/Linux to Windows is not recommended for Tauri; prefer native builds.

## Using Dive (Tauri)

- Launch the built app from your OS’s bundle output.
- On first run, configure MCP servers via the app’s MCP Server Management.
- For local MCP servers (optional advanced):

```json
{
  "mcpServers": {
    "fetch": { "command": "uvx", "args": ["mcp-server-fetch"] }
  }
}
```

- For OAP cloud services, follow in-app instructions or the main `README.md`.

## Keeping build details separate

- Development and update flow:
  - `git pull` and `git submodule update` only refresh source code.
  - Build is triggered manually with the sequences above.
  - This avoids unintended rebuilds and keeps local artifacts out of the repo.

Optional local helpers (existing):
- `docker/linux-tauri-build/Dockerfile` and `scripts/docker/build-linux-tauri.sh` to produce `deb/rpm` via container.
- These are reference-only; not required for macOS/Windows Tauri builds.

## Troubleshooting

- If Vite can’t find a platform-specific Rollup binary, reinstall modules:
```bash
rm -rf node_modules
npm ci
```
- Ensure Rust is installed and up to date: `rustup update`.
- For Linux GUI deps, mirror packages from the Dockerfile.

## Contributing and personal Git setup

You can put this code on your own Git in one of two common ways: fork or mirror.

### Option A: Fork on GitHub (keeps upstream link)

1. Click Fork on the GitHub repo UI.
2. Rename your fork as needed.
3. Locally, point `origin` to your fork and keep upstream:

```bash
# Show current remotes
git remote -v

# Set origin to your fork
git remote set-url origin git@github.com:YOUR_NAME/Dive.git

# Add upstream to original repo (read-only)
git remote add upstream https://github.com/OpenAgentPlatform/Dive.git || true

# Fetch and rebase regularly
git fetch upstream
git rebase upstream/main
```

Push your local work to your fork:
```bash
git push origin your-branch
```

### Option B: Full mirror to your own Git server (no ties)

```bash
# Create a bare mirror
mkdir -p ~/mirrors && cd ~/mirrors
git clone --mirror https://github.com/OpenAgentPlatform/Dive.git Dive.git
cd Dive.git

# Push to your own server (example)
git remote add myserver ssh://git@your.git.server/your-namespace/Dive.git
git push --mirror myserver
```

Use the mirrored repo as your canonical origin:
```bash
cd /path/to/workspace
rm -rf Dive
git clone ssh://git@your.git.server/your-namespace/Dive.git
cd Dive
git remote -v
```

To sever the link to GitHub in an existing checkout and make your server the only remote:
```bash
# Replace origin, remove upstream if present
git remote set-url origin ssh://git@your.git.server/your-namespace/Dive.git
git remote remove upstream 2>/dev/null || true
```

## License

Unless you change licensing for your fork/mirror, this project is MIT-licensed. See `LICENSE`.
