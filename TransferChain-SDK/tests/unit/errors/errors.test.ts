import { describe, it, expect } from "vitest";
import {
  TransferChainError,
  ValidationError,
  ContractError,
  ProviderError,
  TransactionError,
  ChainMismatchError,
  SdkErrorCode,
} from "../../../src/errors/index.js";

describe("TransferChainError", () => {
  it("should set code and message", () => {
    const error = new TransferChainError(SdkErrorCode.UNKNOWN, "test error");
    expect(error.code).toBe("UNKNOWN");
    expect(error.message).toBe("test error");
    expect(error.name).toBe("TransferChainError");
  });

  it("should set context", () => {
    const ctx = { chainId: 8888 };
    const error = new TransferChainError(SdkErrorCode.UNKNOWN, "test", ctx);
    expect(error.context).toEqual(ctx);
  });

  it("should preserve cause", () => {
    const cause = new Error("original");
    const error = new TransferChainError(
      SdkErrorCode.UNKNOWN,
      "wrapped",
      undefined,
      cause,
    );
    expect(error.cause).toBe(cause);
  });

  it("should serialize to JSON", () => {
    const error = new TransferChainError(
      SdkErrorCode.UNKNOWN,
      "test",
      { foo: "bar" },
    );
    const json = error.toJSON();
    expect(json).toEqual({
      name: "TransferChainError",
      code: "UNKNOWN",
      message: "test",
      context: { foo: "bar" },
    });
  });

  it("should be instanceof Error", () => {
    const error = new TransferChainError(SdkErrorCode.UNKNOWN, "test");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TransferChainError);
  });
});

describe("ValidationError", () => {
  it("should set name to ValidationError", () => {
    const error = new ValidationError(
      SdkErrorCode.INVALID_ADDRESS,
      "bad address",
    );
    expect(error.name).toBe("ValidationError");
    expect(error.code).toBe("INVALID_ADDRESS");
  });

  it("should be instanceof TransferChainError", () => {
    const error = new ValidationError(SdkErrorCode.INVALID_ADDRESS, "bad");
    expect(error).toBeInstanceOf(TransferChainError);
  });
});

describe("ContractError", () => {
  it("should set contract error details", () => {
    const error = new ContractError(
      SdkErrorCode.PLAYER_NOT_FOUND,
      "player not found",
      "PlayerNotFound",
      { playerId: 1n },
    );
    expect(error.name).toBe("ContractError");
    expect(error.contractErrorName).toBe("PlayerNotFound");
    expect(error.contractErrorArgs).toEqual({ playerId: 1n });
  });

  it("should serialize contract error details to JSON", () => {
    const error = new ContractError(
      SdkErrorCode.UNAUTHORIZED,
      "unauthorized",
      "Unauthorized",
    );
    const json = error.toJSON();
    expect(json.contractErrorName).toBe("Unauthorized");
    expect(json.contractErrorArgs).toBeUndefined();
  });
});

describe("ProviderError", () => {
  it("should set name and code", () => {
    const cause = new Error("fetch failed");
    const error = new ProviderError(
      SdkErrorCode.CONNECTION_FAILED,
      "cannot connect",
      cause,
    );
    expect(error.name).toBe("ProviderError");
    expect(error.code).toBe("CONNECTION_FAILED");
    expect(error.cause).toBe(cause);
  });
});

describe("TransactionError", () => {
  it("should set txHash when provided", () => {
    const error = new TransactionError(
      SdkErrorCode.SUBMISSION_FAILED,
      "submitted",
      "0xabc123",
    );
    expect(error.txHash).toBe("0xabc123");
    expect(error.toJSON().txHash).toBe("0xabc123");
  });

  it("should allow undefined txHash", () => {
    const error = new TransactionError(
      SdkErrorCode.GAS_ESTIMATION_FAILED,
      "estimation failed",
    );
    expect(error.txHash).toBeUndefined();
  });
});

describe("ChainMismatchError", () => {
  it("should set expected and actual chain IDs", () => {
    const error = new ChainMismatchError(1439, 1);
    expect(error.name).toBe("ChainMismatchError");
    expect(error.code).toBe("CHAIN_MISMATCH");
    expect(error.message).toBe("Expected chain 1439, got 1");
    expect(error.context).toEqual({ expectedChainId: 1439, actualChainId: 1 });
  });

  it("should be instanceof TransferChainError", () => {
    const error = new ChainMismatchError(1439, 525);
    expect(error).toBeInstanceOf(TransferChainError);
    expect(error).toBeInstanceOf(Error);
  });

  it("should serialize chain mismatch details to JSON", () => {
    const error = new ChainMismatchError(1439, 8888);
    const json = error.toJSON();
    expect(json.context).toEqual({ expectedChainId: 1439, actualChainId: 8888 });
  });
});

describe("SdkErrorCode", () => {
  it("should have all expected validation codes", () => {
    expect(SdkErrorCode.INVALID_ADDRESS).toBe("INVALID_ADDRESS");
    expect(SdkErrorCode.SIGNER_REQUIRED).toBe("SIGNER_REQUIRED");
    expect(SdkErrorCode.CHAIN_NOT_SUPPORTED).toBe("CHAIN_NOT_SUPPORTED");
  });

  it("should have all expected contract codes", () => {
    expect(SdkErrorCode.PLAYER_NOT_FOUND).toBe("PLAYER_NOT_FOUND");
    expect(SdkErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(SdkErrorCode.PROTOCOL_PAUSED).toBe("PROTOCOL_PAUSED");
  });

  it("should have all expected provider codes", () => {
    expect(SdkErrorCode.CONNECTION_FAILED).toBe("CONNECTION_FAILED");
    expect(SdkErrorCode.CHAIN_MISMATCH).toBe("CHAIN_MISMATCH");
    expect(SdkErrorCode.REQUEST_TIMEOUT).toBe("REQUEST_TIMEOUT");
  });

  it("should have all expected transaction codes", () => {
    expect(SdkErrorCode.GAS_ESTIMATION_FAILED).toBe("GAS_ESTIMATION_FAILED");
    expect(SdkErrorCode.SUBMISSION_FAILED).toBe("SUBMISSION_FAILED");
    expect(SdkErrorCode.CONFIRMATION_TIMEOUT).toBe("CONFIRMATION_TIMEOUT");
  });
});
