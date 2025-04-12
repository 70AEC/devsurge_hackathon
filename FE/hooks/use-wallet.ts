'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { toast } from '@/components/ui/use-toast'

export interface WalletState {
  walletConnected: boolean
  account: string | undefined
  chainId: number | undefined
  connectWallet: () => void
  disconnectWallet: () => void
  deploymentNetwork: string
}

export function useWalletConnector(): WalletState {
  const { address, isConnected, chain } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const [deploymentNetwork, setDeploymentNetwork] = useState('')

  const connectWallet = () => {
    connect({ connector: injected() }) // ✅ 인자 넣어주기
  }

  const disconnectWallet = () => {
    disconnect()
    toast({
      title: 'Disconnected',
      description: '지갑 연결이 해제되었습니다.',
    })
  }

  useEffect(() => {
    if (isConnected && address && chain) {
      if (chain.id !== 1315) {
        toast({
          title: '⚠️ 잘못된 네트워크',
          description: 'Aeneid Testnet(Chain ID 1111)에 연결해주세요.',
          variant: 'destructive',
        })
        return
      }

      setDeploymentNetwork('Aeneid Testnet')

      toast({
        title: 'Wallet Connected',
        description: `Aeneid에 연결됨: ${address.slice(0, 6)}...${address.slice(-4)}`,
      })
    }
  }, [isConnected, address, chain])

  return {
    walletConnected: isConnected,
    account: address,
    chainId: chain?.id,
    deploymentNetwork,
    connectWallet,
    disconnectWallet,
  }
}
