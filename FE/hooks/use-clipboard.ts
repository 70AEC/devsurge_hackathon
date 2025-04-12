"use client"

import { useState, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"

export function useClipboard() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback((text: string, label = "Text") => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)

        // Show toast notification
        toast({
          title: "Copied to clipboard",
          description: `${label} has been copied to clipboard`,
          duration: 2000,
        })

        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Copy failed:", err)

        // Show error toast
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard",
          variant: "destructive",
          duration: 3000,
        })
      })
  }, [])

  return { copied, copyToClipboard }
}
