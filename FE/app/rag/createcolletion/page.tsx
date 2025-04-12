// 📁 app/rag/createcollection/page.tsx
import CreateCollection from '@/components/rag/createcollection'

export default function CreateCollectionPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">컬렉션 생성</h1>
      <CreateCollection />
    </main>
  )
}
