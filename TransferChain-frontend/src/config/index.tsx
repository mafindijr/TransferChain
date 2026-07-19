import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from '@reown/appkit/networks'

export const injectiveSepolia = defineChain({
  id: 1439,
  caipNetworkId: 'eip155:1439',
  chainNamespace: 'eip155',
  name: 'Injective EVM Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Injective',
    symbol: 'INJ',
  },
  rpcUrls: {
    default: {
      http: ['https://k8s.testnet.json-rpc.injective.network'],
    },
  },
  blockExplorers: {
    default: { name: 'Injective EVM Testnet Explorer', url: 'https://testnet.blockscout.injective.network' },
  },
})

// Get projectId from https://dashboard.reown.com
export const projectId = 'b2ed0618c2957378a2b5809677587e8d';
if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [injectiveSepolia]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig