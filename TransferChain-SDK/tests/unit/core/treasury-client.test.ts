import { describe, it, expect, vi, beforeEach } from "vitest";
import { TreasuryClient } from "../../../src/contracts/treasury-client.js";
import { TREASURY_ABI } from "../../../src/abi/index.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";
import type { TransactionManager } from "../../../src/core/transaction-manager.js";

function createMockContract(overrides: Record<string, unknown> = {}) {
  return {
    tokenBalance: vi.fn().mockResolvedValue(5000n * 10n ** 18n),
    owner: vi.fn().mockResolvedValue("0xOwnerAddress0000000000000000000000000001"),
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

describe("TreasuryClient", () => {
  let client: TreasuryClient;
  let mockContract: ReturnType<typeof createMockContract>;
  let mockRegistry: ContractRegistry;
  let mockTxManager: TransactionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContract = createMockContract();
    mockRegistry = createMockRegistry(mockContract);
    mockTxManager = createMockTxManager();
    client = new TreasuryClient(mockRegistry, mockTxManager);
  });

  describe("getTokenBalance", () => {
    it("should return the token balance", async () => {
      const balance = await client.getTokenBalance("0xTokenAddr");
      expect(balance).toBe(5000n * 10n ** 18n);
      expect(mockContract.tokenBalance).toHaveBeenCalledWith("0xTokenAddr");
    });

    it("should return 0 for zero balance", async () => {
      mockContract.tokenBalance.mockResolvedValue(0n);
      const balance = await client.getTokenBalance("0xTokenAddr");
      expect(balance).toBe(0n);
    });
  });

  describe("getOwner", () => {
    it("should return the owner address", async () => {
      const owner = await client.getOwner();
      expect(owner).toBe("0xOwnerAddress0000000000000000000000000001");
    });
  });

  describe("depositToken", () => {
    it("should call transactionManager.execute with token and amount", async () => {
      await client.depositToken("0xTokenAddr", 1000n * 10n ** 18n);
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "treasury",
        TREASURY_ABI,
        "depositToken",
        ["0xTokenAddr", 1000n * 10n ** 18n],
      );
    });
  });

  describe("withdrawToken", () => {
    it("should call transactionManager.execute with all args", async () => {
      await client.withdrawToken(
        "0xTokenAddr",
        "0xRecipientAddr",
        500n * 10n ** 18n,
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "treasury",
        TREASURY_ABI,
        "withdrawToken",
        ["0xTokenAddr", "0xRecipientAddr", 500n * 10n ** 18n],
      );
    });
  });
});
