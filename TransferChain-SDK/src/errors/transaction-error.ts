import { TransferChainError } from "./transfer-chain-error.js";

export class TransactionError extends TransferChainError {
  readonly txHash?: string;

  constructor(
    code: string,
    message: string,
    txHash?: string,
    cause?: Error,
  ) {
    super(code, message, undefined, cause);
    this.name = "TransactionError";
    this.txHash = txHash;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      txHash: this.txHash,
    };
  }
}
