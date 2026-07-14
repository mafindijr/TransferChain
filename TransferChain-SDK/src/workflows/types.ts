import type { TransactionResult } from "../types/transaction-result.js";
import type { CreateAgreementParams } from "../types/agreement.js";
import type { DepositParams } from "../types/escrow.js";
import type { CreateListingParams } from "../types/marketplace.js";
import type { RegisterPlayerParams } from "../types/player.js";
import type { RegisterClubParams } from "../types/club.js";

/**
 * Parameters for the full transfer workflow.
 *
 * Chains: create agreement → approve → deposit escrow → release.
 */
export interface TransferWorkflowParams {
  /** Agreement creation parameters. */
  agreement: Omit<CreateAgreementParams, "metadataUri"> & { metadataUri?: string };
  /** Escrow deposit parameters (token + amount + payee). */
  deposit: Omit<DepositParams, "agreementId">;
  /** Address that approves the agreement (seller). */
  approver: string;
}

/**
 * Result of a completed transfer workflow.
 */
export interface TransferWorkflowResult {
  /** The created agreement. */
  agreement: TransactionResult;
  /** The escrow deposit. */
  deposit: TransactionResult;
  /** The escrow release. */
  release: TransactionResult;
}

/**
 * Parameters for the listing workflow.
 */
export interface ListingWorkflowParams {
  /** Listing parameters. */
  listing: CreateListingParams;
}

/**
 * Parameters for the player registration workflow.
 */
export interface PlayerRegistrationWorkflowParams {
  /** Player registration parameters. */
  player: RegisterPlayerParams;
}

/**
 * Parameters for the club registration workflow.
 */
export interface ClubRegistrationWorkflowParams {
  /** Club registration parameters. */
  club: RegisterClubParams;
}
