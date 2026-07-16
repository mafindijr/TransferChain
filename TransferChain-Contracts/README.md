# TransferChain Smart Contracts

A modular smart contract protocol for football transfer workflows, built on [OpenZeppelin](https://www.openzeppelin.com/contracts) and deployed on [Injective EVM](https://injective.com/).

## Overview

TransferChain provides on-chain infrastructure for football player transfers. The protocol separates concerns into independent, auditable modules: identity registries, a transfer marketplace, agreement management, escrow custody, and protocol treasury.

Key properties:

- **Modular** — each contract owns a single domain with no hidden state coupling.
- **Minimal on-chain state** — player and club metadata lives off-chain via URI pointers.
- **Multi-token escrow** — supports any ERC-20 payment token.
- **Role-based access** — protocol-wide permissioning through `TransferChainAccessControl`.
- **Upgrade-ready architecture** — designed for future upgradeability without ABI breakage.

## Architecture

```
TransferChainAccessControl
        |
        ├── TransferChainConfig        (fees, treasury, emergency controls)
        ├── PlayerRegistry             (player identity)
        ├── ClubRegistry               (club identity)
        ├── TransferMarketplace        (listings, offers)
        ├── TransferAgreementManager   (transfer agreements, clauses)
        ├── Escrow                     (ERC-20 fund custody)
        └── Treasury                   (protocol revenue)
```

### Contract Responsibilities

| Contract | Responsibility |
|---|---|
| `TransferChainAccessControl` | Protocol-wide RBAC, pause/unpause |
| `TransferChainConfig` | Fee parameters, payment tokens, emergency mode |
| `PlayerRegistry` | Player identity registration, metadata pointers |
| `ClubRegistry` | Club identity registration, metadata pointers |
| `TransferMarketplace` | Listing lifecycle, offers, negotiation |
| `TransferAgreementManager` | Transfer agreements, commercial clauses |
| `Escrow` | ERC-20 fund custody, release/refund flows |
| `Treasury` | Protocol revenue, controlled withdrawals |

## Deployments

### Injective EVM Testnet (Chain ID 1439)

| Contract | Address |
|---|---|
| TransferChainAccessControl | [`0x4ce4ac389cdb84c4e5cea2d0e9e65f1ecc8b87e5`](https://explorer.testnet.injective.network/address/0x4ce4ac389cdb84c4e5cea2d0e9e65f1ecc8b87e5) |
| Treasury | [`0x0ea50ae90ed69bd029cc3e3cffce21f6e1e0b9bc`](https://explorer.testnet.injective.network/address/0x0ea50ae90ed69bd029cc3e3cffce21f6e1e0b9bc) |
| TransferChainConfig | [`0xf0f67e6578e44230924bffd02ae94090136608f1`](https://explorer.testnet.injective.network/address/0xf0f67e6578e44230924bffd02ae94090136608f1) |
| PlayerRegistry | [`0x49335199e4121fc332cb5b11ce704250dea92cc8`](https://explorer.testnet.injective.network/address/0x49335199e4121fc332cb5b11ce704250dea92cc8) |
| ClubRegistry | [`0x873ae71139407889650b74b24da51643a0e680eb`](https://explorer.testnet.injective.network/address/0x873ae71139407889650b74b24da51643a0e680eb) |
| TransferMarketplace | [`0x6bc6dd2cc4f5c2c1ab6b0387ed95ec5b543eef1a`](https://explorer.testnet.injective.network/address/0x6bc6dd2cc4f5c2c1ab6b0387ed95ec5b543eef1a) |
| TransferAgreementManager | [`0x4e9865d82174376b1246e982311d85b8cc1297f8`](https://explorer.testnet.injective.network/address/0x4e9865d82174376b1246e982311d85b8cc1297f8) |
| Escrow | [`0xded509f4c002e4013e96cec6b3ad87bf5213c68d`](https://explorer.testnet.injective.network/address/0xded509f4c002e4013e96cec6b3ad87bf5213c68d) |

Full deployment manifest: [`deployments/1439.json`](deployments/1439.json)

## Security Model

- **Access Control** — `TransferChainAccessControl` uses OpenZeppelin `AccessControl` with role-based permissions.
- **Ownable** — Config, Treasury, and registries use `Ownable` for admin operations.
- **Custom Errors** — all reverts use descriptive custom errors, not strings.
- **Input Validation** — zero-address and zero-amount checks on all external entry points.
- **Fund Safety** — Escrow and Treasury use `SafeERC20` for all token transfers.

### Roles

| Role | Purpose |
|---|---|
| `DEFAULT_ADMIN_ROLE` | Full protocol administration |
| `PAUSER_ROLE` | Emergency pause/unpause |
| `REGISTRY_ADMIN_ROLE` | Player and club registry administration |
| `MARKETPLACE_ADMIN_ROLE` | Marketplace administration |
| `AGREEMENT_ADMIN_ROLE` | Agreement administration |
| `ESCROW_MANAGER_ROLE` | Escrow operations |
| `TREASURY_ADMIN_ROLE` | Treasury operations |
| `CONFIG_ADMIN_ROLE` | Protocol configuration |

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/)

### Install dependencies

```bash
forge install
```

### Build

```bash
forge build
# or
make build
```

### Test

```bash
forge test -vvv
# or
make test
```

### Deploy locally

```bash
anvil
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### Deploy to testnet

```bash
cp .env.example .env
# fill in PRIVATE_KEY and RPC_URL
make deploy-testnet
```

## Project Structure

```
src/
  core/
    TransferChainAccessControl.sol    # RBAC and pause
    TransferChainConfig.sol           # Protocol parameters
  registries/
    PlayerRegistry.sol                # Player identity
    ClubRegistry.sol                  # Club identity
  marketplace/
    TransferMarketplace.sol           # Listings and offers
  agreements/
    TransferAgreementManager.sol      # Transfer agreements
  escrow/
    Escrow.sol                        # Fund custody
  treasury/
    Treasury.sol                      # Revenue management

script/
  Deploy.s.sol                        # Deployment script

test/
  unit/                               # Per-contract unit tests
  integration/                        # Full protocol flow tests
  mocks/
    ERC20Mock.sol                     # Test token

deployments/
  1439.json                           # Injective testnet manifest
```

## License

MIT
