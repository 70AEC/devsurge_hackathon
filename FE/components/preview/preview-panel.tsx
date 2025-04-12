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
  const [previewError, setPreviewError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const filesRef = useRef<Record<string, string>>({})
  const [retryCount, setRetryCount] = useState(0)

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
      fetch("http://localhost:4000/preview/stop", {
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
    setPreviewError(null)

    try {
      // Make sure we have required files
      const requiredFiles = ["app/page.tsx", "app/layout.tsx", "app/globals.css"]
      const missingFiles = requiredFiles.filter((file) => !filesRef.current[file])

      if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(", ")}`)
      }

      console.log("Starting preview with files:", Object.keys(filesRef.current))

      const res = await fetch("http://localhost:4000/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesRef.current }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Server responded with ${res.status}: ${errorText}`)
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      console.log("Preview server response:", data)
      setPreviewUrl(data.url)

      toast({
        title: "Preview Ready",
        description: "Next.js server started successfully!",
      })
    } catch (err: any) {
      console.error("Preview init error:", err)
      setPreviewError(err.message || "Failed to start preview server")
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
    setPreviewError(null)

    try {
      console.log("Updating preview with files:", Object.keys(filesRef.current))

      const res = await fetch("http://localhost:4000/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesRef.current }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Server responded with ${res.status}: ${errorText}`)
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      console.log("Preview update response:", data)

      if (data.url && iframeRef.current) {
        // Store the URL and update the iframe
        setPreviewUrl(data.url)

        // Force iframe refresh by changing the src
        iframeRef.current.src = `${data.url}?t=${Date.now()}`
      }

      toast({
        title: "Preview Updated",
        description: "Preview server updated with latest changes",
      })
    } catch (err: any) {
      console.error("Preview update error:", err)
      setPreviewError(err.message || "Failed to update preview")
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
    if (iframeRef.current && previewUrl) {
      setIsRefreshing(true)
      // Force iframe refresh by adding timestamp to URL
      iframeRef.current.src = `${previewUrl}?t=${Date.now()}`
      setTimeout(() => setIsRefreshing(false), 1000)
    } else {
      // If no preview URL, try to initialize again
      initializePreview()
    }
  }

  const retryPreview = () => {
    setRetryCount((prev) => prev + 1)
    initializePreview()
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
        ) : previewError ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-900">
            <div className="text-center p-4 max-w-md">
              <p className="text-red-400 mb-2">❌ Preview Error</p>
              <p className="text-gray-300 mb-4 text-sm whitespace-pre-wrap">{previewError}</p>
              <Button onClick={retryPreview} variant="outline">
                Try Again ({retryCount})
              </Button>
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
            onError={(e) => {
              console.error("iframe error:", e)
              setPreviewError("Failed to load preview. The server might not be ready yet.")
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-900">
            <div className="text-center p-4">
              <p className="text-red-400 mb-2">❌ No preview URL available</p>
              <Button onClick={initializePreview} variant="outline">
                Start Preview
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
