# ADR-0004: Manual Dependency Injection

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The SDK contains approximately 15 internal services (ProviderManager, SignerManager, ContractRegistry, TransactionManager, EventManager, MetadataResolver, Logger, 8 domain clients). These services depend on each other and need to be wired together during initialization. DI containers (inversify, tsyringe, etc.) automate this wiring but add runtime overhead.

## Decision

Use manual constructor injection. Services are instantiated and wired together explicitly in the `TransferChain` class constructor. No DI container, no decorators, no `reflect-metadata`, no runtime type introspection.

## Consequences

**Positive:**

- Zero runtime overhead from DI framework
- Full TypeScript type inference (no string tokens or metadata)
- Bundle size is minimal (no DI container in the dependency tree)
- Tree-shaking works reliably (all dependencies are static imports)
- Debugging is straightforward (trace constructor calls)

**Negative:**

- Constructor is verbose (wires ~15 services manually)
- Adding a new service requires updating the constructor
- No lazy resolution — all dependencies are resolved at construction time
