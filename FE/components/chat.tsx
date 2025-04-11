"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatProps {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  onSendMessage: (message: string) => void
}

export function Chat({ messages, onSendMessage }: ChatProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input)
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
                <div className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors">
                  "Create an ERC721 NFT collection with minting page"
                </div>
                <div className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors">
                  "Build a token swap interface for my DEX contract"
                </div>
                <div className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors">
                  "Create a DAO voting mechanism with frontend"
                </div>
                <div className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800 cursor-pointer transition-colors">
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
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
