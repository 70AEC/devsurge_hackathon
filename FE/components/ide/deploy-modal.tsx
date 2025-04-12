"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

interface DeployModalProps {
  isOpen: boolean
  isDeploying: boolean
  selectedContract: string
  compiledContracts: Record<string, any>
  gasLimit: string
  gasPrice: string
  value: string
  valueUnit: string
  onClose: () => void
  onDeploy: (constructorArgs: any[]) => void
  onSelectContract: (contract: string) => void
  onGasLimitChange: (limit: string) => void
  onGasPriceChange: (price: string) => void
  onValueChange: (value: string) => void
  onValueUnitChange: (unit: string) => void
}

interface ConstructorParam {
  name: string
  type: string
  value: string
}

export function DeployModal({
  isOpen,
  isDeploying,
  selectedContract,
  compiledContracts,
  gasLimit,
  gasPrice,
  value,
  valueUnit,
  onClose,
  onDeploy,
  onSelectContract,
  onGasLimitChange,
  onGasPriceChange,
  onValueChange,
  onValueUnitChange,
}: DeployModalProps) {
  const [constructorParams, setConstructorParams] = useState<ConstructorParam[]>([])

  // 선택된 컨트랙트가 변경될 때마다 생성자 매개변수 추출
  useEffect(() => {
    if (!selectedContract || !compiledContracts || Object.keys(compiledContracts).length === 0) {
      setConstructorParams([])
      return
    }

    console.log("Looking for constructor in contract:", selectedContract)
    console.log("Available compiled contracts:", compiledContracts)

    // 선택된 컨트랙트의 ABI 찾기
    let contractABI = null
    let fileName = ""

    // 모든 파일에서 선택된 컨트랙트 찾기
    for (fileName in compiledContracts) {
      if (compiledContracts[fileName][selectedContract]) {
        contractABI = compiledContracts[fileName][selectedContract].abi
        console.log(`Found contract ${selectedContract} in file ${fileName}`)
        break
      }
    }

    if (!contractABI) {
      console.warn(`Could not find ABI for contract ${selectedContract}`)
      setConstructorParams([])
      return
    }

    console.log(`Contract ABI for ${selectedContract}:`, contractABI)

    // ABI에서 생성자 찾기
    const constructor = contractABI.find((item: any) => item.type === "constructor")
    console.log("Constructor found:", constructor)

    if (constructor && constructor.inputs && constructor.inputs.length > 0) {
      console.log("Constructor inputs:", constructor.inputs)

      // 생성자 매개변수 초기화
      const params = constructor.inputs.map((input: any) => ({
        name: input.name || input.type,
        type: input.type,
        value: "",
      }))
      console.log("Prepared constructor params:", params)
      setConstructorParams(params)
    } else {
      console.log("No constructor inputs found or constructor has no parameters")
      setConstructorParams([])
    }
  }, [selectedContract, compiledContracts])

  // 생성자 매개변수 값 변경 처리
  const handleParamChange = (index: number, value: string) => {
    const updatedParams = [...constructorParams]
    updatedParams[index].value = value
    setConstructorParams(updatedParams)
  }

  // 주소 형식 검증 함수
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // 정수 타입 검증
  const isValidInteger = (value: string): boolean => {
    return /^-?\d+$/.test(value)
  }

  // 부호 없는 정수 타입 검증
  const isValidUnsignedInteger = (value: string): boolean => {
    return /^\d+$/.test(value)
  }

  // 바이트 타입 검증
  const isValidBytes = (value: string): boolean => {
    return /^(0x)?[a-fA-F0-9]*$/.test(value)
  }

  // 배열 형식 검증 (JSON 배열 형식)
  const isValidArray = (value: string): boolean => {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
    } catch (e) {
      return false
    }
  }

  // 배포 시 생성자 매개변수 전달
  const handleDeploy = () => {
    console.log("Deploying with constructor params:", constructorParams)

    // 필수 매개변수 검증
    const missingParams = constructorParams.filter((param) => !param.value && param.type !== "bool")
    if (missingParams.length > 0) {
      toast({
        title: "Missing Parameters",
        description: `Please provide values for all constructor parameters`,
        variant: "destructive",
      })
      return
    }

    // 타입별 검증
    for (const param of constructorParams) {
      if (!param.value && param.type !== "bool") continue

      // 주소 타입 검증
      if (param.type === "address" && !isValidAddress(param.value)) {
        toast({
          title: "Invalid Address Format",
          description: `Parameter "${param.name}": Address must be a hex value starting with 0x followed by 40 hex characters`,
          variant: "destructive",
        })
        return
      }

      // uint 타입 검증
      if (param.type.startsWith("uint") && !isValidUnsignedInteger(param.value)) {
        toast({
          title: "Invalid Unsigned Integer",
          description: `Parameter "${param.name}": Value must be a positive integer`,
          variant: "destructive",
        })
        return
      }

      // int 타입 검증
      if (param.type.startsWith("int") && !isValidInteger(param.value)) {
        toast({
          title: "Invalid Integer",
          description: `Parameter "${param.name}": Value must be an integer`,
          variant: "destructive",
        })
        return
      }

      // bytes 타입 검증
      if ((param.type.startsWith("bytes") || param.type === "bytes") && !isValidBytes(param.value)) {
        toast({
          title: "Invalid Bytes Format",
          description: `Parameter "${param.name}": Value must be a hex string, optionally starting with 0x`,
          variant: "destructive",
        })
        return
      }

      // 배열 타입 검증
      if (param.type.includes("[]") && !isValidArray(param.value)) {
        toast({
          title: "Invalid Array Format",
          description: `Parameter "${param.name}": Value must be a valid JSON array`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      // 매개변수 값을 적절한 타입으로 변환
      const args = constructorParams.map((param) => {
        // 값이 비어있는 경우 기본값 처리
        if (!param.value) {
          if (param.type === "bool") return false
          if (param.type.startsWith("uint") || param.type.startsWith("int")) return BigInt(0)
          if (param.type === "address") return "0x0000000000000000000000000000000000000000" as `0x${string}`
          if (param.type.startsWith("bytes") || param.type === "bytes") return "0x"
          if (param.type.includes("[]")) return []
          return ""
        }

        // 타입별 변환 로직
        if (param.type.startsWith("uint") || param.type.startsWith("int")) {
          // 정수 타입 처리
          return BigInt(param.value)
        } else if (param.type === "bool") {
          // 불리언 타입 처리
          return param.value.toLowerCase() === "true"
        } else if (param.type === "address") {
          // 주소 타입 처리
          return param.value as `0x${string}`
        } else if (param.type.startsWith("bytes") || param.type === "bytes") {
          // 바이트 타입 처리
          return param.value.startsWith("0x") ? param.value : `0x${param.value}`
        } else if (param.type.includes("[]")) {
          // 배열 타입 처리
          try {
            const arrayValues = JSON.parse(param.value)

            // 배열 요소의 타입에 따라 변환
            const baseType = param.type.replace("[]", "")

            return arrayValues.map((item: any) => {
              if (baseType.startsWith("uint") || baseType.startsWith("int")) {
                return BigInt(item)
              } else if (baseType === "bool") {
                return Boolean(item)
              } else if (baseType === "address") {
                return item as `0x${string}`
              } else if (baseType.startsWith("bytes")) {
                return item.startsWith("0x") ? item : `0x${item}`
              } else {
                return item
              }
            })
          } catch (e) {
            console.error("Error parsing array:", e)
            throw new Error(`Invalid array format for parameter ${param.name}`)
          }
        } else {
          // 문자열 및 기타 타입
          return param.value
        }
      })

      console.log("Converted constructor args:", args)
      onDeploy(args)
    } catch (error) {
      console.error("Parameter conversion error:", error)
      toast({
        title: "Parameter Error",
        description: error instanceof Error ? error.message : "Error processing constructor parameters",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">Deploy Contract</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Contract</label>
            <div className="flex items-center space-x-2">
              <select
                className="flex-1 bg-gray-800 border border-gray-700 rounded-md p-2"
                value={selectedContract}
                onChange={(e) => onSelectContract(e.target.value)}
              >
                {Object.keys(compiledContracts).flatMap((fileName) =>
                  Object.keys(compiledContracts[fileName]).map((contract) => (
                    <option key={`${fileName}-${contract}`} value={contract}>
                      {contract}
                    </option>
                  )),
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Constructor Arguments</label>
            {constructorParams.length > 0 ? (
              <div className="space-y-2">
                {constructorParams.map((param, index) => (
                  <div key={index} className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">
                      {param.name} ({param.type})
                      {param.type === "address" && <span className="text-xs text-gray-400 ml-1">(e.g. 0x1234...)</span>}
                      {param.type.startsWith("uint") && <span className="text-xs text-gray-400 ml-1">(e.g. 123)</span>}
                      {param.type.startsWith("int") && (
                        <span className="text-xs text-gray-400 ml-1">(e.g. -123 or 123)</span>
                      )}
                      {param.type === "bool" && <span className="text-xs text-gray-400 ml-1">(true or false)</span>}
                      {(param.type.startsWith("bytes") || param.type === "bytes") && (
                        <span className="text-xs text-gray-400 ml-1">(e.g. 0xabcd...)</span>
                      )}
                      {param.type.includes("[]") && (
                        <span className="text-xs text-gray-400 ml-1">(e.g. [1,2,3] as JSON array)</span>
                      )}
                    </label>
                    <Input
                      type="text"
                      placeholder={getPlaceholderForType(param.type)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-2"
                      value={param.value}
                      onChange={(e) => handleParamChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 mb-2">No constructor arguments required</div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Gas Limit (optional)</label>
            <input
              type="text"
              placeholder="Auto"
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2"
              value={gasLimit}
              onChange={(e) => onGasLimitChange(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Gas Price (optional)</label>
            <input
              type="text"
              placeholder="Auto"
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2"
              value={gasPrice}
              onChange={(e) => onGasPriceChange(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Value</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="0"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-md p-2"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
              />
              <select
                className="bg-gray-800 border border-gray-700 rounded-md p-2"
                value={valueUnit}
                onChange={(e) => onValueUnitChange(e.target.value)}
              >
                <option>ETH</option>
                <option>Gwei</option>
                <option>Wei</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeploying}
              className="text-white bg-gray-800 border-gray-700"
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium"
              onClick={handleDeploy}
              disabled={isDeploying}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                "Confirm Deploy"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 타입별 플레이스홀더 함수 추가
function getPlaceholderForType(type: string): string {
  if (type === "address") return "0x0000000000000000000000000000000000000000"
  if (type.startsWith("uint")) return "0"
  if (type.startsWith("int")) return "0"
  if (type === "bool") return "true or false"
  if (type.startsWith("bytes") || type === "bytes") return "0x"
  if (type.includes("[]")) return "[...]"
  if (type === "string") return "text"
  return `Enter ${type}`
}
