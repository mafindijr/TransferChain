import { describe, it, expect } from "vitest";
import { BUILTIN_MANIFEST } from "../../../src/constants/manifest.js";
import { CHAIN_REGISTRY } from "../../../src/constants/chains.js";

describe("BUILTIN_MANIFEST", () => {
  it("should contain Injective EVM Testnet (8888)", () => {
    const deployment = BUILTIN_MANIFEST[8888];
    expect(deployment).toBeDefined();
  });

  it("should have all 8 contract addresses for chain 8888", () => {
    const deployment = BUILTIN_MANIFEST[8888];
    expect(deployment).toBeDefined();

    const requiredKeys = [
      "transferChainAccessControl",
      "transferChainConfig",
      "playerRegistry",
      "clubRegistry",
      "transferMarketplace",
      "transferAgreementManager",
      "escrow",
      "treasury",
    ] as const;

    for (const key of requiredKeys) {
      expect(deployment[key]).toBeDefined();
      expect(deployment[key]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });
});

describe("CHAIN_REGISTRY", () => {
  it("should contain Injective EVM Testnet (8888)", () => {
    const chain = CHAIN_REGISTRY[8888];
    expect(chain).toBeDefined();
    expect(chain.name).toBe("Injective EVM Testnet");
    expect(chain.chainId).toBe(8888);
  });

  it("should contain Injective EVM Mainnet (525)", () => {
    const chain = CHAIN_REGISTRY[525];
    expect(chain).toBeDefined();
    expect(chain.name).toBe("Injective EVM Mainnet");
    expect(chain.chainId).toBe(525);
  });

  it("should have correct native currency for chain 8888", () => {
    const chain = CHAIN_REGISTRY[8888];
    expect(chain.nativeCurrency).toEqual({
      name: "INJ",
      symbol: "INJ",
      decimals: 18,
    });
  });

  it("should have rpcUrls and blockExplorerUrls", () => {
    for (const chain of Object.values(CHAIN_REGISTRY)) {
      expect(chain.rpcUrls.length).toBeGreaterThan(0);
      expect(chain.blockExplorerUrls.length).toBeGreaterThan(0);
    }
  });
});
