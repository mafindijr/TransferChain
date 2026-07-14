import { TransferChainError } from "./transfer-chain-error.js";

export class ContractError extends TransferChainError {
  readonly contractErrorName: string;
  readonly contractErrorArgs?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    contractErrorName: string,
    contractErrorArgs?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(code, message, undefined, cause);
    this.name = "ContractError";
    this.contractErrorName = contractErrorName;
    this.contractErrorArgs = contractErrorArgs;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      contractErrorName: this.contractErrorName,
      contractErrorArgs: this.contractErrorArgs,
    };
  }
}
