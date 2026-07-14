import { describe, it, expect } from "vitest";
import { SignerManager } from "../../../src/core/signer-manager.js";
import { ProviderManager } from "../../../src/core/provider-manager.js";
import { silentLogger } from "../../../src/logger/silent-logger.js";
import type { SdkConfig } from "../../../src/types/config.js";

function makeProviderManager(config: SdkConfig): ProviderManager {
  return new ProviderManager(config, silentLogger);
}

describe("SignerManager", () => {
  it("should operate in read-only mode when no signer or privateKey", () => {
    const config = { chainId: 8888, rpcUrl: "https://evm.testnet.injective.network" };
    const pm = makeProviderManager(config);
    const sm = new SignerManager(config, pm, silentLogger);

    expect(sm.hasSigner()).toBe(false);
    expect(sm.getSigner()).toBeUndefined();
  });

  it("should use a pre-built signer when provided", () => {
    const mockSigner = { _isSigner: true } as unknown as import("ethers").Signer;
    const config = {
      chainId: 8888,
      rpcUrl: "https://evm.testnet.injective.network",
      signer: mockSigner,
    };
    const pm = makeProviderManager(config);
    const sm = new SignerManager(config, pm, silentLogger);

    expect(sm.hasSigner()).toBe(true);
    expect(sm.getSigner()).toBe(mockSigner);
  });

  it("should prefer pre-built signer over privateKey", () => {
    const mockSigner = { _isSigner: true } as unknown as import("ethers").Signer;
    const config = {
      chainId: 8888,
      rpcUrl: "https://evm.testnet.injective.network",
      signer: mockSigner,
      privateKey: "0x0000000000000000000000000000000000000000000000000000000000000001",
    };
    const pm = makeProviderManager(config);
    const sm = new SignerManager(config, pm, silentLogger);

    expect(sm.getSigner()).toBe(mockSigner);
  });

  it("should create a Wallet from privateKey", () => {
    // Use a valid 32-byte hex key (not a real one, but valid format)
    const config = {
      chainId: 8888,
      rpcUrl: "https://evm.testnet.injective.network",
      privateKey:
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    };
    const pm = makeProviderManager(config);
    const sm = new SignerManager(config, pm, silentLogger);

    expect(sm.hasSigner()).toBe(true);
    const signer = sm.getSigner();
    expect(signer).toBeDefined();
    // The signer should be an ethers Wallet
    expect(signer?.constructor.name).toBe("Wallet");
  });
});
