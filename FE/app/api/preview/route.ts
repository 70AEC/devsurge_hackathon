import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { existsSync } from "fs"

const execAsync = promisify(exec)

// 프로젝트 저장 기본 경로
const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), "tmp", "preview-projects")
const MAX_PROJECT_AGE_MS = 1000 * 60 * 60 // 1시간

// 실행 중인 프로젝트 추적
interface RunningProject {
  id: string
  port: number
  path: string
  lastAccessed: number
  process: any
}

// 전역 변수로 실행 중인 프로젝트 관리
// 이렇게 하면 API 라우트 간에 상태를 공유할 수 있습니다
if (!global.runningProjects) {
  global.runningProjects = {}
}
const runningProjects = global.runningProjects
let nextPort = 3100 // 시작 포트

// 오래된 프로젝트 정리
setInterval(
  () => {
    const now = Date.now()
    Object.keys(runningProjects).forEach((id) => {
      const project = runningProjects[id]
      if (now - project.lastAccessed > MAX_PROJECT_AGE_MS) {
        console.log(`Cleaning up inactive project: ${id}`)
        if (project.process) {
          try {
            process.kill(project.process.pid)
          } catch (error) {
            console.error(`Failed to kill process for project ${id}:`, error)
          }
        }
        delete runningProjects[id]
      }
    })
  },
  1000 * 60 * 15,
) // 15분마다 정리

export async function POST(req: NextRequest) {
  try {
    // 요청에서 파일 데이터 추출
    const data = await req.json()
    const { files, projectId } = data

    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // 기존 프로젝트 ID가 있으면 해당 프로젝트 사용, 없으면 새로 생성
    const id = projectId || uuidv4()
    const projectPath = path.join(PROJECTS_DIR, id)

    // 프로젝트 디렉토리 생성
    if (!existsSync(projectPath)) {
      await mkdir(projectPath, { recursive: true })
    }

    // 파일 저장
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(projectPath, filePath)

      // 디렉토리 생성
      const dir = path.dirname(fullPath)
      await mkdir(dir, { recursive: true })

      // 파일 저장
      await writeFile(fullPath, content as string)
    }

    // 이미 실행 중인 프로젝트인지 확인
    if (runningProjects[id]) {
      // 마지막 접근 시간 업데이트
      runningProjects[id].lastAccessed = Date.now()

      return NextResponse.json({
        projectId: id,
        url: `http://localhost:${runningProjects[id].port}`,
        message: "Project updated",
      })
    }

    // package.json이 없으면 생성
    const packageJsonPath = path.join(projectPath, "package.json")
    if (!existsSync(packageJsonPath)) {
      const packageJson = {
        name: `preview-${id}`,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
        },
        dependencies: {
          next: "^14.0.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
        devDependencies: {
          "@types/node": "^20.0.0",
          "@types/react": "^18.2.0",
          typescript: "^5.0.0",
          tailwindcss: "^3.3.0",
          autoprefixer: "^10.4.0",
          postcss: "^8.4.0",
        },
      }
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    }

    // 필요한 설정 파일들 생성
    const configFiles = {
      "next.config.js": `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig`,
      "tsconfig.json": `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
      "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}`,
      "postcss.config.js": `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    }

    // 설정 파일 저장
    for (const [filePath, content] of Object.entries(configFiles)) {
      const fullPath = path.join(projectPath, filePath)
      if (!existsSync(fullPath)) {
        await writeFile(fullPath, content)
      }
    }

    // 포트 할당
    const port = nextPort++
    if (nextPort > 3200) nextPort = 3100 // 포트 범위 제한

    // 의존성 설치 및 개발 서버 시작
    console.log(`Starting Next.js dev server for project ${id} on port ${port}...`)

    try {
      // npm install 실행
      console.log(`Installing dependencies for project ${id}...`)
      await execAsync("npm install", { cwd: projectPath })

      // Next.js 개발 서버 시작 - detached 옵션 제거
      const process = exec(`npx next dev -p ${port}`, {
        cwd: projectPath,
      })

      // 프로세스 출력 로깅
      if (process.stdout) {
        process.stdout.on("data", (data) => {
          console.log(`[Project ${id}]: ${data}`)
        })
      }

      if (process.stderr) {
        process.stderr.on("data", (data) => {
          console.error(`[Project ${id} ERROR]: ${data}`)
        })
      }

      // 프로세스 종료 처리
      process.on("close", (code) => {
        console.log(`Project ${id} process exited with code ${code}`)
        if (runningProjects[id] && runningProjects[id].process === process) {
          delete runningProjects[id]
        }
      })

      // 실행 중인 프로젝트 추적
      runningProjects[id] = {
        id,
        port,
        path: projectPath,
        lastAccessed: Date.now(),
        process,
      }

      // 서버가 시작될 때까지 잠시 대기
      await new Promise((resolve) => setTimeout(resolve, 3000))

      return NextResponse.json({
        projectId: id,
        url: `http://localhost:${port}`,
        message: "Project started",
      })
    } catch (error) {
      console.error(`Error starting project ${id}:`, error)
      return NextResponse.json({ error: `Failed to start project: ${error}` }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in preview API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 프로젝트 상태 확인 API
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const projectId = url.searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
  }

  const project = runningProjects[projectId]
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // 마지막 접근 시간 업데이트
  project.lastAccessed = Date.now()

  return NextResponse.json({
    projectId,
    url: `http://localhost:${project.port}`,
    status: "running",
  })
}

// 전역 타입 선언 추가
declare global {
  var runningProjects: Record<string, RunningProject>
}
