import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfigClient } from "../../../src/contracts/config-client.js";
import { CONFIG_ABI } from "../../../src/abi/index.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";
import type { TransactionManager } from "../../../src/core/transaction-manager.js";

function createMockContract(overrides: Record<string, unknown> = {}) {
  return {
    treasury: vi.fn().mockResolvedValue("0xTreasuryAddress"),
    marketplaceFeeBps: vi.fn().mockResolvedValue(250n),
    isProtocolOperational: vi.fn().mockResolvedValue(true),
    isPaymentTokenSupported: vi.fn().mockResolvedValue(true),
    protocolVersion: vi.fn().mockResolvedValue(1n),
    paused: vi.fn().mockResolvedValue(false),
    emergencyMode: vi.fn().mockResolvedValue(false),
    owner: vi.fn().mockResolvedValue("0xOwnerAddress"),
    ...overrides,
  };
}

function createMockRegistry(
  contract: ReturnType<typeof createMockContract>,
): ContractRegistry {
  return {
    getReadContract: vi.fn().mockReturnValue(contract),
    getWriteContract: vi.fn().mockReturnValue(contract),
    getAddress: vi.fn().mockReturnValue("0x0000000000000000000000000000000000000001"),
  } as unknown as ContractRegistry;
}

function createMockTxManager(): TransactionManager {
  return {
    execute: vi.fn().mockResolvedValue({
      txHash: "0xabc",
      receipt: { status: 1, hash: "0xabc", gasUsed: 21000n },
      events: [],
    }),
  } as unknown as TransactionManager;
}

describe("ConfigClient", () => {
  let client: ConfigClient;
  let mockContract: ReturnType<typeof createMockContract>;
  let mockRegistry: ContractRegistry;
  let mockTxManager: TransactionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContract = createMockContract();
    mockRegistry = createMockRegistry(mockContract);
    mockTxManager = createMockTxManager();
    client = new ConfigClient(mockRegistry, mockTxManager);
  });

  describe("getTreasury", () => {
    it("should return the treasury address", async () => {
      const result = await client.getTreasury();
      expect(result).toBe("0xTreasuryAddress");
    });
  });

  describe("getMarketplaceFee", () => {
    it("should return the fee in basis points", async () => {
      const result = await client.getMarketplaceFee();
      expect(result).toBe(250n);
    });
  });

  describe("isProtocolOperational", () => {
    it("should return true when operational", async () => {
      const result = await client.isProtocolOperational();
      expect(result).toBe(true);
    });

    it("should return false when not operational", async () => {
      mockContract.isProtocolOperational.mockResolvedValue(false);
      const result = await client.isProtocolOperational();
      expect(result).toBe(false);
    });
  });

  describe("isPaymentTokenSupported", () => {
    it("should return true for supported tokens", async () => {
      const result = await client.isPaymentTokenSupported("0xTokenAddr");
      expect(result).toBe(true);
      expect(mockContract.isPaymentTokenSupported).toHaveBeenCalledWith(
        "0xTokenAddr",
      );
    });

    it("should return false for unsupported tokens", async () => {
      mockContract.isPaymentTokenSupported.mockResolvedValue(false);
      const result = await client.isPaymentTokenSupported("0xBadToken");
      expect(result).toBe(false);
    });
  });

  describe("getProtocolVersion", () => {
    it("should return the version", async () => {
      const result = await client.getProtocolVersion();
      expect(result).toBe(1n);
    });
  });

  describe("isPaused", () => {
    it("should return the paused state", async () => {
      const result = await client.isPaused();
      expect(result).toBe(false);
    });
  });

  describe("isEmergencyMode", () => {
    it("should return the emergency mode state", async () => {
      const result = await client.isEmergencyMode();
      expect(result).toBe(false);
    });
  });

  describe("getOwner", () => {
    it("should return the owner address", async () => {
      const result = await client.getOwner();
      expect(result).toBe("0xOwnerAddress");
    });
  });

  describe("write methods", () => {
    it("setTreasury should call transactionManager.execute", async () => {
      await client.setTreasury("0xNewTreasury");
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainConfig",
        CONFIG_ABI,
        "setTreasury",
        ["0xNewTreasury"],
      );
    });

    it("setMarketplaceFee should call transactionManager.execute", async () => {
      await client.setMarketplaceFee(500n);
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainConfig",
        CONFIG_ABI,
        "setMarketplaceFee",
        [500n],
      );
    });

    it("setEmergencyMode should call transactionManager.execute", async () => {
      await client.setEmergencyMode(true);
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainConfig",
        CONFIG_ABI,
        "setEmergencyMode",
        [true],
      );
    });

    it("addPaymentToken should call transactionManager.execute", async () => {
      await client.addPaymentToken("0xToken");
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainConfig",
        CONFIG_ABI,
        "addSupportedPaymentToken",
        ["0xToken"],
      );
    });

    it("removePaymentToken should call transactionManager.execute", async () => {
      await client.removePaymentToken("0xToken");
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainConfig",
        CONFIG_ABI,
        "removeSupportedPaymentToken",
        ["0xToken"],
      );
    });
  });
});
