"use client"

import { useState, useCallback, useEffect } from "react"

export function useFileManager(initialCode: string) {
  const [files, setFiles] = useState<Record<string, string>>({
    "contract.sol":
      initialCode ||
      `// SPDX-License-Identifier: MIT pragma solidity ^0.8.17;
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

  // Load files from localStorage on first render
  useEffect(() => {
    try {
      const savedFiles = localStorage.getItem("remix-files")
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles)
        setFiles(parsedFiles)

        // Load active file
        const savedActiveFile = localStorage.getItem("remix-active-file")
        if (savedActiveFile && parsedFiles[savedActiveFile]) {
          setActiveFile(savedActiveFile)
        } else if (Object.keys(parsedFiles).length > 0) {
          // If no valid saved active file, use the first one
          setActiveFile(Object.keys(parsedFiles)[0])
        }
      }
    } catch (error) {
      console.error("Error loading saved files:", error)
      // Use default file if failed
    }
  }, [])

  // Select a file to be the active editor target
  const selectFile = useCallback((fileName: string) => {
    setActiveFile(fileName)
  }, [])

  // Update the content of a file
  const updateFileContent = useCallback((fileName: string, content: string) => {
    setFiles((prevFiles) => ({
      ...prevFiles,
      [fileName]: content,
    }))
  }, [])

  // Create a new file
  const createFile = useCallback(
    (fileName: string) => {
      if (!fileName.trim()) return

      // Add .sol extension if missing
      if (!fileName.includes(".")) {
        fileName = `${fileName}.sol`
      }

      // Prevent creating a file that already exists
      if (files[fileName]) {
        alert(`File "${fileName}" already exists.`)
        return
      }

      setFiles((prevFiles) => ({
        ...prevFiles,
        [fileName]: `// SPDX-License-Identifier: MIT pragma solidity ^0.8.17;
        contract ${fileName.split(".")[0]} {
        Write your code here
         }`,
      }))
      setActiveFile(fileName)
    },
    [files],
  )

  // Delete a file
  const deleteFile = useCallback(
    (fileName: string) => {
      if (Object.keys(files).length <= 1) {
        alert("At least one file must exist.")
        return
      }

      const newFiles = { ...files }
      delete newFiles[fileName]
      setFiles(newFiles)

      // If the deleted file was the active one, switch to another
      if (fileName === activeFile) {
        setActiveFile(Object.keys(newFiles)[0])
      }

      // Update localStorage
      localStorage.setItem("remix-files", JSON.stringify(newFiles))
    },
    [files, activeFile],
  )

  // Save all files to localStorage
  const saveFile = useCallback(
    (fileName: string) => {
      setIsSaving(true)

      try {
        // Save files to localStorage
        localStorage.setItem("remix-files", JSON.stringify(files))
        localStorage.setItem("remix-active-file", activeFile)

        // Indicate success
        setTimeout(() => {
          setIsSaving(false)
          // You can show a toast here
        }, 500)

        return true
      } catch (error) {
        console.error("Error saving file:", error)
        setIsSaving(false)
        // You can show a toast here
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
