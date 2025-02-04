import net from "node:net"
import path from "node:path"
import { spawn } from "cross-spawn"
import { app } from "electron"

export function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          resolve(true)
        }
      })
      .once("listening", () => {
        server.close()
        resolve(false)
      })
      .listen(port)
  })
}

export function npmInstall(targetPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const npm = process.platform === "win32"
      ? (app.isPackaged ? path.join(process.resourcesPath, "node", "npm.cmd") : "npm.cmd")
      : "npm"

    const installation = spawn(npm, ["install"], {
      cwd: targetPath,
      stdio: "inherit",
      shell: process.platform === "darwin",
      windowsHide: true,
      windowsVerbatimArguments: true
    })

    installation.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm install failed with code: ${code}`))
      }
    })

    installation.on("error", (err) => {
      reject(err)
    })
  })
}

export function modifyPath(customBinPath: string) {
  const connector = process.platform === "win32" ? ";" : ":"
  process.env.PATH = `${customBinPath}${connector}${process.env.PATH}`
}

export function setNodePath() {
  process.env.NODE_PATH = path.join(process.resourcesPath, "node", "node_modules")
}