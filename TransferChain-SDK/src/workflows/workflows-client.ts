import type { AgreementClient } from "../contracts/agreement-client.js";
import type { EscrowClient } from "../contracts/escrow-client.js";
import type { MarketplaceClient } from "../contracts/marketplace-client.js";
import type { PlayerRegistryClient } from "../contracts/player-registry-client.js";
import type { ClubRegistryClient } from "../contracts/club-registry-client.js";
import type {
  ClubRegistrationWorkflowParams,
  ListingWorkflowParams,
  PlayerRegistrationWorkflowParams,
  TransferWorkflowParams,
  TransferWorkflowResult,
} from "./types.js";

/**
 * Orchestrates multi-step workflows that chain multiple contract
 * interactions into a single high-level operation.
 *
 * Workflows are convenience helpers — each step can also be
 * performed individually via the underlying domain clients.
 *
 * @example
 * ```typescript
 * // Full transfer lifecycle
 * const result = await tc.workflows.transfer({
 *   agreement: { listingId: 1n, buyer: "0x...", seller: "0x...", ... },
 *   deposit: { token: "0x...", amount: 1000n, payee: "0x..." },
 *   approver: "0x...",
 * });
 * ```
 */
export class WorkflowsClient {
  private readonly agreementClient: AgreementClient;
  private readonly escrowClient: EscrowClient;
  private readonly marketplaceClient: MarketplaceClient;
  private readonly playerRegistryClient: PlayerRegistryClient;
  private readonly clubRegistryClient: ClubRegistryClient;

  constructor(
    agreementClient: AgreementClient,
    escrowClient: EscrowClient,
    marketplaceClient: MarketplaceClient,
    playerRegistryClient: PlayerRegistryClient,
    clubRegistryClient: ClubRegistryClient,
  ) {
    this.agreementClient = agreementClient;
    this.escrowClient = escrowClient;
    this.marketplaceClient = marketplaceClient;
    this.playerRegistryClient = playerRegistryClient;
    this.clubRegistryClient = clubRegistryClient;
  }

  /**
   * Execute a full player transfer lifecycle.
   *
   * Steps:
   * 1. Create the transfer agreement
   * 2. Approve the agreement (seller signs)
   * 3. Fund the escrow deposit
   * 4. Release the escrow to the payee
   *
   * Each step returns a `TransactionResult`. If any step fails,
   * the error propagates and subsequent steps are not executed.
   */
  async transfer(params: TransferWorkflowParams): Promise<TransferWorkflowResult> {
    const agreementResult = await this.agreementClient.createAgreement({
      listingId: params.agreement.listingId,
      buyer: params.agreement.buyer,
      seller: params.agreement.seller,
      transferFee: params.agreement.transferFee,
      signingBonus: params.agreement.signingBonus,
      sellOnPercentage: params.agreement.sellOnPercentage,
      releaseClause: params.agreement.releaseClause,
      installmentAmount: params.agreement.installmentAmount,
      appearanceBonus: params.agreement.appearanceBonus,
      goalBonus: params.agreement.goalBonus,
      metadataUri: params.agreement.metadataUri ?? "",
    });

    const agreementId = (
      agreementResult.events[0] as { agreementId?: bigint } | undefined
    )?.agreementId;
    if (agreementId === undefined) {
      throw new Error("Agreement creation did not emit an AgreementCreated event");
    }

    await this.agreementClient.approveAgreement(agreementId, params.approver);

    const depositResult = await this.escrowClient.deposit({
      token: params.deposit.token,
      amount: params.deposit.amount,
      agreementId,
      payee: params.deposit.payee,
    });

    const depositId = (
      depositResult.events[0] as { depositId?: bigint } | undefined
    )?.depositId;
    if (depositId === undefined) {
      throw new Error("Deposit did not emit a DepositCreated event");
    }

    const releaseResult = await this.escrowClient.release(depositId, params.approver);

    return {
      agreement: agreementResult,
      deposit: depositResult,
      release: releaseResult,
    };
  }

  /**
   * Create a marketplace listing.
   *
   * This is a thin orchestration wrapper around
   * `MarketplaceClient.createListing()`. Use this when you want
   * workflow-level semantics in your application.
   */
  async createListing(params: ListingWorkflowParams) {
    return this.marketplaceClient.createListing(params.listing);
  }

  /**
   * Register a new player on-chain.
   *
   * Thin orchestration wrapper around
   * `PlayerRegistryClient.registerPlayer()`.
   */
  async registerPlayer(params: PlayerRegistrationWorkflowParams) {
    return this.playerRegistryClient.registerPlayer(params.player);
  }

  /**
   * Register a new club on-chain.
   *
   * Thin orchestration wrapper around
   * `ClubRegistryClient.registerClub()`.
   */
  async registerClub(params: ClubRegistrationWorkflowParams) {
    return this.clubRegistryClient.registerClub(params.club);
  }
}
