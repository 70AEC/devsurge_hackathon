'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { aeneidChain } from '@/lib/story-chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export const config = createConfig({
  chains: [aeneidChain],
  connectors: [injected()],
  transports: {
    [aeneidChain.id]: http(),
  },
})

export function WagmiWrapper({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config} reconnectOnMount>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  )
}
