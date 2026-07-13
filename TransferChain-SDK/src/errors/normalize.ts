import { TransferChainError } from "./transfer-chain-error.js";
import { ValidationError } from "./validation-error.js";
import { ContractError } from "./contract-error.js";
import { ProviderError } from "./provider-error.js";
import { TransactionError } from "./transaction-error.js";
import { SdkErrorCode } from "./codes.js";

/**
 * Normalize any error into a `TransferChainError` subclass.
 *
 * This is the single point of error conversion. Every error produced
 * by the SDK passes through this function before being thrown to
 * consumers.
 *
 * @param error - The raw error to normalize.
 * @returns A `TransferChainError` subclass.
 */
export function normalize(error: Error): TransferChainError {
  const name = error.name;

  // Already an SDK error
  if (error instanceof TransferChainError) {
    return error;
  }

  // ethers.js contract revert
  if (
    name === "ContractFunctionRevertError" ||
    name === "ContractRevertError" ||
    name === "BrowserProviderError"
  ) {
    const message = error.message;
    const match = message.match(/reverted with reason string '(.+?)'/);
    const reason = match?.[1] ?? message;

    return new ContractError(
      SdkErrorCode.UNKNOWN,
      reason,
      reason,
      undefined,
      error,
    );
  }

  // ethers.js RPC error
  if (name === "RpcRequestError" || name === "ServerError") {
    return new ProviderError(SdkErrorCode.CONNECTION_FAILED, error.message, error);
  }

  // ethers.js transaction error
  if (
    name === "TransactionRevertedError" ||
    name === "TransactionFailedError"
  ) {
    return new TransactionError(
      SdkErrorCode.SUBMISSION_FAILED,
      error.message,
      undefined,
      error,
    );
  }

  // Validation errors from the SDK
  if (name === "TypeError" || name === "RangeError") {
    return new ValidationError(SdkErrorCode.INVALID_ADDRESS, error.message);
  }

  // Fallback
  return new TransferChainError(
    SdkErrorCode.UNKNOWN,
    error.message,
    undefined,
    error,
  );
}
