import type { ChainMetadata } from "../types/chain.js";

export const CHAIN_REGISTRY: Record<number, ChainMetadata> = {
  8888: {
    chainId: 8888,
    name: "Injective EVM Testnet",
    nativeCurrency: {
      name: "INJ",
      symbol: "INJ",
      decimals: 18,
    },
    rpcUrls: ["https://evm.testnet.injective.network"],
    blockExplorerUrls: ["https://testnet.explorer.injective.network"],
  },
  525: {
    chainId: 525,
    name: "Injective EVM Mainnet",
    nativeCurrency: {
      name: "INJ",
      symbol: "INJ",
      decimals: 18,
    },
    rpcUrls: ["https://evm.injective.network"],
    blockExplorerUrls: ["https://explorer.injective.network"],
  },
};
