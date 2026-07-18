# Error Handling

## Table of Contents

- [Error Hierarchy](#error-hierarchy)
- [Error Shape](#error-shape)
- [Error Normalization](#error-normalization)
- [Custom Error Mapping](#custom-error-mapping)
- [Application Error Handling](#application-error-handling)
- [Error Codes](#error-codes)

---

## Error Hierarchy

```
TransferChainError (base)
├── ValidationError
│   ├── INVALID_ADDRESS
│   ├── INVALID_AMOUNT
│   ├── INVALID_METADATA_URI
│   ├── INVALID_PRICE
│   ├── INVALID_FEE
│   ├── SIGNER_REQUIRED
│   └── CHAIN_NOT_SUPPORTED
├── ContractError
│   ├── PLAYER_ALREADY_REGISTERED
│   ├── PLAYER_NOT_FOUND
│   ├── CLUB_ALREADY_REGISTERED
│   ├── CLUB_NOT_FOUND
│   ├── LISTING_NOT_FOUND
│   ├── OFFER_NOT_FOUND
│   ├── AGREEMENT_NOT_FOUND
│   ├── DEPOSIT_NOT_FOUND
│   ├── UNAUTHORIZED
│   ├── INVALID_STATE
│   ├── TOKEN_ALREADY_SUPPORTED
│   ├── TOKEN_NOT_SUPPORTED
│   └── INSUFFICIENT_BALANCE
├── ChainMismatchError
│   └── CHAIN_MISMATCH
├── ProviderError
│   ├── CONNECTION_FAILED
│   ├── CHAIN_MISMATCH
│   └── REQUEST_TIMEOUT
└── TransactionError
    ├── GAS_ESTIMATION_FAILED
    ├── SUBMISSION_FAILED
    ├── CONFIRMATION_TIMEOUT
    └── REPLACEMENT_UNDERPRICED
```

---

## Error Shape

All SDK errors extend `TransferChainError`:

```typescript
class TransferChainError extends Error {
  /** Machine-readable error code */
  readonly code: string;

  /** Original error for debugging (if wrapping an external error) */
  readonly cause?: Error;

  /** Additional context for debugging */
  readonly context?: Record<string, unknown>;

  /** Structured serialization for logging */
  toJSON(): Record<string, unknown>;
}
```

### Subclass Signatures

```typescript
class ValidationError extends TransferChainError {
  constructor(code: string, message: string, context?: Record<string, unknown>);
}

class ContractError extends TransferChainError {
  /** The decoded on-chain custom error name */
  readonly contractErrorName: string;

  /** The decoded on-chain error arguments */
  readonly contractErrorArgs?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    contractErrorName: string,
    contractErrorArgs?: Record<string, unknown>,
    cause?: Error
  );
}

class ChainMismatchError extends TransferChainError {
  constructor(expectedChainId: number, actualChainId: number);
}

class ProviderError extends TransferChainError {
  constructor(code: string, message: string, cause?: Error);
}

class TransactionError extends TransferChainError {
  /** The transaction hash (if the TX was submitted before failing) */
  readonly txHash?: string;

  constructor(code: string, message: string, txHash?: string, cause?: Error);
}
```

---

## Error Normalization

The `normalize` function in `src/errors/normalize.ts` is the single point of error conversion. Every error produced by the SDK passes through this function.

### What It Handles

| Source Error | Target SDK Error | Mapping Logic |
|-------------|-----------------|---------------|
| `ethers.ContractRevertError` | `ContractError` | Decodes custom error name and arguments from revert data |
| `ethers.RpcRequestError` | `ProviderError` | Maps RPC error codes to SDK error codes |
| `ethers.TransactionFailedError` | `TransactionError` | Extracts TX hash and revert reason |
| `TypeError` / `RangeError` | `ValidationError` | Maps to appropriate validation code |
| Unknown `Error` | `TransferChainError` | Wraps with `UNKNOWN` code, preserves original |

### Usage

```typescript
import { normalize } from "@transferchain/sdk/errors";

try {
  await contract.someFunction();
} catch (rawError) {
  const error = normalize(rawError);
  // error is always a TransferChainError subclass
}
```

---

## Custom Error Mapping

Each on-chain custom error is mapped to a specific SDK error code:

| On-Chain Error | SDK Error Code | SDK Error Class |
|---------------|----------------|-----------------|
| `InvalidAddress()` | `INVALID_ADDRESS` | `ValidationError` |
| `InvalidAmount()` | `INVALID_AMOUNT` | `ValidationError` |
| `InvalidPrice()` | `INVALID_PRICE` | `ValidationError` |
| `InvalidFee()` | `INVALID_FEE` | `ValidationError` |
| `InvalidMetadataURI()` | `INVALID_METADATA_URI` | `ValidationError` |
| `PlayerAlreadyRegistered()` | `PLAYER_ALREADY_REGISTERED` | `ContractError` |
| `PlayerNotFound()` | `PLAYER_NOT_FOUND` | `ContractError` |
| `ClubAlreadyRegistered()` | `CLUB_ALREADY_REGISTERED` | `ContractError` |
| `ClubNotFound()` | `CLUB_NOT_FOUND` | `ContractError` |
| `ListingNotFound()` | `LISTING_NOT_FOUND` | `ContractError` |
| `OfferNotFound()` | `OFFER_NOT_FOUND` | `ContractError` |
| `AgreementNotFound()` | `AGREEMENT_NOT_FOUND` | `ContractError` |
| `DepositNotFound()` | `DEPOSIT_NOT_FOUND` | `ContractError` |
| `Unauthorized()` | `UNAUTHORIZED` | `ContractError` |
| `InvalidState()` | `INVALID_STATE` | `ContractError` |
| `TokenAlreadySupported()` | `TOKEN_ALREADY_SUPPORTED` | `ContractError` |
| `TokenNotSupported()` | `TOKEN_NOT_SUPPORTED` | `ContractError` |
| `InsufficientBalance()` | `INSUFFICIENT_BALANCE` | `ContractError` |
| `EnforcedPause()` | `PROTOCOL_PAUSED` | `ContractError` |

---

## Application Error Handling

Consumers catch errors using `instanceof` checks:

```typescript
import {
  TransferChainError,
  ContractError,
  ValidationError,
  TransactionError,
  ChainMismatchError,
} from "@transferchain/sdk";

try {
  const result = await tc.marketplace.createListing(params);
} catch (error) {
  if (error instanceof ChainMismatchError) {
    // Wrong network — wallet is on a different chain
    console.error(
      `Wrong network: expected ${error.context?.expectedChainId}, got ${error.context?.actualChainId}`,
    );

  } else if (error instanceof ValidationError) {
    // Input validation failed before any RPC call
    console.error(`Invalid input: ${error.code}`);

  } else if (error instanceof ContractError) {
    // On-chain revert
    switch (error.code) {
      case "UNAUTHORIZED":
        console.error("You are not the seller");
        break;
      case "PLAYER_NOT_FOUND":
        console.error("Player does not exist");
        break;
      default:
        console.error(`Contract error: ${error.contractErrorName}`);
    }

  } else if (error instanceof TransactionError) {
    // TX lifecycle failure
    if (error.txHash) {
      console.error(`TX failed: ${error.txHash}`);
    } else {
      console.error(`TX error: ${error.code}`);
    }

  } else if (error instanceof TransferChainError) {
    // Other SDK error
    console.error(`SDK error: ${error.code}`);
  }
}
```

---

## Error Codes

The complete `SdkErrorCode` enum:

```typescript
enum SdkErrorCode {
  // Validation
  INVALID_ADDRESS = "INVALID_ADDRESS",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  INVALID_METADATA_URI = "INVALID_METADATA_URI",
  INVALID_PRICE = "INVALID_PRICE",
  INVALID_FEE = "INVALID_FEE",
  SIGNER_REQUIRED = "SIGNER_REQUIRED",
  CHAIN_NOT_SUPPORTED = "CHAIN_NOT_SUPPORTED",

  // Contract reverts
  PLAYER_ALREADY_REGISTERED = "PLAYER_ALREADY_REGISTERED",
  PLAYER_NOT_FOUND = "PLAYER_NOT_FOUND",
  CLUB_ALREADY_REGISTERED = "CLUB_ALREADY_REGISTERED",
  CLUB_NOT_FOUND = "CLUB_NOT_FOUND",
  LISTING_NOT_FOUND = "LISTING_NOT_FOUND",
  OFFER_NOT_FOUND = "OFFER_NOT_FOUND",
  AGREEMENT_NOT_FOUND = "AGREEMENT_NOT_FOUND",
  DEPOSIT_NOT_FOUND = "DEPOSIT_NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_STATE = "INVALID_STATE",
  TOKEN_ALREADY_SUPPORTED = "TOKEN_ALREADY_SUPPORTED",
  TOKEN_NOT_SUPPORTED = "TOKEN_NOT_SUPPORTED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  PROTOCOL_PAUSED = "PROTOCOL_PAUSED",

  // Provider
  CONNECTION_FAILED = "CONNECTION_FAILED",
  CHAIN_MISMATCH = "CHAIN_MISMATCH",
  REQUEST_TIMEOUT = "REQUEST_TIMEOUT",

  // Transaction
  GAS_ESTIMATION_FAILED = "GAS_ESTIMATION_FAILED",
  SUBMISSION_FAILED = "SUBMISSION_FAILED",
  CONFIRMATION_TIMEOUT = "CONFIRMATION_TIMEOUT",
  REPLACEMENT_UNDERPRICED = "REPLACEMENT_UNDERPRICED",

  // Unknown
  UNKNOWN = "UNKNOWN",
}
```
