import type { ChainMetadata } from "../types/chain.js";

export const CHAIN_REGISTRY: Record<number, ChainMetadata> = {
  1439: {
    chainId: 1439,
    name: "Injective Testnet",
    nativeCurrency: {
      name: "INJ",
      symbol: "INJ",
      decimals: 18,
    },
    rpcUrls: ["https://k8s.testnet.json-rpc.injective.network"],
    blockExplorerUrls: ["https://explorer.testnet.injective.network"],
  },
  8888: {
    chainId: 8888,
    name: "Injective EVM Testnet (Legacy)",
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
