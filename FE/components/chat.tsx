"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useProjectManager, type ChatMessage } from "@/hooks/use-project-manager"

interface ChatProps {
  onSendMessage: (message: string) => Promise<void>
  isLoading?: boolean
}

export function Chat({ onSendMessage, isLoading = false }: ChatProps) {
  const { activeProject, addChatMessage } = useProjectManager()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // 활성 프로젝트가 변경될 때 채팅 메시지 업데이트
  useEffect(() => {
    if (activeProject) {
      setMessages(activeProject.messages || [])
    } else {
      setMessages([])
    }
  }, [activeProject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && activeProject) {
      // 사용자 메시지 추가
      addChatMessage(activeProject.id, {
        role: "user",
        content: input,
      })

      // AI 응답 요청
      try {
        await onSendMessage(input)
      } catch (error) {
        console.error("Error sending message:", error)
        // 오류 발생 시 오류 메시지 추가
        addChatMessage(activeProject.id, {
          role: "assistant",
          content: "Sorry, an error occurred while processing your request. Please try again.",
        })
      }

      setInput("")
    }
  }

  return (
    <div className="flex flex-col h-full border-b border-gray-800">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                Web3 Development Assistant
              </h2>
              <p className="text-gray-400 mb-4">
                Create smart contracts and build frontends with AI assistance. Describe what you want to build or paste
                existing code to get started.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div
                  className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setInput("Create an ERC721 NFT collection with minting page")}
                >
                  "Create an ERC721 NFT collection with minting page"
                </div>
                <div
                  className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setInput("Build a token swap interface for my DEX contract")}
                >
                  "Build a token swap interface for my DEX contract"
                </div>
                <div
                  className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setInput("Create a DAO voting mechanism with frontend")}
                >
                  "Create a DAO voting mechanism with frontend"
                </div>
                <div
                  className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setInput("Build a staking dApp with rewards tracking")}
                >
                  "Build a staking dApp with rewards tracking"
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-3/4 rounded-lg p-3 ${
                  message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-800 text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build..."
            className="flex-1 bg-gray-800 border-gray-700 focus:border-purple-500 focus:ring-purple-500"
            rows={1}
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            disabled={isLoading || !activeProject}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
