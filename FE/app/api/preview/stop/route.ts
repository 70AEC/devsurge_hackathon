import { type NextRequest, NextResponse } from "next/server"
import { rm } from "fs/promises"
import path from "path"

// 프로젝트 저장 기본 경로
const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), "tmp", "preview-projects")

// 프로젝트 중지 API
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { projectId } = data

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // 전역 변수에서 프로젝트 정보 가져오기
    const project = global.runningProjects?.[projectId]
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // 프로세스 종료
    try {
      if (project.process) {
        console.log(`Stopping project ${projectId}...`)
        process.kill(project.process.pid)
      }
    } catch (error) {
      console.error(`Error stopping project ${projectId}:`, error)
    }

    // 프로젝트 디렉토리 삭제 (선택적)
    try {
      await rm(project.path, { recursive: true, force: true })
      console.log(`Removed project directory: ${project.path}`)
    } catch (error) {
      console.error(`Error removing project directory ${project.path}:`, error)
    }

    // 추적 목록에서 제거
    delete global.runningProjects[projectId]

    return NextResponse.json({
      success: true,
      message: `Project ${projectId} stopped`,
    })
  } catch (error) {
    console.error("Error stopping project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
