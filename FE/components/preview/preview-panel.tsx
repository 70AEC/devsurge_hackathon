"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export function PreviewPanel() {
  // FileContext 의존성 제거
  const [files, setFiles] = useState<Record<string, string>>({})
  const [iframeHeight, setIframeHeight] = useState("100%")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState("")
  const [projectId, setProjectId] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 파일 데이터 가져오기 (localStorage 또는 다른 상태 관리 방식에서)
  useEffect(() => {
    // 예시: localStorage에서 파일 데이터 가져오기
    try {
      const savedFiles = localStorage.getItem("remix-files")
      if (savedFiles) {
        setFiles(JSON.parse(savedFiles))
      } else {
        // 기본 파일 설정
        setFiles({
          "app/page.tsx": `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to Next.js</h1>
      <p>Edit app/page.tsx and save to see your changes!</p>
    </main>
  )
}`,
          "app/layout.tsx": `export default function RootLayout({
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
        })
      }
    } catch (error) {
      console.error("Error loading files:", error)
      // 기본 파일 설정
      setFiles({
        "app/page.tsx": `export default function Home() {
  return <div>Hello World</div>
}`,
      })
    }
  }, [])

  // Adjust iframe height on window resize
  useEffect(() => {
    const handleResize = () => {
      setIframeHeight(`${window.innerHeight - 100}px`)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 컴포넌트 마운트 시 프리뷰 초기화
  useEffect(() => {
    if (Object.keys(files).length > 0) {
      initializePreview()
    }

    // 컴포넌트 언마운트 시 프로젝트 정리
    return () => {
      if (projectId) {
        fetch("/api/preview/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        }).catch((err) => console.error("Failed to stop preview project:", err))
      }
    }
  }, [files])

  // 파일이 변경될 때 프리뷰 업데이트
  useEffect(() => {
    // 파일 변경 감지 로직 (예: localStorage 이벤트 리스너)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "remix-files" && projectId) {
        try {
          const updatedFiles = JSON.parse(e.newValue || "{}")
          setFiles(updatedFiles)
          updatePreview(updatedFiles)
        } catch (error) {
          console.error("Error parsing updated files:", error)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [projectId])

  // 프리뷰 초기화
  const initializePreview = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setProjectId(data.projectId)
      setPreviewUrl(data.url)

      toast({
        title: "Preview Ready",
        description: "Next.js development server started successfully",
      })
    } catch (error) {
      console.error("Failed to initialize preview:", error)
      toast({
        title: "Preview Error",
        description: error instanceof Error ? error.message : "Failed to start preview server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 프리뷰 업데이트
  const updatePreview = async (updatedFiles?: Record<string, string>) => {
    if (!projectId) return

    setIsRefreshing(true)

    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: updatedFiles || files, projectId }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // iframe 새로고침
      if (iframeRef.current) {
        iframeRef.current.src = data.url
      }

      toast({
        title: "Preview Updated",
        description: "Changes applied to preview",
      })
    } catch (error) {
      console.error("Failed to update preview:", error)
      toast({
        title: "Update Error",
        description: error instanceof Error ? error.message : "Failed to update preview",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // 수동 새로고침
  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // 새 창에서 열기
  const openInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank")
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-900">
      <div className="flex justify-between items-center p-2 border-b border-gray-800">
        <div className="text-sm font-medium text-gray-300">Next.js Live Preview</div>
        <div className="flex space-x-2">
          <Button
            onClick={refreshPreview}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            disabled={isRefreshing || isLoading || !previewUrl}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={openInNewWindow}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            disabled={isLoading || !previewUrl}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>
      <div className="flex-1 w-full relative bg-white">
        {isLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 p-4">
            <div className="w-8 h-8 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300 mb-2">Starting Next.js development server...</p>
            <div className="w-full max-w-md space-y-2">
              <Skeleton className="h-4 w-full bg-gray-800" />
              <Skeleton className="h-4 w-3/4 bg-gray-800" />
              <Skeleton className="h-4 w-5/6 bg-gray-800" />
            </div>
          </div>
        ) : previewUrl ? (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            style={{
              width: "100%",
              height: iframeHeight,
              border: "none",
              backgroundColor: "white",
            }}
            title="Next.js Preview"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-900">
            <div className="text-center p-4">
              <p className="text-red-400 mb-2">Failed to start preview server</p>
              <Button onClick={initializePreview} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
