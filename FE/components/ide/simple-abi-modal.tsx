"use client"

import { useState, useEffect } from "react"
import { Copy, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SimpleABIModalProps {
  isOpen: boolean
  onClose: () => void
  contractName: string
  abi: any
  bytecode: string
  onCopy: (text: string, label: string) => void
}

export function SimpleABIModal({ isOpen, onClose, contractName, abi, bytecode, onCopy }: SimpleABIModalProps) {
  const [formattedABI, setFormattedABI] = useState<string>("")
  const [formattedBytecode, setFormattedBytecode] = useState<string>("")
  const [abiItems, setAbiItems] = useState<any[]>([])
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    console.log("SimpleABIModal props:", { contractName, isOpen })
    console.log("ABI data type:", typeof abi)
    console.log("ABI data:", abi)
    console.log("Bytecode data:", bytecode?.substring(0, 50) + "...")

    if (abi) {
      try {
        // Convert ABI to string if it's already an object
        const abiString = typeof abi === "string" ? abi : JSON.stringify(abi, null, 2)
        setFormattedABI(abiString)

        // Classify ABI items
        const items = typeof abi === "string" ? JSON.parse(abi) : abi
        setAbiItems(Array.isArray(items) ? items : [])

        console.log("ABI loaded successfully:", items.length, "items")
      } catch (error: any) {
        console.error("Error formatting ABI:", error)
        setFormattedABI("Error formatting ABI: " + error.message)
        setAbiItems([])
      }
    } else {
      console.warn("ABI is undefined or null")
      setFormattedABI("No ABI available")
      setAbiItems([])
    }

    if (bytecode) {
      try {
        // Show only part of the bytecode if it's too long
        const totalLength = bytecode.length
        const formattedCode =
          totalLength > 1000
            ? `${bytecode.substring(0, 500)}...
[${totalLength - 500} more bytes (total length: ${totalLength})]`
            : bytecode
        setFormattedBytecode(formattedCode)

        console.log("Bytecode loaded successfully, length:", totalLength)
      } catch (error: any) {
        console.error("Error formatting bytecode:", error)
        setFormattedBytecode("Error formatting bytecode: " + error.message)
      }
    } else {
      console.warn("Bytecode is undefined or null")
      setFormattedBytecode("No bytecode available")
    }

    // Reset copied states when modal opens/closes or contract changes
    setCopiedItems({})
  }, [abi, bytecode, contractName, isOpen])

  const handleCopy = (text: string, label: string) => {
    onCopy(text, label)
    setCopiedItems((prev) => ({ ...prev, [label]: true }))

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopiedItems((prev) => ({ ...prev, [label]: false }))
    }, 2000)
  }

  if (!isOpen) return null

  // Classify ABI items
  const functions = abiItems.filter((item) => item.type === "function")
  const events = abiItems.filter((item) => item.type === "event")
  const constructor = abiItems.find((item) => item.type === "constructor")

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-800 p-4">
          <h2 className="text-lg font-medium text-white">Contract: {contractName}</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-300 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <Tabs defaultValue="abi" className="h-full flex flex-col">
            <TabsList className="bg-gray-800 w-full">
              <TabsTrigger value="abi" className="flex-1 text-white data-[state=active]:bg-purple-600">
                ABI
              </TabsTrigger>
              <TabsTrigger value="functions" className="flex-1 text-white data-[state=active]:bg-purple-600">
                Functions ({functions.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="flex-1 text-white data-[state=active]:bg-purple-600">
                Events ({events.length})
              </TabsTrigger>
              <TabsTrigger value="bytecode" className="flex-1 text-white data-[state=active]:bg-purple-600">
                Bytecode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="abi" className="mt-4 flex-1 overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Application Binary Interface (ABI)</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-white border-gray-600 hover:bg-gray-700 bg-gray-800 transition-all duration-200"
                  onClick={() => handleCopy(formattedABI, "ABI")}
                >
                  {copiedItems["ABI"] ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" /> Copy ABI
                    </>
                  )}
                </Button>
              </div>
              <div className="border border-gray-700 rounded-md bg-gray-800 p-4 overflow-auto max-h-[50vh]">
                <pre className="text-xs text-gray-300">
                  <code>{formattedABI}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="functions" className="mt-4 flex-1 overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Contract Functions</span>
              </div>
              <div className="border border-gray-700 rounded-md bg-gray-800 p-4 overflow-auto max-h-[50vh]">
                {constructor && (
                  <div className="mb-4 pb-4 border-b border-gray-700">
                    <h3 className="text-sm font-medium text-purple-400 mb-2">Constructor</h3>
                    <div className="text-xs text-gray-300">
                      <div className="mb-1">
                        <span className="text-gray-400">Inputs: </span>
                        {constructor.inputs && constructor.inputs.length > 0 ? (
                          <span>
                            {constructor.inputs.map((input: any) => `${input.type} ${input.name || ""}`).join(", ")}
                          </span>
                        ) : (
                          <span>None</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400">Payable: </span>
                        <span>{constructor.stateMutability === "payable" ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {functions.length > 0 ? (
                  <div className="space-y-3">
                    {functions.map((func, index) => (
                      <div key={index} className="pb-3 border-b border-gray-700 last:border-0">
                        <h3 className="text-sm font-medium text-green-400 mb-1">{func.name}</h3>
                        <div className="text-xs text-gray-300">
                          <div className="mb-1">
                            <span className="text-gray-400">Inputs: </span>
                            {func.inputs && func.inputs.length > 0 ? (
                              <span>
                                {func.inputs.map((input: any) => `${input.type} ${input.name || ""}`).join(", ")}
                              </span>
                            ) : (
                              <span>None</span>
                            )}
                          </div>
                          <div className="mb-1">
                            <span className="text-gray-400">Outputs: </span>
                            {func.outputs && func.outputs.length > 0 ? (
                              <span>
                                {func.outputs.map((output: any) => `${output.type} ${output.name || ""}`).join(", ")}
                              </span>
                            ) : (
                              <span>None</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-400">State Mutability: </span>
                            <span
                              className={
                                func.stateMutability === "view" || func.stateMutability === "pure"
                                  ? "text-blue-400"
                                  : func.stateMutability === "payable"
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                              }
                            >
                              {func.stateMutability}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No functions found in this contract.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="events" className="mt-4 flex-1 overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Contract Events</span>
              </div>
              <div className="border border-gray-700 rounded-md bg-gray-800 p-4 overflow-auto max-h-[50vh]">
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((event, index) => (
                      <div key={index} className="pb-3 border-b border-gray-700 last:border-0">
                        <h3 className="text-sm font-medium text-yellow-400 mb-1">{event.name}</h3>
                        <div className="text-xs text-gray-300">
                          <div className="mb-1">
                            <span className="text-gray-400">Parameters: </span>
                            {event.inputs && event.inputs.length > 0 ? (
                              <span>
                                {event.inputs
                                  .map(
                                    (input: any) =>
                                      `${input.type} ${input.name || ""}${input.indexed ? " (indexed)" : ""}`,
                                  )
                                  .join(", ")}
                              </span>
                            ) : (
                              <span>None</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-400">Anonymous: </span>
                            <span>{event.anonymous ? "Yes" : "No"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No events found in this contract.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bytecode" className="mt-4 flex-1 overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Contract Bytecode</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-white border-gray-600 hover:bg-gray-700 bg-gray-800 transition-all duration-200"
                  onClick={() => handleCopy(bytecode, "Bytecode")}
                >
                  {copiedItems["Bytecode"] ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" /> Copy Bytecode
                    </>
                  )}
                </Button>
              </div>
              <div className="border border-gray-700 rounded-md bg-gray-800 p-4 overflow-auto max-h-[50vh]">
                <pre className="text-xs break-all text-gray-300">
                  <code>{formattedBytecode}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 flex justify-end border-t border-gray-800">
          <Button
            variant="outline"
            className="text-white bg-gray-800 border-gray-700 hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
