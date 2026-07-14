import { describe, it, expect, vi, beforeEach } from "vitest";
import { keccak256, toUtf8Bytes } from "ethers";
import { AccessControlClient } from "../../../src/contracts/access-control-client.js";
import { ROLES } from "../../../src/constants/roles.js";
import { ACCESS_CONTROL_ABI } from "../../../src/abi/index.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";
import type { TransactionManager } from "../../../src/core/transaction-manager.js";

function createMockContract(overrides: Record<string, unknown> = {}) {
  return {
    hasRole: vi.fn().mockResolvedValue(true),
    isPaused: vi.fn().mockResolvedValue(false),
    getRoleAdmin: vi.fn().mockResolvedValue(ROLES.DEFAULT_ADMIN),
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

describe("AccessControlClient", () => {
  let client: AccessControlClient;
  let mockContract: ReturnType<typeof createMockContract>;
  let mockRegistry: ContractRegistry;
  let mockTxManager: TransactionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContract = createMockContract();
    mockRegistry = createMockRegistry(mockContract);
    mockTxManager = createMockTxManager();
    client = new AccessControlClient(mockRegistry, mockTxManager);
  });

  describe("hasRole", () => {
    it("should return true when account has the role", async () => {
      const result = await client.hasRole(ROLES.PAUSER, "0xBEEF");
      expect(result).toBe(true);
      expect(mockContract.hasRole).toHaveBeenCalledWith(
        ROLES.PAUSER,
        "0xBEEF",
      );
    });

    it("should return false when account lacks the role", async () => {
      mockContract.hasRole.mockResolvedValue(false);
      const result = await client.hasRole(ROLES.PAUSER, "0xCAFE");
      expect(result).toBe(false);
    });
  });

  describe("isPaused", () => {
    it("should return false when not paused", async () => {
      const result = await client.isPaused();
      expect(result).toBe(false);
    });

    it("should return true when paused", async () => {
      mockContract.isPaused.mockResolvedValue(true);
      const result = await client.isPaused();
      expect(result).toBe(true);
    });
  });

  describe("getRoleAdmin", () => {
    it("should return the admin role", async () => {
      const result = await client.getRoleAdmin(ROLES.REGISTRY_ADMIN);
      expect(result).toBe(ROLES.DEFAULT_ADMIN);
    });
  });

  describe("grantRole", () => {
    it("should call transactionManager.execute", async () => {
      await client.grantRole(ROLES.PAUSER, "0xBEEF");
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainAccessControl",
        ACCESS_CONTROL_ABI,
        "grantRole",
        [ROLES.PAUSER, "0xBEEF"],
      );
    });
  });

  describe("revokeRole", () => {
    it("should call transactionManager.execute", async () => {
      await client.revokeRole(ROLES.PAUSER, "0xBEEF");
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainAccessControl",
        ACCESS_CONTROL_ABI,
        "revokeRole",
        [ROLES.PAUSER, "0xBEEF"],
      );
    });
  });

  describe("pause", () => {
    it("should call transactionManager.execute", async () => {
      await client.pause();
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainAccessControl",
        ACCESS_CONTROL_ABI,
        "pause",
        [],
      );
    });
  });

  describe("unpause", () => {
    it("should call transactionManager.execute", async () => {
      await client.unpause();
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferChainAccessControl",
        ACCESS_CONTROL_ABI,
        "unpause",
        [],
      );
    });
  });
});

describe("ROLES constants", () => {
  it("should have all 8 roles defined", () => {
    expect(Object.keys(ROLES)).toHaveLength(8);
  });

  it("each role should be a bytes32 hex string", () => {
    for (const value of Object.values(ROLES)) {
      expect(value).toMatch(/^0x[a-f0-9]{64}$/);
    }
  });

  it("DEFAULT_ADMIN should be keccak256 of the role name", () => {
    const expected = keccak256(toUtf8Bytes("DEFAULT_ADMIN_ROLE"));
    expect(ROLES.DEFAULT_ADMIN).toBe(expected);
  });
});
