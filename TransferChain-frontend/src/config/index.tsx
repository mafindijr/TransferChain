import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { injectiveSepolia } from '@reown/appkit/networks'

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