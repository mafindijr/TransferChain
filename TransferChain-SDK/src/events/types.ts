import type { PlayerStatus } from "../types/player.js";
import type { ClubStatus } from "../types/club.js";

/**
 * Typed map of all contract events emitted by the 8 TransferChain
 * contracts. Keys are event names; values are the decoded event
 * parameters.
 *
 * This is the single source of truth for event typing across the SDK.
 */
export type ContractEventMap = {
  // ── PlayerRegistry (3) ──────────────────────────────────────
  PlayerRegistered: {
    owner: string;
    playerId: bigint;
    metadataURI: string;
  };
  PlayerMetadataUpdated: {
    owner: string;
    playerId: bigint;
    metadataURI: string;
  };
  PlayerStatusUpdated: {
    owner: string;
    playerId: bigint;
    status: PlayerStatus;
  };

  // ── ClubRegistry (3) ────────────────────────────────────────
  ClubRegistered: {
    owner: string;
    clubId: bigint;
    name: string;
  };
  ClubMetadataUpdated: {
    owner: string;
    clubId: bigint;
    metadataURI: string;
  };
  ClubStatusUpdated: {
    owner: string;
    clubId: bigint;
    status: ClubStatus;
  };

  // ── TransferMarketplace (4) ─────────────────────────────────
  ListingCreated: {
    listingId: bigint;
    seller: string;
    playerId: bigint;
    price: bigint;
  };
  ListingCancelled: {
    listingId: bigint;
    seller: string;
  };
  OfferMade: {
    listingId: bigint;
    buyer: string;
    amount: bigint;
  };
  OfferRejected: {
    listingId: bigint;
    buyer: string;
  };

  // ── TransferAgreementManager (4) ────────────────────────────
  AgreementCreated: {
    agreementId: bigint;
    listingId: bigint;
    buyer: string;
  };
  AgreementApproved: { agreementId: bigint };
  AgreementRejected: { agreementId: bigint };
  AgreementSigned: { agreementId: bigint };

  // ── Escrow (4) ──────────────────────────────────────────────
  DepositCreated: {
    depositId: bigint;
    token: string;
    amount: bigint;
    agreementId: bigint;
  };
  DepositFunded: {
    depositId: bigint;
    token: string;
    amount: bigint;
  };
  DepositReleased: {
    depositId: bigint;
    payee: string;
    amount: bigint;
  };
  DepositRefunded: {
    depositId: bigint;
    payer: string;
    amount: bigint;
  };

  // ── TransferChainConfig (5) ─────────────────────────────────
  TreasuryUpdated: { treasury: string };
  MarketplaceFeeUpdated: { feeBps: bigint };
  PaymentTokenUpdated: { token: string; supported: boolean };
  EmergencyModeUpdated: { enabled: boolean };
  ProtocolPaused: { paused: boolean };

  // ── TransferChainAccessControl (5) ──────────────────────────
  Paused: { account: string };
  Unpaused: { account: string };
  RoleGranted: { role: string; account: string; sender: string };
  RoleRevoked: { role: string; account: string; sender: string };
  RoleAdminChanged: {
    role: string;
    previousAdminRole: string;
    newAdminRole: string;
  };

  // ── Treasury (2) ────────────────────────────────────────────
  TokenDeposited: { token: string; amount: bigint };
  TokenWithdrawn: { token: string; to: string; amount: bigint };
};

/** All valid event names. */
export type ContractEventName = keyof ContractEventMap;

/**
 * Options for live event subscriptions.
 */
export interface SubscriptionOptions {
  /** Filter events by the contract that emitted them. */
  address?: string;
  /** Only emit events from this block onward. */
  fromBlock?: bigint;
  /** Stop listening after this block. */
  toBlock?: bigint;
  /** Custom predicate for additional client-side filtering. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: (event: any) => boolean;
}

/**
 * Options for historical event queries.
 */
export interface QueryOptions {
  /** The start of the block range (inclusive). */
  fromBlock: bigint | "earliest";
  /** The end of the block range (inclusive). */
  toBlock: bigint | "latest";
  /** Filter events by the contract that emitted them. */
  address?: string;
}

/**
 * A decoded event with its block context.
 */
export interface DecodedEvent<TName extends ContractEventName = ContractEventName> {
  /** The event name (e.g. "ListingCreated"). */
  eventName: TName;
  /** The decoded event parameters. */
  args: ContractEventMap[TName];
  /** The block number where this event was emitted. */
  blockNumber: bigint;
  /** The transaction hash. */
  transactionHash: string;
  /** The log index within the transaction. */
  logIndex: number;
}
