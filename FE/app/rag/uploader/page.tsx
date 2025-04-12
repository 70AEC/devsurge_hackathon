// 📁 app/rag/createcollection/page.tsx
import Uploader from '@/components/rag/uploader'

export default function UploaderPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">NFT업로더</h1>
      <Uploader />
    </main>
  )
}
