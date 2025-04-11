"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

export function useSolidityCompiler(initialCode: string) {
  const [isCompiling, setIsCompiling] = useState(false)
  const [compilationSuccess, setCompilationSuccess] = useState<boolean | null>(null)
  const [compilationOutput, setCompilationOutput] = useState<string | null>(null)
  const [compilerVersion, setCompilerVersion] = useState("0.8.17")
  const [optimizationEnabled, setOptimizationEnabled] = useState(false)
  const [compiledContracts, setCompiledContracts] = useState<Record<string, any>>({})
  const [selectedContract, setSelectedContract] = useState<string>("")
  const [isServerConnected, setIsServerConnected] = useState<boolean | null>(null)
  const [availableVersions, setAvailableVersions] = useState<string[]>([
    "0.8.20",
    "0.8.19",
    "0.8.18",
    "0.8.17",
    "0.8.16",
    "0.8.15",
    "0.8.14",
    "0.8.13",
    "0.8.12",
    "0.8.11",
    "0.8.10",
  ])

  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/status")
      if (!response.ok) {
        setIsServerConnected(false)
        throw new Error(`Server error: ${response.status}`)
      }
      const data = await response.json()

      // If the server returns supported versions, use those
      if (data.supportedVersions && Array.isArray(data.supportedVersions)) {
        setAvailableVersions(data.supportedVersions)
      }

      setIsServerConnected(true)
      return data
    } catch (error: unknown) {
      console.error("Error checking server status:", error)
      setIsServerConnected(false)

      let errorMessage = "Could not connect to the compiler server"
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      }

      toast({
        title: "Compiler Server Error",
        description: errorMessage,
        variant: "destructive",
      })
      return null
    }
  }, [])

  useEffect(() => {
    checkServerStatus()
  }, [checkServerStatus])

  const compile = useCallback(
    async (sourceCode: string, fileName: string): Promise<boolean> => {
      if (isCompiling) return false

      if (isServerConnected === false) {
        toast({
          title: "Compiler Server Not Connected",
          description: "Please start the backend compiler server first.",
          variant: "destructive",
        })
        return false
      }

      setIsCompiling(true)
      setCompilationSuccess(null)
      setCompilationOutput("Compiling...")
      setCompiledContracts({})
      setSelectedContract("")

      try {
        // Format the version correctly for solc
        // Remove the "v" prefix if it exists
        const formattedVersion = compilerVersion.startsWith("v") ? compilerVersion.substring(1) : compilerVersion

        console.log(`Compiling with Solidity version: ${formattedVersion}`)

        const response = await fetch("/api/compile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: sourceCode,
            fileName: fileName,
            version: formattedVersion,
            optimize: optimizationEnabled,
            runs: 200,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Server error (${response.status}): ${errorText}`)
        }

        const result = await response.json()

        if (result.success === false) {
          setCompilationSuccess(false)

          if (result.errors && result.errors.length > 0) {
            const errorMessages = result.errors.map(
              (error: { severity: string; formattedMessage?: string; message?: string }) => {
                const severity = error.severity === "warning" ? "Warning" : "Error"
                return `${severity}: ${error.formattedMessage || error.message}`
              },
            )
            setCompilationOutput(errorMessages.join("\n\n"))
          } else {
            setCompilationOutput("Compilation failed with unknown errors")
          }

          return false
        }

        if (result.contracts && Object.keys(result.contracts).length > 0) {
          setCompilationSuccess(true)

          if (result.errors && result.errors.length > 0) {
            const warningMessages = result.errors.map((error: { formattedMessage?: string; message?: string }) => {
              return `Warning: ${error.formattedMessage || error.message}`
            })
            setCompilationOutput(`Compilation successful with warnings:\n\n${warningMessages.join("\n\n")}`)
          } else {
            setCompilationOutput("Compilation successful!")
          }

          setCompiledContracts(result.contracts)

          const firstFile = Object.keys(result.contracts)[0]
          if (firstFile) {
            const firstContract = Object.keys(result.contracts[firstFile])[0]
            if (firstContract) {
              setSelectedContract(firstContract)
            }
          }

          return true
        }

        return false
      } catch (error: unknown) {
        console.error("Error during compilation:", error)
        setCompilationSuccess(false)

        let errorMessage = "Unknown error occurred"
        if (error instanceof Error) {
          errorMessage = error.message
        }

        setCompilationOutput(`Compilation error: ${errorMessage}`)

        toast({
          title: "Compilation Failed",
          description: errorMessage,
          variant: "destructive",
        })

        return false
      } finally {
        setIsCompiling(false)
      }
    },
    [compilerVersion, isCompiling, optimizationEnabled, isServerConnected],
  )

  return {
    isCompiling,
    compilationSuccess,
    compilationOutput,
    compilerVersion,
    optimizationEnabled,
    compiledContracts,
    selectedContract,
    isServerConnected,
    availableVersions,
    compile,
    setCompilerVersion,
    setOptimizationEnabled,
    setSelectedContract,
    checkServerStatus,
  }
}
