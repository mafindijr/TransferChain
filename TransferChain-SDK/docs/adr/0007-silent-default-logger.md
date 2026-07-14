# ADR-0007: Silent Default Logger

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Libraries that log to `console.log` by default create noise in production environments and are difficult to suppress. Consumers of the SDK may run in serverless functions, CI pipelines, or mobile environments where console output is either invisible or problematic.

## Decision

The default logger is silent. The SDK never calls `console.log`, `console.warn`, or `console.error` unless the consumer explicitly injects a logger that does. The `Logger` interface exposes `debug`, `info`, `warn`, and `error` methods, but the default implementation discards all output.

## Consequences

**Positive:**

- No noise in production environments
- Consumers have full control over logging behavior
- Library does not assume a console environment (works in React Native, Edge workers)
- Structured logging is easy to add via the Logger interface

**Negative:**

- No debugging output by default (developers must inject a logger to see SDK activity)
- Initial development experience may feel "quiet" without explicit logger setup
