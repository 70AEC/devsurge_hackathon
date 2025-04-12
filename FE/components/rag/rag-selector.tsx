'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

interface RagAsset {
  id: string
  title: string
  description: string
  mediaUrl: string
}

export default function RagSelector({ onSelect }: { onSelect: (items: any[]) => void }) {
  const [ragList, setRagList] = useState<RagAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRags = async () => {
      try {
        const res = await fetch('/api/rags')
        const data = await res.json()
        console.log('[✅ RAG 불러옴]', data) // ← 콘솔 출력 추가

        setRagList(data)
      } catch (err) {
        toast({ title: 'RAG 불러오기 실패', description: String(err), variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }

    fetchRags()
  }, [])

  const handleSelect = async (mediaUrl: string) => {
    try {
      const res = await fetch(mediaUrl.replace('ipfs://', 'https://ipfs.io/ipfs/'))
      const rawText = await res.text()
      const parsed = rawText
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))

      onSelect(parsed)
      toast({ title: '✅ RAG 적용 완료', description: `${parsed.length}개 항목` })
    } catch (err) {
      toast({ title: 'RAG 파싱 실패', description: String(err), variant: 'destructive' })
    }
  }

  if (loading) return <p className="p-4">불러오는 중...</p>

  return (
    <ScrollArea className="h-64 p-4 border rounded-md">
      <div className="space-y-4">
        {ragList.map((rag) => (
          <Card key={rag.id} className="cursor-pointer hover:bg-muted">
            <CardContent className="p-4 space-y-2">
              <p className="font-medium">{rag.title}</p>
              <p className="text-sm text-muted-foreground">{rag.description}</p>
              <Button variant="outline" onClick={() => handleSelect(rag.mediaUrl)}>
                적용하기
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
