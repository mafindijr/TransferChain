import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketplaceClient } from "../../../src/contracts/marketplace-client.js";
import { MARKETPLACE_ABI } from "../../../src/abi/index.js";
import { ListingStatus, OfferStatus } from "../../../src/types/marketplace.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";
import type { TransactionManager } from "../../../src/core/transaction-manager.js";

const MOCK_LISTING = {
  id: 1n,
  seller: "0xBEEF000000000000000000000000000000000001",
  playerId: 10n,
  clubId: 5n,
  price: 1000n * 10n ** 18n,
  metadataURI: "ipfs://QmListing",
  status: ListingStatus.Active,
  createdAt: 1700000000n,
};

const MOCK_OFFER = {
  listingId: 1n,
  buyer: "0xCAFE000000000000000000000000000000000001",
  amount: 900n * 10n ** 18n,
  status: OfferStatus.Pending,
  createdAt: 1700001000n,
};

function createMockContract(overrides: Record<string, unknown> = {}) {
  return {
    getListing: vi.fn().mockResolvedValue(MOCK_LISTING),
    getOffer: vi.fn().mockResolvedValue(MOCK_OFFER),
    nextListingId: vi.fn().mockResolvedValue(42n),
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

describe("MarketplaceClient", () => {
  let client: MarketplaceClient;
  let mockContract: ReturnType<typeof createMockContract>;
  let mockRegistry: ContractRegistry;
  let mockTxManager: TransactionManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockContract = createMockContract();
    mockRegistry = createMockRegistry(mockContract);
    mockTxManager = createMockTxManager();
    client = new MarketplaceClient(mockRegistry, mockTxManager);
  });

  describe("getListing", () => {
    it("should return a parsed listing entity", async () => {
      const listing = await client.getListing(1n);
      expect(listing).toEqual(MOCK_LISTING);
      expect(mockContract.getListing).toHaveBeenCalledWith(1n);
    });

    it("should parse bigints correctly", async () => {
      const listing = await client.getListing(1n);
      expect(typeof listing.id).toBe("bigint");
      expect(typeof listing.playerId).toBe("bigint");
      expect(typeof listing.clubId).toBe("bigint");
      expect(typeof listing.price).toBe("bigint");
      expect(typeof listing.createdAt).toBe("bigint");
    });

    it("should return the correct ListingStatus", async () => {
      mockContract.getListing.mockResolvedValue({
        ...MOCK_LISTING,
        status: ListingStatus.Sold,
      });
      const listing = await client.getListing(1n);
      expect(listing.status).toBe(ListingStatus.Sold);
    });
  });

  describe("getOffer", () => {
    it("should return a parsed offer entity", async () => {
      const offer = await client.getOffer(1n, "0xCAFE000000000000000000000000000000000001");
      expect(offer).toEqual(MOCK_OFFER);
      expect(mockContract.getOffer).toHaveBeenCalledWith(
        1n,
        "0xCAFE000000000000000000000000000000000001",
      );
    });

    it("should parse bigints correctly", async () => {
      const offer = await client.getOffer(1n, "0xCAFE000000000000000000000000000000000001");
      expect(typeof offer.listingId).toBe("bigint");
      expect(typeof offer.amount).toBe("bigint");
      expect(typeof offer.createdAt).toBe("bigint");
    });

    it("should return the correct OfferStatus", async () => {
      mockContract.getOffer.mockResolvedValue({
        ...MOCK_OFFER,
        status: OfferStatus.Accepted,
      });
      const offer = await client.getOffer(1n, "0xCAFE000000000000000000000000000000000001");
      expect(offer.status).toBe(OfferStatus.Accepted);
    });
  });

  describe("getNextListingId", () => {
    it("should return the next listing ID", async () => {
      const nextId = await client.getNextListingId();
      expect(nextId).toBe(42n);
    });
  });

  describe("createListing", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.createListing({
        seller: "0xBEEF000000000000000000000000000000000001",
        playerId: 10n,
        clubId: 5n,
        price: 1000n * 10n ** 18n,
        metadataUri: "ipfs://QmListing",
      });
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferMarketplace",
        MARKETPLACE_ABI,
        "createListing",
        [
          "0xBEEF000000000000000000000000000000000001",
          10n,
          5n,
          1000n * 10n ** 18n,
          "ipfs://QmListing",
        ],
      );
    });
  });

  describe("cancelListing", () => {
    it("should call transactionManager.execute with listingId and caller", async () => {
      await client.cancelListing(
        1n,
        "0xBEEF000000000000000000000000000000000001",
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferMarketplace",
        MARKETPLACE_ABI,
        "cancelListing",
        [1n, "0xBEEF000000000000000000000000000000000001"],
      );
    });
  });

  describe("makeOffer", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.makeOffer({
        listingId: 1n,
        buyer: "0xCAFE000000000000000000000000000000000001",
        amount: 900n * 10n ** 18n,
      });
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferMarketplace",
        MARKETPLACE_ABI,
        "makeOffer",
        [1n, "0xCAFE000000000000000000000000000000000001", 900n * 10n ** 18n],
      );
    });
  });

  describe("rejectOffer", () => {
    it("should call transactionManager.execute with correct args", async () => {
      await client.rejectOffer(
        1n,
        "0xCAFE000000000000000000000000000000000001",
        "0xBEEF000000000000000000000000000000000001",
      );
      expect(mockTxManager.execute).toHaveBeenCalledWith(
        "transferMarketplace",
        MARKETPLACE_ABI,
        "rejectOffer",
        [
          1n,
          "0xCAFE000000000000000000000000000000000001",
          "0xBEEF000000000000000000000000000000000001",
        ],
      );
    });
  });
});

describe("ListingStatus enum", () => {
  it("should define all status values", () => {
    expect(ListingStatus.Active).toBe(0);
    expect(ListingStatus.Cancelled).toBe(1);
    expect(ListingStatus.Sold).toBe(2);
    expect(ListingStatus.Paused).toBe(3);
  });
});

describe("OfferStatus enum", () => {
  it("should define all status values", () => {
    expect(OfferStatus.Pending).toBe(0);
    expect(OfferStatus.Accepted).toBe(1);
    expect(OfferStatus.Rejected).toBe(2);
    expect(OfferStatus.Expired).toBe(3);
  });
});
