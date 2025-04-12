"use client"

import { useState, useEffect, useCallback } from "react"
import { usePublicClient, useWalletClient, useChainId } from "wagmi"
import { toast } from "@/components/ui/use-toast"
import { parseEther, parseGwei, type WalletClient, type PublicClient } from "viem"

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

export function useContractDeployer() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()

  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentSuccess, setDeploymentSuccess] = useState<boolean | null>(null)
  const [deploymentOutput, setDeploymentOutput] = useState<string | null>(null)
  const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([])

  // Deployment modal state
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [gasLimit, setGasLimit] = useState("3000000")
  const [gasPrice, setGasPrice] = useState("5")
  const [value, setValue] = useState("0")
  const [valueUnit, setValueUnit] = useState("ether")

  // Load deployed contracts from local storage
  useEffect(() => {
    const savedContracts = localStorage.getItem("deployed-contracts")
    if (savedContracts) {
      try {
        setDeployedContracts(JSON.parse(savedContracts))
      } catch (error) {
        console.error("Error loading deployed contracts:", error)
      }
    }
  }, [])

  // Save deployed contract to local storage
  const saveDeployedContract = useCallback((contract: DeployedContract) => {
    try {
      const savedContracts = JSON.parse(localStorage.getItem("deployed-contracts") || "[]") as DeployedContract[]
      savedContracts.push({
        ...contract,
        timestamp: Date.now(),
      })
      localStorage.setItem("deployed-contracts", JSON.stringify(savedContracts))
    } catch (error) {
      console.error("Error saving contract:", error)
    }
  }, [])

  // Deploy contract - 타입 수정
  const deployContract = useCallback(
    async (
      walletClientParam: WalletClient | undefined, // 타입 수정
      publicClientParam: PublicClient | undefined, // 타입 수정
      contractName: string,
      compiledContracts: Record<string, any>,
      networkName: string,
      constructorArgs: any[] = [], // 생성자 인자 추가
    ) => {
      // 로컬 변수 사용 대신 파라미터 사용
      const activeWalletClient = walletClientParam || walletClient
      const activePublicClient = publicClientParam || publicClient

      if (!activeWalletClient || !activePublicClient || !contractName || !compiledContracts) {
        setDeploymentSuccess(false)
        setDeploymentOutput("Missing information required for deployment.")
        return false // 실패 시 false 반환
      }

      setIsDeploying(true)
      setDeploymentSuccess(null)
      setDeploymentOutput("Preparing deployment...")

      try {
        // Find compiled contract
        let contractABI = null
        let contractBytecode = null
        let contractFileName = ""

        for (const fileName in compiledContracts) {
          if (compiledContracts[fileName][contractName]) {
            contractABI = compiledContracts[fileName][contractName].abi
            contractBytecode = compiledContracts[fileName][contractName].evm?.bytecode?.object
            contractFileName = fileName
            break
          }
        }

        if (!contractABI || !contractBytecode) {
          throw new Error(`Could not find ABI or bytecode for contract "${contractName}".`)
        }

        // Ensure bytecode has 0x prefix
        let bytecodeWithPrefix = contractBytecode
        if (!bytecodeWithPrefix.startsWith("0x")) {
          bytecodeWithPrefix = "0x" + bytecodeWithPrefix
        }

        setDeploymentOutput("Creating contract deployment transaction...")

        // Deployment options
        const deployOptions: any = {
          account: activeWalletClient.account,
          args: constructorArgs, // 생성자 인자 전달
        }

        // 로그 추가
        console.log("Deploying contract with options:", {
          contractName,
          constructorArgs,
          account: activeWalletClient.account?.address,
          chainId,
          networkName,
        })

        // Set value if needed
        if (Number.parseFloat(value) > 0) {
          try {
            deployOptions.value =
              valueUnit.toLowerCase() === "ether"
                ? parseEther(value)
                : valueUnit.toLowerCase() === "gwei"
                  ? parseGwei(value)
                  : BigInt(value) // wei
            console.log(`Setting value: ${value} ${valueUnit}`)
          } catch (error) {
            console.warn("Invalid value:", error)
          }
        }

        // Set gas price if specified
        if (gasPrice) {
          try {
            deployOptions.gasPrice = parseGwei(gasPrice)
            console.log(`Setting gas price: ${gasPrice} Gwei`)
          } catch (error) {
            console.warn("Invalid gas price:", error)
          }
        }

        // Set gas limit if specified
        if (gasLimit) {
          try {
            deployOptions.gas = BigInt(gasLimit)
            console.log(`Setting gas limit: ${gasLimit}`)
          } catch (error) {
            console.warn("Invalid gas limit:", error)
          }
        }

        setDeploymentOutput("Deploying contract to network...")
        console.log("Final deployment options:", deployOptions)

        // Deploy contract using Viem
        const hash = await activeWalletClient.deployContract({
          abi: contractABI,
          bytecode: bytecodeWithPrefix as `0x${string}`,
          ...deployOptions,
        })

        setDeploymentOutput(`Transaction sent! Waiting for confirmation...Transaction hash: ${hash}`)

        // Wait for transaction receipt
        const receipt = await activePublicClient.waitForTransactionReceipt({ hash })

        // Get deployed contract address
        const contractAddress = receipt.contractAddress

        if (!contractAddress) {
          throw new Error("Contract address not found in transaction receipt")
        }

        // Deployment success
        const deployedContract: DeployedContract = {
          name: contractName,
          address: contractAddress,
          network: networkName,
          abi: contractABI,
          bytecode: contractBytecode,
          txHash: hash,
          chainId,
        }

        // Add to deployed contracts list
        setDeployedContracts((prevContracts) => {
          const newContracts = [...prevContracts, deployedContract]
          localStorage.setItem("deployed-contracts", JSON.stringify(newContracts))
          return newContracts
        })

        setDeploymentSuccess(true)
        setDeploymentOutput(
          `Contract "${contractName}" successfully deployed.
          Address: ${contractAddress}
          Transaction hash: ${hash}
          Gas used: ${receipt.gasUsed.toString()}
          Block number: ${receipt.blockNumber || "Pending"}`,
        )

        // Close deployment modal
        setShowDeployModal(false)

        saveDeployedContract(deployedContract)

        toast({
          title: "Deployment Successful",
          description: `Contract deployed at ${contractAddress.substring(0, 8)}...`,
        })

        return true // 성공 시 true 반환
      } catch (error: unknown) {
        console.error("Contract deployment error:", error)
        setDeploymentSuccess(false)

        let errorMessage = "Unknown deployment error"
        if (error instanceof Error) {
          errorMessage = error.message
        }

        setDeploymentOutput(`Error during contract deployment: ${errorMessage}`)

        toast({
          title: "Deployment Failed",
          description: errorMessage,
          variant: "destructive",
        })

        return false // 실패 시 false 반환
      } finally {
        setIsDeploying(false)
      }
    },
    [gasLimit, gasPrice, value, valueUnit, saveDeployedContract, walletClient, publicClient, chainId],
  )

  // Load deployed contracts (when wallet connects)
  const loadDeployedContracts = useCallback((address: string | `0x${string}`, chainId: number) => {
    try {
      const savedContracts = localStorage.getItem("deployed-contracts")
      if (savedContracts) {
        const allContracts = JSON.parse(savedContracts) as DeployedContract[]
        const filteredContracts = allContracts.filter((contract) => !contract.chainId || contract.chainId === chainId)
        setDeployedContracts(filteredContracts.length > 0 ? filteredContracts : [])
      } else {
        setDeployedContracts([])
      }
    } catch (error) {
      console.error("Error loading deployed contracts:", error)
    }
  }, [])

  return {
    isDeploying,
    deploymentSuccess,
    deploymentOutput,
    deployedContracts,
    showDeployModal,
    gasLimit,
    gasPrice,
    value,
    valueUnit,
    deployContract,
    loadDeployedContracts,
    setShowDeployModal,
    setGasLimit,
    setGasPrice,
    setValue,
    setValueUnit,
  }
}
