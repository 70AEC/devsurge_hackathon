import express, { type Request, type Response } from "express"
import cors from "cors"
import fs from "fs/promises"
import { existsSync, mkdirSync } from "fs"
import path from "path"
import { exec, spawn, type ChildProcess } from "child_process"
import { promisify } from "util"
import { fileURLToPath } from "url"
import treeKill from "tree-kill"

// ✅ __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const execAsync = promisify(exec)
const app = express()
const port = 4000

// ✅ One shared project folder
const PROJECT_PATH = path.join(__dirname, "project")
const MAX_PROJECT_AGE_MS = 1000 * 60 * 60
const BASE_PORT = 3100
let nextPort = BASE_PORT

let runningProject: {
  port: number
  path: string
  lastAccessed: number
  process: ChildProcess
  ready: boolean
} | null = null

app.use(cors())
app.use(express.json({ limit: "10mb" }))

// 🧹 Cleanup interval
setInterval(
  () => {
    if (!runningProject) return
    const now = Date.now()
    if (now - runningProject.lastAccessed > MAX_PROJECT_AGE_MS) {
      console.log("🧹 Auto-stopping stale preview project")
      stopProject()
    }
  },
  1000 * 60 * 10,
)

// Helper to stop the current project
async function stopProject() {
  if (!runningProject) return

  try {
    console.log(`🛑 Stopping project on port ${runningProject.port}`)

    // Use tree-kill to properly kill the process tree
    if (runningProject.process.pid) {
      await new Promise<void>((resolve) => {
        treeKill(runningProject!.process.pid!, "SIGTERM", (error?: Error) => {
          if (error) console.error("❌ Kill error:", error)
          resolve()
        })
      })
    }

    // Clean up project directory
    if (existsSync(PROJECT_PATH)) {
      await fs.rm(PROJECT_PATH, { recursive: true, force: true })
      await fs.mkdir(PROJECT_PATH, { recursive: true })
    }

    runningProject = null

    // Reset port if it's getting too high
    if (nextPort > BASE_PORT + 100) {
      nextPort = BASE_PORT
    }

    console.log("✅ Project stopped successfully")
  } catch (e) {
    console.error("❌ Failed to stop project:", e)
    // Reset the running project anyway to avoid getting stuck
    runningProject = null
  }
}

// Create default files if they don't exist
async function ensureDefaultFiles(files: Record<string, string>) {
  // Check if app directory exists
  const appDir = path.join(PROJECT_PATH, "app")
  if (!existsSync(appDir)) {
    mkdirSync(appDir, { recursive: true })
  }

  // Default files to create if they don't exist
  const defaultFiles = {
    "app/page.tsx": `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to Next.js</h1>
      <p>Edit app/page.tsx and save to see your changes!</p>
    </main>
  )
}`,
    "app/layout.tsx": `export const metadata = {
  title: 'Next.js App',
  description: 'Created with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
    "app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, sans-serif;
}`,
  }

  // Create default files if they don't exist in the provided files
  for (const [filePath, content] of Object.entries(defaultFiles)) {
    if (!files[filePath]) {
      console.log(`Creating default file: ${filePath}`)
      const fullPath = path.join(PROJECT_PATH, filePath)
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, content)
    }
  }
}

