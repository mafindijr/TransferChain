import { describe, it, expect } from "vitest";
import { Wallet } from "ethers";
import { ContractRegistry } from "../../../src/core/contract-registry.js";
import { ProviderManager } from "../../../src/core/provider-manager.js";
import { SignerManager } from "../../../src/core/signer-manager.js";
import { ValidationError } from "../../../src/errors/validation-error.js";
import { silentLogger } from "../../../src/logger/silent-logger.js";
import { BUILTIN_MANIFEST } from "../../../src/constants/manifest.js";
import type { SdkConfig } from "../../../src/types/config.js";

function createRegistry(signer?: unknown): ContractRegistry {
  const config: SdkConfig = {
    chainId: 8888,
    rpcUrl: "https://evm.testnet.injective.network",
    signer: signer as import("ethers").Signer | undefined,
  };
  const pm = new ProviderManager(config, silentLogger);
  const sm = new SignerManager(config, pm, silentLogger);

  return new ContractRegistry(
    8888,
    BUILTIN_MANIFEST,
    pm,
    sm,
    silentLogger,
  );
}

// Minimal ABI for testing — just enough for ethers.Contract to accept
const testAbi = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
];

describe("ContractRegistry", () => {
  describe("getAddress", () => {
    it("should resolve address from built-in manifest", () => {
      const registry = createRegistry();
      const address = registry.getAddress("playerRegistry");
      expect(address).toBe(BUILTIN_MANIFEST[8888].playerRegistry);
    });

    it("should resolve all 8 contract addresses", () => {
      const registry = createRegistry();
      const contracts = [
        "transferChainAccessControl",
        "transferChainConfig",
        "playerRegistry",
        "clubRegistry",
        "transferMarketplace",
        "transferAgreementManager",
        "escrow",
        "treasury",
      ] as const;

      for (const name of contracts) {
        const address = registry.getAddress(name);
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });
  });

  describe("getReadContract", () => {
    it("should return a contract instance", () => {
      const registry = createRegistry();
      const contract = registry.getReadContract("playerRegistry", testAbi);
      expect(contract).toBeDefined();
      expect(typeof contract.getAddress).toBe("function");
    });

    it("should cache the same contract instance", () => {
      const registry = createRegistry();
      const first = registry.getReadContract("playerRegistry", testAbi);
      const second = registry.getReadContract("playerRegistry", testAbi);
      expect(first).toBe(second);
    });

    it("should return different instances for different contracts", () => {
      const registry = createRegistry();
      const player = registry.getReadContract("playerRegistry", testAbi);
      const club = registry.getReadContract("clubRegistry", testAbi);
      expect(player).not.toBe(club);
    });
  });

  describe("getWriteContract", () => {
    it("should throw SIGNER_REQUIRED when no signer is available", () => {
      const registry = createRegistry();
      expect(() =>
        registry.getWriteContract("playerRegistry", testAbi),
      ).toThrow(ValidationError);

      try {
        registry.getWriteContract("playerRegistry", testAbi);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe("SIGNER_REQUIRED");
      }
    });

    it("should return a contract when signer is available", () => {
      const wallet = Wallet.createRandom();
      const registry = createRegistry(wallet);

      const contract = registry.getWriteContract("playerRegistry", testAbi);
      expect(contract).toBeDefined();
    });

    it("should cache write contract instances", () => {
      const wallet = Wallet.createRandom();
      const registry = createRegistry(wallet);

      const first = registry.getWriteContract("playerRegistry", testAbi);
      const second = registry.getWriteContract("playerRegistry", testAbi);
      expect(first).toBe(second);
    });
  });
});
