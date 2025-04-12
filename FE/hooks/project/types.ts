// 프로젝트 관련 타입 정의

export interface ChatMessage {
    role: "user" | "assistant"
    content: string
    timestamp: number
  }
  
  export interface Project {
    id: string
    name: string
    files: Record<string, string>
    createdAt: number
    updatedAt: number
    isArchived: boolean
    lastOpenedFile?: string
    messages: ChatMessage[] // 채팅 기록
    generatedCode?: Record<string, string> // AI가 생성한 코드
  }
  
  // 프로젝트 상태 인터페이스
  export interface ProjectState {
    projects: Project[]
    activeProject: Project | null
    recentProjects: Project[]
    archivedProjects: Project[]
    isLoading: boolean
  }
  
  // 프로젝트 액션 인터페이스
  export interface ProjectActions {
    createProject: (name?: string) => Project
    selectProject: (projectId: string) => void
    updateProject: (projectId: string, updates: Partial<Project>) => void
    toggleArchiveProject: (projectId: string) => void
    deleteProject: (projectId: string) => void
    renameProject: (projectId: string, newName: string) => void
    updateProjectTimestamp: (projectId: string) => void
  }
  
  // 파일 관리 액션 인터페이스
  export interface FileActions {
    updateProjectFile: (projectId: string, fileName: string, content: string) => void
    addProjectFile: (projectId: string, fileName: string, content?: string) => void
    deleteProjectFile: (projectId: string, fileName: string) => void
    updateLastOpenedFile: (projectId: string, fileName: string) => void
  }
  
  // 채팅 및 코드 생성 액션 인터페이스
  export interface ChatActions {
    addChatMessage: (projectId: string, message: Omit<ChatMessage, "timestamp">) => ChatMessage | undefined
    saveGeneratedCode: (projectId: string, generatedCode: Record<string, string>) => void
  }
  
  // 통합 프로젝트 매니저 인터페이스
  export interface ProjectManager extends ProjectState, ProjectActions, FileActions, ChatActions {}
  