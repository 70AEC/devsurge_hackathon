"use client"

import type React from "react"

import { useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import type { FileActions, Project } from "./types"

// 프로젝트 파일 관리 기능을 담당하는 훅
export function useProjectFiles(
  activeProject: Project | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>,
  saveProjects: (projects: Project[]) => void,
): FileActions {
  // 프로젝트 파일 업데이트
  const updateProjectFile = useCallback(
    (projectId: string, fileName: string, content: string) => {
      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id === projectId) {
            const updatedFiles = {
              ...p.files,
              [fileName]: content,
            }

            const updatedProject = {
              ...p,
              files: updatedFiles,
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
    [activeProject, saveProjects, setActiveProject, setProjects],
  )

  // 프로젝트 파일 추가
  const addProjectFile = useCallback(
    (projectId: string, fileName: string, content = "") => {
      setProjects((prev) => {
        const project = prev.find((p) => p.id === projectId)
        if (!project) return prev

        // 이미 존재하는 파일인지 확인
        if (project.files[fileName]) {
          toast({
            title: "File Already Exists",
            description: `File "${fileName}" already exists in this project`,
            variant: "destructive",
          })
          return prev
        }

        const updated = prev.map((p) => {
          if (p.id === projectId) {
            const updatedFiles = {
              ...p.files,
              [fileName]: content || `// ${fileName}\n// Created on ${new Date().toLocaleString()}\n`,
            }

            const updatedProject = {
              ...p,
              files: updatedFiles,
              lastOpenedFile: fileName,
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
    [activeProject, saveProjects, setActiveProject, setProjects],
  )

  // 프로젝트 파일 삭제
  const deleteProjectFile = useCallback(
    (projectId: string, fileName: string) => {
      setProjects((prev) => {
        const project = prev.find((p) => p.id === projectId)
        if (!project) return prev

        // 파일이 존재하는지 확인
        if (!project.files[fileName]) {
          return prev
        }

        // 마지막 파일은 삭제할 수 없음
        if (Object.keys(project.files).length <= 1) {
          toast({
            title: "Cannot Delete File",
            description: "A project must have at least one file",
            variant: "destructive",
          })
          return prev
        }

        const updated = prev.map((p) => {
          if (p.id === projectId) {
            const updatedFiles = { ...p.files }
            delete updatedFiles[fileName]

            // 삭제된 파일이 마지막으로 열린 파일이었다면 다른 파일로 변경
            let lastOpenedFile = p.lastOpenedFile
            if (lastOpenedFile === fileName) {
              lastOpenedFile = Object.keys(updatedFiles)[0]
            }

            const updatedProject = {
              ...p,
              files: updatedFiles,
              lastOpenedFile,
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
    [activeProject, saveProjects, setActiveProject, setProjects],
  )

  // 마지막으로 열린 파일 업데이트
  const updateLastOpenedFile = useCallback(
    (projectId: string, fileName: string) => {
      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id === projectId) {
            const updatedProject = {
              ...p,
              lastOpenedFile: fileName,
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
    [activeProject, saveProjects, setActiveProject, setProjects],
  )

  return {
    updateProjectFile,
    addProjectFile,
    deleteProjectFile,
    updateLastOpenedFile,
  }
}
