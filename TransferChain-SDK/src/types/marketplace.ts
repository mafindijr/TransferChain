/**
 * Mirrors the Solidity `ListingStatus` enum in `TransferMarketplace.sol`.
 *
 * @see TransferMarketplace.ListingStatus
 */
export enum ListingStatus {
  Active = 0,
  Cancelled = 1,
  Sold = 2,
  Paused = 3,
}

/**
 * Mirrors the Solidity `OfferStatus` enum in `TransferMarketplace.sol`.
 *
 * @see TransferMarketplace.OfferStatus
 */
export enum OfferStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Expired = 3,
}

/**
 * On-chain listing entity returned by `MarketplaceClient.getListing()`.
 *
 * All fields match the Solidity `Listing` struct.
 */
export interface Listing {
  /** On-chain auto-incremented listing ID. */
  id: bigint;
  /** The seller's address. */
  seller: string;
  /** The player entity ID being listed. */
  playerId: bigint;
  /** The club entity ID associated with the listing. */
  clubId: bigint;
  /** The listing price in the protocol's base token unit. */
  price: bigint;
  /** IPFS or HTTP URI pointing to the listing's metadata JSON. */
  metadataURI: string;
  /** Current status of the listing. */
  status: ListingStatus;
  /** Unix timestamp (seconds) when the listing was created. */
  createdAt: bigint;
}

/**
 * On-chain offer entity returned by `MarketplaceClient.getOffer()`.
 *
 * All fields match the Solidity `Offer` struct.
 */
export interface Offer {
  /** The listing ID this offer targets. */
  listingId: bigint;
  /** The buyer's address. */
  buyer: string;
  /** The offer amount in the protocol's base token unit. */
  amount: bigint;
  /** Current status of the offer. */
  status: OfferStatus;
  /** Unix timestamp (seconds) when the offer was made. */
  createdAt: bigint;
}

/**
 * Parameters for `MarketplaceClient.createListing()`.
 *
 * @see TransferMarketplace.createListing
 */
export interface CreateListingParams {
  /** The seller's address. */
  seller: string;
  /** The player entity ID to list. */
  playerId: bigint;
  /** The club entity ID associated with the listing. */
  clubId: bigint;
  /** The listing price in the protocol's base token unit. */
  price: bigint;
  /** IPFS or HTTP URI pointing to the listing's metadata JSON. */
  metadataUri: string;
}

/**
 * Parameters for `MarketplaceClient.makeOffer()`.
 *
 * @see TransferMarketplace.makeOffer
 */
export interface MakeOfferParams {
  /** The listing ID to make an offer on. */
  listingId: bigint;
  /** The buyer's address. */
  buyer: string;
  /** The offer amount in the protocol's base token unit. */
  amount: bigint;
}
