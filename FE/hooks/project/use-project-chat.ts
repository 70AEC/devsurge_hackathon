"use client"

import type React from "react"

import { useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import type { ChatActions, ChatMessage, Project } from "./types"

// 채팅 및 코드 생성 관련 기능을 담당하는 훅
export function useProjectChat(
  activeProject: Project | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>,
  saveProjects: (projects: Project[]) => void,
): ChatActions {
  // 채팅 메시지 추가
  const addChatMessage = useCallback(
    (projectId: string, message: Omit<ChatMessage, "timestamp">) => {
      if (!projectId) return

      const timestamp = Date.now()
      const newMessage: ChatMessage = {
        ...message,
        timestamp,
      }

      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id === projectId) {
            const updatedMessages = [...p.messages, newMessage]
            const updatedProject = {
              ...p,
              messages: updatedMessages,
              updatedAt: timestamp,
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

      return newMessage
    },
    [activeProject, saveProjects, setActiveProject, setProjects],
  )

  // AI 생성 코드 저장
  const saveGeneratedCode = useCallback(
    (projectId: string, generatedCode: Record<string, string>) => {
      if (!projectId || !generatedCode || Object.keys(generatedCode).length === 0) return

      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id === projectId) {
            // 기존 파일에 생성된 코드 병합
            const updatedFiles = { ...p.files }

            // 생성된 각 파일을 프로젝트에 추가
            Object.entries(generatedCode).forEach(([fileName, content]) => {
              updatedFiles[fileName] = content
            })

            const updatedProject = {
              ...p,
              files: updatedFiles,
              generatedCode, // 원본 생성 코드도 저장
              lastOpenedFile: Object.keys(generatedCode)[0] || p.lastOpenedFile, // 첫 번째 생성 파일을 활성화
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

      toast({
        title: "Code Generated",
        description: `${Object.keys(generatedCode).length} files have been added to your project`,
      })
    },
    [activeProject, saveProjects, setActiveProject, setProjects],
  )

  return {
    addChatMessage,
    saveGeneratedCode,
  }
}
