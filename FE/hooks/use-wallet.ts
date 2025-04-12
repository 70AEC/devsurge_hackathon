"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useChainId, useDisconnect, useConnect } from "wagmi"
import { injected } from "wagmi/connectors"
import { toast } from "@/components/ui/use-toast"

export interface WalletConnectionResult {
  address: string
  chainId: number
}

export interface WalletState {
  walletConnected: boolean
  account: string | undefined
  chainId: number | undefined
  connectWallet: () => Promise<WalletConnectionResult | null>
  disconnectWallet: () => void
  deploymentNetwork: string
  checkWalletConnection: () => WalletConnectionResult | null
}

export function useWallet(): WalletState {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { connect } = useConnect()

  const [walletConnected, setWalletConnected] = useState(false)
  const [deploymentNetwork, setDeploymentNetwork] = useState<string>("unknown")

  // Network name helper
  const getNetworkName = (chainId: number): string => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 5:
        return "Goerli Testnet"
      case 11155111:
        return "Sepolia Testnet"
      case 137:
        return "Polygon Mainnet"
      case 80001:
        return "Mumbai Testnet"
      case 56:
        return "BSC Mainnet"
      case 97:
        return "BSC Testnet"
      case 42161:
        return "Arbitrum One"
      case 421613:
        return "Arbitrum Goerli"
      case 10:
        return "Optimism"
      case 420:
        return "Optimism Goerli"
      case 1315:
        return "Aeneid Testnet"
      case 1337:
      case 31337:
        return "Local Network"
      default:
        return `Chain ID: ${chainId}`
    }
  }

  // Check wallet connection status
  const checkWalletConnection = useCallback((): WalletConnectionResult | null => {
    if (isConnected && address && chainId) {
      setWalletConnected(true)
      setDeploymentNetwork(getNetworkName(chainId))
      return { address, chainId }
    }
    return null
  }, [isConnected, address, chainId])

  // Connect wallet
  const connectWallet = useCallback(async (): Promise<WalletConnectionResult | null> => {
    try {
      connect({ connector: injected() })

      if (isConnected && address && chainId) {
        setWalletConnected(true)
        setDeploymentNetwork(getNetworkName(chainId))
        return { address, chainId }
      }
    } catch (error) {
      console.error("지갑 연결 오류:", error)
      toast({
        title: "Wallet Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      })
    }
    return null
  }, [connect, isConnected, address, chainId])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect()
    toast({
      title: "Disconnected",
      description: "지갑 연결이 해제되었습니다.",
    })
  }, [disconnect])

  // Update state when wallet connection changes
  useEffect(() => {
    if (isConnected && address && chainId) {
      setWalletConnected(true)
      setDeploymentNetwork(getNetworkName(chainId))

      // Check if connected to the correct network (Aeneid)
      if (chainId !== 1315) {
        toast({
          title: "⚠️ 잘못된 네트워크",
          description: "Aeneid Testnet(Chain ID 1315)에 연결해주세요.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Wallet Connected",
          description: `Aeneid에 연결됨: ${address.slice(0, 6)}...${address.slice(-4)}`,
        })
      }
    } else {
      setWalletConnected(false)
    }
  }, [isConnected, address, chainId])

  return {
    walletConnected: isConnected,
    account: address,
    chainId,
    deploymentNetwork: getNetworkName(chainId || 0),
    connectWallet,
    disconnectWallet,
    checkWalletConnection,
  }
}
