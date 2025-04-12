"use client"

import { useState, useEffect } from "react"
import { Code, Play, FileCode } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IDE } from "./ide/ide"
import { NextJSCode } from "./nextjs/nextjs-code"
import { PreviewPanel } from "./preview/preview-panel"
import type { Project } from "@/hooks/project/types"

interface CodePanelProps {
  activeTab: "remix" | "code" | "preview"
  setActiveTab: (tab: "remix" | "code" | "preview") => void
  activeProject: Project | null
  onUpdateFile: (projectId: string, fileName: string, content: string) => void
}

export function CodePanel({ activeTab, setActiveTab, activeProject, onUpdateFile }: CodePanelProps) {
  // 활성 프로젝트의 파일 및 초기 코드 설정
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

  // 활성 프로젝트가 변경될 때 초기 코드 업데이트
  useEffect(() => {
    if (activeProject) {
      console.log("CodePanel: Active project changed to:", activeProject.name)
      console.log("CodePanel: Project files:", Object.keys(activeProject.files))

      const lastOpenedFile = activeProject.lastOpenedFile || Object.keys(activeProject.files)[0]
      if (lastOpenedFile && activeProject.files[lastOpenedFile]) {
        console.log("CodePanel: Setting initial code from file:", lastOpenedFile)
        setInitialCode(activeProject.files[lastOpenedFile])
      } else {
        console.warn("CodePanel: Could not find lastOpenedFile or any file in the project")
      }
    } else {
      console.log("CodePanel: No active project")
    }
  }, [activeProject])

  // 파일 내용 업데이트 핸들러
  const handleUpdateFile = (fileName: string, content: string) => {
    if (activeProject) {
      onUpdateFile(activeProject.id, fileName, content)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-900">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        className="flex flex-col h-full w-full"
      >
        <div className="border-b border-gray-800 px-4">
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
        </div>

        <TabsContent value="remix" className="flex-1 overflow-hidden m-0 p-0 h-full">
          {/* key 속성 추가: 프로젝트 ID가 변경될 때마다 컴포넌트를 다시 마운트 */}
          <IDE
            key={activeProject?.id || "no-project"}
            initialCode={initialCode}
            generatedFiles={activeProject?.files || {}}
            onUpdateFile={handleUpdateFile}
            activeProject={activeProject}
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
