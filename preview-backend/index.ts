// index.ts

import express, { Request, Response } from "express"
import cors from "cors"
import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { exec, ChildProcess } from "child_process"
import { promisify } from "util"
import { fileURLToPath } from "url"

// ✅ __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const execAsync = promisify(exec)
const app = express()
const port = 4000

// ✅ One shared project folder
const PROJECT_PATH = path.join(__dirname, "project")
const MAX_PROJECT_AGE_MS = 1000 * 60 * 60
let nextPort = 3100

let runningProject: {
  port: number
  path: string
  lastAccessed: number
  process: ChildProcess
} | null = null

app.use(cors())
app.use(express.json({ limit: "10mb" }))

// 🧹 Cleanup interval
setInterval(() => {
  if (!runningProject) return
  const now = Date.now()
  if (now - runningProject.lastAccessed > MAX_PROJECT_AGE_MS) {
    console.log("🧹 Auto-stopping stale preview project")
    try {
      if (runningProject.process.pid) {
        process.kill(runningProject.process.pid)
      }
    } catch (e) {
      console.error("❌ Failed to kill process:", e)
    }
    runningProject = null
  }
}, 1000 * 60 * 10)

// 🚀 Preview API
app.post("/preview", async (req: Request, res: Response) => {
  const { files } = req.body as { files: Record<string, string> }

  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ error: "No files provided" })
  }

  try {
    // 📁 Ensure folder
    if (!existsSync(PROJECT_PATH)) {
      await fs.mkdir(PROJECT_PATH, { recursive: true })
    }

    // ✍️ Write files
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(PROJECT_PATH, filePath)
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, content)
    }

    // 🔁 Reuse if running
    if (runningProject) {
      runningProject.lastAccessed = Date.now()
      return res.json({ url: `http://localhost:${runningProject.port}` })
    }

    // 📦 Setup package.json
    const packageJsonPath = path.join(PROJECT_PATH, "package.json")
    if (!existsSync(packageJsonPath)) {
      const packageJson = {
        name: "preview-project",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev"
        },
        dependencies: {
          next: "15.2.4",
          react: "19.0.0",
          "react-dom": "19.0.0"
        }
      }
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    }

    // 🧩 Install deps
    console.log("📦 Installing dependencies...")
    await execAsync("npm install --force", { cwd: PROJECT_PATH })

    // ▶️ Run dev server
    const portToUse = nextPort++
    const devProcess = exec(`npx next dev -p ${portToUse}`, { cwd: PROJECT_PATH })

    devProcess.stdout?.on("data", (data) => console.log(`[Preview] ${data}`))
    devProcess.stderr?.on("data", (data) => console.error(`[Preview ERROR] ${data}`))

    runningProject = {
      port: portToUse,
      path: PROJECT_PATH,
      lastAccessed: Date.now(),
      process: devProcess,
    }

    await new Promise((resolve) => setTimeout(resolve, 3000))

    res.json({ url: `http://localhost:${portToUse}` })
  } catch (e) {
    console.error("❌ Error in /preview:", e)
    res.status(500).json({ error: "Internal server error" })
  }
})

// 🛑 Stop server
app.post("/preview/stop", async (_req: Request, res: Response) => {
  if (!runningProject) return res.json({ success: true })

  try {
    if (runningProject.process.pid) {
      process.kill(runningProject.process.pid)
    }

    await fs.rm(PROJECT_PATH, { recursive: true, force: true })
    runningProject = null

    res.json({ success: true })
  } catch (e) {
    console.error("❌ Failed to stop project:", e)
    res.status(500).json({ error: "Failed to stop project" })
  }
})

app.listen(port, () => {
  console.log(`🚀 Preview server running at http://localhost:${port}`)
})
