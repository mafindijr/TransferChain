import { TransferChainError } from "./transfer-chain-error.js";

export class ChainMismatchError extends TransferChainError {
  constructor(
    expectedChainId: number,
    actualChainId: number,
  ) {
    super(
      "CHAIN_MISMATCH",
      `Expected chain ${expectedChainId}, got ${actualChainId}`,
      { expectedChainId, actualChainId },
    );
    this.name = "ChainMismatchError";
  }
}
