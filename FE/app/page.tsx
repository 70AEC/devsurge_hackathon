"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Chat } from "@/components/chat"
import { CodePanel } from "@/components/code-panel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Define types for chat messages
type ChatRole = "user" | "assistant"

interface ChatMessage {
  role: ChatRole
  content: string
}

interface AIResponse {
  text: string
  code?: {
    language: string
    content: string
    fileName?: string
  }[]
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"remix" | "code" | "preview">("remix")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<Record<string, string>>({})

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [topPanelHeight, setTopPanelHeight] = useState(50) // percentage
  const [isDragging, setIsDragging] = useState(false)

  // Fake AI service
  const callAIService = async (prompt: string): Promise<AIResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (prompt.toLowerCase().includes("nft") || prompt.toLowerCase().includes("token")) {
          resolve({
            text: "Here is an example of an NFT contract following the ERC721 standard with minting functionality.",
            code: [
              {
                language: "solidity",
                fileName: "MyNFT.sol",
                content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFT is ERC721URIStorage, Ownable {
  using Strings for uint256;

  uint256 private _nextTokenId;
  uint256 public mintPrice = 0.05 ether;
  string public baseURI;

  constructor(address initialOwner) ERC721("MyNFT", "MNFT") Ownable(initialOwner) {}

  function mint() public payable {
    require(msg.value >= mintPrice, "Insufficient payment");
    uint256 tokenId = _nextTokenId++;
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, string(abi.encodePacked(baseURI, tokenId.toString(), ".json")));
  }

  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }

  function setMintPrice(uint256 _newPrice) public onlyOwner {
    mintPrice = _newPrice;
  }

  function withdraw() public onlyOwner {
    payable(owner()).transfer(address(this).balance);
  }
}`,
              },
            ],
          })
        } else {
          resolve({
            text: "What kind of smart contract would you like to create? Let me know if it's an NFT, token, DAO, DeFi, etc.",
          })
        }
      }, 1500)
    })
  }

  const handleSendMessage = async (message: string) => {
    const updatedMessages: ChatMessage[] = [...messages, { role: "user", content: message }]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const aiResponse = await callAIService(message)

      setMessages([...updatedMessages, { role: "assistant", content: aiResponse.text }])

      if (aiResponse.code && aiResponse.code.length > 0) {
        const newGeneratedCode = { ...generatedCode }

        aiResponse.code.forEach((codeBlock) => {
          if (codeBlock.fileName) {
            newGeneratedCode[codeBlock.fileName] = codeBlock.content
          }
        })

        setGeneratedCode(newGeneratedCode)
        setActiveTab("remix")
      }
    } catch (error) {
      console.error("AI service error:", error)

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Sorry, an error occurred while processing your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleMouseDown = () => {
    setIsDragging(true)
    document.body.style.userSelect = "none"
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    document.body.style.userSelect = ""
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const container = e.currentTarget as HTMLDivElement
    const containerRect = container.getBoundingClientRect()
    const newTopPanelHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100

    // Limit height between 20% and 80%
    if (newTopPanelHeight >= 20 && newTopPanelHeight <= 80) {
      setTopPanelHeight(newTopPanelHeight)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`h-full transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-0"}`}>
        {isSidebarOpen && <Sidebar />}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 h-full relative">
        {/* Sidebar toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-0 z-10 bg-gray-800 rounded-r-full rounded-l-none border-l-0 border-gray-700"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {/* Split view with resizable panels */}
        <div
          className="flex flex-col h-full"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Top panel */}
          <div className="overflow-hidden" style={{ height: `${topPanelHeight}%` }}>
            <Chat messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>

          {/* Resize handle */}
          <div
            className="h-2 bg-gray-800 hover:bg-purple-500 cursor-ns-resize flex items-center justify-center"
            onMouseDown={handleMouseDown}
          >
            <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
          </div>

          {/* Bottom panel */}
          <div className="flex-1 overflow-hidden" style={{ height: `${100 - topPanelHeight}%` }}>
            <CodePanel activeTab={activeTab} setActiveTab={setActiveTab} generatedCode={generatedCode} />
          </div>
        </div>
      </div>
    </div>
  )
}
