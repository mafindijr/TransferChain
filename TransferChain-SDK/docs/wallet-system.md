# Wallet System

## Table of Contents

- [SignerManager](#signermanager)
- [Signer Sources](#signer-sources)
- [Read-Only Mode](#read-only-mode)
- [Write Operations](#write-operations)
- [Multi-Signer Future](#multi-signer-future)
- [Security](#security)

---

## SignerManager

The `SignerManager` holds the active `ethers.Signer` instance and provides it to the `ContractRegistry` and `TransactionManager` for write operations.

### Interface

```typescript
interface ISignerManager {
  /** Get the active signer, or undefined if in read-only mode */
  getSigner(): ethers.Signer | undefined;

  /** Check if a signer is available */
  hasSigner(): boolean;
}
```

### Instantiation

```typescript
// With private key
const signerManager = new SignerManager(config, providerManager);

// Without signer (read-only mode)
const signerManager = new SignerManager({ ...config, privateKey: undefined }, providerManager);
```

---

## Signer Sources

The SDK accepts signers from multiple sources:

### Private Key

The most common pattern. A raw private key string creates an `ethers.Wallet` attached to the provider:

```typescript
const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "https://evm.injective.network",
  privateKey: "0x...",
});
```

### Pre-Built Signer

For environments where the SDK does not manage the key (browser wallets, hardware wallets, AA smart accounts):

```typescript
const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "https://evm.injective.network",
  signer: metamaskSigner, // or WalletConnect, Safe, etc.
});
```

### Priority

If both `privateKey` and `signer` are provided, `signer` takes precedence.

---

## Read-Only Mode

When no signer is provided, the SDK operates in full read-only mode:

- All read methods work normally
- All write methods throw `ValidationError` with code `SIGNER_REQUIRED`

```typescript
const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "https://evm.injective.network",
});

// Read works
const player = await tc.players.getPlayer("0xBEEF...");

// Write throws
await tc.marketplace.createListing(params);
// throws: ValidationError(SIGNER_REQUIRED, "A signer is required for write operations")
```

### Why Enforce at the SDK Level

- Provides a clear, consistent error message instead of a cryptic ethers.js failure
- Allows consumers to conditionally enable write functionality
- Prevents accidental write attempts in read-only contexts

---

## Write Operations

When a domain client method requires a write, the flow is:

1. Domain client calls `TransactionManager.execute()`
2. `TransactionManager` obtains the signer from `SignerManager`
3. The `ContractRegistry` provides a signer-attached contract instance
4. The transaction is estimated, signed, submitted, and confirmed
5. The result is returned as `TransactionResult<T>`

The domain client never handles the signer directly. It only calls `TransactionManager.execute()` with the contract name, function name, and arguments.

---

## Multi-Signer Future

The current implementation holds a single signer. The architecture supports future extension to multiple signers without breaking changes:

### Possible Future Pattern

```typescript
const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "https://evm.injective.network",
  signers: {
    default: hotWallet,          // Used for small operations
    treasury: coldWallet,        // Used for high-value operations
  },
});

await tc.escrow.deposit(params, { signerRole: "treasury" });
```

### What Would Change

- `SignerManager` gains a `getSigner(role?: string)` method
- `TransactionManager` accepts an optional signer role override
- Domain clients pass through the signer role option

### What Would NOT Change

- The `TransferChain` facade API
- The domain client read methods
- The `TransactionResult` return type
- The event system

---

## Security

### Key Handling Rules

| Rule | Description |
|------|-------------|
| No storage | Private keys are never stored in localStorage, cookies, or disk |
| No logging | Private keys are never logged, even at debug level |
| No transmission | Keys are only sent to the configured RPC endpoint via ethers.js |
| No validation beyond ethers.js | The SDK does not validate key format — ethers.js handles this |
| No key generation | The SDK never generates keys internally |

### Environment Safety

For browser and mobile applications, use pre-built `Signer` instances from wallet providers (MetaMask, WalletConnect, etc.) instead of raw private keys. The SDK never prompts for key input or accesses browser storage.

### Key in Environment Variables

The `fromEnv()` helper loads keys from environment variables for development convenience. This pattern is explicitly discouraged in production.
