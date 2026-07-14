/**
 * Mirrors the Solidity `AgreementStatus` enum in
 * `TransferAgreementManager.sol`.
 *
 * @see TransferAgreementManager.AgreementStatus
 */
export enum AgreementStatus {
  Draft = 0,
  Approved = 1,
  Rejected = 2,
  Expired = 3,
  Signed = 4,
}

/**
 * The financial and contractual clauses of a transfer agreement.
 *
 * Mirrors the Solidity `ClauseSet` struct.
 */
export interface ClauseSet {
  /** Transfer fee in base token units. */
  transferFee: bigint;
  /** Signing bonus in base token units. */
  signingBonus: bigint;
  /** Sell-on percentage (basis points). */
  sellOnPercentage: bigint;
  /** Release clause amount in base token units. */
  releaseClause: bigint;
  /** Installment payment amount in base token units. */
  installmentAmount: bigint;
  /** Appearance bonus in base token units. */
  appearanceBonus: bigint;
  /** Goal bonus in base token units. */
  goalBonus: bigint;
  /** Whether medical approval is required before signing. */
  medicalApprovalRequired: boolean;
  /** Unix timestamp (seconds) for the negotiation deadline. */
  negotiationDeadline: bigint;
  /** Unix timestamp (seconds) for the agreement expiration. */
  agreementExpiration: bigint;
  /** IPFS or HTTP URI pointing to the full clause metadata. */
  metadataURI: string;
}

/**
 * On-chain agreement entity returned by
 * `AgreementClient.getAgreement()`.
 *
 * All fields match the Solidity `Agreement` struct.
 */
export interface Agreement {
  /** On-chain auto-incremented agreement ID. */
  id: bigint;
  /** The listing ID this agreement was created for. */
  listingId: bigint;
  /** The buyer's address. */
  buyer: string;
  /** The seller's address. */
  seller: string;
  /** Current status of the agreement. */
  status: AgreementStatus;
  /** The financial and contractual clauses. */
  clauses: ClauseSet;
  /** Whether the buyer has signed. */
  buyerSigned: boolean;
  /** Whether the seller has signed. */
  sellerSigned: boolean;
  /** Unix timestamp (seconds) when the agreement was created. */
  createdAt: bigint;
}

/**
 * Parameters for `AgreementClient.createAgreement()`.
 *
 * @see TransferAgreementManager.createAgreement
 */
export interface CreateAgreementParams {
  /** The listing ID to create an agreement for. */
  listingId: bigint;
  /** The buyer's address. */
  buyer: string;
  /** The seller's address. */
  seller: string;
  /** Transfer fee in base token units. */
  transferFee: bigint;
  /** Signing bonus in base token units. */
  signingBonus: bigint;
  /** Sell-on percentage (basis points). */
  sellOnPercentage: bigint;
  /** Release clause amount in base token units. */
  releaseClause: bigint;
  /** Installment payment amount in base token units. */
  installmentAmount: bigint;
  /** Appearance bonus in base token units. */
  appearanceBonus: bigint;
  /** Goal bonus in base token units. */
  goalBonus: bigint;
  /** IPFS or HTTP URI pointing to the full clause metadata. */
  metadataUri: string;
}
