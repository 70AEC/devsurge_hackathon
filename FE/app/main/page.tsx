"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Chat } from "@/components/chat"

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<"remix" | "code" | "preview">("remix")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  const handleSendMessage = (message: string) => {
    const newMessages = [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "Processing your request..." },
    ]
   // setMessages(newMessages)
    // In a real implementation, you would call your AI service here
  }

  return (
    <>
      <Sidebar />
      <div>
        <Chat messages={messages} onSendMessage={handleSendMessage} />
test
      </div>
    </>
  )
}
