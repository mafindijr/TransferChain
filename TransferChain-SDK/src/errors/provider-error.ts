import { TransferChainError } from "./transfer-chain-error.js";

export class ProviderError extends TransferChainError {
  constructor(code: string, message: string, cause?: Error) {
    super(code, message, undefined, cause);
    this.name = "ProviderError";
  }
}
