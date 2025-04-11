"use client"

import { useState, useCallback } from "react"

export function useClipboard() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => {
        console.error("copy failed:", err)
      })
  }, [])

  return { copied, copyToClipboard }
}
