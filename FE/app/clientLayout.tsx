"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import "./globals.css"

interface LayoutProps {
  children: ReactNode
}

export default function ClientLayout({ children }: LayoutProps) {
  const pathname = usePathname()
  const isMainPage = pathname === "/main"

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatHeight, setChatHeight] = useState(50) // percentage
  const [sidebarWidth, setSidebarWidth] = useState(250) // pixels

  const chatResizeRef = useRef<HTMLDivElement>(null)
  const sidebarResizeRef = useRef<HTMLDivElement>(null)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const childrenArray = Array.isArray(children) ? children : [children]

  const renderMainPageLayout = () => {
    const sidebar = childrenArray[0]
    const content = childrenArray[1]

    const getContentChildren = () => {
      if (!content) return { chatSection: null, codePanel: null }

      if (content && typeof content === "object" && "props" in content && content.props && content.props.children) {
        const contentChildren = Array.isArray(content.props.children)
          ? content.props.children
          : [content.props.children]

        return {
          chatSection: contentChildren[0] || null,
          codePanel: contentChildren[1] || null,
        }
      }

      return { chatSection: null, codePanel: null }
    }

    const { chatSection, codePanel } = getContentChildren()

    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        {/* Sidebar */}
        <div
          className="h-full flex-shrink-0 transition-all duration-300 relative"
          style={{ width: sidebarCollapsed ? "0px" : `${sidebarWidth}px` }}
        >
          {!sidebarCollapsed && (
            <>
              <div className="h-full overflow-hidden">{sidebar}</div>
              <div
                ref={sidebarResizeRef}
                className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-purple-500 group"
              >
                <div className="absolute top-1/2 right-0 w-1 h-8 -translate-y-1/2 bg-gray-700 group-hover:bg-purple-500"></div>
              </div>
            </>
          )}
        </div>

        {/* Toggle sidebar button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-0 z-10 bg-gray-800 rounded-r-full rounded-l-none border-l-0 border-gray-700"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Main content */}
        <div className="flex flex-col flex-1 h-screen relative">
          {/* Chat section */}
          <div className="flex-shrink-0 overflow-hidden" style={{ height: `${chatHeight}%` }}>
            {chatSection}
          </div>

          {/* Resize handle */}
          <div
            ref={chatResizeRef}
            className="h-1 w-full cursor-ns-resize hover:bg-purple-500 flex items-center justify-center"
          >
            <div className="w-8 h-1 bg-gray-700 hover:bg-purple-500 rounded-full"></div>
          </div>

          {/* Code panel */}
          <div className="flex-1 overflow-hidden">{codePanel}</div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!isMainPage) return

    const chatResizeHandler = chatResizeRef.current
    const sidebarResizeHandler = sidebarResizeRef.current

    if (!chatResizeHandler || !sidebarResizeHandler) return

    let isResizingChat = false
    let isResizingSidebar = false
    let startY = 0
    let startX = 0
    let startHeight = 0
    let startWidth = 0

    const onMouseDown = (e: MouseEvent, type: "chat" | "sidebar") => {
      if (type === "chat") {
        isResizingChat = true
        startY = e.clientY
        startHeight = chatHeight
      } else {
        isResizingSidebar = true
        startX = e.clientX
        startWidth = sidebarWidth
      }
      document.body.style.cursor = type === "chat" ? "ns-resize" : "ew-resize"
      document.body.style.userSelect = "none"
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isResizingChat) {
        const containerHeight = window.innerHeight
        const deltaY = e.clientY - startY
        const newHeightPercent = startHeight + (deltaY / containerHeight) * 100

        // Limit the height between 20% and 80%
        if (newHeightPercent >= 20 && newHeightPercent <= 80) {
          setChatHeight(newHeightPercent)
        }
      }

      if (isResizingSidebar && !sidebarCollapsed) {
        const deltaX = e.clientX - startX
        const newWidth = startWidth + deltaX

        // Limit the width between 180px and 400px
        if (newWidth >= 180 && newWidth <= 400) {
          setSidebarWidth(newWidth)
        }
      }
    }

    const onMouseUp = () => {
      isResizingChat = false
      isResizingSidebar = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    chatResizeHandler.addEventListener("mousedown", (e) => onMouseDown(e, "chat"))
    sidebarResizeHandler.addEventListener("mousedown", (e) => onMouseDown(e, "sidebar"))
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)

    return () => {
      chatResizeHandler.removeEventListener("mousedown", (e) => onMouseDown(e, "chat"))
      sidebarResizeHandler.removeEventListener("mousedown", (e) => onMouseDown(e, "sidebar"))
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [chatHeight, sidebarWidth, sidebarCollapsed, isMainPage])

  return (
    <html lang="en">
      <body>{isMainPage ? renderMainPageLayout() : children}</body>
    </html>
  )
}
