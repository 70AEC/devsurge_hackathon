'use client'

import { useState } from 'react'
import { useWalletClient, useAccount } from 'wagmi'
import { uploadToIPFS } from '@/lib/ipfs'
import { StoryClient } from '@story-protocol/core-sdk'
import { custom } from 'viem'
import { sha256 } from 'js-sha256'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'

export default function RagUploaderMini() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()

  const handleUpload = async () => {
    if (!file || !walletClient || !address) return

    setLoading(true)
    try {
      const fileContent = await file.text()
      const ragCid = await uploadToIPFS(file)
      const ragUrl = `ipfs://${ragCid}`
      const ragHash = `0x${sha256(fileContent)}`

      const ipMetadata = {
        title: file.name,
        description: description || 'Mini RAG Upload',
        mediaUrl: ragUrl,
        mediaHash: ragHash,
        mediaType: 'application/jsonl',
        creators: [{ address, name: 'User', contributionPercent: 100 }],
      }

      const ipfsify = (data: any, name: string) =>
        new File([JSON.stringify(data)], name, { type: 'application/json' })

      const ipMetadataCid = await uploadToIPFS(ipfsify(ipMetadata, 'ipMetadata.json'))

      const storyClient = StoryClient.newClient({
        wallet: walletClient,
        transport: custom(walletClient.transport),
        chainId: 'aeneid',
      })

      const tx = await storyClient.ipAsset.mintAndRegisterIp({
        spgNftContract: '0x9Ba82E2210C247CD9D613680D9d92085A256979A',
        ipMetadata: {
          ipMetadataURI: `ipfs://${ipMetadataCid}`,
          ipMetadataHash: `0x${sha256(JSON.stringify(ipMetadata))}` as `0x${string}`,
          nftMetadataURI: '',
          nftMetadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        txOptions: { waitForTransaction: true },
      })

      toast({ title: '✅ 업로드 성공', description: `IP ID: ${tx.ipId}` })
      setFile(null)
      setDescription('')
    } catch (e) {
      console.error('❌ RAG 업로드 실패:', e)
      toast({ title: '❌ 업로드 실패', description: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-2 text-xs text-gray-400">
      <div className="font-semibold text-white">Quick RAG Upload</div>

      <Input
        type="file"
        accept=".jsonl"
        className="text-xs h-8 p-1"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <Textarea
        placeholder="설명을 입력하세요"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="text-xs"
      />

      <Button
        onClick={handleUpload}
        disabled={loading || !file || !walletClient}
        className="text-xs h-8 w-full"
      >
        {loading ? 'Uploading...' : 'Upload'}
      </Button>
    </div>
  )
}
