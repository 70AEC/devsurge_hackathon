"use client"

interface CodeEditorProps {
  activeFile: string
  code: string
  onChange: (code: string) => void
  onCompile: () => void
  isCompiling: boolean
  onSaveFile?: () => void
  isSaving?: boolean
}

import { Button } from "@/components/ui/button"
import { Save, Check } from "lucide-react"
import { useEffect, useState } from "react"

export function CodeEditor({
  activeFile,
  code,
  onChange,
  onCompile,
  isCompiling,
  onSaveFile,
  isSaving = false,
}: CodeEditorProps) {
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!isSaving && saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [isSaving, saveSuccess])

  const handleSave = () => {
    if (onSaveFile) {
      onSaveFile()
      setSaveSuccess(true)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="text-sm font-medium">{activeFile}</div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className={`h-7 text-xs flex items-center gap-1 text-white border-gray-600 hover:bg-gray-700 bg-gray-800 transition-all duration-200 ${
              isSaving ? "opacity-70" : ""
            } ${saveSuccess ? "bg-green-700 border-green-600" : ""}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center">
                <Save className="h-3 w-3 mr-1 animate-pulse" />
                Saving...
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center">
                <Check className="h-3 w-3 mr-1" />
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
            onClick={onCompile}
            disabled={isCompiling}
          >
            {isCompiling ? "Compiling..." : "Compile"}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <textarea
          className="w-full h-full bg-gray-900 text-gray-100 p-4 font-mono text-sm resize-none focus:outline-none"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
