import type { TransactionReceipt } from "ethers";

/**
 * The result of a successful on-chain write operation.
 *
 * Every write method on domain clients returns this type, giving
 * consumers access to the transaction hash, receipt, and decoded
 * events.
 *
 * @typeParam TEvent - The decoded event type emitted by the
 *   transaction.
 */
export interface TransactionResult<TEvent = unknown> {
  /** The transaction hash. */
  readonly txHash: string;

  /** The confirmed transaction receipt. */
  readonly receipt: TransactionReceipt;

  /** Decoded events emitted by this transaction. */
  readonly events: TEvent[];
}