// 🚀 Preview API
app.post("/preview", async (req: Request, res: Response) => {
  const { files } = req.body as { files: Record<string, string> }

  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ error: "No files provided" })
  }

  try {
    // 🔁 Reuse if running
    if (runningProject && runningProject.ready) {
      console.log(`♻️ Reusing existing project on port ${runningProject.port}`)

      // Update files
      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(PROJECT_PATH, filePath)
        await fs.mkdir(path.dirname(fullPath), { recursive: true })
        await fs.writeFile(fullPath, content)
      }

      runningProject.lastAccessed = Date.now()
      return res.json({ url: `http://localhost:${runningProject.port}` })
    }

    // Stop any existing project first
    await stopProject()

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

    // Ensure default files exist
    await ensureDefaultFiles(files)

    // 📦 Setup package.json
    const packageJsonPath = path.join(PROJECT_PATH, "package.json")
    const packageJson = {
      name: "preview-project",
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
      },
      dependencies: {
        next: "^14.1.0",
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        typescript: "^5.0.4",
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "@types/node": "^18.16.0",
      },
    }
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

    // Create a proper tsconfig.json
    const tsconfigPath = path.join(PROJECT_PATH, "tsconfig.json")
    const tsconfig = {
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "node",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [
          {
            name: "next",
          },
        ],
        paths: {
          "@/*": ["./*"],
        },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    }
    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2))

    // Create next.config.js
    const nextConfigPath = path.join(PROJECT_PATH, "next.config.js")
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`
    await fs.writeFile(nextConfigPath, nextConfig)

    // Create tailwind.config.js
    const tailwindConfigPath = path.join(PROJECT_PATH, "tailwind.config.js")
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
    await fs.writeFile(tailwindConfigPath, tailwindConfig)

    // Create postcss.config.js
    const postcssConfigPath = path.join(PROJECT_PATH, "postcss.config.js")
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
    await fs.writeFile(postcssConfigPath, postcssConfig)

    // 🧩 Install deps with --force to ensure proper installation
    console.log("📦 Installing dependencies...")
    try {
      await execAsync("npm install --force", { cwd: PROJECT_PATH })
    } catch (error) {
      console.error("❌ npm install failed:", error)
      return res.status(500).json({ error: "Failed to install dependencies" })
    }

    // ▶️ Run dev server
    const portToUse = nextPort++
    console.log(`🚀 Starting Next.js on port ${portToUse}...`)

    const devProcess = spawn("npx", ["next", "dev", "-p", portToUse.toString()], {
      cwd: PROJECT_PATH,
      shell: true,
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: "true" },
    })

    // Create a promise that resolves when the server is ready
    const serverReady = new Promise<boolean>((resolve, reject) => {
      let output = ""
      let errorOutput = ""
      let timeout: NodeJS.Timeout

      // Set a maximum timeout
      timeout = setTimeout(() => {
        console.error("⏱️ Server start timeout")
        console.error("Last output:", output)
        console.error("Error output:", errorOutput)
        reject(new Error("Server start timeout after 30 seconds"))
      }, 30000)

      devProcess.stdout?.on("data", (data) => {
        const chunk = data.toString()
        output += chunk
        console.log(`[Preview] ${chunk.trim()}`)

        // Check for the "ready" message from Next.js
        if (chunk.includes("Ready") || (chunk.includes("ready") && chunk.includes("started"))) {
          clearTimeout(timeout)
          resolve(true)
        }
      })

      devProcess.stderr?.on("data", (data) => {
        const chunk = data.toString()
        errorOutput += chunk
        console.error(`[Preview ERROR] ${chunk.trim()}`)

        // Some Next.js versions output ready message to stderr
        if (chunk.includes("Ready") || (chunk.includes("ready") && chunk.includes("started"))) {
          clearTimeout(timeout)
          resolve(true)
        }
      })

      devProcess.on("error", (err) => {
        clearTimeout(timeout)
        console.error("❌ Failed to start Next.js:", err)
        reject(err)
      })

      devProcess.on("exit", (code) => {
        clearTimeout(timeout)
        if (code !== 0) {
          console.error(`❌ Next.js exited with code ${code}`)
          reject(new Error(`Process exited with code ${code}`))
        }
      })
    })

    runningProject = {
      port: portToUse,
      path: PROJECT_PATH,
      lastAccessed: Date.now(),
      process: devProcess,
      ready: false,
    }

    try {
      // Wait for the server to be ready
      await serverReady
      console.log(`✅ Next.js server ready on port ${portToUse}`)

      if (runningProject) {
        runningProject.ready = true
      }

      res.json({ url: `http://localhost:${portToUse}` })
    } catch (error) {
      console.error("❌ Server failed to start:", error)
      await stopProject()
      res.status(500).json({ error: "Failed to start preview server" })
    }
  } catch (e) {
    console.error("❌ Error in /preview:", e)
    await stopProject()
    res.status(500).json({ error: String(e) || "Internal server error" })
  }
})

// 🛑 Stop server
app.post("/preview/stop", async (_req: Request, res: Response) => {
  await stopProject()
  res.json({ success: true })
})

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    running: runningProject
      ? {
          port: runningProject.port,
          ready: runningProject.ready,
          uptime: Date.now() - runningProject.lastAccessed,
        }
      : null,
  })
})

app.listen(port, () => {
  console.log(`🚀 Preview server running at http://localhost:${port}`)
})
