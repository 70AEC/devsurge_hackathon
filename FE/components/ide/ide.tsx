"use client"

import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi"

// Import hooks
import { useFileManager } from "@/hooks/use-file-manager"
import { useSolidityCompiler } from "@/hooks/use-solidity-compiler"
import { useWallet } from "@/hooks/use-wallet"
import { useContractDeployer } from "@/hooks/use-contract-deployer"
import { useClipboard } from "@/hooks/use-clipboard"

// Import components
import { FileExplorer } from "./file-explorer"
import { DeploymentPanel } from "./deployment-panel"
import { DeployedContracts } from "./deployed-contracts"
import { CodeEditor } from "./code-editor"
import { DeployModal } from "./deploy-modal"
import { ContractDetailsModal } from "./contract-details-modal"
import { SimpleABIModal } from "./simple-abi-modal"
import { ServerStatusIndicator } from "./server-status-indicator"

interface RemixIDEProps {
  initialCode: string
  generatedFiles?: Record<string, string>
}

interface SimpleABIData {
  contractName: string
  abi: any
  bytecode: string
}

export function IDE({ initialCode, generatedFiles = {} }: RemixIDEProps) {
  // Use custom hooks
  const fileManager = useFileManager(initialCode)
  const compiler = useSolidityCompiler(initialCode)
  const wallet = useWallet()
  const deployer = useContractDeployer()
  const { copyToClipboard } = useClipboard()

  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Deployed contract details modal
  const [showABIModal, setShowABIModal] = useState(false)
  const [selectedDeployedContract, setSelectedDeployedContract] = useState<{
    name: string
    address: string
    network: string
    abi: any
    bytecode: string
    txHash: string
  } | null>(null)

  // New simple ABI modal state
  const [showSimpleABIModal, setShowSimpleABIModal] = useState(false)
  const [simpleABIData, setSimpleABIData] = useState<SimpleABIData | null>(null)

  // 생성된 파일이 있으면 파일 매니저에 추가하는 부분 수정
  useEffect(() => {
    if (generatedFiles && Object.keys(generatedFiles).length > 0) {
      // 각 생성된 파일을 파일 매니저에 추가
      Object.entries(generatedFiles).forEach(([fileName, content]) => {
        // 파일이 이미 존재하는지 확인
        if (!fileManager.files[fileName]) {
          fileManager.createFile(fileName)
          // 파일 생성 후 내용 업데이트
          setTimeout(() => {
            fileManager.updateFileContent(fileName, content)
          }, 0)
        }
      })

      // 첫 번째 파일을 활성화
      const firstFileName = Object.keys(generatedFiles)[0]
      if (firstFileName) {
        fileManager.selectFile(firstFileName)
      }

      toast({
        title: "파일 로드 완료",
        description: `${Object.keys(generatedFiles).length}개의 파일이 로드되었습니다.`,
      })
    }
  }, [generatedFiles, fileManager])

  // Compile handler
  const handleCompile = () => {
    // 현재 선택된 파일의 내용과 파일명을 컴파일러에 전달
    compiler.compile(fileManager.files[fileManager.activeFile], fileManager.activeFile).then((success) => {
      if (success && compiler.compiledContracts) {
        // Save compilation result
        localStorage.setItem(
          "last-compilation",
          JSON.stringify({
            contracts: compiler.compiledContracts,
            selectedContract: compiler.selectedContract,
          }),
        )
      }
    })
  }

  // Deploy handler
  const handleDeploy = async (constructorArgs: any[] = []) => {
    try {
      // Check compilation before deployment
      if (Object.keys(compiler.compiledContracts).length === 0) {
        toast({
          title: "Compilation Required",
          description: "You need to compile the contract before deploying.",
          variant: "destructive",
        })
        return
      }

      // Execute deployment using Wagmi
      const success = await deployer.deployContract(
        walletClient,
        publicClient,
        compiler.selectedContract,
        compiler.compiledContracts,
        wallet.deploymentNetwork,
        constructorArgs, // 생성자 인자 전달
      )

      // Show ABI modal automatically on successful deployment
      if (success && deployer.deploymentSuccess) {
        handleShowSimpleABIModal(compiler.selectedContract)
      }
    } catch (error) {
      console.error("Deployment error:", error)
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  // File save handler
  const handleSaveFile = () => {
    fileManager.saveFile(fileManager.activeFile)
  }

  // Wallet connection handler
  const handleConnectWallet = async () => {
    const result = await wallet.connectWallet()
    if (result) {
      // Load previously deployed contracts on successful wallet connection
      deployer.loadDeployedContracts(result.address, result.chainId)
    }
  }

  // Simple ABI modal display handler
  const handleShowSimpleABIModal = (contractName: string) => {
    // Find ABI and bytecode for the selected contract
    let contractABI = null
    let contractBytecode = null

    // Find ABI and bytecode in compiled contract data
    for (const fileName in compiler.compiledContracts) {
      if (compiler.compiledContracts[fileName][contractName]) {
        contractABI = compiler.compiledContracts[fileName][contractName].abi
        contractBytecode = compiler.compiledContracts[fileName][contractName].evm?.bytecode?.object || ""
        break
      }
    }

    // Set ABI data and show modal
    setSimpleABIData({
      contractName,
      abi: contractABI,
      bytecode: contractBytecode,
    })
    setShowSimpleABIModal(true)
  }

  // Custom Solidity Compiler component
  const SolidityCompiler = () => (
    <AccordionItem value="compiler" className="border-b border-gray-800">
      <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:bg-gray-800 hover:no-underline">
        SOLIDITY COMPILER
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-3 px-4">
        <div className="space-y-3">
          <ServerStatusIndicator
            onCheckStatus={compiler.checkServerStatus}
            isServerConnected={compiler.isServerConnected}
          />

          {/* 파일 선택 드롭다운 추가 */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 block mb-1">Source File</label>
          </div>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm p-1.5 text-white"
            value={fileManager.activeFile}
            onChange={(e) => fileManager.selectFile(e.target.value)}
          >
            {Object.keys(fileManager.files).map((fileName) => (
              <option key={fileName} value={fileName}>
                {fileName}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 block mb-1">Compiler Version</label>
          </div>

          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm p-1.5 text-white"
            value={compiler.compilerVersion}
            onChange={(e) => {
              console.log(`Changed compiler version to: ${e.target.value}`)
              compiler.setCompilerVersion(e.target.value)
            }}
            disabled={compiler.isCompiling}
          >
            {compiler.availableVersions.map((version) => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </select>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="optimization"
              className="mr-2"
              checked={compiler.optimizationEnabled}
              onChange={() => compiler.setOptimizationEnabled(!compiler.optimizationEnabled)}
              disabled={compiler.isCompiling}
            />
            <label htmlFor="optimization" className="text-white text-sm">
              Enable optimization
            </label>
          </div>

          <button
            className={`w-full py-2 px-4 rounded ${
              compiler.compilationSuccess === true
                ? "bg-green-600 hover:bg-green-700"
                : compiler.compilationSuccess === false
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            } text-white font-medium transition-colors duration-300`}
            onClick={handleCompile}
            disabled={compiler.isCompiling || compiler.isServerConnected === false}
          >
            {compiler.isCompiling ? "Compiling..." : "Compile"}
          </button>

          {compiler.compilationOutput && (
            <div
              className={`mt-2 p-2 text-xs rounded-md ${
                compiler.compilationSuccess ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
              }`}
            >
              <pre className="whitespace-pre-wrap">{compiler.compilationOutput}</pre>
            </div>
          )}

          {Object.keys(compiler.compiledContracts).length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 block">Compiled contracts</label>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md text-sm p-1.5 text-white"
                  value={compiler.selectedContract}
                  onChange={(e) => compiler.setSelectedContract(e.target.value)}
                >
                  {Object.keys(compiler.compiledContracts).flatMap((file) =>
                    Object.keys(compiler.compiledContracts[file]).map((contract) => (
                      <option key={`${file}-${contract}`} value={contract}>
                        {contract}
                      </option>
                    )),
                  )}
                </select>

                <button
                  className="h-8 px-3 text-white border border-gray-600 hover:bg-gray-700 bg-gray-800 rounded text-sm"
                  onClick={() => handleShowSimpleABIModal(compiler.selectedContract)}
                  disabled={!compiler.selectedContract}
                >
                  ABI
                </button>
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )

  return (
    <div className="flex h-full">
      {/* Left sidebar with file explorer and tools */}
      <div className="w-64 border-r border-gray-800 flex flex-col overflow-hidden">
        <Accordion type="single" collapsible defaultValue="files">
          <FileExplorer
            files={fileManager.files}
            activeFile={fileManager.activeFile}
            onFileSelect={fileManager.selectFile}
            onCreateFile={fileManager.createFile}
            onDeleteFile={fileManager.deleteFile}
            onSaveFile={fileManager.saveFile}
          />

          <SolidityCompiler />

          <DeploymentPanel
            walletConnected={isConnected}
            account={address}
            deploymentNetwork={wallet.deploymentNetwork}
            compiledContracts={compiler.compiledContracts}
            selectedContract={compiler.selectedContract}
            isDeploying={deployer.isDeploying}
            deploymentSuccess={deployer.deploymentSuccess}
            deploymentOutput={deployer.deploymentOutput}
            onConnectWallet={handleConnectWallet}
            onSelectContract={compiler.setSelectedContract}
            onShowDeployModal={() => deployer.setShowDeployModal(true)}
          />

          <DeployedContracts
            contracts={deployer.deployedContracts}
            onViewABI={(contract) => {
              setSelectedDeployedContract(contract)
              setShowABIModal(true)
            }}
            onCopyAddress={copyToClipboard}
          />
        </Accordion>
      </div>

      {/* Code editor */}
      <CodeEditor
        activeFile={fileManager.activeFile}
        code={fileManager.files[fileManager.activeFile]}
        onChange={(code) => fileManager.updateFileContent(fileManager.activeFile, code)}
        onCompile={handleCompile}
        isCompiling={compiler.isCompiling}
        onSaveFile={handleSaveFile}
        isSaving={fileManager.isSaving}
      />

      {/* Deploy Modal */}
      <DeployModal
        isOpen={deployer.showDeployModal}
        isDeploying={deployer.isDeploying}
        selectedContract={compiler.selectedContract}
        compiledContracts={compiler.compiledContracts}
        gasLimit={deployer.gasLimit}
        gasPrice={deployer.gasPrice}
        value={deployer.value}
        valueUnit={deployer.valueUnit}
        onClose={() => deployer.setShowDeployModal(false)}
        onDeploy={handleDeploy}
        onSelectContract={compiler.setSelectedContract}
        onGasLimitChange={deployer.setGasLimit}
        onGasPriceChange={deployer.setGasPrice}
        onValueChange={deployer.setValue}
        onValueUnitChange={deployer.setValueUnit}
      />

      {/* Contract Details Modal */}
      <ContractDetailsModal
        isOpen={showABIModal}
        contract={selectedDeployedContract}
        onClose={() => setShowABIModal(false)}
        onCopy={copyToClipboard}
        onUseInFrontend={() => {}}
      />

      {/* Simple ABI Modal */}
      {simpleABIData && (
        <SimpleABIModal
          isOpen={showSimpleABIModal}
          onClose={() => setShowSimpleABIModal(false)}
          contractName={simpleABIData.contractName}
          abi={simpleABIData.abi}
          bytecode={simpleABIData.bytecode}
          onCopy={copyToClipboard}
        />
      )}
    </div>
  )
}
