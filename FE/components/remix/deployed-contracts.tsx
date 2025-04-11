"use client"

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Copy, FileCode } from "lucide-react"

interface DeployedContract {
  name: string
  address: string
  network: string
  abi: any
  bytecode: string
  txHash: string
  chainId?: number
  timestamp?: number
}

interface DeployedContractsProps {
  contracts: DeployedContract[]
  onViewABI: (contract: DeployedContract) => void
  onCopyAddress: (text: string) => void
}

export function DeployedContracts({ contracts, onViewABI, onCopyAddress }: DeployedContractsProps) {
  return (
    <AccordionItem value="deployed" className="border-b border-gray-800">
      <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:bg-gray-800 hover:no-underline">
        DEPLOYED CONTRACTS
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-3 px-4">
        {contracts.length === 0 ? (
          <div className="text-xs text-gray-400 py-2">No deployed contracts yet</div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract, index) => (
              <div key={index} className="bg-gray-800 rounded-md p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-purple-400 flex items-center">
                    <FileCode className="h-3 w-3 mr-1" />
                    {contract.name}
                  </div>
                  <div className="text-gray-400 text-[10px]">{contract.network}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="truncate text-gray-300 max-w-[120px]">{contract.address}</div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => onCopyAddress(contract.address)}
                      title="Copy Address"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 py-0 text-[10px] text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => onViewABI(contract)}
                    >
                      View ABI
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
