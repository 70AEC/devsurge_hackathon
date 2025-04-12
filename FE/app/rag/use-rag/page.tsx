'use client'

import { useState, useEffect } from 'react'
import RagSelector from '@/components/rag/rag-selector'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function UseRagPage() {
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [chat, setChat] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const [ragUrl, setRagUrl] = useState<string | null>(null)

  const handleRagSelection = async (items: any[], mediaUrl: string) => {
    const ragText = items.map((item) => JSON.stringify(item)).join('\n')

    const prompt = `You are an expert Solidity developer. Generate a smart contract based on the following RAG content:\n\n${ragText}`

    localStorage.setItem('selectedRagUrl', mediaUrl)
    setRagUrl(mediaUrl)

    const res = await fetch('/api/deep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, ragUrl: mediaUrl }),
    })

    const { contract } = await res.json()
    setGeneratedCode(contract)
  }

  const sendMessage = async () => {
    if (!chat || !ragUrl) return

    const res = await fetch('/api/deep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: chat, ragUrl }),
    })
    const { contract } = await res.json()

    setMessages((prev) => [...prev, `🧑‍💻 ${chat}`, `🤖 ${contract}`])
    setChat('')
  }

  useEffect(() => {
    const saved = localStorage.getItem('selectedRagUrl')
    if (saved) setRagUrl(saved)
  }, [])

  return (
    <div className="p-4 space-y-6">
      <RagSelector onSelect={handleRagSelection} />

      <div>
        <h2 className="font-bold text-lg mb-2">💬 Solidity Q&A</h2>
        {messages.map((msg, i) => (
          <div key={i} className="whitespace-pre-wrap mb-2">{msg}</div>
        ))}
        <Textarea
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          placeholder="Ask something about smart contracts..."
        />
        <Button onClick={sendMessage} className="mt-2">Send</Button>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">🧾 Generated Contract</h2>
        <Textarea rows={20} value={generatedCode} readOnly className="w-full" />
      </div>
    </div>
  )
}
