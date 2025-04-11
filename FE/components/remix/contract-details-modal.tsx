"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"

interface ContractDetailsModalProps {
  isOpen: boolean
  contract: {
    name: string
    address: string
    network: string
    abi: any
    bytecode: string
    txHash: string
  } | null
  onClose: () => void
  onCopy: (text: string) => void
  onUseInFrontend: () => void
}

export function ContractDetailsModal({
  isOpen,
  contract,
  onClose,
  onCopy,
  onUseInFrontend,
}: ContractDetailsModalProps) {
  const [formattedABI, setFormattedABI] = useState<string>("")
  const [formattedBytecode, setFormattedBytecode] = useState<string>("")

  useEffect(() => {
    if (contract?.abi) {
      try {
        const abiString = typeof contract.abi === "string" ? contract.abi : JSON.stringify(contract.abi, null, 2)
        setFormattedABI(abiString)
      } catch (error) {
        console.error("Error formatting ABI:", error)
        setFormattedABI("Error formatting ABI")
      }
    }

    if (contract?.bytecode) {
      try {
        const formattedCode =
          contract.bytecode.length > 1000
            ? `${contract.bytecode.substring(0, 500)}...
[${contract.bytecode.length - 500} more bytes]`
            : contract.bytecode
        setFormattedBytecode(formattedCode)
      } catch (error) {
        console.error("Error formatting bytecode:", error)
        setFormattedBytecode("Error formatting bytecode")
      }
    }
  }, [contract])

  if (!isOpen || !contract) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Contract Details</h3>
          <Button
            variant="outline"
            className="text-white bg-gray-800 border-gray-700 hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Contract Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="ml-2">{contract.name}</span>
              </div>
              <div>
                <span className="text-gray-400">Network:</span>
                <span className="ml-2">{contract.network}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400">Address:</span>
                <div className="ml-2 flex-1">
                  <div className="flex items-center">
                    <span className="text-xs break-all mr-2">{contract.address}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => onCopy(contract.address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400">Tx Hash:</span>
                <div className="ml-2 flex-1">
                  <div className="flex items-center">
                    <span className="text-xs break-all mr-2">{contract.txHash}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => onCopy(contract.txHash)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Actions</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-white bg-gray-800 border-gray-700"
                onClick={onUseInFrontend}
              >
                <Copy className="h-4 w-4 mr-2" />
                Use in Frontend
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-white bg-gray-800 border-gray-700"
                onClick={() => onCopy(formattedABI)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy ABI
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-white bg-gray-800 border-gray-700"
                onClick={() => onCopy(contract.bytecode)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Bytecode
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Tabs defaultValue="abi">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="abi">ABI</TabsTrigger>
              <TabsTrigger value="bytecode">Bytecode</TabsTrigger>
            </TabsList>
            <TabsContent value="abi" className="mt-2">
              <div className="border border-gray-800 rounded-md bg-gray-800 p-4 overflow-auto max-h-80">
                <pre className="text-xs">
                  <code>{formattedABI}</code>
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="bytecode" className="mt-2">
              <div className="border border-gray-800 rounded-md bg-gray-800 p-4 overflow-auto max-h-80">
                <pre className="text-xs">
                  <code>{formattedBytecode}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
