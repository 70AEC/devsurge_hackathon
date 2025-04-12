'use client'

import type React from 'react'
import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { CodePanel } from '@/components/code-panel'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
    role: ChatRole
    content: string
}

export default function Home() {
    const [activeTab, setActiveTab] = useState<'remix' | 'code' | 'preview'>('remix')
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [generatedCode, setGeneratedCode] = useState<Record<string, string>>({})

    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [topPanelHeight, setTopPanelHeight] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const [ragUrl, setRagUrl] = useState<string | null>(null)
    const [creator, setCreator] = useState<string | null>(null)

    const extractSolidityCode = (text: string): string => {
        const match = text.match(/```solidity\n([\s\S]*?)```/)
        return match ? match[1].trim() : text
    }

    const handleSendMessage = async (message: string) => {
        const updatedMessages: ChatMessage[] = [...messages, { role: 'user' as const, content: message }]
        setMessages(updatedMessages)
        setIsLoading(true)

        try {
            const res = await fetch('/api/deep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: message, ragUrl })
            })

            const data = await res.json()
            const solidityCode = extractSolidityCode(data.contract)

            setMessages([
                ...updatedMessages,
                { role: 'assistant' as const, content: solidityCode },
            ])
            setGeneratedCode({ 'MyContract.sol': solidityCode })
            setActiveTab('remix')
        } catch (error) {
            console.error('AI service error:', error)
            setMessages([
                ...updatedMessages,
                {
                    role: 'assistant' as const,
                    content: '❌ Error occurred while processing your request.',
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }


    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    const handleMouseDown = () => {
        setIsDragging(true)
        document.body.style.userSelect = 'none'
    }

    const handleMouseUp = () => {
        setIsDragging(false)
        document.body.style.userSelect = ''
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const container = e.currentTarget as HTMLDivElement
        const rect = container.getBoundingClientRect()
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100
        if (newHeight >= 20 && newHeight <= 80) setTopPanelHeight(newHeight)
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
            <div className={`h-full transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
                {isSidebarOpen && <Sidebar />}
            </div>

            <div className="flex flex-col flex-1 h-full relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-0 z-10 bg-gray-800 rounded-r-full rounded-l-none border-l-0 border-gray-700"
                    onClick={toggleSidebar}
                >
                    {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                <div
                    className="flex flex-col h-full"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Top panel: Chat */}
                    <div className="overflow-hidden" style={{ height: `${topPanelHeight}%` }}>
                        <Chat
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading}
                            onRagSelect={(url, addr) => {
                                setRagUrl(url)
                                setCreator(addr)
                            }}
                        />          </div>

                    {/* Resize bar */}
                    <div
                        className="h-2 bg-gray-800 hover:bg-purple-500 cursor-ns-resize flex items-center justify-center"
                        onMouseDown={handleMouseDown}
                    >
                        <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
                    </div>

                    {/* Bottom panel: Code display */}
                    <div className="flex-1 overflow-hidden" style={{ height: `${100 - topPanelHeight}%` }}>
                        <CodePanel activeTab={activeTab} setActiveTab={setActiveTab} generatedCode={generatedCode} />
                    </div>
                </div>
            </div>
        </div>
    )
}
