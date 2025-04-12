"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Chat } from "@/components/chat"
import { CodePanel } from "@/components/code-panel"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjectManager } from "@/hooks/use-project-manager"
import { toast } from "@/components/ui/use-toast"

// Define types for AI response
interface AIResponse {
  text: string
  code?: {
    language: string
    content: string
    fileName?: string
  }[]
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    projects,
    activeProject,
    selectProject,
    addChatMessage,
    saveGeneratedCode,
    updateProjectFile,
    createProject,
  } = useProjectManager()

  const [activeTab, setActiveTab] = useState<"remix" | "code" | "preview">("remix")
  const [isLoading, setIsLoading] = useState(false)
  const [projectNotFound, setProjectNotFound] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [topPanelHeight, setTopPanelHeight] = useState(50) // percentage
  const [isDragging, setIsDragging] = useState(false)

  // 프로젝트 로드 상태 추적
  const projectLoadAttempted = useRef(false)
  const createdProjectId = useRef<string | null>(null)

  // 프로젝트 ID가 변경될 때 해당 프로젝트 로드
  useEffect(() => {
    // 이미 리디렉션 중이면 중복 실행 방지
    if (isRedirecting) {
      return
    }

    // 프로젝트 ID가 방금 생성한 프로젝트인 경우 로드 시도 초기화
    if (projectId === createdProjectId.current) {
      projectLoadAttempted.current = false
      createdProjectId.current = null
    }

    if (projectId && !projectLoadAttempted.current) {
      console.log("ProjectPage: Loading project with ID:", projectId)
      projectLoadAttempted.current = true

      try {
        // 프로젝트가 존재하는지 확인
        const projectExists = projects.some((p) => p.id === projectId)

        if (projectExists) {
          console.log("Project found, selecting:", projectId)
          selectProject(projectId)
          setProjectNotFound(false)
        } else {
          console.log("Project not found:", projectId)
          setProjectNotFound(true)
        }
      } catch (error) {
        console.error("Error loading project:", error)
        setProjectNotFound(true)

        toast({
          title: "프로젝트 로드 오류",
          description: "프로젝트를 로드하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    }
  }, [projectId, projects, selectProject, isRedirecting])

  // 활성 프로젝트가 변경될 때 디버그 로그
  useEffect(() => {
    if (activeProject) {
      console.log("ProjectPage: Active project changed to:", activeProject.name, activeProject.id)
      console.log("ProjectPage: Project files:", Object.keys(activeProject.files))

      // 프로젝트를 찾았으면 projectNotFound 상태 업데이트
      if (activeProject.id === projectId) {
        setProjectNotFound(false)
      }
    } else {
      console.log("ProjectPage: No active project")
    }
  }, [activeProject, projectId])

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
    if (!activeProject) {
      toast({
        title: "프로젝트 오류",
        description: "활성화된 프로젝트가 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const aiResponse = await callAIService(message)

      // 어시스턴트 응답 추가
      addChatMessage(activeProject.id, {
        role: "assistant",
        content: aiResponse.text,
      })

      // 생성된 코드가 있으면 프로젝트에 추가
      if (aiResponse.code && aiResponse.code.length > 0) {
        const newGeneratedCode: Record<string, string> = {}

        aiResponse.code.forEach((codeBlock) => {
          if (codeBlock.fileName) {
            newGeneratedCode[codeBlock.fileName] = codeBlock.content
          }
        })

        if (Object.keys(newGeneratedCode).length > 0) {
          saveGeneratedCode(activeProject.id, newGeneratedCode)
          setActiveTab("remix")
        }
      }
    } catch (error) {
      console.error("AI service error:", error)

      // 오류 발생 시 오류 메시지 추가
      addChatMessage(activeProject.id, {
        role: "assistant",
        content: "Sorry, an error occurred while processing your request. Please try again.",
      })
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

  // 프로젝트 파일 업데이트 핸들러
  const handleUpdateFile = (projectId: string, fileName: string, content: string) => {
    console.log(`Updating file ${fileName} in project ${projectId}`)
    try {
      updateProjectFile(projectId, fileName, content)
    } catch (error) {
      console.error("Error updating file:", error)
      toast({
        title: "파일 저장 오류",
        description: "파일을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 새 프로젝트 생성 핸들러
  const handleCreateNewProject = () => {
    try {
      // 리디렉션 상태 설정으로 중복 실행 방지
      setIsRedirecting(true)

      // 새 프로젝트 생성
      const newProject = createProject()
      console.log("Created new project:", newProject.id)

      // 생성된 프로젝트 ID 저장
      createdProjectId.current = newProject.id

      // 프로젝트 로드 시도 초기화
      projectLoadAttempted.current = false

      // 새 프로젝트로 리디렉션
      router.push(`/project/${newProject.id}`)

      toast({
        title: "새 프로젝트 생성됨",
        description: "새 프로젝트가 성공적으로 생성되었습니다.",
      })
    } catch (error) {
      console.error("Error creating project:", error)
      setIsRedirecting(false)
      toast({
        title: "프로젝트 생성 오류",
        description: "새 프로젝트를 생성하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 홈으로 이동 핸들러
  const handleGoHome = () => {
    setIsRedirecting(true)
    router.push("/")
  }

  // 프로젝트를 찾을 수 없을 때 표시할 화면
  if (projectNotFound) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
        <div className="w-64 h-full">
          <Sidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">프로젝트를 찾을 수 없습니다</h1>
            <p className="text-gray-400 mb-8">
              요청하신 프로젝트 ID ({projectId})를 찾을 수 없습니다. 프로젝트가 삭제되었거나 존재하지 않을 수 있습니다.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
              <Button onClick={handleGoHome} variant="outline" className="border-gray-700 hover:bg-gray-800">
                홈으로 돌아가기
              </Button>
              <Button
                onClick={handleCreateNewProject}
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
              >
                새 프로젝트 생성
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 프로젝트가 로드되지 않았을 때 로딩 표시
  if (!activeProject) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
        <div className="w-64 h-full">
          <Sidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">프로젝트 로딩 중...</h1>
            <div className="animate-pulse">잠시만 기다려주세요</div>
          </div>
        </div>
      </div>
    )
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
            <Chat onSendMessage={handleSendMessage} isLoading={isLoading} />
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
            <CodePanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeProject={activeProject}
              onUpdateFile={handleUpdateFile}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
