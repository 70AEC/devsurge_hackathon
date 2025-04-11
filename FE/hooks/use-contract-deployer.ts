"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { toast } from "@/components/ui/use-toast"

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

    // Deploy contract
    const deployContract = useCallback(
        async (
            signer: ethers.JsonRpcSigner | null,
            provider: ethers.BrowserProvider | null,
            contractName: string,
            compiledContracts: Record<string, any>,
            networkName: string,
        ) => {
            if (!signer || !provider || !contractName || !compiledContracts) {
                setDeploymentSuccess(false)
                setDeploymentOutput("Missing information required for deployment.")
                return
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

                setDeploymentOutput("Creating contract factory...")

                // Create a minimal contract factory with just the ABI and bytecode
                const factory = new ethers.ContractFactory(contractABI, bytecodeWithPrefix, signer)

                // Deployment options
                const deployOptions: any = {}

                // Set gas limit
                if (gasLimit) {
                    try {
                        deployOptions.gasLimit = ethers.parseUnits(gasLimit, "wei")
                    } catch (error) {
                        console.warn("Invalid gas limit:", error)
                    }
                }

                // Set gas price
                if (gasPrice) {
                    try {
                        deployOptions.gasPrice = ethers.parseUnits(gasPrice, "gwei")
                    } catch (error) {
                        console.warn("Invalid gas price:", error)
                    }
                }

                // Set value if needed
                if (Number.parseFloat(value) > 0) {
                    try {
                        deployOptions.value = ethers.parseUnits(value, valueUnit.toLowerCase() as any)
                    } catch (error) {
                        console.warn("Invalid value:", error)
                    }
                }

                setDeploymentOutput("Deploying contract to network...")

                // Deploy contract
                const contract = await factory.deploy(deployOptions)
                setDeploymentOutput(
                    `Transaction sent! Waiting for confirmation...Transaction hash: ${contract.deploymentTransaction()?.hash}`,
                )

                // Wait for deployment confirmation
                await contract.waitForDeployment()

                // Get deployed contract address
                const contractAddress = await contract.getAddress()

                // Get transaction hash
                const deployTx = contract.deploymentTransaction()
                const txHash = deployTx ? deployTx.hash : "Unknown"

                // Get transaction receipt
                const receipt = await provider.getTransactionReceipt(txHash)
                const gasUsed = receipt?.gasUsed?.toString() || "Unknown"

                // Get network info
                const network = await provider.getNetwork()
                const chainId = Number(network.chainId)

                // Deployment success
                const deployedContract: DeployedContract = {
                    name: contractName,
                    address: contractAddress,
                    network: networkName,
                    abi: contractABI,
                    bytecode: contractBytecode,
                    txHash: txHash,
                    chainId: chainId,
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
                    Transaction hash: ${txHash}
                    Gas used: ${gasUsed}
                    Block number: ${receipt?.blockNumber || "Pending"}`,
                )

                // Close deployment modal
                setShowDeployModal(false)

                saveDeployedContract(deployedContract)

                toast({
                    title: "Deployment Successful",
                    description: `Contract deployed at ${contractAddress.substring(0, 8)}...`,
                })
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
            } finally {
                setIsDeploying(false)
            }
        },
        [gasLimit, gasPrice, value, valueUnit, saveDeployedContract],
    )

    // Load deployed contracts (when wallet connects)
    const loadDeployedContracts = useCallback((address: string, chainId: number) => {
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
