'use client'

import { useEffect, useState } from 'react'
import { useWalletClient, useAccount } from 'wagmi'
import { uploadToIPFS } from '@/lib/ipfs'
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk'
import { custom } from 'viem'
import { sha256 } from 'js-sha256'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function RagUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState<string>('')
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  const handleUpload = async () => {
    if (!file || !walletClient || !address) return

    const fileContent = await file.text()
    const ragCid = await uploadToIPFS(file)
    const ragUrl = `ipfs://${ragCid}`
    const ragHash = `0x${sha256(fileContent)}`

    const ipMetadata = {
      title: file.name,
      description: description || '사용자 업로드 RAG 모델',
      mediaUrl: ragUrl,
      mediaHash: ragHash,
      mediaType: 'application/jsonl',
      creators: [
        {
          address,
          name: 'User',
          contributionPercent: 100,
        },
      ],
    }

    const nftMetadata = {
      name: file.name,
      description: 'This NFT represents ownership of the RAG.',
      image: 'https://picsum.photos/200',
    }

    const ipfsify = (data: any, name: string) =>
      new File([JSON.stringify(data)], name, { type: 'application/json' })

    const ipMetadataCid = await uploadToIPFS(ipfsify(ipMetadata, 'ipMetadata.json'))
    const nftMetadataCid = await uploadToIPFS(ipfsify(nftMetadata, 'nftMetadata.json'))

    const config: StoryConfig = {
      wallet: walletClient,
      transport: custom(walletClient.transport),
      chainId: 'aeneid',
    }

    const storyClient = StoryClient.newClient(config)

    const tx = await storyClient.ipAsset.mintAndRegisterIp({
      spgNftContract: '0x9Ba82E2210C247CD9D613680D9d92085A256979A',
      ipMetadata: {
        ipMetadataURI: `ipfs://${ipMetadataCid}`,
        ipMetadataHash: `0x${sha256(JSON.stringify(ipMetadata))}` as `0x${string}`,
        nftMetadataURI: `ipfs://${nftMetadataCid}`,
        nftMetadataHash: `0x${sha256(JSON.stringify(nftMetadata))}` as `0x${string}`,
      },
      txOptions: { waitForTransaction: true },
    })

    alert(`✅ 등록 완료!\nTX Hash: ${tx.txHash}\nIP ID: ${tx.ipId}`)
  }

  return (
    <div className="space-y-4 p-4">
      <Input
        type="file"
        accept=".jsonl"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Textarea
        placeholder="RAG 설명을 입력하세요"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button onClick={handleUpload} disabled={!walletClient || !ready}>
        {walletClient ? 'RAG 등록' : '지갑 먼저 연결하세요'}
      </Button>
    </div>
  )
}
