# Network Layer

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Required Provider Capabilities](#required-provider-capabilities)
- [Provider Types](#provider-types)
- [WebSocket Support](#websocket-support)
- [Provider Validation](#provider-validation)
- [Error Handling](#error-handling)

---

## Design Philosophy

The SDK uses ethers.js v6 as its network layer. It does not wrap, replace, or extend ethers.js `Provider` or `Signer` abstractions.

The SDK's value is in the domain model layer above ethers.js — typed contract clients, error normalization, event decoding, and metadata resolution — not in reimplementing network primitives.

---

## Required Provider Capabilities

The SDK requires the provider to support these JSON-RPC methods:

| Method | Used By | Purpose |
|--------|---------|---------|
| `eth_chainId` | ProviderManager | Chain ID validation on first use |
| `eth_call` | ContractRegistry | Read contract state |
| `eth_sendRawTransaction` | TransactionManager | Submit signed transactions |
| `eth_getLogs` | EventManager | Query historical events |
| `eth_blockNumber` | EventManager | Poll for new blocks (subscription fallback) |
| `eth_estimateGas` | TransactionManager | Gas estimation before submission |
| `eth_feeHistory` | TransactionManager | EIP-1559 fee estimation |

### Optional Capabilities

| Method | Used By | Purpose |
|--------|---------|---------|
| WebSocket subscription | EventManager | Push-based event notifications |
| `eth_getTransactionReceipt` | TransactionManager | Poll for TX confirmation |
| `debug_traceTransaction` | Future | Transaction simulation |

---

## Provider Types

The SDK works with any `ethers.Provider` implementation:

| Provider | Supported | Notes |
|----------|-----------|-------|
| `JsonRpcProvider` | Yes | Primary target. Works in Node.js and browsers. |
| `WebSocketProvider` | Yes | Enables efficient event subscriptions. |
| `BrowserProvider` | Yes | From `window.ethereum` via MetaMask or similar. |
| `FallbackProvider` | Yes | For redundancy across multiple RPC endpoints. |
| `InfuraProvider` | Yes | Any third-party provider that implements `ethers.Provider`. |
| Custom `Provider` | Yes | Any object implementing the `ethers.Provider` interface. |

---

## WebSocket Support

WebSocket providers are optional but recommended for event-heavy applications.

### Benefits

- Push-based event delivery (no polling)
- Lower latency for real-time notifications
- Reduced RPC call volume

### Limitations

- Not all RPC endpoints support WebSocket
- Requires reconnection logic for dropped connections
- Not supported in all environments (serverless, mobile)

### Fallback Behavior

If no WebSocket provider is available, the `EventManager` falls back to polling:

1. Subscribe to `eth_blockNumber` changes
2. On each new block, query `eth_getLogs` for the relevant event topics
3. Decode and dispatch matching events

---

## Provider Validation

### Chain ID Check

On the first RPC call, the SDK validates that the provider's chain ID matches the configured chain ID:

```typescript
const network = await provider.getNetwork();
if (Number(network.chainId) !== config.chainId) {
  throw new ProviderError(
    SdkErrorCode.CHAIN_MISMATCH,
    `Expected chain ${config.chainId}, provider reports ${network.chainId}`
  );
}
```

### Connectivity Check

If the first RPC call fails with a network error, a `ProviderError` with code `CONNECTION_FAILED` is thrown.

### Why Deferred

- Keeps the constructor synchronous and fast
- Avoids network calls for type-only imports
- Allows initialization in environments where the network is temporarily unavailable

---

## Error Handling

Network errors are wrapped in `ProviderError`:

| Source Error | SDK Error Code | Message |
|-------------|----------------|---------|
| DNS resolution failure | `CONNECTION_FAILED` | Cannot connect to RPC endpoint |
| Connection timeout | `REQUEST_TIMEOUT` | RPC request timed out |
| Chain ID mismatch | `CHAIN_MISMATCH` | Expected chain X, got Y |
| RPC method not supported | `CONNECTION_FAILED` | Provider does not support required method |
| HTTP 429 (rate limit) | `REQUEST_TIMEOUT` | RPC rate limit exceeded |

See [Error Handling](./error-handling.md) for the full error hierarchy.
