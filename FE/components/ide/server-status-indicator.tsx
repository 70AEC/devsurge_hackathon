"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ServerStatusIndicatorProps {
  onCheckStatus: () => Promise<any>
  isServerConnected?: boolean | null
}

export function ServerStatusIndicator({
  onCheckStatus,
  isServerConnected: externalStatus,
}: ServerStatusIndicatorProps) {
  const [isChecking, setIsChecking] = useState(false)

  const checkServerStatus = async () => {
    setIsChecking(true)
    try {
      await onCheckStatus()
    } catch (error) {
      console.error("Error checking server status:", error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="flex items-center mb-2">
      <div
        className={`w-2 h-2 rounded-full mr-2 ${
          externalStatus === null ? "bg-gray-400" : externalStatus ? "bg-green-500" : "bg-red-500"
        }`}
      ></div>
      <span className="text-xs text-gray-400">
        {externalStatus === null
          ? "Checking compiler server..."
          : externalStatus
            ? "Compiler server connected"
            : "Compiler server not connected"}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 ml-2"
        onClick={checkServerStatus}
        disabled={isChecking}
        title="Check server connection"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}
