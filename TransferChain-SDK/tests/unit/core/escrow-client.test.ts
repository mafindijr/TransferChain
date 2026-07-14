import { describe, it, expect, vi, beforeEach } from "vitest";
import { EscrowClient } from "../../../src/contracts/escrow-client.js";
import { ESCROW_ABI } from "../../../src/abi/index.js";
import { DepositStatus } from "../../../src/types/escrow.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";
import type { TransactionManager } from "../../../src/core/transaction-manager.js";

const MOCK_DEPOSIT = {
  id: 1n,
  token: "0xTokenAddr000000000000000000000000000000000001",
  amount: 1000n * 10n ** 18n,
  agreementId: 5n,
  payer: "0xBEEF000000000000000000000000000000000001",
  payee: "0xCAFE000000000000000000000000000000000001",
  status: DepositStatus.Funded,
  createdAt: 1700000000n,
};

function createMockContract(overrides: Record<string, unknown> = {}) {
  return {
    getDeposit: vi.fn().mockResolvedValue(MOCK_DEPOSIT),
    nextDepositId: vi.fn().mockResolvedValue(7n),
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

describe("EscrowClient", () => {
  let client: EscrowClient;
  let mockContract: ReturnType<typeof createMockContract>;
  let mockRegistry: ContractRegistry;
  let mockTxManager: TransactionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContract = createMockContract();
    mockRegistry = createMockRegistry(mockContract);
    mockTxManager = createMockTxManager();
    client = new EscrowClient(mockRegistry, mockTxManager);
  });

  describe("getDeposit", () => {
    it("should return a parsed deposit entity", async () => {
      const deposit = await client.getDeposit(1n);
      expect(deposit.id).toBe(1n);
      expect(deposit.token).toBe("0xTokenAddr000000000000000000000000000000000001");
      expect(deposit.amount).toBe(1000n * 10n ** 18n);
      expect(deposit.agreementId).toBe(5n);
      expect(deposit.payer).toBe("0xBEEF000000000000000000000000000000000001");
      expect(deposit.payee).toBe("0xCAFE000000000000000000000000000000000001");
      expect(deposit.status).toBe(DepositStatus.Funded);
      expect(mockContract.getDeposit).toHaveBeenCalledWith(1n);
    });

    it("should parse bigints correctly", async () => {
      const deposit = await client.getDeposit(1n);
      expect(typeof deposit.id).toBe("bigint");
      expect(typeof deposit.amount).toBe("bigint");
      expect(typeof deposit.agreementId).toBe("bigint");
      expect(typeof deposit.createdAt).toBe("bigint");
    });

    it("should return the correct DepositStatus", async () => {
      mockContract.getDeposit.mockResolvedValue({
        ...MOCK_DEPOSIT,
        status: DepositStatus.Released,
      });
      const deposit = await client.getDeposit(1n);
      expect(deposit.status).toBe(DepositStatus.Released);
    });
  });

  describe("getNextDepositId", () => {
    it("should return the next deposit ID", async () => {
      const nextId = await client.getNextDepositId();
      expect(nextId).toBe(7n);
    });
  });

  describe("deposit", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.deposit({
        token: "0xTokenAddr000000000000000000000000000000000001",
        amount: 1000n * 10n ** 18n,
        agreementId: 5n,
        payee: "0xCAFE000000000000000000000000000000000001",
      });
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "escrow",
        ESCROW_ABI,
        "deposit",
        [
          "0xTokenAddr000000000000000000000000000000000001",
          1000n * 10n ** 18n,
          5n,
          "0xCAFE000000000000000000000000000000000001",
        ],
      );
    });
  });

  describe("release", () => {
    it("should call transactionManager.execute with depositId and caller", async () => {
      await client.release(
        1n,
        "0xBEEF000000000000000000000000000000000001",
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "escrow",
        ESCROW_ABI,
        "release",
        [1n, "0xBEEF000000000000000000000000000000000001"],
      );
    });
  });

  describe("refund", () => {
    it("should call transactionManager.execute with depositId and caller", async () => {
      await client.refund(
        1n,
        "0xBEEF000000000000000000000000000000000001",
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "escrow",
        ESCROW_ABI,
        "refund",
        [1n, "0xBEEF000000000000000000000000000000000001"],
      );
    });
  });
});

describe("DepositStatus enum", () => {
  it("should define all status values", () => {
    expect(DepositStatus.Created).toBe(0);
    expect(DepositStatus.Funded).toBe(1);
    expect(DepositStatus.Released).toBe(2);
    expect(DepositStatus.Refunded).toBe(3);
    expect(DepositStatus.Disputed).toBe(4);
  });
});
