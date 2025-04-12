"use client"

import { useState, useEffect } from "react"
import { Code, Play, FileCode, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { IDE } from "./ide/ide"
import { NextJSCode } from "./nextjs/nextjs-code"
import { PreviewPanel } from "./preview/preview-panel"
import JSZip from "jszip"
import FileSaver from "file-saver"

interface CodePanelProps {
  activeTab: "remix" | "code" | "preview"
  setActiveTab: (tab: "remix" | "code" | "preview") => void
  generatedCode?: Record<string, string>
}

export function CodePanel({ activeTab, setActiveTab, generatedCode = {} }: CodePanelProps) {
  const [initialCode, setInitialCode] = useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleStorage {
    uint256 private storedData;

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}`)

  const [nextFiles, setNextFiles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (generatedCode && Object.keys(generatedCode).length > 0) {
      const firstFileName = Object.keys(generatedCode)[0]
      if (firstFileName) {
        setInitialCode(generatedCode[firstFileName])
      }
    }
  }, [generatedCode])

  const downloadProject = async () => {
    try {
      const zip = new JSZip()

      if (activeTab === "code") {
        // zip에 현재 nextFiles 넣기
        Object.entries(nextFiles).forEach(([filePath, content]) => {
          zip.file(filePath, content)
        })
      } else if (activeTab === "remix") {
        if (generatedCode && Object.keys(generatedCode).length > 0) {
          Object.entries(generatedCode).forEach(([fileName, content]) => {
            zip.file(fileName, content)
          })
        } else {
          zip.file("SimpleStorage.sol", initialCode)
        }
      }

      const content = await zip.generateAsync({ type: "blob" })
      const zipName = activeTab === "code" ? "nextjs-project.zip" : "solidity-project.zip"
      FileSaver.saveAs(content, zipName)
    } catch (error) {
      console.error("Error downloading project:", error)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-900">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex flex-col h-full w-full">
        <div className="border-b border-gray-800 px-4 flex justify-between items-center">
          <TabsList className="bg-transparent border-b-0">
            <TabsTrigger value="remix" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
              <Code className="h-4 w-4 mr-2" />
              Remix IDE
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
              <FileCode className="h-4 w-4 mr-2" />
              Next.js
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
              <Play className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={downloadProject}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <TabsContent value="remix" className="flex-1 overflow-hidden m-0 p-0 h-full">
          <IDE
            initialCode={initialCode}
            generatedFiles={Object.keys(generatedCode).length > 0 ? generatedCode : undefined}
          />
        </TabsContent>

        <TabsContent value="code" className="flex-1 overflow-hidden m-0 p-0 h-full">
          <NextJSCode onFilesChange={setNextFiles} />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 overflow-hidden m-0 p-0 h-full">
          <PreviewPanel files={nextFiles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
