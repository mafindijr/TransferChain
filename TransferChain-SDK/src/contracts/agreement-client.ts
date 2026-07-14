import type { ContractRegistry } from "../core/contract-registry.js";
import type { TransactionManager } from "../core/transaction-manager.js";
import { AGREEMENT_MANAGER_ABI } from "../abi/index.js";
import type { TransactionResult } from "../types/transaction-result.js";
import type { Agreement, CreateAgreementParams, ClauseSet } from "../types/agreement.js";
import { AgreementStatus } from "../types/agreement.js";

/** The deployment manifest key for the TransferAgreementManager contract. */
const CONTRACT = "transferAgreementManager" as const;

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
 * Typed client for the TransferAgreementManager contract.
 *
 * Manages the lifecycle of transfer agreements between buyers and
 * sellers. Agreements are created against active listings and
 * progress through a Draft → Signed → Approved workflow.
 *
 * @example
 * ```ts
 * const agreement = await tc.agreements.getAgreement(1n);
 * console.log(agreement.clauses.transferFee, agreement.status);
 *
 * const result = await tc.agreements.createAgreement({
 *   listingId: 1n,
 *   buyer: "0xBEEF...",
 *   seller: "0xCAFE...",
 *   transferFee: 500n * 10n ** 18n,
 *   signingBonus: 100n * 10n ** 18n,
 *   sellOnPercentage: 1000n,
 *   releaseClause: 10000n * 10n ** 18n,
 *   installmentAmount: 0n,
 *   appearanceBonus: 50n * 10n ** 18n,
 *   goalBonus: 100n * 10n ** 18n,
 *   metadataUri: "ipfs://Qm...",
 * });
 * ```
 */
export class AgreementClient {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly transactionManager: TransactionManager,
  ) {}

  // ── Read Methods ──────────────────────────────────────────────

  /**
   * Get an agreement by its on-chain ID.
   *
   * @param agreementId - The auto-incremented agreement ID.
   * @returns The full agreement entity with nested clause set.
   * @throws {ContractError} If no agreement exists for the given ID.
   */
  async getAgreement(agreementId: bigint): Promise<Agreement> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      AGREEMENT_MANAGER_ABI,
    );
    const result = await getMethod(contract, "getAgreement")(agreementId);
    return this.parseAgreement(result);
  }

  /**
   * Get the next agreement ID that will be assigned on creation.
   *
   * @returns The next agreement ID.
   */
  async getNextAgreementId(): Promise<bigint> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      AGREEMENT_MANAGER_ABI,
    );
    return (await getMethod(contract, "nextAgreementId")()) as bigint;
  }

  // ── Write Methods ─────────────────────────────────────────────

  /**
   * Create a new agreement. Requires a signer.
   *
   * The new agreement starts in `Draft` status.
   *
   * @param params - The agreement parameters including all clause
   *   values.
   * @returns The transaction result with decoded events.
   */
  async createAgreement(
    params: CreateAgreementParams,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      AGREEMENT_MANAGER_ABI,
      "createAgreement",
      [
        params.listingId,
        params.buyer,
        params.seller,
        params.transferFee,
        params.signingBonus,
        params.sellOnPercentage,
        params.releaseClause,
        params.installmentAmount,
        params.appearanceBonus,
        params.goalBonus,
        params.metadataUri,
      ],
    );
  }

  /**
   * Approve an agreement. Requires the caller to be a party to the
   * agreement.
   *
   * @param agreementId - The agreement ID to approve.
   * @param caller - The address approving the agreement.
   * @returns The transaction result.
   */
  async approveAgreement(
    agreementId: bigint,
    caller: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      AGREEMENT_MANAGER_ABI,
      "approveAgreement",
      [agreementId, caller],
    );
  }

  /**
   * Reject an agreement. Requires the caller to be a party to the
   * agreement.
   *
   * @param agreementId - The agreement ID to reject.
   * @param caller - The address rejecting the agreement.
   * @returns The transaction result.
   */
  async rejectAgreement(
    agreementId: bigint,
    caller: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      AGREEMENT_MANAGER_ABI,
      "rejectAgreement",
      [agreementId, caller],
    );
  }

  // ── Private Helpers ───────────────────────────────────────────

  private parseClauseSet(raw: unknown): ClauseSet {
    const r = raw as Record<string, unknown>;
    return {
      transferFee: BigInt(r.transferFee as bigint | number),
      signingBonus: BigInt(r.signingBonus as bigint | number),
      sellOnPercentage: BigInt(r.sellOnPercentage as bigint | number),
      releaseClause: BigInt(r.releaseClause as bigint | number),
      installmentAmount: BigInt(r.installmentAmount as bigint | number),
      appearanceBonus: BigInt(r.appearanceBonus as bigint | number),
      goalBonus: BigInt(r.goalBonus as bigint | number),
      medicalApprovalRequired: r.medicalApprovalRequired as boolean,
      negotiationDeadline: BigInt(r.negotiationDeadline as bigint | number),
      agreementExpiration: BigInt(r.agreementExpiration as bigint | number),
      metadataURI: r.metadataURI as string,
    };
  }

  private parseAgreement(raw: unknown): Agreement {
    const r = raw as Record<string, unknown>;
    return {
      id: BigInt(r.id as bigint | number),
      listingId: BigInt(r.listingId as bigint | number),
      buyer: r.buyer as string,
      seller: r.seller as string,
      status: r.status as AgreementStatus,
      clauses: this.parseClauseSet(r.clauses),
      buyerSigned: r.buyerSigned as boolean,
      sellerSigned: r.sellerSigned as boolean,
      createdAt: BigInt(r.createdAt as bigint | number),
    };
  }
}

// Re-export enum for convenience
export { AgreementStatus };