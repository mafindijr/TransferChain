import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlayerRegistryClient } from "../../../src/contracts/player-registry-client.js";
import { PLAYER_REGISTRY_ABI } from "../../../src/abi/index.js";
import { PlayerStatus } from "../../../src/types/player.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";
import type { TransactionManager } from "../../../src/core/transaction-manager.js";

const MOCK_PLAYER = {
  id: 1n,
  owner: "0xBEEF000000000000000000000000000000000001",
  name: "Alice",
  metadataURI: "ipfs://QmAlice",
  status: PlayerStatus.Active,
  registeredAt: 1700000000n,
};

function createMockContract(overrides: Record<string, unknown> = {}) {
  return {
    getPlayer: vi.fn().mockResolvedValue(MOCK_PLAYER),
    getPlayerOwner: vi.fn().mockResolvedValue("0xBEEF000000000000000000000000000000000001"),
    nextPlayerId: vi.fn().mockResolvedValue(5n),
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

describe("PlayerRegistryClient", () => {
  let client: PlayerRegistryClient;
  let mockContract: ReturnType<typeof createMockContract>;
  let mockRegistry: ContractRegistry;
  let mockTxManager: TransactionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContract = createMockContract();
    mockRegistry = createMockRegistry(mockContract);
    mockTxManager = createMockTxManager();
    client = new PlayerRegistryClient(mockRegistry, mockTxManager);
  });

  describe("getPlayer", () => {
    it("should return a parsed player entity", async () => {
      const player = await client.getPlayer("0xBEEF000000000000000000000000000000000001");
      expect(player).toEqual(MOCK_PLAYER);
      expect(mockContract.getPlayer).toHaveBeenCalledWith(
        "0xBEEF000000000000000000000000000000000001",
      );
    });

    it("should parse bigints correctly", async () => {
      const player = await client.getPlayer("0xBEEF000000000000000000000000000000000001");
      expect(typeof player.id).toBe("bigint");
      expect(typeof player.registeredAt).toBe("bigint");
      expect(player.id).toBe(1n);
    });

    it("should return the correct PlayerStatus enum value", async () => {
      mockContract.getPlayer.mockResolvedValue({
        ...MOCK_PLAYER,
        status: PlayerStatus.Suspended,
      });
      const player = await client.getPlayer("0xBEEF000000000000000000000000000000000001");
      expect(player.status).toBe(PlayerStatus.Suspended);
    });
  });

  describe("getPlayerOwner", () => {
    it("should return the owner address for a player ID", async () => {
      const owner = await client.getPlayerOwner(1n);
      expect(owner).toBe("0xBEEF000000000000000000000000000000000001");
      expect(mockContract.getPlayerOwner).toHaveBeenCalledWith(1n);
    });
  });

  describe("getNextPlayerId", () => {
    it("should return the next player ID", async () => {
      const nextId = await client.getNextPlayerId();
      expect(nextId).toBe(5n);
    });
  });

  describe("registerPlayer", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.registerPlayer({
        owner: "0xBEEF000000000000000000000000000000000001",
        name: "Alice",
        metadataUri: "ipfs://QmAlice",
      });
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "playerRegistry",
        PLAYER_REGISTRY_ABI,
        "registerPlayer",
        [
          "0xBEEF000000000000000000000000000000000001",
          "ipfs://QmAlice",
          "Alice",
        ],
      );
    });
  });

  describe("updatePlayerMetadata", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.updatePlayerMetadata(
        "0xBEEF000000000000000000000000000000000001",
        "ipfs://QmUpdated",
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "playerRegistry",
        PLAYER_REGISTRY_ABI,
        "updatePlayerMetadata",
        ["0xBEEF000000000000000000000000000000000001", "ipfs://QmUpdated"],
      );
    });
  });

  describe("setPlayerStatus", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.setPlayerStatus(
        "0xBEEF000000000000000000000000000000000001",
        PlayerStatus.Inactive,
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "playerRegistry",
        PLAYER_REGISTRY_ABI,
        "setPlayerStatus",
        ["0xBEEF000000000000000000000000000000000001", PlayerStatus.Inactive],
      );
    });
  });
});

describe("PlayerStatus enum", () => {
  it("should define all status values", () => {
    expect(PlayerStatus.Active).toBe(0);
    expect(PlayerStatus.Suspended).toBe(1);
    expect(PlayerStatus.Inactive).toBe(2);
  });

  it("Active should be 0", () => {
    expect(PlayerStatus.Active).toBe(0);
  });

  it("Suspended should be 1", () => {
    expect(PlayerStatus.Suspended).toBe(1);
  });

  it("Inactive should be 2", () => {
    expect(PlayerStatus.Inactive).toBe(2);
  });
});
