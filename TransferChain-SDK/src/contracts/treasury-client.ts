import type { ContractRegistry } from "../core/contract-registry.js";
import type { TransactionManager } from "../core/transaction-manager.js";
import { TREASURY_ABI } from "../abi/index.js";
import type { TransactionResult } from "../types/transaction-result.js";

/** The deployment manifest key for the Treasury contract. */
const CONTRACT = "treasury" as const;

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
 * Typed client for the Treasury contract.
 *
 * Manages protocol-level ERC-20 token balances. The treasury holds
 * tokens deposited by the protocol and allows the owner to withdraw
 * them.
 *
 * @example
 * ```ts
 * const balance = await tc.treasury.getTokenBalance("0xToken...");
 * console.log(balance);
 *
 * const result = await tc.treasury.depositToken("0xToken...", 1000n * 10n ** 18n);
 * ```
 */
export class TreasuryClient {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly transactionManager: TransactionManager,
  ) {}

  // ── Read Methods ──────────────────────────────────────────────

  /**
   * Get the ERC-20 token balance held by the treasury.
   *
   * @param token - The ERC-20 token address.
   * @returns The token balance in the token's base unit.
   */
  async getTokenBalance(token: string): Promise<bigint> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      TREASURY_ABI,
    );
    return (await getMethod(contract, "tokenBalance")(token)) as bigint;
  }

  /**
   * Get the contract owner address.
   *
   * @returns The checksummed owner address.
   */
  async getOwner(): Promise<string> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      TREASURY_ABI,
    );
    return (await getMethod(contract, "owner")()) as string;
  }

  // ── Write Methods ─────────────────────────────────────────────

  /**
   * Deposit ERC-20 tokens into the treasury. Requires a signer.
   *
   * @param token - The ERC-20 token address.
   * @param amount - The amount to deposit.
   * @returns The transaction result.
   */
  async depositToken(
    token: string,
    amount: bigint,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      TREASURY_ABI,
      "depositToken",
      [token, amount],
    );
  }

  /**
   * Withdraw ERC-20 tokens from the treasury. Requires owner.
   *
   * @param token - The ERC-20 token address.
   * @param to - The recipient address.
   * @param amount - The amount to withdraw.
   * @returns The transaction result.
   */
  async withdrawToken(
    token: string,
    to: string,
    amount: bigint,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      TREASURY_ABI,
      "withdrawToken",
      [token, to, amount],
    );
  }
}