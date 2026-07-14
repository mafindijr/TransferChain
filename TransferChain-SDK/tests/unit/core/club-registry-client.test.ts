import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClubRegistryClient } from "../../../src/contracts/club-registry-client.js";
import { CLUB_REGISTRY_ABI } from "../../../src/abi/index.js";
import { ClubStatus } from "../../../src/types/club.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";
import type { TransactionManager } from "../../../src/core/transaction-manager.js";

const MOCK_CLUB = {
  id: 1n,
  owner: "0xCAFE000000000000000000000000000000000001",
  name: "FC Example",
  metadataURI: "ipfs://QmClub",
  country: "England",
  city: "London",
  league: "Premier League",
  logoURI: "ipfs://QmLogo",
  website: "https://fc-example.com",
  status: ClubStatus.Verified,
  registeredAt: 1700000000n,
};

function createMockContract(overrides: Record<string, unknown> = {}) {
  return {
    getClub: vi.fn().mockResolvedValue(MOCK_CLUB),
    getClubOwner: vi.fn().mockResolvedValue("0xCAFE000000000000000000000000000000000001"),
    nextClubId: vi.fn().mockResolvedValue(3n),
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

describe("ClubRegistryClient", () => {
  let client: ClubRegistryClient;
  let mockContract: ReturnType<typeof createMockContract>;
  let mockRegistry: ContractRegistry;
  let mockTxManager: TransactionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContract = createMockContract();
    mockRegistry = createMockRegistry(mockContract);
    mockTxManager = createMockTxManager();
    client = new ClubRegistryClient(mockRegistry, mockTxManager);
  });

  describe("getClub", () => {
    it("should return a parsed club entity", async () => {
      const club = await client.getClub("0xCAFE000000000000000000000000000000000001");
      expect(club).toEqual(MOCK_CLUB);
      expect(mockContract.getClub).toHaveBeenCalledWith(
        "0xCAFE000000000000000000000000000000000001",
      );
    });

    it("should parse bigints correctly", async () => {
      const club = await client.getClub("0xCAFE000000000000000000000000000000000001");
      expect(typeof club.id).toBe("bigint");
      expect(typeof club.registeredAt).toBe("bigint");
      expect(club.id).toBe(1n);
    });

    it("should return the correct ClubStatus enum value", async () => {
      mockContract.getClub.mockResolvedValue({
        ...MOCK_CLUB,
        status: ClubStatus.Suspended,
      });
      const club = await client.getClub("0xCAFE000000000000000000000000000000000001");
      expect(club.status).toBe(ClubStatus.Suspended);
    });

    it("should include all club fields", async () => {
      const club = await client.getClub("0xCAFE000000000000000000000000000000000001");
      expect(club.country).toBe("England");
      expect(club.city).toBe("London");
      expect(club.league).toBe("Premier League");
      expect(club.logoURI).toBe("ipfs://QmLogo");
      expect(club.website).toBe("https://fc-example.com");
    });
  });

  describe("getClubOwner", () => {
    it("should return the owner address for a club ID", async () => {
      const owner = await client.getClubOwner(1n);
      expect(owner).toBe("0xCAFE000000000000000000000000000000000001");
      expect(mockContract.getClubOwner).toHaveBeenCalledWith(1n);
    });
  });

  describe("getNextClubId", () => {
    it("should return the next club ID", async () => {
      const nextId = await client.getNextClubId();
      expect(nextId).toBe(3n);
    });
  });

  describe("registerClub", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.registerClub({
        owner: "0xCAFE000000000000000000000000000000000001",
        name: "FC Example",
        metadataUri: "ipfs://QmClub",
        country: "England",
        city: "London",
        league: "Premier League",
        logoUri: "ipfs://QmLogo",
        website: "https://fc-example.com",
      });
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "clubRegistry",
        CLUB_REGISTRY_ABI,
        "registerClub",
        [
          "0xCAFE000000000000000000000000000000000001",
          "FC Example",
          "ipfs://QmClub",
          "England",
          "London",
          "Premier League",
          "ipfs://QmLogo",
          "https://fc-example.com",
        ],
      );
    });
  });

  describe("updateClubMetadata", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.updateClubMetadata(
        "0xCAFE000000000000000000000000000000000001",
        "ipfs://QmUpdatedClub",
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "clubRegistry",
        CLUB_REGISTRY_ABI,
        "updateClubMetadata",
        ["0xCAFE000000000000000000000000000000000001", "ipfs://QmUpdatedClub"],
      );
    });
  });

  describe("setClubStatus", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.setClubStatus(
        "0xCAFE000000000000000000000000000000000001",
        ClubStatus.Inactive,
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "clubRegistry",
        CLUB_REGISTRY_ABI,
        "setClubStatus",
        ["0xCAFE000000000000000000000000000000000001", ClubStatus.Inactive],
      );
    });
  });
});

describe("ClubStatus enum", () => {
  it("should define all status values", () => {
    expect(ClubStatus.Unverified).toBe(0);
    expect(ClubStatus.Verified).toBe(1);
    expect(ClubStatus.Suspended).toBe(2);
    expect(ClubStatus.Inactive).toBe(3);
  });

  it("Unverified should be 0", () => {
    expect(ClubStatus.Unverified).toBe(0);
  });

  it("Verified should be 1", () => {
    expect(ClubStatus.Verified).toBe(1);
  });

  it("Suspended should be 2", () => {
    expect(ClubStatus.Suspended).toBe(2);
  });

  it("Inactive should be 3", () => {
    expect(ClubStatus.Inactive).toBe(3);
  });
});
