# Account Abstraction

> This document describes the SDK's readiness for ERC-4337 Account Abstraction support. AA is not yet implemented.

## Table of Contents

- [Current State](#current-state)
- [Architectural Readiness](#architectural-readiness)
- [How It Works Today](#how-it-works-today)
- [Future: Native AA Support](#future-native-aa-support)
- [ERC-4337 Considerations](#erc-4337-considerations)

---

## Current State

The SDK currently uses raw `ethers.Signer` for transaction submission. Account Abstraction (ERC-4337) is not implemented.

Consumers who use smart contract wallets (Safe, Biconomy, ZeroDev) can pass the wallet's `Signer` instance directly to the SDK. The SDK works without modification because it calls `signer.sendTransaction()`, which smart contract wallet signers redirect to `eth_sendUserOperation` internally.

---

## Architectural Readiness

The architecture supports AA through three design decisions:

### 1. SignerManager Accepts Any ethers.Signer

Smart contract wallets implement `ethers.Signer`. When a consumer passes an AA-enabled signer, the SDK works without modification.

```typescript
// This "just works" with AA-enabled signers
const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "...",
  signer: safeSigner,  // Safe smart account signer
});
```

### 2. TransactionManager Uses signer.sendTransaction()

The SDK calls `signer.sendTransaction()`, not `provider.sendRawTransaction()`. Smart contract wallet signers intercept this call and handle UserOp construction internally.

### 3. Middleware Can Modify Overrides

AA-specific logic (setting smart account nonce, adding paymaster data) can be injected via middleware without changing domain clients.

```typescript
const aaMiddleware: Middleware = {
  name: "aa-support",
  beforeSubmit: async (ctx) => {
    // Add paymaster data for gas sponsorship
    ctx.overrides.customData = {
      paymasterAndData: paymasterAddress,
    };
  },
};
```

---

## How It Works Today

| Scenario | How It Works |
|----------|-------------|
| EOA wallet | Private key → `ethers.Wallet` → `sendTransaction()` → raw TX |
| MetaMask | `BrowserProvider.getSigner()` → `sendTransaction()` → MetaMask popup |
| WalletConnect | WalletConnect signer → `sendTransaction()` → relay |
| Smart account (Safe) | Safe signer → `sendTransaction()` → UserOp → bundler |

The SDK does not need to know which type of signer it is using. The signer handles the transport.

---

## Future: Native AA Support

When AA becomes a product requirement, the SDK can add:

### AASignerAdapter

A wrapper that converts smart account providers into `ethers.Signer` instances:

```typescript
import { AASignerAdapter } from "@transferchain/sdk/aa";

const aaSigner = new AASignerAdapter({
  accountFactory: "0x...",
  bundlerUrl: "https://bundler.example.com",
  paymasterUrl: "https://paymaster.example.com",
});

const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "...",
  signer: aaSigner,
});
```

### AA-Specific Middleware

Built-in middleware for common AA patterns:

- **GasSponsorshipMiddleware** — Configures paymaster for gasless transactions
- **NonceManagementMiddleware** — Manages smart account nonces
- **BatchMiddleware** — Combines multiple operations into a single UserOp

### SmartAccountConfig

A new `SdkConfig` option for AA-specific configuration:

```typescript
const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "...",
  aa: {
    accountFactory: "0x...",
    bundlerUrl: "https://bundler.example.com",
    paymasterUrl: "https://paymaster.example.com",
    gasSponsored: true,
  },
});
```

---

## ERC-4337 Considerations

### Key Differences from EOA Transactions

| Aspect | EOA | AA (ERC-4337) |
|--------|-----|---------------|
| Transaction type | `0x02` (EIP-1559) | UserOperation |
| Submission | `eth_sendRawTransaction` | `eth_sendUserOperation` |
| Gas payment | Sender pays in native token | Paymaster can sponsor |
| Nonce management | Sequential | Sender + nonce key |
| Signature | Single signer | Account contract validates |

### What Does NOT Change

- Domain client APIs remain identical
- `TransactionResult` return type is unchanged
- Event decoding is unchanged
- Read methods are completely unaffected

### What Might Change

- Transaction confirmation timing (bundler batching)
- Gas estimation (paymaster simulation)
- Error types (bundler-specific errors)
- Transaction hash semantics (UserOp hash vs TX hash)
