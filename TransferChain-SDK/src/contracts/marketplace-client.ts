import type { ContractRegistry } from "../core/contract-registry.js";
import type { TransactionManager } from "../core/transaction-manager.js";
import { MARKETPLACE_ABI } from "../abi/index.js";
import type { TransactionResult } from "../types/transaction-result.js";
import type {
  Listing,
  Offer,
  CreateListingParams,
  MakeOfferParams,
} from "../types/marketplace.js";
import { ListingStatus, OfferStatus } from "../types/marketplace.js";

/** The deployment manifest key for the TransferMarketplace contract. */
const CONTRACT = "transferMarketplace" as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContractMethod = (...args: any[]) => Promise<any>;

function getMethod(
  contract: { [key: string]: unknown },
  name: string,
): ContractMethod {
  const fn = contract[name];
  if (typeof fn !== "function") {
    throw new Error(`Contract method not found: ${name}`);
  }
  return fn as ContractMethod;
}

/**
 * Typed client for the TransferMarketplace contract.
 *
 * Manages player transfer listings and offers. Sellers create listings
 * for player entities; buyers make offers on active listings. The
 * contract enforces listing and offer lifecycle rules on-chain.
 *
 * @example
 * ```ts
 * const listing = await tc.marketplace.getListing(1n);
 * console.log(listing.price, listing.status);
 *
 * const result = await tc.marketplace.createListing({
 *   seller: "0xBEEF...",
 *   playerId: 1n,
 *   clubId: 1n,
 *   price: 1000n * 10n ** 18n,
 *   metadataUri: "ipfs://Qm...",
 * });
 * ```
 */
export class MarketplaceClient {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly transactionManager: TransactionManager,
  ) {}

  // ── Read Methods ──────────────────────────────────────────────

  /**
   * Get a listing by its on-chain ID.
   *
   * @param listingId - The auto-incremented listing ID.
   * @returns The full listing entity.
   * @throws {ContractError} If no listing exists for the given ID.
   */
  async getListing(listingId: bigint): Promise<Listing> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      MARKETPLACE_ABI,
    );
    const result = await getMethod(contract, "getListing")(listingId);
    return this.parseListing(result);
  }

  /**
   * Get an offer for a specific listing and buyer.
   *
   * @param listingId - The listing ID.
   * @param buyer - The buyer's address.
   * @returns The full offer entity.
   * @throws {ContractError} If no offer exists for the given pair.
   */
  async getOffer(listingId: bigint, buyer: string): Promise<Offer> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      MARKETPLACE_ABI,
    );
    const result = await getMethod(contract, "getOffer")(listingId, buyer);
    return this.parseOffer(result);
  }

  /**
   * Get the next listing ID that will be assigned on creation.
   *
   * @returns The next listing ID.
   */
  async getNextListingId(): Promise<bigint> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      MARKETPLACE_ABI,
    );
    return (await getMethod(contract, "nextListingId")()) as bigint;
  }

  // ── Write Methods ─────────────────────────────────────────────

  /**
   * Create a new listing. Requires a signer.
   *
   * @param params - The listing parameters.
   * @returns The transaction result with decoded events.
   */
  async createListing(params: CreateListingParams): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      MARKETPLACE_ABI,
      "createListing",
      [
        params.seller,
        params.playerId,
        params.clubId,
        params.price,
        params.metadataUri,
      ],
    );
  }

  /**
   * Cancel an active listing. Requires the caller to be the listing
   * seller.
   *
   * @param listingId - The listing ID to cancel.
   * @param caller - The address cancelling the listing (must be the
   *   seller).
   * @returns The transaction result.
   */
  async cancelListing(
    listingId: bigint,
    caller: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      MARKETPLACE_ABI,
      "cancelListing",
      [listingId, caller],
    );
  }

  /**
   * Make an offer on an active listing. Requires a signer.
   *
   * @param params - The offer parameters.
   * @returns The transaction result with decoded events.
   */
  async makeOffer(params: MakeOfferParams): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      MARKETPLACE_ABI,
      "makeOffer",
      [params.listingId, params.buyer, params.amount],
    );
  }

  /**
   * Reject an offer on a listing. Requires the caller to be the
   * listing seller.
   *
   * @param listingId - The listing ID.
   * @param buyer - The buyer whose offer is being rejected.
   * @param caller - The address rejecting the offer (must be the
   *   seller).
   * @returns The transaction result.
   */
  async rejectOffer(
    listingId: bigint,
    buyer: string,
    caller: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      MARKETPLACE_ABI,
      "rejectOffer",
      [listingId, buyer, caller],
    );
  }

  // ── Private Helpers ───────────────────────────────────────────

  private parseListing(raw: unknown): Listing {
    const r = raw as Record<string, unknown>;
    return {
      id: BigInt(r.id as bigint | number),
      seller: r.seller as string,
      playerId: BigInt(r.playerId as bigint | number),
      clubId: BigInt(r.clubId as bigint | number),
      price: BigInt(r.price as bigint | number),
      metadataURI: r.metadataURI as string,
      status: r.status as ListingStatus,
      createdAt: BigInt(r.createdAt as bigint | number),
    };
  }

  private parseOffer(raw: unknown): Offer {
    const r = raw as Record<string, unknown>;
    return {
      listingId: BigInt(r.listingId as bigint | number),
      buyer: r.buyer as string,
      amount: BigInt(r.amount as bigint | number),
      status: r.status as OfferStatus,
      createdAt: BigInt(r.createdAt as bigint | number),
    };
  }
}

// Re-export enums for convenience
export { ListingStatus, OfferStatus };
