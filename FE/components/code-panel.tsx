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
  // 생성된 코드가 있으면 사용, 없으면 기본 코드 사용
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

  // generatedCode가 변경되면 initialCode 업데이트
  useEffect(() => {
    if (generatedCode && Object.keys(generatedCode).length > 0) {
      // 첫 번째 파일의 내용을 사용
      const firstFileName = Object.keys(generatedCode)[0]
      if (firstFileName) {
        setInitialCode(generatedCode[firstFileName])
      }
    }
  }, [generatedCode])

  // Function to download project files
  const downloadProject = async () => {
    try {
      // Create a new JSZip instance
      const zip = new JSZip()

      // Add files to the zip based on the current tab
      if (activeTab === "code") {
        // Add Next.js files
        zip.file(
          "package.json",
          JSON.stringify(
            {
              name: "nextjs-nft-dapp",
              version: "0.1.0",
              private: true,
              scripts: {
                dev: "next dev",
                build: "next build",
                start: "next start",
              },
              dependencies: {
                next: "15.2.4",
                react: "^19",
                "react-dom": "^19",
              },
            },
            null,
            2,
          ),
        )

        // Create directories
        const appDir = zip.folder("app")!
        const componentsDir = zip.folder("components")!
        const uiDir = componentsDir.folder("ui")!

        // Add files to directories
        appDir.file(
          "page.tsx",
          `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Hello World</h1>
    </main>
  )
}`,
        )

        appDir.file(
          "layout.tsx",
          `export default function RootLayout({
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
        )
      } else if (activeTab === "remix") {
        // Add Solidity files
        if (generatedCode && Object.keys(generatedCode).length > 0) {
          // Add all generated Solidity files
          Object.entries(generatedCode).forEach(([fileName, content]) => {
            zip.file(fileName, content)
          })
        } else {
          // Add default Solidity file
          zip.file("SimpleStorage.sol", initialCode)
        }
      }

      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" })

      // Save the zip file with appropriate name
      const zipName = activeTab === "code" ? "nextjs-project.zip" : "solidity-project.zip"
      FileSaver.saveAs(content, zipName)
    } catch (error) {
      console.error("Error downloading project:", error)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-900">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        className="flex flex-col h-full w-full"
      >
        <div className="border-b border-gray-800 px-4 flex justify-between items-center">
          <TabsList className="bg-transparent border-b-0">
            <TabsTrigger
              value="remix"
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
            >
              <Code className="h-4 w-4 mr-2" />
              Remix IDE
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
            >
              <FileCode className="h-4 w-4 mr-2" />
              Next.js
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
            >
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
          <NextJSCode />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 overflow-hidden m-0 p-0 h-full">
          <PreviewPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
