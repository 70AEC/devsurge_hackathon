"use client"

import { useState, useEffect } from "react"
import { Download, FileCode, Plus, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import JSZip from "jszip"
import FileSaver from "file-saver"
import Editor from "@monaco-editor/react"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Default Next.js files
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

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`,
  "package.json": `{
  "name": "nextjs-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}`,
  "postcss.config.js": `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
  "next.config.js": `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig`,
  "components/Button.tsx": `export default function Button({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return (
    <button 
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={onClick}
    >
      {children}
    </button>
  )
}`,
  "components/Card.tsx": `export default function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-sm">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  )
}`,
}

// Helper to parse file paths into a tree structure
function parseFileTree(files: Record<string, string>) {
  const tree: Record<string, any> = {}

  Object.keys(files).forEach((path) => {
    const parts = path.split("/")
    let current = tree

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        // This is a file
        current[part] = { type: "file", content: files[path] }
      } else {
        // This is a directory
        if (!current[part]) {
          current[part] = { type: "directory", children: {} }
        }
        current = current[part].children
      }
    }
  })

  return tree
}

export function NextJSCode() {
  const [files, setFiles] = useState<Record<string, string>>(defaultFiles)
  const [fileTree, setFileTree] = useState<Record<string, any>>({})
  const [activeFile, setActiveFile] = useState("app/page.tsx")
  const [fileContent, setFileContent] = useState("")
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [newFileDirectory, setNewFileDirectory] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize file tree and content
  useEffect(() => {
    setFileTree(parseFileTree(files))
    setFileContent(files[activeFile] || "")
    setIsLoading(false)
  }, [files, activeFile])

  // Handle file selection
  const handleFileSelect = (filePath: string) => {
    setActiveFile(filePath)
    setFileContent(files[filePath] || "")
  }

  // Handle file content change
  const handleEditorChange = (value: string | undefined) => {
    if (!value) return
    setFileContent(value)
  }

  // Save the current file
  const handleSaveFile = () => {
    setIsSaving(true)

    // Update the files state with the new content
    setFiles((prev) => ({
      ...prev,
      [activeFile]: fileContent,
    }))

    // Show success indicator
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)

    toast({
      title: "File Saved",
      description: `${activeFile} has been saved`,
    })

    setIsSaving(false)
  }

  // Create a new file
  const handleCreateFile = () => {
    if (!newFileName) {
      toast({
        title: "Error",
        description: "File name is required",
        variant: "destructive",
      })
      return
    }

    // Determine the full path
    const fullPath = newFileDirectory ? `${newFileDirectory}/${newFileName}` : newFileName

    // Check if the file already exists
    if (files[fullPath]) {
      toast({
        title: "File Exists",
        description: `${fullPath} already exists`,
        variant: "destructive",
      })
      return
    }

    // Create default content based on extension
    let defaultContent = ""
    if (fullPath.endsWith(".tsx") || fullPath.endsWith(".jsx")) {
      defaultContent = `export default function Component() {\n  return (\n    <div>\n      New Component\n    </div>\n  );\n}`
    } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".js")) {
      defaultContent = `// ${fullPath}\n\nexport function example() {\n  return "Hello World";\n}`
    } else if (fullPath.endsWith(".css")) {
      defaultContent = `/* ${fullPath} */\n\n.container {\n  padding: 1rem;\n}`
    } else if (fullPath.endsWith(".json")) {
      defaultContent = `{\n  "name": "example"\n}`
    }

    // Add the new file
    setFiles((prev) => ({
      ...prev,
      [fullPath]: defaultContent,
    }))

    // Select the new file
    setActiveFile(fullPath)
    setFileContent(defaultContent)

    toast({
      title: "File Created",
      description: `${fullPath} has been created`,
    })

    setShowNewFileDialog(false)
    setNewFileName("")
    setNewFileDirectory("")
  }

  // Delete the current file
  const handleDeleteFile = () => {
    if (activeFile === "app/page.tsx" || activeFile === "app/layout.tsx") {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete essential Next.js files",
        variant: "destructive",
      })
      return
    }

    // Create a copy of files without the active file
    const newFiles = { ...files }
    delete newFiles[activeFile]

    // Update files state
    setFiles(newFiles)

    // Select app/page.tsx after deletion
    setActiveFile("app/page.tsx")
    setFileContent(files["app/page.tsx"])

    toast({
      title: "File Deleted",
      description: `${activeFile} has been deleted`,
    })
  }

  // Function to download project files
  const downloadProject = async () => {
    try {
      const zip = new JSZip()

      // Add all files to the zip
      Object.entries(files).forEach(([path, content]) => {
        // Create directories if needed
        const parts = path.split("/")
        if (parts.length > 1) {
          const dirPath = parts.slice(0, -1).join("/")
          zip.folder(dirPath)
        }

        zip.file(path, content)
      })

      // Generate zip file
      const content = await zip.generateAsync({ type: "blob" })

      // Download the zip file
      FileSaver.saveAs(content, "nextjs-project.zip")

      toast({
        title: "Success",
        description: "Project downloaded successfully",
      })
    } catch (error) {
      console.error("Failed to download project:", error)
      toast({
        title: "Error",
        description: "Failed to download project",
        variant: "destructive",
      })
    }
  }

  // Get file language for Monaco editor
  const getLanguage = (filePath: string) => {
    if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "typescript"
    if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) return "javascript"
    if (filePath.endsWith(".json")) return "json"
    if (filePath.endsWith(".css")) return "css"
    if (filePath.endsWith(".html")) return "html"
    return "plaintext"
  }

  return (
    <div className="h-full w-full flex bg-gray-900">
      {/* File Explorer */}
      <div className="w-64 border-r border-gray-800 overflow-y-auto bg-gray-900 flex flex-col">
        <div className="p-2 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-300">FILES</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-white"
            onClick={() => setShowNewFileDialog(true)}
            title="New File"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <FileExplorer
          fileTree={fileTree}
          activeFile={activeFile}
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-300 truncate flex items-center">
            <FileCode className="h-4 w-4 mr-2 text-gray-400" />
            {activeFile}
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className={`h-7 text-xs flex items-center gap-1 text-white border-gray-600 hover:bg-gray-700 bg-gray-800 transition-all duration-200 ${
                isSaving ? "opacity-70" : ""
              } ${saveSuccess ? "bg-green-700 border-green-600" : ""}`}
              onClick={handleSaveFile}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <Save className="h-3 w-3 mr-1 animate-pulse" />
                  Saving...
                </span>
              ) : saveSuccess ? (
                <span className="flex items-center">
                  <Save className="h-3 w-3 mr-1" />
                  Saved!
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-white border-gray-600 hover:bg-gray-700 bg-gray-800"
              onClick={handleDeleteFile}
              disabled={activeFile === "app/page.tsx" || activeFile === "app/layout.tsx"}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
            <Button
              onClick={downloadProject}
              variant="outline"
              size="sm"
              className="h-7 text-xs text-white border-gray-600 hover:bg-gray-700 bg-gray-800"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin mb-2"></div>
                <p className="text-sm text-gray-400">Initializing editor...</p>
              </div>
            </div>
          ) : (
            <Editor
              height="100%"
              language={getLanguage(activeFile)}
              value={fileContent}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          )}
        </div>
      </div>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Directory (optional)</label>
              <Input
                value={newFileDirectory}
                onChange={(e) => setNewFileDirectory(e.target.value)}
                placeholder="e.g., app/components"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">File Name</label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g., Button.tsx"
                className="bg-gray-800 border-gray-700"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFile()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile} className="bg-purple-600 hover:bg-purple-700 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// File Explorer Component
