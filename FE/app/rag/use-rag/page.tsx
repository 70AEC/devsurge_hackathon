'use client'

import { useState } from 'react'
import RagSelector from '@/components/rag/rag-selector'
import { Textarea } from '@/components/ui/textarea'

export default function UseRagPage() {
  const [generatedCode, setGeneratedCode] = useState<string>('')

  const handleRagSelection = async (items: any[]) => {
    const ragText = items.map((item) => JSON.stringify(item)).join('\n')

    const prompt = `You are an expert Solidity developer. Generate a smart contract based on the following RAG content:\n\n${ragText}`

    const res = await fetch('/api/deep', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })

    const { code } = await res.json()
    setGeneratedCode(code)
  }

  return (
    <div className="p-4 space-y-4">
      <RagSelector onSelect={handleRagSelection} />
      <Textarea rows={20} value={generatedCode} readOnly className="w-full" />
    </div>
  )
}
