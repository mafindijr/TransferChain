# Provider System

## Table of Contents

- [ProviderManager](#providermanager)
- [Provider Creation](#provider-creation)
- [Provider Caching](#provider-caching)
- [Provider Validation](#provider-validation)
- [Read vs Write](#read-vs-write)
- [WebSocket Support](#websocket-support)
- [Chain Metadata](#chain-metadata)

---

## ProviderManager

The `ProviderManager` centralizes all provider lifecycle management. It is an internal service — consumers do not interact with it directly.

### Interface

```typescript
interface IProviderManager {
  /** Get or create a provider for the given chain */
  getProvider(chainId: number): ethers.Provider;

  /** Manually register a provider instance */
  setProvider(chainId: number, provider: ethers.Provider): void;
}
```

### Instantiation

The `ProviderManager` is created during `TransferChain` construction:

```typescript
const providerManager = new ProviderManager(config);
```

---

## Provider Creation

When a consumer provides a raw `rpcUrl`, the manager creates an `ethers.JsonRpcProvider`:

```typescript
const provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
```

When a consumer provides a pre-built `Provider` instance, it is used directly without wrapping.

If both `rpcUrl` and `provider` are provided, `provider` takes precedence.

---

## Provider Caching

Providers are cached by a composite key derived from `(chainId, rpcUrl)`:

```typescript
// Internal cache structure
private cache = new Map<string, ethers.Provider>();

// Key generation
private getCacheKey(chainId: number, rpcUrl: string): string {
  return `${chainId}:${rpcUrl}`;
}
```

### Cache Behavior

| Property | Behavior |
|----------|----------|
| Key | `${chainId}:${rpcUrl}` |
| Eviction | Never — providers are stateless connections |
| Memory | One provider per unique RPC endpoint |
| Thread safety | Not applicable (single-threaded JS) |

### Why Never Evict

- Providers are lightweight wrappers around HTTP connections
- HTTP connections are pooled and reused by the runtime
- Evicting a provider does not close its underlying connections
- Re-creating a provider for the same endpoint provides no benefit

---

## Provider Validation

Validation is deferred to first use, not construction:

### Chain ID Validation

On the first RPC call, the SDK verifies that `eth_chainId` returns a value matching the configured `chainId`. If not, a `ProviderError` with code `CHAIN_MISMATCH` is thrown.

```typescript
// Pseudocode
const actualChainId = await provider.getNetwork();
if (actualChainId !== config.chainId) {
  throw new ProviderError(
    SdkErrorCode.CHAIN_MISMATCH,
    `Expected chain ${config.chainId}, got ${actualChainId}`
  );
}
```

### Connectivity Validation

The first RPC call also serves as a connectivity check. If the endpoint is unreachable, a `ProviderError` with code `CONNECTION_FAILED` is thrown.

### Why Deferred

- Constructor remains synchronous and fast
- Avoids unnecessary network calls when the SDK is used for type imports only
- Allows the SDK to initialize in environments where the network is not yet available

---

## Read vs Write

ethers.js v6 contracts are immutable — a contract instance bound to a `Provider` is different from one bound to a `Signer`. The `ProviderManager` always provides read-only providers. The `SignerManager` handles the signer-attached provider for write operations.

```typescript
// Read-only: uses ProviderManager.getProvider()
const readContract = new ethers.Contract(address, abi, provider);

// Write: uses SignerManager.getSigner()
const writeContract = new ethers.Contract(address, abi, signer);
```

These two contract instances are cached separately in the `ContractRegistry` (see [Cache Architecture](./cache-architecture.md)).

---

## WebSocket Support

The SDK supports WebSocket providers but does not require them.

### Benefits

- More efficient event subscriptions (push-based, no polling)
- Lower latency for real-time event notifications
- Reduced RPC call volume

### Limitations

- Not all RPC endpoints support WebSocket
- WebSocket connections require reconnection logic
- Mobile and serverless environments may not support persistent connections

### How It Works

If the consumer passes a WebSocket URL or a pre-built `WebSocketProvider`, the `EventManager` uses it for subscriptions. If not, subscriptions fall back to polling via `eth_getLogs`.

---

## Chain Metadata

The SDK ships with a built-in chain registry:

```typescript
interface ChainMetadata {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}
```

### Built-In Chains

| Chain | Chain ID | Native Currency | Block Explorer |
|-------|----------|----------------|----------------|
| Injective EVM Testnet | 8888 | INJ (18 decimals) | https://testnet.explorer.injective.network |
| Injective EVM Mainnet | 525 | INJ (18 decimals) | https://explorer.injective.network |

### Extending

Consumers can reference chains not in the built-in registry by providing a custom `rpcUrl` and `chainId`. The chain metadata table is informational only — it does not gate SDK functionality.
