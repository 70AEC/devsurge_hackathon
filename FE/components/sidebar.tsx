"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Archive,
  Zap,
  Code,
  History,
  MoreHorizontal,
  Trash2,
  Edit,
  ArchiveIcon,
  ArchiveRestore,
  FolderPlus,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useProjectManager, type Project } from "@/hooks/use-project-manager"

export function Sidebar() {
  const router = useRouter()
  const {
    recentProjects,
    archivedProjects,
    activeProject,
    createProject,
    selectProject,
    toggleArchiveProject,
    deleteProject,
    renameProject,
  } = useProjectManager()

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")

  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [projectToRename, setProjectToRename] = useState<Project | null>(null)
  const [newName, setNewName] = useState("")

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  // 새 프로젝트 생성 처리
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      try {
        const newProject = createProject(newProjectName)
        setNewProjectName("")
        setShowNewProjectDialog(false)

        // 약간의 지연 후 새 프로젝트의 URL로 이동
        setTimeout(() => {
          router.push(`/project/${newProject.id}`)
        }, 100)
      } catch (error) {
        console.error("Error creating project:", error)
      }
    }
  }

  // 프로젝트 선택 처리
  const handleSelectProject = (projectId: string) => {
    // 이미 선택된 프로젝트인 경우 중복 선택 방지
    if (activeProject?.id === projectId) {
      return
    }

    try {
      selectProject(projectId)
      router.push(`/project/${projectId}`)
    } catch (error) {
      console.error("Error selecting project:", error)
    }
  }

  // 프로젝트 이름 변경 처리
  const handleRenameProject = () => {
    if (projectToRename && newName.trim()) {
      renameProject(projectToRename.id, newName)
      setProjectToRename(null)
      setNewName("")
      setShowRenameDialog(false)
    }
  }

  // 프로젝트 삭제 처리
  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id)
      setProjectToDelete(null)
      setShowDeleteDialog(false)

      // 삭제된 프로젝트가 현재 활성 프로젝트였다면 홈으로 이동
      if (activeProject?.id === projectToDelete.id) {
        router.push("/")
      }
    }
  }

  // 프로젝트 아카이브/복원 처리
  const handleToggleArchive = (project: Project) => {
    toggleArchiveProject(project.id)

    // 아카이브된 프로젝트가 현재 활성 프로젝트였다면 홈으로 이동
    if (project.id === activeProject?.id && !project.isArchived) {
      router.push("/")
    }
  }

  // 프로젝트 이름 변경 다이얼로그 열기
  const openRenameDialog = (project: Project) => {
    setProjectToRename(project)
    setNewName(project.name)
    setShowRenameDialog(true)
  }

  // 프로젝트 삭제 다이얼로그 열기
  const openDeleteDialog = (project: Project) => {
    setProjectToDelete(project)
    setShowDeleteDialog(true)
  }

  return (
    <div className="w-full h-full border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="h-6 w-6 text-purple-500" />
          <h1 className="text-xl font-bold">Web3 Studio</h1>
        </div>
        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          onClick={() => setShowNewProjectDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-400 flex items-center mb-3">
            <History className="h-4 w-4 mr-2" />
            RECENT PROJECTS
          </h2>
          {recentProjects.length > 0 ? (
            <ul className="space-y-2">
              {recentProjects.map((project) => (
                <li key={project.id} className="group">
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800 transition-colors">
                    <button
                      className="flex items-center flex-1 text-left"
                      onClick={() => handleSelectProject(project.id)}
                    >
                      <Code
                        className={`h-4 w-4 mr-2 ${project.id === activeProject?.id ? "text-purple-400" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm truncate ${project.id === activeProject?.id ? "text-purple-400 font-medium" : ""}`}
                      >
                        {project.name}
                      </span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                        <DropdownMenuItem
                          className="text-sm cursor-pointer flex items-center"
                          onClick={() => openRenameDialog(project)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer flex items-center"
                          onClick={() => handleToggleArchive(project)}
                        >
                          <ArchiveIcon className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer flex items-center text-red-500"
                          onClick={() => openDeleteDialog(project)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500 py-2">No recent projects</div>
          )}
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-400 flex items-center mb-3">
            <Archive className="h-4 w-4 mr-2" />
            ARCHIVED
          </h2>
          {archivedProjects.length > 0 ? (
            <ul className="space-y-2">
              {archivedProjects.map((project) => (
                <li key={project.id} className="group">
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800 transition-colors">
                    <button
                      className="flex items-center flex-1 text-left text-gray-400"
                      onClick={() => handleSelectProject(project.id)}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      <span className="text-sm truncate">{project.name}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                        <DropdownMenuItem
                          className="text-sm cursor-pointer flex items-center"
                          onClick={() => handleToggleArchive(project)}
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer flex items-center text-red-500"
                          onClick={() => openDeleteDialog(project)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500 py-2">No archived projects</div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-xs font-bold">WS</span>
          </div>
          <div className="text-sm">Web3 Studio</div>
        </div>
      </div>

      {/* 새 프로젝트 다이얼로그 */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FolderPlus className="h-5 w-5 mr-2" />
              Create New Project
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="bg-gray-800 border-gray-700"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)} className="border-gray-700">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!newProjectName.trim()}
            >
              <Check className="h-4 w-4 mr-2" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 프로젝트 이름 변경 다이얼로그 */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              Rename Project
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New project name"
              className="bg-gray-800 border-gray-700"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameProject()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)} className="border-gray-700">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleRenameProject}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!newName.trim()}
            >
              <Check className="h-4 w-4 mr-2" />
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 프로젝트 삭제 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-500">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Project
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to delete <span className="font-medium">{projectToDelete?.name}</span>? This action
              cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-gray-700">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleDeleteProject} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
