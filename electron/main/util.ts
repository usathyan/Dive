import net from "net"
import { spawn } from "child_process"

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
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    
    const installation = spawn(npm, ['install'], {
      cwd: targetPath,
      stdio: 'inherit'
    })

    installation.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm install failed with code: ${code}`))
      }
    })

    installation.on('error', (err) => {
      reject(err)
    })
  })
}