"use client"

import { useState } from "react"
import { Box, Plus, Save, Trash2 } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface FileExplorerProps {
  files: Record<string, string>
  activeFile: string
  onFileSelect: (filename: string) => void
  onCreateFile?: (filename: string) => void
  onDeleteFile?: (filename: string) => void
  onSaveFile?: (filename: string) => void
}

export function FileExplorer({
  files,
  activeFile,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  onSaveFile,
}: FileExplorerProps) {
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState("")

  const handleCreateFile = () => {
    if (newFileName.trim() && onCreateFile) {
      // 확장자가 없으면 .sol 추가
      const fileName = newFileName.includes(".") ? newFileName : `${newFileName}.sol`
      onCreateFile(fileName)
      setNewFileName("")
      setShowNewFileDialog(false)
    }
  }

  return (
    <>
      <AccordionItem value="files" className="border-b border-gray-800">
        <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:bg-gray-800 hover:no-underline">
          FILE EXPLORER
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-3 px-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">FILES</span>
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
          <ul className="space-y-1">
            {Object.keys(files).map((filename) => (
              <li
                key={filename}
                className={`text-sm flex items-center justify-between p-1 rounded cursor-pointer group ${
                  activeFile === filename ? "bg-gray-800 text-purple-400" : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center flex-1 overflow-hidden" onClick={() => onFileSelect(filename)}>
                  <Box className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{filename}</span>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
                  {onSaveFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-gray-300 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSaveFile(filename)
                      }}
                      title="Save File"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  )}
                  {onDeleteFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteFile(filename)
                      }}
                      title="Delete File"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.sol"
              className="bg-gray-800 border-gray-700"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile()
              }}
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
    </>
  )
}
