"use client"

import { useState, useCallback, useEffect } from "react"

export function useFileManager(initialCode: string) {
  const [files, setFiles] = useState<Record<string, string>>({
    "contract.sol":
      initialCode ||
      `// SPDX-License-Identifier: MIT
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
  })
  const [activeFile, setActiveFile] = useState("contract.sol")
  const [isSaving, setIsSaving] = useState(false)

  // 초기화 시 로컬 스토리지에서 파일 불러오기
  useEffect(() => {
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
      }
    } catch (error) {
      console.error("저장된 파일 불러오기 오류:", error)
      // 기본 파일 사용
    }
  }, [])

  // 파일 선택
  const selectFile = useCallback((fileName: string) => {
    setActiveFile(fileName)
  }, [])

  // 파일 내용 업데이트
  const updateFileContent = useCallback((fileName: string, content: string) => {
    if (!fileName || !content) return

    setFiles((prevFiles) => ({
      ...prevFiles,
      [fileName]: content,
    }))
  }, [])

  // 새 파일 생성
  const createFile = useCallback(
    (fileName: string) => {
      if (!fileName.trim()) return

      // 확장자가 없으면 .sol 추가
      if (!fileName.includes(".")) {
        fileName = `${fileName}.sol`
      }

      // 이미 존재하는 파일인지 확인
      if (files[fileName]) {
        // 이미 존재하는 파일이면 선택만 하고 내용은 변경하지 않음
        setActiveFile(fileName)
        return
      }

      setFiles((prevFiles) => ({
        ...prevFiles,
        [fileName]: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ${fileName.split(".")[0]} {
    // 여기에 코드를 작성하세요
}`,
      }))
      setActiveFile(fileName)
    },
    [files],
  )

  // 파일 삭제
  const deleteFile = useCallback(
    (fileName: string) => {
      if (Object.keys(files).length <= 1) {
        alert("최소한 하나의 파일이 필요합니다.")
        return
      }

      const newFiles = { ...files }
      delete newFiles[fileName]
      setFiles(newFiles)

      // 삭제한 파일이 활성 파일이었다면 다른 파일로 전환
      if (fileName === activeFile) {
        setActiveFile(Object.keys(newFiles)[0])
      }

      // 로컬 스토리지 업데이트
      localStorage.setItem("remix-files", JSON.stringify(newFiles))
    },
    [files, activeFile],
  )

  // 파일 저장
  const saveFile = useCallback(
    (fileName: string) => {
      setIsSaving(true)

      try {
        // 로컬 스토리지에 저장
        localStorage.setItem("remix-files", JSON.stringify(files))

        // 현재 활성 파일 저장
        localStorage.setItem("remix-active-file", activeFile)

        // 저장 성공 표시
        setTimeout(() => {
          setIsSaving(false)
          // 성공 메시지 또는 토스트 표시 가능
        }, 500)

        return true
      } catch (error) {
        console.error("파일 저장 오류:", error)
        setIsSaving(false)
        // 오류 메시지 또는 토스트 표시 가능
        return false
      }
    },
    [files, activeFile],
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
