export async function GET() {
    const res = await fetch('https://api.pinata.cloud/data/pinList?status=pinned', {
      headers: {
        Authorization: `${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
    })
  
    const data = await res.json()
    if (!data.rows || !Array.isArray(data.rows)) {
      return Response.json({ error: 'No pinned rows found', raw: data }, { status: 500 })
    }
  
    const ipMetadataFiles = data.rows.filter(
      (item: any) => item.metadata?.name === 'ipMetadata.json'
    )
  
    const ragAssets = await Promise.all(
      ipMetadataFiles.map(async (item: any) => {
        try {
          const ipfsUrl = `https://ipfs.io/ipfs/${item.ipfs_pin_hash}`
          const metaRes = await fetch(ipfsUrl)
          const metadata = await metaRes.json()
  
          return {
            id: item.ipfs_pin_hash,
            title: metadata.title || 'Untitled',
            description: metadata.description || '사용자 업로드 RAG',
            mediaUrl: metadata.mediaUrl, // 실제 JSONL 파일 주소 (ipfs:// 형태)
          }
        } catch (err) {
          console.error('❌ Failed to fetch ipMetadata.json from IPFS:', err)
          return null
        }
      })
    )
  
    return Response.json(ragAssets.filter(Boolean))
  }
  