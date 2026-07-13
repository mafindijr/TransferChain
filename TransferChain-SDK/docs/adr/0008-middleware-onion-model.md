# ADR-0008: Middleware Onion Model

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The transaction pipeline needs to support cross-cutting concerns (logging, gas optimization, analytics, simulation) without modifying domain clients. Middleware provides interception points, but the execution order matters — especially for `after*` hooks that may need to clean up resources allocated in `before*` hooks.

## Decision

Middleware follows the onion model (also known as the "ring" pattern, used by Koa and Express 5). `before*` hooks execute in registration order (outermost first). `after*` hooks execute in reverse registration order (innermost first). This ensures cleanup semantics mirror setup semantics.

## Consequences

**Positive:**

- Predictable execution order that matches mental model
- Cleanup in `after*` hooks can reference state from corresponding `before*` hooks
- Standard pattern familiar from Koa/Express 5
- Supports transaction-scoped context that spans the full pipeline

**Negative:**

- Slightly more complex than linear execution order
- Requires documenting and testing the reverse-order behavior
- Performance overhead is negligible but non-zero for the hook traversal
