"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Project } from "./project/types"

export function useFileManager(initialCode: string, activeProject: Project | null = null) {
  // 파일 상태
  const [files, setFiles] = useState<Record<string, string>>({})
  const [activeFile, setActiveFile] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  // 초기화 여부 추적
  const initialized = useRef(false)

  // 프로젝트 ID 추적 (변경 감지용)
  const prevProjectId = useRef<string | null>(null)

  // 활성 프로젝트가 변경될 때 파일 목록 초기화
  useEffect(() => {
    // 이미 초기화된 동일한 프로젝트면 중복 초기화 방지
    if (activeProject?.id === prevProjectId.current && initialized.current) {
      return
    }

    console.log("useFileManager: Project changed, current:", activeProject?.id, "previous:", prevProjectId.current)
    console.log(
      "useFileManager: Active project files:",
      activeProject?.files ? Object.keys(activeProject.files) : "none",
    )

    // 프로젝트가 변경되었는지 확인
    if (activeProject?.id !== prevProjectId.current) {
      console.log("useFileManager: Project ID changed, reinitializing files")

      if (activeProject && activeProject.files && Object.keys(activeProject.files).length > 0) {
        // 프로젝트 파일로 초기화
        console.log("useFileManager: Initializing with project files:", Object.keys(activeProject.files))
        setFiles(activeProject.files)

        // 마지막으로 열린 파일 또는 첫 번째 파일을 활성화
        const fileToOpen = activeProject.lastOpenedFile || Object.keys(activeProject.files)[0]
        if (fileToOpen) {
          console.log("useFileManager: Setting active file to:", fileToOpen)
          setActiveFile(fileToOpen)
        } else {
          console.warn("useFileManager: No file to open in project")
        }
      } else {
        // 프로젝트가 없는 경우 기본 파일로 초기화
        console.log("useFileManager: No project or empty project, initializing with default file")
        const defaultFiles = {
          "contract.sol": initialCode,
        }
        setFiles(defaultFiles)
        setActiveFile("contract.sol")
      }

      // 현재 프로젝트 ID 저장
      prevProjectId.current = activeProject?.id || null
      initialized.current = true
    }
  }, [activeProject, initialCode])

  // 초기화 (프로젝트가 없을 때만)
  useEffect(() => {
    if (!activeProject && !initialized.current) {
      try {
        // 저장된 파일 불러오기
        const savedFiles = localStorage.getItem("remix-files")
        if (savedFiles) {
          const parsedFiles = JSON.parse(savedFiles)
          setFiles(parsedFiles)

          // 활성 파일 불러오기
          const savedActiveFile = localStorage.getItem("remix-active-file")
          if (savedActiveFile && parsedFiles[savedActiveFile]) {
            setActiveFile(savedActiveFile)
          } else if (Object.keys(parsedFiles).length > 0) {
            // 저장된 활성 파일이 없으면 첫 번째 파일 선택
            setActiveFile(Object.keys(parsedFiles)[0])
          }
        } else {
          // 저장된 파일이 없으면 기본 파일 사용
          const defaultFiles = {
            "contract.sol": initialCode,
          }
          setFiles(defaultFiles)
          setActiveFile("contract.sol")
        }

        initialized.current = true
      } catch (error) {
        console.error("저장된 파일 불러오기 오류:", error)
        // 기본 파일 사용
        const defaultFiles = {
          "contract.sol": initialCode,
        }
        setFiles(defaultFiles)
        setActiveFile("contract.sol")
        initialized.current = true
      }
    }
  }, [activeProject, initialCode])

  // 파일 선택
  const selectFile = useCallback((fileName: string) => {
    console.log("useFileManager: Selecting file:", fileName)
    setActiveFile(fileName)
  }, [])

  // 파일 내용 업데이트 - 디바운스 추가
  const updateFileContent = useCallback((fileName: string, content: string) => {
    if (!fileName) return

    console.log("useFileManager: Updating file content:", fileName)
    setFiles((prevFiles) => ({
      ...prevFiles,
      [fileName]: content,
    }))

    // 자동 저장은 별도의 useEffect에서 처리
  }, [])

  // 자동 저장 처리를 위한 useEffect
  useEffect(() => {
    // 프로젝트가 없고 파일이 있을 때만 로컬 스토리지에 저장
    if (!activeProject && Object.keys(files).length > 0 && activeFile) {
      const saveTimer = setTimeout(() => {
        try {
          localStorage.setItem("remix-files", JSON.stringify(files))
          localStorage.setItem("remix-active-file", activeFile)
          console.log("useFileManager: Auto-saved files to localStorage")
        } catch (error) {
          console.error("자동 저장 오류:", error)
        }
      }, 1000) // 1초 디바운스

      return () => clearTimeout(saveTimer)
    }
  }, [files, activeFile, activeProject])

  // 새 파일 생성
  const createFile = useCallback(
    (fileName: string) => {
      if (!fileName.trim()) return

      // 확장자가 없으면 .sol 추가
      if (!fileName.includes(".")) {
        fileName = `${fileName}.sol`
      }

      console.log("useFileManager: Creating new file:", fileName)

      // 이미 존재하는 파일인지 확인
      if (files[fileName]) {
        // 이미 존재하는 파일이면 선택만 하고 내용은 변경하지 않음
        setActiveFile(fileName)
        return
      }

      const newContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ${fileName.split(".")[0]} {
    // 여기에 코드를 작성하세요
}`

      setFiles((prevFiles) => {
        const updatedFiles = {
          ...prevFiles,
          [fileName]: newContent,
        }

        // 프로젝트가 없을 때만 로컬 스토리지에 저장
        if (!activeProject) {
          try {
            localStorage.setItem("remix-files", JSON.stringify(updatedFiles))
          } catch (error) {
            console.error("파일 저장 오류:", error)
          }
        }

        return updatedFiles
      })

      setActiveFile(fileName)
    },
    [files, activeProject],
  )

  // 파일 삭제
  const deleteFile = useCallback(
    (fileName: string) => {
      if (Object.keys(files).length <= 1) {
        toast({
          title: "파일 삭제 불가",
          description: "최소한 하나의 파일이 필요합니다.",
          variant: "destructive",
        })
        return
      }

      console.log("useFileManager: Deleting file:", fileName)

      const newFiles = { ...files }
      delete newFiles[fileName]
      setFiles(newFiles)

      // 삭제한 파일이 활성 파일이었다면 다른 파일로 전환
      if (fileName === activeFile) {
        setActiveFile(Object.keys(newFiles)[0])
      }

      // 로컬 스토리지 업데이트 (프로젝트가 없을 때만)
      if (!activeProject) {
        try {
          localStorage.setItem("remix-files", JSON.stringify(newFiles))
          if (fileName === activeFile) {
            localStorage.setItem("remix-active-file", Object.keys(newFiles)[0])
          }
        } catch (error) {
          console.error("파일 삭제 후 저장 오류:", error)
        }
      }
    },
    [files, activeFile, activeProject],
  )

  // 파일 저장
  const saveFile = useCallback(
    (fileName: string) => {
      setIsSaving(true)

      try {
        console.log("useFileManager: Saving file:", fileName)

        // 프로젝트가 없을 때만 로컬 스토리지에 저장
        if (!activeProject) {
          localStorage.setItem("remix-files", JSON.stringify(files))
          localStorage.setItem("remix-active-file", activeFile)
        }

        // 저장 성공 표시
        setTimeout(() => {
          setIsSaving(false)

          toast({
            title: "파일 저장됨",
            description: `${fileName} 파일이 성공적으로 저장되었습니다.`,
            duration: 2000,
          })
        }, 500)

        return true
      } catch (error) {
        console.error("파일 저장 오류:", error)
        setIsSaving(false)

        toast({
          title: "파일 저장 오류",
          description: "파일을 저장하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })

        return false
      }
    },
    [files, activeFile, activeProject],
  )

  return {
    files,
    activeFile,
    isSaving,
    selectFile,
    updateFileContent,
    createFile,
    deleteFile,
    saveFile,
  }
}
