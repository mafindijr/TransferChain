import type { SdkErrorCode } from "./codes.js";

export class TransferChainError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    code: SdkErrorCode | string,
    message: string,
    context?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(message, { cause });
    this.name = "TransferChainError";
    this.code = code;
    this.context = context;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}
