"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface PreviewPanelProps {
  files: Record<string, string>
  onFileChange?: (files: Record<string, string>) => void
}

export function PreviewPanel({ files }: PreviewPanelProps) {
  const [iframeHeight, setIframeHeight] = useState("100%")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState("")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const filesRef = useRef<Record<string, string>>({})

  // Keep latest files in ref
  useEffect(() => {
    if (files && Object.keys(files).length > 0) {
      filesRef.current = files
    }
  }, [files])

  // Resize iframe on window resize
  useEffect(() => {
    const handleResize = () => {
      setIframeHeight(`${window.innerHeight - 100}px`)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Initialize preview on mount
  useEffect(() => {
    if (files && Object.keys(files).length > 0) {
      initializePreview()
    }

    // Stop preview on unmount
    return () => {
      fetch("/api/preview/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch((err) => console.error("Failed to stop preview:", err))
    }
  }, [])

  // Update preview when files change
  useEffect(() => {
    if (files && Object.keys(files).length > 0) {
      updatePreview()
    }
  }, [files])

  const initializePreview = async () => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesRef.current }),
      })

      if (!res.ok) throw new Error(`Server responded with ${res.status}`)

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setPreviewUrl(data.url)

      toast({
        title: "Preview Ready",
        description: "Next.js server started successfully!",
      })
    } catch (err: any) {
      console.error("Preview init error:", err)
      toast({
        title: "Preview Error",
        description: err.message || "Failed to start preview server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreview = async () => {
    setIsRefreshing(true)

    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesRef.current }),
      })

      if (!res.ok) throw new Error(`Server responded with ${res.status}`)

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (iframeRef.current) {
        iframeRef.current.src = data.url
      }

      toast({
        title: "Preview Updated",
        description: "Preview server updated with latest changes",
      })
    } catch (err: any) {
      console.error("Preview update error:", err)
      toast({
        title: "Update Error",
        description: err.message || "Failed to update preview",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
      setIsRefreshing(true)
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

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
              <p className="text-red-400 mb-2">❌ Failed to start preview server</p>
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
