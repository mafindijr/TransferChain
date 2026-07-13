# ADR-0010: Facade Pattern

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The SDK exposes 8 domain clients, an event system, a metadata resolver, and configuration. Without a unified entry point, consumers would need to import and wire multiple classes manually, creating boilerplate and inconsistency across applications.

## Decision

The `TransferChain` class serves as the single entry point (facade). All domain clients, the event manager, and the metadata resolver are accessible as properties of this class. Consumers instantiate one `TransferChain` object and access everything through it.

```typescript
const tc = new TransferChain({ chainId: 8888, rpcUrl: "..." });
const player = await tc.players.getPlayer(addr);
const listing = await tc.marketplace.getListing(1n);
```

## Consequences

**Positive:**

- Single import, single instantiation, single point of access
- Discoverable API — tab completion reveals all available modules
- Configuration is centralized (one constructor call)
- Easy to mock for testing (mock one object)

**Negative:**

- Consumers who only need one client still construct the full SDK
- The facade class becomes larger as features are added
- Property-based access (`tc.players`) is less tree-shakeable than direct imports
