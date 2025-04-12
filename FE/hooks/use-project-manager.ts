"use client"

import { useProjectCore } from "./project/use-project-core"
import { useProjectFiles } from "./project/use-project-files"
import { useProjectChat } from "./project/use-project-chat"
import type { ProjectManager } from "./project/types"

// 모든 프로젝트 관련 기능을 통합하는 훅
export function useProjectManager(): ProjectManager {
  // 프로젝트 핵심 기능
  const core = useProjectCore()

  // 프로젝트 파일 관리 기능
  const fileActions = useProjectFiles(core.activeProject, core.setProjects, core.setActiveProject, core.saveProjects)

  // 채팅 및 코드 생성 기능
  const chatActions = useProjectChat(core.activeProject, core.setProjects, core.setActiveProject, core.saveProjects)

  // 모든 기능을 통합하여 반환
  return {
    ...core,
    ...fileActions,
    ...chatActions,
  }
}

// 타입 재내보내기
export type { Project, ChatMessage } from "./project/types"
