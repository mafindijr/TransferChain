# ADR-0006: BigInt for All On-Chain Values

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Ethereum `uint256` values can exceed `Number.MAX_SAFE_INTEGER` (2^53 - 1). Representing them as JavaScript `number` risks silent precision loss. Representing them as `string` avoids precision loss but pushes parsing burden onto consumers. Native `bigint` preserves full precision without external dependencies.

## Decision

All on-chain numeric values — amounts, IDs, timestamps, basis points, nonces — use native `bigint` in the SDK's TypeScript types. This includes struct fields, event arguments, and function return values. The SDK provides formatting utilities for display purposes but never internally converts `bigint` to `number` or `string`.

## Consequences

**Positive:**

- Full precision for all numeric values, including token amounts
- Native arithmetic support (`+`, `-`, `*`, `/`, `>`, `<`)
- No external big-number library needed
- TypeScript `bigint` type provides compile-time safety

**Negative:**

- `bigint` is not JSON-serializable (requires custom serializer for storage)
- Not supported in very old browsers (but SDK targets modern runtimes only)
- Display formatting must be handled explicitly by consumers or SDK utilities
