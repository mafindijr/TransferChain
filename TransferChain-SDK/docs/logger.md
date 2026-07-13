# Logger

## Table of Contents

- [Logger Interface](#logger-interface)
- [Default Logger](#default-logger)
- [Logger Injection](#logger-injection)
- [What Gets Logged](#what-gets-logged)
- [Structured Logging](#structured-logging)

---

## Logger Interface

```typescript
interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}
```

---

## Default Logger

The default logger is silent. The SDK never calls `console.log`, `console.warn`, or `console.error` by default.

See [ADR-0007](./adr/0007-silent-default-logger.md) for the rationale.

### Why Silent

- Libraries that log to stdout create noise in production
- Console output is invisible in serverless and CI environments
- Mobile and Edge runtimes may not have a console
- Consumers should control their own logging output

---

## Logger Injection

Inject a logger at SDK initialization:

```typescript
const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "...",
  logger: console,  // Use console for development
});
```

### Using Structured Loggers

```typescript
import pino from "pino";

const logger = pino({ level: "info" });

const tc = new TransferChain({
  chainId: 8888,
  rpcUrl: "...",
  logger,
});
```

### Replacing the Logger After Initialization

Plugins can replace the logger via the `PluginContext`:

```typescript
const myPlugin: Plugin = {
  name: "my-plugin",
  version: "1.0.0",
  install(ctx) {
    ctx.setLogger(myCustomLogger);
  },
};
```

---

## What Gets Logged

| Event | Level | Context Fields |
|-------|-------|----------------|
| SDK initialized | `info` | `chainId`, `rpcUrl` (redacted) |
| Provider created | `debug` | `chainId`, `rpcUrl` |
| Contract cached | `debug` | `contractName`, `chainId` |
| Gas estimated | `debug` | `contractName`, `functionName`, `gasEstimate` |
| Transaction submitted | `info` | `contractName`, `functionName`, `txHash` |
| Transaction confirmed | `info` | `contractName`, `functionName`, `txHash`, `gasUsed` |
| Transaction failed | `error` | `contractName`, `functionName`, `error`, `txHash` |
| Event subscribed | `debug` | `eventName`, `address` |
| Metadata resolved | `debug` | `uri`, `resolvedUrl` |
| Middleware executed | `debug` | `middlewareName`, `hook`, `elapsed` |
| Error occurred | `error` | `code`, `message`, `context` |

### Sensitive Data

The following are **never** logged:

- Private keys
- Wallet addresses (logged only at `debug` level, and only when explicitly opted in)
- Function arguments (configurable via `LoggingMiddleware`)

---

## Structured Logging

All log calls accept an optional `context` parameter for structured logging:

```typescript
// Simple message
logger.info("Transaction confirmed");

// Structured context
logger.info("Transaction confirmed", {
  txHash: "0x...",
  gasUsed: "21000",
  contract: "playerRegistry",
  function: "registerPlayer",
});
```

The SDK always passes context as a plain object. Loggers that support structured output (pino, winston, etc.) will serialize it automatically. Loggers that do not (console) will ignore the context parameter.
