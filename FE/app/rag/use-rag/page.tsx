'use client'

import { useState, useEffect } from 'react'
import RagSelector from '@/components/rag/rag-selector'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { getWalletClient, getAccount } from '@wagmi/core'
import { StoryClient, WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk'
import { custom, parseEther } from 'viem'
import { toast } from '@/components/ui/use-toast'
import { aeneidChain } from '@/lib/story-chains'
import { config } from '@/components/wagmi-wrapper'

const ADMIN_ADDRESS = '0x82860b2d83Ff654cfDE9c4E67c88D2c4119B28f2'

export default function UseRagPage() {
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [chat, setChat] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const [ragUrl, setRagUrl] = useState<string | null>(null)
  const [creator, setCreator] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRagSelection = (items: any[], mediaUrl: string, creator: string) => {
    localStorage.setItem('selectedRagUrl', mediaUrl)
    localStorage.setItem('selectedCreator', creator)
    setRagUrl(mediaUrl)
    setCreator(creator)
  }

  const extractSolidityCode = (text: string): string => {
    const codeMatch = text.match(/```solidity\n([\s\S]*?)```/)
    return codeMatch ? codeMatch[1].trim() : text
  }

  const sendMessage = async () => {
    if (!chat) return
    setLoading(true)

    try {
      const walletClient = await getWalletClient(config)
      const { address: userAddress } = getAccount(config)

      const client = StoryClient.newClient({
        wallet: walletClient,
        transport: custom(walletClient!.transport),
      })

      const total = parseEther('0.001') // 0.001 IP
      let adminAmount = total

      // // 🪙 Approve spend first
      // await client.wipToken.approve({
      //   spender: ADMIN_ADDRESS,
      //   amount: total,
      // })

      // if (ragUrl && creator && creator.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
      //   const royalty = total / 20n // 5%
      //   adminAmount = total - royalty

      //   // 📤 로열티 분배
      //   await client.royalty.({
      //     sender: userAddress as `0x${string}`,
      //     receiver: creator as `0x${string}`,
      //     amount: royalty,
      //   })
      // }

      // // // 🏛️ Admin에게 나머지 금액 전송
      // await client.wipToken.transfer({
      //   recipient: ADMIN_ADDRESS,
      //   amount: adminAmount,
      // })

      const res = await fetch('/api/deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chat, ragUrl }),
      })

      const { contract } = await res.json()
      const codeOnly = extractSolidityCode(contract)

      setMessages((prev) => [...prev, `🧑‍💻 ${chat}`, `🤖 ${codeOnly}`])
      setGeneratedCode(codeOnly)
      setChat('')
    } catch (e) {
      console.error(e)
      setMessages((prev) => [...prev, `❌ Error: ${String(e)}`])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedUrl = localStorage.getItem('selectedRagUrl')
    const savedCreator = localStorage.getItem('selectedCreator')
    if (savedUrl) setRagUrl(savedUrl)
    if (savedCreator) setCreator(savedCreator)
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
        <Button onClick={sendMessage} className="mt-2" disabled={loading}>
          {loading ? 'Generating with Deepseek...' : 'Send'}
        </Button>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">🧾 Generated Contract</h2>
        <Textarea rows={20} value={generatedCode} readOnly className="w-full" />
      </div>
    </div>
  )
}
