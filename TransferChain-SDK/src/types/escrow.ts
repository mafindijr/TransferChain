/**
 * Mirrors the Solidity `DepositStatus` enum in `Escrow.sol`.
 *
 * @see Escrow.DepositStatus
 */
export enum DepositStatus {
  Created = 0,
  Funded = 1,
  Released = 2,
  Refunded = 3,
  Disputed = 4,
}

/**
 * On-chain escrow deposit entity returned by
 * `EscrowClient.getDeposit()`.
 *
 * All fields match the Solidity `Deposit` struct.
 */
export interface Deposit {
  /** On-chain auto-incremented deposit ID. */
  id: bigint;
  /** The ERC-20 token address held in escrow. */
  token: string;
  /** The escrowed amount in the token's base unit. */
  amount: bigint;
  /** The agreement ID this deposit is linked to. */
  agreementId: bigint;
  /** The payer's address (depositor). */
  payer: string;
  /** The payee's address (recipient on release). */
  payee: string;
  /** Current status of the deposit. */
  status: DepositStatus;
  /** Unix timestamp (seconds) when the deposit was created. */
  createdAt: bigint;
}

/**
 * Parameters for `EscrowClient.deposit()`.
 *
 * @see Escrow.deposit
 */
export interface DepositParams {
  /** The ERC-20 token address to deposit. */
  token: string;
  /** The amount to deposit in the token's base unit. */
  amount: bigint;
  /** The agreement ID to link this deposit to. */
  agreementId: bigint;
  /** The payee's address (receives funds on release). */
  payee: string;
}
