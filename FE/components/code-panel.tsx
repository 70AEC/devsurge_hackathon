"use client"

import { useState, useEffect } from "react"
import { Code, Play, FileCode } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IDE } from "./ide/ide"
import { NextJSCode } from "./nextjs/nextjs-code"
import { PreviewPanel } from "./preview/preview-panel"

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