function FileExplorer({
  fileTree,
  activeFile,
  onFileSelect,
  isLoading,
}: {
  fileTree: Record<string, any>
  activeFile: string
  onFileSelect: (path: string) => void
  isLoading: boolean
}) {
  // Recursive function to render the file tree
  const renderFileTree = (tree: Record<string, any>, path = "", level = 0) => {
    return Object.entries(tree)
      .sort(([, a], [, b]) => {
        // Directories first, then files
        if (a.type === "directory" && b.type === "file") return -1
        if (a.type === "file" && b.type === "directory") return 1
        // Alphabetical order
        return 0
      })
      .map(([name, item]) => {
        const currentPath = path ? `${path}/${name}` : name

        if (item.type === "directory") {
          return (
            <div key={currentPath}>
              <div
                className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-800 text-gray-300"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
              >
                <FolderIcon className="h-4 w-4 mr-2 text-yellow-500" />
                <span className="text-sm truncate">{name}</span>
              </div>
              {item.children && renderFileTree(item.children, currentPath, level + 1)}
            </div>
          )
        } else {
          return (
            <div
              key={currentPath}
              className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-800 ${activeFile === currentPath ? "bg-gray-800 text-purple-400" : "text-gray-300"}`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => onFileSelect(currentPath)}
            >
              <FileIcon className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-sm truncate">{name}</span>
            </div>
          )
        }
      })
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-400">Loading files...</div>
  }

  return <div className="py-2 flex-1 overflow-auto">{renderFileTree(fileTree)}</div>
}

// Simple icons for file explorer
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  )
}
