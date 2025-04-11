"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  onDeploy: () => void
  onSelectContract: (contract: string) => void
  onGasLimitChange: (limit: string) => void
  onGasPriceChange: (price: string) => void
  onValueChange: (value: string) => void
  onValueUnitChange: (unit: string) => void
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
                {Object.keys(compiledContracts).map((contract) => (
                  <option key={contract} value={contract}>
                    {contract}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Constructor Arguments</label>
            <div className="text-xs text-gray-500 mb-2">No constructor arguments required</div>
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
              onClick={onDeploy}
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
