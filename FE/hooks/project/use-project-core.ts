"use client"

import { useState, useEffect, useCallback } from "react"
import type React from "react"
import { toast } from "@/components/ui/use-toast"
import type { Project, ProjectState, ProjectActions } from "./types"

// 프로젝트 핵심 기능을 담당하는 훅
export function useProjectCore(): ProjectState &
  ProjectActions & {
    saveProjects: (projectsToSave: Project[]) => void
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>
    setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>
  } {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // 고유 ID 생성 함수 - 더 안정적인 방식으로 변경
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
  }

  // 기본 프로젝트 생성 함수
  const createDefaultProject = useCallback((): Project => {
    const id = generateId()
    console.log("Creating default project with ID:", id)

    return {
      id,
      name: "My First Project",
      files: {
        "contract.sol": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract SimpleStorage {
    uint256 private storedData;

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}`,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isArchived: false,
      lastOpenedFile: "contract.sol",
      messages: [], // 빈 채팅 기록으로 초기화
    }
  }, [])

  // 프로젝트 저장
  const saveProjects = useCallback((projectsToSave: Project[]) => {
    try {
      localStorage.setItem("web3-studio-projects", JSON.stringify(projectsToSave))
      console.log("Projects saved to localStorage:", projectsToSave.length)
    } catch (error) {
      console.error("Error saving projects:", error)
      toast({
        title: "Error",
        description: "Failed to save projects",
        variant: "destructive",
      })
    }
  }, [])

  // 활성 프로젝트 저장
  const saveActiveProject = useCallback((projectId: string) => {
    try {
      localStorage.setItem("web3-studio-active-project", projectId)
      console.log("Active project saved to localStorage:", projectId)
    } catch (error) {
      console.error("Error saving active project:", error)
    }
  }, [])

  // 프로젝트 목록 로드
  const loadProjects = useCallback(() => {
    // 이미 초기화되었으면 다시 로드하지 않음
    if (isInitialized) {
      setIsLoading(false)
      return
    }

    try {
      const savedProjects = localStorage.getItem("web3-studio-projects")
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects) as Project[]

          if (parsedProjects && Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            console.log("Loaded projects:", parsedProjects.length)
            setProjects(parsedProjects)

            // 마지막으로 작업한 프로젝트 찾기
            const lastActiveProjectId = localStorage.getItem("web3-studio-active-project")
            if (lastActiveProjectId) {
              const lastProject = parsedProjects.find((p) => p.id === lastActiveProjectId)
              if (lastProject && !lastProject.isArchived) {
                setActiveProject(lastProject)
              } else {
                // 마지막 프로젝트가 없거나 아카이브된 경우 첫 번째 비아카이브 프로젝트 선택
                const firstNonArchived = parsedProjects.find((p) => !p.isArchived)
                setActiveProject(firstNonArchived || null)
              }
            }
          } else {
            throw new Error("Invalid projects data")
          }
        } catch (error) {
          console.error("Error parsing saved projects:", error)
          throw error
        }
      } else {
        console.log("No projects found in localStorage, creating default project")
        // 저장된 프로젝트가 없으면 기본 프로젝트 생성
        const defaultProject = createDefaultProject()
        setProjects([defaultProject])
        setActiveProject(defaultProject)
        saveProjects([defaultProject])
      }
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })

      // 오류 발생 시 기본 프로젝트 생성
      const defaultProject = createDefaultProject()
      setProjects([defaultProject])
      setActiveProject(defaultProject)
      saveProjects([defaultProject])
    } finally {
      setIsLoading(false)
      setIsInitialized(true) // 초기화 완료 표시
    }
  }, [saveProjects, createDefaultProject, isInitialized])

  // 초기 로드
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 프로젝트 타임스탬프 업데이트 (최근 접근 시간)
  const updateProjectTimestamp = useCallback(
    (projectId: string) => {
      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              updatedAt: Date.now(),
            }
          }
          return p
        })

        saveProjects(updated)
        return updated
      })
    },
    [saveProjects],
  )

  // 새 프로젝트 생성
  const createProject = useCallback(
    (name = "New Project") => {
      const newProject: Project = {
        id: generateId(),
        name,
        files: {
          "contract.sol": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract NewContract {
    // Your code here
}`,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isArchived: false,
        lastOpenedFile: "contract.sol",
        messages: [], // 빈 채팅 기록으로 초기화
      }

      console.log("Creating new project:", newProject.name, "with ID:", newProject.id)

      try {
        // 프로젝트 목록에 추가하고 저장
        setProjects((prev) => {
          const updatedProjects = [...prev, newProject]
          saveProjects(updatedProjects)
          return updatedProjects
        })

        // 활성 프로젝트로 설정
        setActiveProject(newProject)
        saveActiveProject(newProject.id)

        toast({
          title: "Project Created",
          description: `Project "${name}" has been created`,
        })

        return newProject
      } catch (error) {
        console.error("Error creating project:", error)
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive",
        })
        throw error
      }
    },
    [saveProjects, saveActiveProject],
  )

  // 프로젝트 선택
  const selectProject = useCallback(
    (projectId: string) => {
      console.log("useProjectManager: Selecting project:", projectId)

      const project = projects.find((p) => p.id === projectId)
      if (project) {
        // 이전 프로젝트와 다른 경우에만 업데이트
        if (!activeProject || activeProject.id !== projectId) {
          console.log("useProjectManager: Changing active project from", activeProject?.id, "to", projectId)
          setActiveProject(project)
          saveActiveProject(projectId)

          // 프로젝트 접근 시간 업데이트
          updateProjectTimestamp(projectId)
        }
      } else {
        console.warn("Project not found:", projectId)
      }
    },
    [projects, activeProject, saveActiveProject, updateProjectTimestamp],
  )

  // 프로젝트 업데이트 (파일 내용 등)
  const updateProject = useCallback(
    (projectId: string, updates: Partial<Project>) => {
      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id === projectId) {
            const updatedProject = {
              ...p,
              ...updates,
              updatedAt: Date.now(),
            }

            // 활성 프로젝트인 경우 활성 프로젝트도 업데이트
            if (activeProject?.id === projectId) {
              setActiveProject(updatedProject)
            }

            return updatedProject
          }
          return p
        })

        saveProjects(updated)
        return updated
      })
    },
    [activeProject, saveProjects],
  )

  // 프로젝트 아카이브/복원
  const toggleArchiveProject = useCallback(
    (projectId: string) => {
      setProjects((prev) => {
        const project = prev.find((p) => p.id === projectId)
        if (!project) return prev

        const isArchiving = !project.isArchived

        const updated = prev.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              isArchived: isArchiving,
              updatedAt: Date.now(),
            }
          }
          return p
        })

        // 현재 활성 프로젝트를 아카이브하는 경우 다른 프로젝트로 전환
        if (isArchiving && activeProject?.id === projectId) {
          const nextActive = updated.find((p) => !p.isArchived && p.id !== projectId)
          if (nextActive) {
            setActiveProject(nextActive)
            saveActiveProject(nextActive.id)
          } else {
            setActiveProject(null)
          }
        }

        saveProjects(updated)

        toast({
          title: isArchiving ? "Project Archived" : "Project Restored",
          description: `Project "${project.name}" has been ${isArchiving ? "archived" : "restored"}`,
        })

        return updated
      })
    },
    [activeProject, saveProjects, saveActiveProject],
  )

  // 프로젝트 삭제
  const deleteProject = useCallback(
    (projectId: string) => {
      setProjects((prev) => {
        // 삭제할 프로젝트 찾기
        const projectToDelete = prev.find((p) => p.id === projectId)
        if (!projectToDelete) return prev

        const updated = prev.filter((p) => p.id !== projectId)

        // 현재 활성 프로젝트를 삭제하는 경우 다른 프로젝트로 전환
        if (activeProject?.id === projectId) {
          const nextActive = updated.find((p) => !p.isArchived)
          if (nextActive) {
            setActiveProject(nextActive)
            saveActiveProject(nextActive.id)
          } else {
            // 남은 프로젝트가 없으면 새 프로젝트 생성
            if (updated.length === 0) {
              const defaultProject = createDefaultProject()
              updated.push(defaultProject)
              setActiveProject(defaultProject)
              saveActiveProject(defaultProject.id)
            } else {
              setActiveProject(null)
            }
          }
        }

        saveProjects(updated)

        toast({
          title: "Project Deleted",
          description: `Project "${projectToDelete.name}" has been deleted`,
        })

        return updated
      })
    },
    [activeProject, saveProjects, saveActiveProject, createDefaultProject],
  )

  // 프로젝트 이름 변경
  const renameProject = useCallback(
    (projectId: string, newName: string) => {
      if (!newName.trim()) {
        toast({
          title: "Error",
          description: "Project name cannot be empty",
          variant: "destructive",
        })
        return
      }

      updateProject(projectId, { name: newName })

      toast({
        title: "Project Renamed",
        description: `Project has been renamed to "${newName}"`,
      })
    },
    [updateProject],
  )

  // 최근 프로젝트 목록 (아카이브되지 않은 프로젝트, 최근 수정일 기준 정렬)
  const recentProjects = projects.filter((p) => !p.isArchived).sort((a, b) => b.updatedAt - a.updatedAt)

  // 아카이브된 프로젝트 목록
  const archivedProjects = projects.filter((p) => p.isArchived).sort((a, b) => b.updatedAt - a.updatedAt)

  return {
    projects,
    activeProject,
    recentProjects,
    archivedProjects,
    isLoading,
    createProject,
    selectProject,
    updateProject,
    toggleArchiveProject,
    deleteProject,
    renameProject,
    updateProjectTimestamp,
    saveProjects,
    setProjects,
    setActiveProject,
  }
}
