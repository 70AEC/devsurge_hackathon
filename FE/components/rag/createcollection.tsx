'use client'
//admin page용
import { useState } from 'react'
import { useWalletClient } from 'wagmi'
import { custom, zeroAddress } from 'viem'
import { StoryClient } from '@story-protocol/core-sdk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CreateCollection() {
  const { data: walletClient } = useWalletClient()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | { address: string; txHash: string }>(null)

  const handleCreate = async () => {
    if (!walletClient || !name || !symbol) return
    setLoading(true)
    try {
      const client = StoryClient.newClient({
        wallet: walletClient,
        transport: custom(walletClient.transport),
        chainId: 'aeneid',
      })

      const res = await client.nftClient.createNFTCollection({
        name,
        symbol,
        isPublicMinting: false,
        mintOpen: true,
        mintFeeRecipient: zeroAddress,
        contractURI: '',
        txOptions: { waitForTransaction: true },
      })

      setResult({
        address: res.spgNftContract as string,
        txHash: res.txHash as string,
      })
          } catch (err) {
      alert(`에러 발생: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 max-w-md">
      <h2 className="text-xl font-semibold">SPG NFT 컬렉션 생성</h2>
      <Input
        placeholder="컬렉션 이름 (예: My RAGs)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="컬렉션 심볼 (예: RAGX)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
      />
      <Button onClick={handleCreate} disabled={!walletClient || loading}>
        {loading ? '생성 중...' : '컬렉션 생성'}
      </Button>
      {result && (
        <div className="text-sm mt-4">
          ✅ 생성 완료!<br />
          <strong>컨트랙트 주소:</strong> {result.address}<br />
          <strong>TX Hash:</strong> {result.txHash}
        </div>
      )}
    </div>
  )
}
