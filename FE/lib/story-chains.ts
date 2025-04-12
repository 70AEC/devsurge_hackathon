// wagmi, viem 용
import { Chain } from 'viem'

export const aeneidChain: Chain = {
    id: 1513,
    name: 'Aeneid Testnet',
    nativeCurrency: {
      name: 'AENE',
      symbol: 'AENE',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://aeneid.storyrpc.io'] },
    },
    blockExplorers: {
      default: {
        name: 'Story Explorer',
        url: 'https://aeneid.explorer.story.foundation',
      },
    },
    testnet: true,
  }
  

export const storyChains = [aeneidChain]
