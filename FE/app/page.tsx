"use client"

import { Sidebar } from "@/components/sidebar"
import { useRouter } from "next/navigation"
import { useProjectManager } from "@/hooks/use-project-manager"

export default function Home() {
  const { createProject } = useProjectManager()
  const router = useRouter()

  // 새 프로젝트 생성 핸들러
  const handleCreateNewProject = () => {
    const newProject = createProject()
    router.push(`/project/${newProject.id}`)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
      <div className="w-64 h-full">
        <Sidebar />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Web3 AI Builder</h1>
          <p className="text-gray-400 mb-8">시작하려면 새 프로젝트를 생성하세요.</p>
          <button
            onClick={handleCreateNewProject}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-md hover:from-purple-700 hover:to-blue-600 transition-all"
          >
            새 프로젝트 생성
          </button>
        </div>
      </div>
    </div>
  )
}
