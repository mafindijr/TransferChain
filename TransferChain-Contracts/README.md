# TransferChain Smart Contracts

TransferChain is a modular smart contract protocol for football transfer workflows. This repository contains the Solidity contracts, Foundry test suite, and deployment scripts for the protocol.

## Overview

The protocol is organized around:

- access control and emergency controls;
- protocol configuration;
- player and club registries;
- transfer marketplace lifecycle;
- transfer agreement management;
- escrow and treasury modules.

## Tech Stack

- Foundry
- Solidity
- OpenZeppelin
- Forge
- Anvil
- Cast

## Project Structure

```text
src/
  core/
  registries/
  marketplace/
  agreements/
  escrow/
  treasury/
  interfaces/
  libraries/
  utils/
script/
test/
```

## Getting Started

### Install Foundry

Follow the official Foundry installation guide:

https://book.getfoundry.sh/

### Install dependencies

```bash
forge install
```

### Compile contracts

```bash
forge build
```

### Run tests

```bash
forge test
```

## Development Notes

- Solidity code is implemented incrementally in later sprints.
- The architecture is documented in ARCHITECTURE.md.
- The project is intentionally organized for future growth and modular protocol development.

