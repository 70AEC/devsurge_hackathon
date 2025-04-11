"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

interface WalletConnectionResult {
  address: string
  chainId: number
}

export function useWalletConnector() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [deploymentNetwork, setDeploymentNetwork] = useState<string>("unknown")

  const checkWalletConnection = useCallback(async (): Promise<WalletConnectionResult | null> => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })

        if (accounts.length > 0) {
          const ethersProvider = new ethers.BrowserProvider(window.ethereum)
          const ethersSigner = await ethersProvider.getSigner()
          const address = await ethersSigner.getAddress()
          const network = await ethersProvider.getNetwork()
          const chainId = Number(network.chainId)

          setProvider(ethersProvider)
          setSigner(ethersSigner)
          setAccount(address)
          setChainId(chainId)
          setWalletConnected(true)
          setDeploymentNetwork(getNetworkName(chainId))

          return { address, chainId }
        }
      } catch (error) {
        console.error("지갑 연결 확인 오류:", error)
      }
    }
    return null
  }, [])

  const connectWallet = useCallback(async (): Promise<WalletConnectionResult | null> => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

        if (accounts.length > 0) {
          const ethersProvider = new ethers.BrowserProvider(window.ethereum)
          const ethersSigner = await ethersProvider.getSigner()
          const address = await ethersSigner.getAddress()
          const network = await ethersProvider.getNetwork()
          const chainId = Number(network.chainId)

          setProvider(ethersProvider)
          setSigner(ethersSigner)
          setAccount(address)
          setChainId(chainId)
          setWalletConnected(true)
          setDeploymentNetwork(getNetworkName(chainId))

          return { address, chainId }
        }
      } catch (error) {
        console.error("지갑 연결 오류:", error)
      }
    } else {
      alert("메타마스크를 설치해주세요!")
    }
    return null
  }, [])

  // 네트워크 이름 가져오기
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
      case 1337:
      case 31337:
        return "Local Network"
      default:
        return `Chain ID: ${chainId}`
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      checkWalletConnection()

      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          try {
            const ethersProvider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider)
            const ethersSigner = await ethersProvider.getSigner()
            const address = await ethersSigner.getAddress()

            setProvider(ethersProvider)
            setSigner(ethersSigner)
            setAccount(address)
            setWalletConnected(true)
          } catch (error) {
            console.error("계정 변경 처리 오류:", error)
            setAccount(null)
            setWalletConnected(false)
          }
        } else {
          setAccount(null)
          setWalletConnected(false)
        }
      }

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = Number.parseInt(chainIdHex, 16)
        setChainId(newChainId)
        setDeploymentNetwork(getNetworkName(newChainId))
        checkWalletConnection()
      }

      const handleDisconnect = () => {
        setAccount(null)
        setWalletConnected(false)
        setSigner(null)
        setProvider(null)
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("disconnect", handleDisconnect)

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
          window.ethereum.removeListener("chainChanged", handleChainChanged)
          window.ethereum.removeListener("disconnect", handleDisconnect)
        }
      }
    }
  }, [checkWalletConnection])

  return {
    walletConnected,
    account,
    provider,
    signer,
    chainId,
    deploymentNetwork,
    connectWallet,
    checkWalletConnection,
  }
}
