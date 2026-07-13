import { TransferChainError } from "./transfer-chain-error.js";

export class ValidationError extends TransferChainError {
  constructor(
    code: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(code, message, context);
    this.name = "ValidationError";
  }
}
