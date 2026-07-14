import { describe, it, expect, vi, beforeEach } from "vitest";
import { AgreementClient } from "../../../src/contracts/agreement-client.js";
import { AGREEMENT_MANAGER_ABI } from "../../../src/abi/index.js";
import { AgreementStatus } from "../../../src/types/agreement.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";
import type { TransactionManager } from "../../../src/core/transaction-manager.js";

const MOCK_CLAUSE_SET = {
  transferFee: 500n * 10n ** 18n,
  signingBonus: 100n * 10n ** 18n,
  sellOnPercentage: 1000n,
  releaseClause: 10000n * 10n ** 18n,
  installmentAmount: 0n,
  appearanceBonus: 50n * 10n ** 18n,
  goalBonus: 100n * 10n ** 18n,
  medicalApprovalRequired: true,
  negotiationDeadline: 1700010000n,
  agreementExpiration: 1700020000n,
  metadataURI: "ipfs://QmClauses",
};

const MOCK_AGREEMENT = {
  id: 1n,
  listingId: 5n,
  buyer: "0xBEEF000000000000000000000000000000000001",
  seller: "0xCAFE000000000000000000000000000000000001",
  status: AgreementStatus.Draft,
  clauses: MOCK_CLAUSE_SET,
  buyerSigned: false,
  sellerSigned: false,
  createdAt: 1700000000n,
};

function createMockContract(overrides: Record<string, unknown> = {}) {
  return {
    getAgreement: vi.fn().mockResolvedValue(MOCK_AGREEMENT),
    nextAgreementId: vi.fn().mockResolvedValue(10n),
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

describe("AgreementClient", () => {
  let client: AgreementClient;
  let mockContract: ReturnType<typeof createMockContract>;
  let mockRegistry: ContractRegistry;
  let mockTxManager: TransactionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContract = createMockContract();
    mockRegistry = createMockRegistry(mockContract);
    mockTxManager = createMockTxManager();
    client = new AgreementClient(mockRegistry, mockTxManager);
  });

  describe("getAgreement", () => {
    it("should return a parsed agreement entity", async () => {
      const agreement = await client.getAgreement(1n);
      expect(agreement.id).toBe(1n);
      expect(agreement.listingId).toBe(5n);
      expect(agreement.buyer).toBe("0xBEEF000000000000000000000000000000000001");
      expect(agreement.seller).toBe("0xCAFE000000000000000000000000000000000001");
      expect(agreement.status).toBe(AgreementStatus.Draft);
      expect(agreement.buyerSigned).toBe(false);
      expect(agreement.sellerSigned).toBe(false);
      expect(mockContract.getAgreement).toHaveBeenCalledWith(1n);
    });

    it("should parse clause set bigints correctly", async () => {
      const agreement = await client.getAgreement(1n);
      expect(typeof agreement.clauses.transferFee).toBe("bigint");
      expect(typeof agreement.clauses.signingBonus).toBe("bigint");
      expect(typeof agreement.clauses.sellOnPercentage).toBe("bigint");
      expect(typeof agreement.clauses.releaseClause).toBe("bigint");
      expect(typeof agreement.clauses.installmentAmount).toBe("bigint");
      expect(typeof agreement.clauses.appearanceBonus).toBe("bigint");
      expect(typeof agreement.clauses.goalBonus).toBe("bigint");
      expect(typeof agreement.clauses.negotiationDeadline).toBe("bigint");
      expect(typeof agreement.clauses.agreementExpiration).toBe("bigint");
    });

    it("should parse clause set boolean correctly", async () => {
      const agreement = await client.getAgreement(1n);
      expect(typeof agreement.clauses.medicalApprovalRequired).toBe("boolean");
      expect(agreement.clauses.medicalApprovalRequired).toBe(true);
    });

    it("should parse clause set string correctly", async () => {
      const agreement = await client.getAgreement(1n);
      expect(agreement.clauses.metadataURI).toBe("ipfs://QmClauses");
    });

    it("should parse agreement bigints correctly", async () => {
      const agreement = await client.getAgreement(1n);
      expect(typeof agreement.id).toBe("bigint");
      expect(typeof agreement.listingId).toBe("bigint");
      expect(typeof agreement.createdAt).toBe("bigint");
    });

    it("should return the correct AgreementStatus", async () => {
      mockContract.getAgreement.mockResolvedValue({
        ...MOCK_AGREEMENT,
        status: AgreementStatus.Signed,
        buyerSigned: true,
        sellerSigned: true,
      });
      const agreement = await client.getAgreement(1n);
      expect(agreement.status).toBe(AgreementStatus.Signed);
      expect(agreement.buyerSigned).toBe(true);
      expect(agreement.sellerSigned).toBe(true);
    });
  });

  describe("getNextAgreementId", () => {
    it("should return the next agreement ID", async () => {
      const nextId = await client.getNextAgreementId();
      expect(nextId).toBe(10n);
    });
  });

  describe("createAgreement", () => {
    it("should call transactionManager.execute with all clause args", async () => {
      await client.createAgreement({
        listingId: 5n,
        buyer: "0xBEEF000000000000000000000000000000000001",
        seller: "0xCAFE000000000000000000000000000000000001",
        transferFee: 500n * 10n ** 18n,
        signingBonus: 100n * 10n ** 18n,
        sellOnPercentage: 1000n,
        releaseClause: 10000n * 10n ** 18n,
        installmentAmount: 0n,
        appearanceBonus: 50n * 10n ** 18n,
        goalBonus: 100n * 10n ** 18n,
        metadataUri: "ipfs://QmClauses",
      });
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferAgreementManager",
        AGREEMENT_MANAGER_ABI,
        "createAgreement",
        [
          5n,
          "0xBEEF000000000000000000000000000000000001",
          "0xCAFE000000000000000000000000000000000001",
          500n * 10n ** 18n,
          100n * 10n ** 18n,
          1000n,
          10000n * 10n ** 18n,
          0n,
          50n * 10n ** 18n,
          100n * 10n ** 18n,
          "ipfs://QmClauses",
        ],
      );
    });
  });

  describe("approveAgreement", () => {
    it("should call transactionManager.execute with agreementId and caller", async () => {
      await client.approveAgreement(
        1n,
        "0xBEEF000000000000000000000000000000000001",
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferAgreementManager",
        AGREEMENT_MANAGER_ABI,
        "approveAgreement",
        [1n, "0xBEEF000000000000000000000000000000000001"],
      );
    });
  });

  describe("rejectAgreement", () => {
    it("should call transactionManager.execute with agreementId and caller", async () => {
      await client.rejectAgreement(
        1n,
        "0xCAFE000000000000000000000000000000000001",
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferAgreementManager",
        AGREEMENT_MANAGER_ABI,
        "rejectAgreement",
        [1n, "0xCAFE000000000000000000000000000000000001"],
      );
    });
  });
});

describe("AgreementStatus enum", () => {
  it("should define all status values", () => {
    expect(AgreementStatus.Draft).toBe(0);
    expect(AgreementStatus.Approved).toBe(1);
    expect(AgreementStatus.Rejected).toBe(2);
    expect(AgreementStatus.Expired).toBe(3);
    expect(AgreementStatus.Signed).toBe(4);
  });
});
