import type { ContractRegistry } from "../core/contract-registry.js";
import type { TransactionManager } from "../core/transaction-manager.js";
import { CONFIG_ABI } from "../abi/index.js";
import type { TransactionResult } from "../types/transaction-result.js";

/** The deployment manifest key for the Config contract. */
const CONTRACT = "transferChainConfig" as const;

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
 * Typed client for the TransferChainConfig contract.
 *
 * Provides read and write access to protocol configuration: treasury
 * address, marketplace fee, payment tokens, and emergency mode.
 *
 * @example
 * ```ts
 * const treasury = await tc.config.getTreasury();
 * const fee = await tc.config.getMarketplaceFee();
 * ```
 */
export class ConfigClient {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly transactionManager: TransactionManager,
  ) {}

  // ── Read Methods ──────────────────────────────────────────────

  /**
   * Get the treasury address that receives protocol fees.
   *
   * @returns The checksummed treasury address.
   */
  async getTreasury(): Promise<string> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CONFIG_ABI,
    );
    return (await getMethod(contract, "treasury")()) as string;
  }

  /**
   * Get the marketplace fee in basis points (1 bp = 0.01%).
   *
   * @returns The fee in basis points.
   */
  async getMarketplaceFee(): Promise<bigint> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CONFIG_ABI,
    );
    return (await getMethod(contract, "marketplaceFeeBps")()) as bigint;
  }

  /**
   * Check whether the protocol is operational (not paused, not in
   * emergency mode).
   *
   * @returns `true` if the protocol is operational.
   */
  async isProtocolOperational(): Promise<boolean> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CONFIG_ABI,
    );
    return (await getMethod(contract, "isProtocolOperational")()) as boolean;
  }

  /**
   * Check whether an ERC-20 token is a supported payment token.
   *
   * @param token - The token contract address.
   * @returns `true` if the token is supported.
   */
  async isPaymentTokenSupported(token: string): Promise<boolean> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CONFIG_ABI,
    );
    return (await getMethod(contract, "isPaymentTokenSupported")(token)) as boolean;
  }

  /**
   * Get the current protocol version number.
   *
   * @returns The protocol version.
   */
  async getProtocolVersion(): Promise<bigint> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CONFIG_ABI,
    );
    return (await getMethod(contract, "protocolVersion")()) as bigint;
  }

  /**
   * Check whether the protocol is paused.
   *
   * @returns `true` if paused.
   */
  async isPaused(): Promise<boolean> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CONFIG_ABI,
    );
    return (await getMethod(contract, "paused")()) as boolean;
  }

  /**
   * Check whether emergency mode is enabled.
   *
   * @returns `true` if emergency mode is active.
   */
  async isEmergencyMode(): Promise<boolean> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CONFIG_ABI,
    );
    return (await getMethod(contract, "emergencyMode")()) as boolean;
  }

  /**
   * Get the contract owner address.
   *
   * @returns The checksummed owner address.
   */
  async getOwner(): Promise<string> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CONFIG_ABI,
    );
    return (await getMethod(contract, "owner")()) as string;
  }

  // ── Write Methods ─────────────────────────────────────────────

  /**
   * Set the treasury address. Requires owner.
   *
   * @param treasury - The new treasury address.
   * @returns The transaction result.
   */
  async setTreasury(treasury: string): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      CONFIG_ABI,
      "setTreasury",
      [treasury],
    );
  }

  /**
   * Set the marketplace fee in basis points. Requires owner.
   *
   * @param feeBps - The new fee (0–10000).
   * @returns The transaction result.
   */
  async setMarketplaceFee(feeBps: bigint): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      CONFIG_ABI,
      "setMarketplaceFee",
      [feeBps],
    );
  }

  /**
   * Enable or disable emergency mode. Requires owner.
   *
   * @param enabled - `true` to enable, `false` to disable.
   * @returns The transaction result.
   */
  async setEmergencyMode(enabled: boolean): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      CONFIG_ABI,
      "setEmergencyMode",
      [enabled],
    );
  }

  /**
   * Add a supported payment token. Requires owner.
   *
   * @param token - The ERC-20 token address to add.
   * @returns The transaction result.
   */
  async addPaymentToken(token: string): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      CONFIG_ABI,
      "addSupportedPaymentToken",
      [token],
    );
  }

  /**
   * Remove a supported payment token. Requires owner.
   *
   * @param token - The ERC-20 token address to remove.
   * @returns The transaction result.
   */
  async removePaymentToken(token: string): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      CONFIG_ABI,
      "removeSupportedPaymentToken",
      [token],
    );
  }
}
