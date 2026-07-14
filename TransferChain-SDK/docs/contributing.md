# Contributing

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Commands](#project-commands)
- [PR Process](#pr-process)
- [Code Style](#code-style)
- [Commit Convention](#commit-convention)
- [Adding a New Client](#adding-a-new-client)
- [Adding Middleware](#adding-middleware)
- [Adding a Plugin](#adding-a-plugin)
- [Review Checklist](#review-checklist)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime |
| pnpm | 9+ | Package manager |
| Anvil | latest | Integration tests (from Foundry) |
| Git | latest | Version control |

---

## Development Setup

```bash
# Clone the repository
git clone https://github.com/transferchain/transferchain-sdk.git
cd transferchain-sdk

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run unit tests
pnpm test:unit

# Run linter
pnpm lint

# Run type checker
pnpm typecheck
```

### Integration Test Setup

Integration tests require Anvil (from Foundry):

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Start Anvil (in a separate terminal)
anvil

# Run integration tests
pnpm test:integration
```

---

## Project Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build the SDK with tsup |
| `pnpm test:unit` | Run unit tests with Vitest |
| `pnpm test:integration` | Run integration tests against Anvil |
| `pnpm test:all` | Run all tests |
| `pnpm test:coverage` | Generate coverage report |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm format` | Run Prettier |
| `pnpm typecheck` | Run TypeScript type checker |
| `pnpm abi:sync` | Sync ABIs from TransferChain-Contracts |

---

## PR Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all checks pass (`pnpm lint && pnpm typecheck && pnpm test:unit`)
4. Submit a PR with a clear description
5. Request review from a maintainer
6. Address review feedback
7. Merge after approval

### Branch Naming

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code refactoring (no behavior change) |
| `test/` | Test additions or improvements |
| `chore/` | Tooling, CI, dependencies |

---

## Code Style

### ESLint + Prettier

The project uses ESLint 9 with Prettier for formatting. Run both before committing:

```bash
pnpm lint:fix && pnpm format
```

### TypeScript

- Strict mode enabled
- No `any` types in source code
- Use `interface` for object shapes, `type` for unions/intersections
- Export types with `export type` for type-only exports

### Naming

See [Repository — Naming Conventions](./repository.md#naming-conventions).

### Comments

- Use JSDoc on all public methods
- Use inline comments for complex logic
- Do not comment obvious code

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation change |
| `refactor` | Code refactoring |
| `test` | Test change |
| `chore` | Tooling or dependency change |
| `perf` | Performance improvement |

### Examples

```
feat(clients): add batch read support to PlayerRegistryClient
fix(events): handle unknown event topics gracefully
docs(api): update TransactionResult examples
test(integration): add escrow refund scenario
```

---

## Adding a New Client

1. Create `src/contracts/NewContractClient.ts`
2. Follow the client architecture pattern (see [Public API](./public-api.md))
3. Implement all read methods returning typed results
4. Implement all write methods returning `TransactionResult<T>`
5. Add the client as a property of `TransferChain`
6. Export from `src/contracts/index.ts`
7. Add unit tests in `tests/unit/contracts/`
8. Add integration tests in `tests/integration/`
9. Update the contract mapping table in `architecture.md`

---

## Adding Middleware

1. Create `src/middleware/MyMiddleware.ts`
2. Implement the `Middleware` interface
3. Add unit tests in `tests/unit/middleware/`
4. Document the middleware in `middleware.md`
5. Export from `src/middleware/index.ts` (if public)

---

## Adding a Plugin

1. Create `src/plugins/my-plugin.ts` (or a separate package)
2. Implement the `Plugin` interface
3. Add unit tests
4. Document the plugin in `plugin-system.md`
5. Publish as a separate package (recommended) or export from the SDK

---

## Review Checklist

- [ ] All checks pass (`pnpm lint && pnpm typecheck && pnpm test:unit`)
- [ ] New code has unit tests
- [ ] Public API has JSDoc documentation
- [ ] Error handling uses SDK error hierarchy
- [ ] No raw ethers.js errors leak to consumers
- [ ] No `any` types in source code
- [ ] No secrets or private keys in code
- [ ] CHANGELOG.md is updated (for releases)
- [ ] README.md is updated (if adding new features)
