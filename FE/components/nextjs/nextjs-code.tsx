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

interface NextJSCodeProps {
  onFilesChange?: (files: Record<string, string>) => void
}

// ✅ 초기 파일 정의
const defaultFiles: Record<string, string> = {
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
  background-color: #f0f0f0;
}
`,
}


// 📁 파일 트리 파싱 함수
function parseFileTree(files: Record<string, string>) {
  const tree: Record<string, any> = {}
  Object.entries(files).forEach(([path, content]) => {
    const parts = path.split("/")
    let current = tree
    parts.forEach((part, idx) => {
      if (idx === parts.length - 1) {
        current[part] = { type: "file", content }
      } else {
        if (!current[part]) {
          current[part] = { type: "directory", children: {} }
        }
        current = current[part].children
      }
    })
  })
  return tree
}

export function NextJSCode({ onFilesChange }: NextJSCodeProps) {
  const [files, setFiles] = useState<Record<string, string>>(defaultFiles)
  const [fileTree, setFileTree] = useState({})
  const [activeFile, setActiveFile] = useState("app/page.tsx")
  const [fileContent, setFileContent] = useState("")
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [newFileDirectory, setNewFileDirectory] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 🧠 최초 로드
  useEffect(() => {
    const saved = localStorage.getItem("nextjs-preview-files")
    const initial = saved ? JSON.parse(saved) : defaultFiles
    setFiles(initial)
    setFileTree(parseFileTree(initial))
    setFileContent(initial[activeFile] || "")
    setIsLoading(false)
    if (onFilesChange) {
      onFilesChange(initial)
    }
  }, [])

  // 🔁 선택된 파일 바뀌면 에디터에 반영
  useEffect(() => {
    setFileContent(files[activeFile] || "")
  }, [activeFile, files])

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value)
    }
  }

  const handleSaveFile = () => {
    const updatedFiles = {
      ...files,
      [activeFile]: fileContent,
    }
    setFiles(updatedFiles)
    localStorage.setItem("nextjs-preview-files", JSON.stringify(updatedFiles))
    setFileTree(parseFileTree(updatedFiles))
    if (onFilesChange) onFilesChange(updatedFiles)

    setIsSaving(true)
    toast({ title: "File Saved", description: `${activeFile} saved.` })
    setSaveSuccess(true)
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(false)
    }, 1500)
  }

  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      toast({ title: "Error", description: "File name required", variant: "destructive" })
      return
    }

    const fullPath = newFileDirectory ? `${newFileDirectory}/${newFileName}` : newFileName

    if (files[fullPath]) {
      toast({ title: "Exists", description: `${fullPath} already exists`, variant: "destructive" })
      return
    }

    const defaultContent = fullPath.endsWith(".tsx")
      ? `export default function Component() {\n  return <div>New Component</div>\n}`
      : fullPath.endsWith(".ts")
      ? `export const example = () => "Hello"`
      : fullPath.endsWith(".css")
      ? `/* ${fullPath} */\n.container { padding: 1rem; }`
      : ""

    const updated = { ...files, [fullPath]: defaultContent }
    setFiles(updated)
    setFileTree(parseFileTree(updated))
    setActiveFile(fullPath)
    setFileContent(defaultContent)
    localStorage.setItem("nextjs-preview-files", JSON.stringify(updated))
    if (onFilesChange) onFilesChange(updated)

    setNewFileName("")
    setNewFileDirectory("")
    setShowNewFileDialog(false)

    toast({ title: "File Created", description: `${fullPath} created.` })
  }

  const handleDeleteFile = () => {
    if (activeFile === "app/page.tsx" || activeFile === "app/layout.tsx") {
      toast({ title: "Cannot Delete", description: "Essential file", variant: "destructive" })
      return
    }

    const updated = { ...files }
    delete updated[activeFile]
    setFiles(updated)
    setFileTree(parseFileTree(updated))
    setActiveFile("app/page.tsx")
    setFileContent(updated["app/page.tsx"])
    localStorage.setItem("nextjs-preview-files", JSON.stringify(updated))
    if (onFilesChange) onFilesChange(updated)

    toast({ title: "File Deleted", description: `${activeFile} deleted.` })
  }

  const getLanguage = (path: string) => {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript"
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript"
    if (path.endsWith(".css")) return "css"
    if (path.endsWith(".json")) return "json"
    return "plaintext"
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 overflow-y-auto">
        <div className="p-2 flex justify-between items-center border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Files</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-white"
            onClick={() => setShowNewFileDialog(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <FileExplorer fileTree={fileTree} activeFile={activeFile} onFileSelect={setActiveFile} />
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="p-2 border-b border-gray-800 flex justify-between items-center text-sm text-white">
          <span>{activeFile}</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveFile} variant="outline">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button size="sm" onClick={handleDeleteFile} variant="outline">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <Editor
            language={getLanguage(activeFile)}
            value={fileContent}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
      </div>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newFileDirectory}
              onChange={(e) => setNewFileDirectory(e.target.value)}
              placeholder="Directory (e.g. app/components)"
              className="bg-gray-800 border-gray-700"
            />
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name (e.g. Button.tsx)"
              className="bg-gray-800 border-gray-700"
            />
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

function FileExplorer({
  fileTree,
  activeFile,
  onFileSelect,
}: {
  fileTree: Record<string, any>
  activeFile: string
  onFileSelect: (path: string) => void
}) {
  const renderTree = (tree: Record<string, any>, prefix = "", depth = 0) =>
    Object.entries(tree).map(([name, node]) => {
      const path = prefix ? `${prefix}/${name}` : name
      if (node.type === "directory") {
        return (
          <div key={path}>
            <div className="text-yellow-400 pl-4">{name}/</div>
            <div className="pl-4">{renderTree(node.children, path, depth + 1)}</div>
          </div>
        )
      }
      return (
        <div
          key={path}
          onClick={() => onFileSelect(path)}
          className={`cursor-pointer pl-4 py-1 text-sm ${
            path === activeFile ? "text-purple-400" : "text-white"
          }`}
        >
          {name}
        </div>
      )
    })

  return <div className="py-2">{renderTree(fileTree)}</div>
}
