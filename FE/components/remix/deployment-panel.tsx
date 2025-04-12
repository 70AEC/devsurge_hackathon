"use client"

import { Loader2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface DeploymentPanelProps {
  walletConnected: boolean
  account: `0x${string}` | undefined // 타입 수정: string | null -> `0x${string}` | undefined
  deploymentNetwork: string
  compiledContracts: Record<string, any>
  selectedContract: string
  isDeploying: boolean
  deploymentSuccess: boolean | null
  deploymentOutput: string | null
  onConnectWallet: () => void
  onSelectContract: (contract: string) => void
  onShowDeployModal: () => void
}

export function DeploymentPanel({
  walletConnected,
  account,
  deploymentNetwork,
  compiledContracts,
  selectedContract,
  isDeploying,
  deploymentSuccess,
  deploymentOutput,
  onConnectWallet,
  onSelectContract,
  onShowDeployModal,
}: DeploymentPanelProps) {
  return (
    <AccordionItem value="deploy" className="border-b border-gray-800">
      <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:bg-gray-800 hover:no-underline">
        DEPLOY & RUN
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-3 px-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Environment</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm p-1.5">
              <option>Injected Provider - MetaMask</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Connected Account</label>
            {!walletConnected ? (
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium"
                onClick={onConnectWallet}
              >
                <Wallet className="h-3 w-3 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-md text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="truncate">{account}</span>
              </div>
            )}
          </div>

          {walletConnected && (
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Network</label>
                <div className="bg-gray-800 border border-gray-700 rounded-md text-sm p-1.5">{deploymentNetwork}</div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Contract</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm p-1.5"
                  value={selectedContract}
                  onChange={(e) => onSelectContract(e.target.value)}
                  disabled={Object.keys(compiledContracts).length === 0}
                >
                  {Object.keys(compiledContracts).length > 0 ? (
                    Object.keys(compiledContracts).map((contract) => (
                      <option key={contract} value={contract}>
                        {contract}
                      </option>
                    ))
                  ) : (
                    <option value="">No compiled contracts</option>
                  )}
                </select>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-medium"
                onClick={onShowDeployModal}
                disabled={Object.keys(compiledContracts).length === 0 || isDeploying || !selectedContract}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>Deploy</>
                )}
              </Button>

              {deploymentOutput && (
                <div
                  className={`mt-2 p-2 text-xs rounded-md ${
                    deploymentSuccess ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                  }`}
                >
                  <pre className="whitespace-pre-wrap">{deploymentOutput}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
