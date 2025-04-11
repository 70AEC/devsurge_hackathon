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

  const COMPILER_SERVER_URL = process.env.NEXT_PUBLIC_COMPILER_SERVER_URL || "http://localhost:3001/compile"

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const statusUrl = COMPILER_SERVER_URL.replace("/compile", "/status")
        const response = await fetch(statusUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setIsServerConnected(true)
          toast({
            title: "Compiler Server Connected",
            description: `Using Solidity compiler v${data.solcVersion || "0.8.17"}`,
          })
        } else {
          setIsServerConnected(false)
          throw new Error(`Server error: ${response.status}`)
        }
      } catch (error: unknown) {
        console.error("Error checking server status:", error)
        setIsServerConnected(false)
        toast({
          title: "Compiler Server Error",
          description: "Could not connect to the compiler server. Make sure it's running.",
          variant: "destructive",
        })
      }
    }

    checkServerStatus()
  }, [COMPILER_SERVER_URL])

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
        const response = await fetch("/api/compile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: sourceCode,
            fileName: fileName,
            version: compilerVersion,
            optimize: optimizationEnabled,
            runs: 200,
            libraries: {
              useOpenZeppelin: true,
              paths: [
                "@openzeppelin/contracts/token/ERC721",
                "@openzeppelin/contracts/token/ERC20",
                "@openzeppelin/contracts/access",
                "@openzeppelin/contracts/utils",
              ],
            },
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
    [compilerVersion, isCompiling, optimizationEnabled, COMPILER_SERVER_URL, isServerConnected],
  )

  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/status")
      if (!response.ok) {
        setIsServerConnected(false)
        throw new Error(`Server error: ${response.status}`)
      }
      const data = await response.json()
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

  return {
    isCompiling,
    compilationSuccess,
    compilationOutput,
    compilerVersion,
    optimizationEnabled,
    compiledContracts,
    selectedContract,
    isServerConnected,
    compile,
    setCompilerVersion,
    setOptimizationEnabled,
    setSelectedContract,
    checkServerStatus,
  }
}
