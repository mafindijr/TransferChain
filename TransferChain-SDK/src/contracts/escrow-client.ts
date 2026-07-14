import type { ContractRegistry } from "../core/contract-registry.js";
import type { TransactionManager } from "../core/transaction-manager.js";
import { ESCROW_ABI } from "../abi/index.js";
import type { TransactionResult } from "../types/transaction-result.js";
import type { Deposit, DepositParams } from "../types/escrow.js";
import { DepositStatus } from "../types/escrow.js";

/** The deployment manifest key for the Escrow contract. */
const CONTRACT = "escrow" as const;

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
 * Typed client for the Escrow contract.
 *
 * Manages ERC-20 token escrow deposits linked to transfer agreements.
 * Funds are deposited, then either released to the payee or refunded
 * to the payer.
 *
 * @example
 * ```ts
 * const deposit = await tc.escrow.getDeposit(1n);
 * console.log(deposit.amount, deposit.status);
 *
 * const result = await tc.escrow.deposit({
 *   token: "0xToken...",
 *   amount: 1000n * 10n ** 18n,
 *   agreementId: 1n,
 *   payee: "0xCAFE...",
 * });
 * ```
 */
export class EscrowClient {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly transactionManager: TransactionManager,
  ) {}

  // ── Read Methods ──────────────────────────────────────────────

  /**
   * Get a deposit by its on-chain ID.
   *
   * @param depositId - The auto-incremented deposit ID.
   * @returns The full deposit entity.
   * @throws {ContractError} If no deposit exists for the given ID.
   */
  async getDeposit(depositId: bigint): Promise<Deposit> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      ESCROW_ABI,
    );
    const result = await getMethod(contract, "getDeposit")(depositId);
    return this.parseDeposit(result);
  }

  /**
   * Get the next deposit ID that will be assigned on creation.
   *
   * @returns The next deposit ID.
   */
  async getNextDepositId(): Promise<bigint> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      ESCROW_ABI,
    );
    return (await getMethod(contract, "nextDepositId")()) as bigint;
  }

  // ── Write Methods ─────────────────────────────────────────────

  /**
   * Create and fund a new escrow deposit. Requires a signer.
   *
   * The deposit starts in `Created` status and is immediately funded.
   *
   * @param params - The deposit parameters.
   * @returns The transaction result with decoded events.
   */
  async deposit(params: DepositParams): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      ESCROW_ABI,
      "deposit",
      [params.token, params.amount, params.agreementId, params.payee],
    );
  }

  /**
   * Release the escrowed funds to the payee. Requires the caller to
   * be authorized.
   *
   * @param depositId - The deposit ID to release.
   * @param caller - The address authorizing the release.
   * @returns The transaction result.
   */
  async release(
    depositId: bigint,
    caller: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      ESCROW_ABI,
      "release",
      [depositId, caller],
    );
  }

  /**
   * Refund the escrowed funds to the payer. Requires the caller to
   * be authorized.
   *
   * @param depositId - The deposit ID to refund.
   * @param caller - The address authorizing the refund.
   * @returns The transaction result.
   */
  async refund(
    depositId: bigint,
    caller: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      ESCROW_ABI,
      "refund",
      [depositId, caller],
    );
  }

  // ── Private Helpers ───────────────────────────────────────────

  private parseDeposit(raw: unknown): Deposit {
    const r = raw as Record<string, unknown>;
    return {
      id: BigInt(r.id as bigint | number),
      token: r.token as string,
      amount: BigInt(r.amount as bigint | number),
      agreementId: BigInt(r.agreementId as bigint | number),
      payer: r.payer as string,
      payee: r.payee as string,
      status: r.status as DepositStatus,
      createdAt: BigInt(r.createdAt as bigint | number),
    };
  }
}

// Re-export enum for convenience
export { DepositStatus };