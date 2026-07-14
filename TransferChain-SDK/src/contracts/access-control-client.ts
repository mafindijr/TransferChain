import type { ContractRegistry } from "../core/contract-registry.js";
import type { TransactionManager } from "../core/transaction-manager.js";
import { ACCESS_CONTROL_ABI } from "../abi/index.js";
import type { TransactionResult } from "../types/transaction-result.js";

/** The deployment manifest key for the AccessControl contract. */
const CONTRACT = "transferChainAccessControl" as const;

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
 * Typed client for the TransferChainAccessControl contract.
 *
 * Provides read and write access to role management and pause
 * functionality. Write methods delegate to the {@link TransactionManager}
 * and require a signer.
 *
 * @example
 * ```ts
 * const isPaused = await tc.accessControl.isPaused();
 * const hasRole = await tc.accessControl.hasRole(ROLES.PAUSER, address);
 * ```
 */
export class AccessControlClient {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly transactionManager: TransactionManager,
  ) {}

  // ── Read Methods ──────────────────────────────────────────────

  /**
   * Check whether `account` holds `role`.
   *
   * @param role - The `bytes32` role identifier (use {@link ROLES}).
   * @param account - The address to check.
   * @returns `true` if the account holds the role.
   */
  async hasRole(role: string, account: string): Promise<boolean> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      ACCESS_CONTROL_ABI,
    );
    return (await getMethod(contract, "hasRole")(role, account)) as boolean;
  }

  /**
   * Check whether the protocol is currently paused.
   *
   * @returns `true` if the protocol is paused.
   */
  async isPaused(): Promise<boolean> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      ACCESS_CONTROL_ABI,
    );
    return (await getMethod(contract, "isPaused")()) as boolean;
  }

  /**
   * Get the admin role for a given role.
   *
   * @param role - The `bytes32` role identifier.
   * @returns The `bytes32` admin role for the given role.
   */
  async getRoleAdmin(role: string): Promise<string> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      ACCESS_CONTROL_ABI,
    );
    return (await getMethod(contract, "getRoleAdmin")(role)) as string;
  }

  // ── Write Methods ─────────────────────────────────────────────

  /**
   * Grant a role to an account. Requires the caller to hold the
   * admin role for the target role.
   *
   * @param role - The `bytes32` role identifier.
   * @param account - The address to grant the role to.
   * @returns The transaction result.
   */
  async grantRole(
    role: string,
    account: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      ACCESS_CONTROL_ABI,
      "grantRole",
      [role, account],
    );
  }

  /**
   * Revoke a role from an account. Requires the caller to hold the
   * admin role for the target role.
   *
   * @param role - The `bytes32` role identifier.
   * @param account - The address to revoke the role from.
   * @returns The transaction result.
   */
  async revokeRole(
    role: string,
    account: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      ACCESS_CONTROL_ABI,
      "revokeRole",
      [role, account],
    );
  }

  /**
   * Pause the protocol. Requires the PAUSER_ROLE.
   *
   * @returns The transaction result.
   */
  async pause(): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      ACCESS_CONTROL_ABI,
      "pause",
      [],
    );
  }

  /**
   * Unpause the protocol. Requires the PAUSER_ROLE.
   *
   * @returns The transaction result.
   */
  async unpause(): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      ACCESS_CONTROL_ABI,
      "unpause",
      [],
    );
  }
}
