import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import jotaiDebugLabel from "jotai/babel/plugin-debug-label"
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh"

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    build: {
      host: host || false,
      // Tauri uses Chromium on Windows and WebKit on macOS and Linux
      target:
        process.env.TAURI_ENV_PLATFORM == "windows"
          ? "chrome105"
          : "safari13",
      // don"t minify for debug builds
      minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" as const : false,
      // produce sourcemaps for debug builds
      sourcemap: !!process.env.TAURI_ENV_DEBUG,
      // Optimize chunk splitting for better performance
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React and core libraries
            if (id.includes('node_modules/react') ||
                id.includes('node_modules/react-dom') ||
                id.includes('node_modules/react-router')) {
              return 'react-vendor'
            }
            // UI libraries
            if (id.includes('node_modules/@radix-ui')) {
              return 'ui-vendor'
            }
            // Code editor
            if (id.includes('node_modules/@codemirror') ||
                id.includes('node_modules/@uiw/react-codemirror')) {
              return 'codemirror'
            }
            // Markdown and math
            if (id.includes('node_modules/react-markdown') ||
                id.includes('node_modules/remark') ||
                id.includes('node_modules/rehype') ||
                id.includes('node_modules/katex')) {
              return 'markdown'
            }
            // Charts and diagrams
            if (id.includes('node_modules/mermaid')) {
              return 'diagrams'
            }
            // Internationalization
            if (id.includes('node_modules/i18next') ||
                id.includes('node_modules/react-i18next')) {
              return 'i18n'
            }
            // State management
            if (id.includes('node_modules/jotai')) {
              return 'state'
            }
            // Utility libraries
            if (id.includes('node_modules/lodash') ||
                id.includes('node_modules/clsx') ||
                id.includes('node_modules/classnames')) {
              return 'utils'
            }
            // Other heavy libraries
            if (id.includes('node_modules/@anthropic-ai/sdk') ||
                id.includes('node_modules/openai') ||
                id.includes('node_modules/@aws-sdk')) {
              return 'ai-vendor'
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        "@": path.join(__dirname, "src"),
        "@codemirror/state": path.resolve(
          __dirname,
          "./node_modules/@codemirror/state/dist/index.js"
        ),
        "@codemirror/view": path.resolve(
          __dirname,
          "./node_modules/@codemirror/view/dist/index.js"
        ),
        "@codemirror/lint": path.resolve(
          __dirname,
          "./node_modules/@codemirror/lint/dist/index.js"
        ),
        "@codemirror/lang-json": path.resolve(
          __dirname,
          "./node_modules/@codemirror/lang-json/dist/index.js"
        ),
        "@codemirror/linter": path.resolve(
          __dirname,
          "./node_modules/@codemirror/linter/dist/index.js"
        ),
        "@codemirror/theme-one-dark": path.resolve(
          __dirname,
          "./node_modules/@codemirror/theme-one-dark/dist/index.js"
        ),
        "@codemirror/autocomplete": path.resolve(
          __dirname,
          "./node_modules/@codemirror/autocomplete/dist/index.js"
        ),
        "@codemirror/commands": path.resolve(
          __dirname,
          "./node_modules/@codemirror/commands/dist/index.js"
        ),
        "@codemirror/language": path.resolve(
          __dirname,
          "./node_modules/@codemirror/language/dist/index.js"
        ),
        "@codemirror/search": path.resolve(
          __dirname,
          "./node_modules/@codemirror/search/dist/index.js"
        ),
        "@uiw/react-codemirror": path.resolve(
          __dirname,
          "node_modules/@uiw/react-codemirror/esm/index.js",
        ),
        "@uiw/codemirror-extensions-basic-setup": path.resolve(
          __dirname,
          "node_modules/@uiw/codemirror-extensions-basic-setup/esm/index.js"
        ),
      },
    },
    plugins: [
      react({babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] }}),
    ],
    server: {
      strictPort: true,
      watch: {
        ignored: ["**/mcp-host/**", "**/src-tauri/**"],
        exclude: ["**/mcp-host/**"],
      },
    },
    envPrefix: ["VITE_", "TAURI_ENV_*"],
  }
})
