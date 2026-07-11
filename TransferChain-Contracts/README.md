# TransferChain Smart Contracts

TransferChain is a modular smart contract protocol for football transfer workflows. This repository contains the Solidity contracts, Foundry test suite, deployment scripts, and protocol documentation.

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

### Deploy locally

```bash
anvil
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

## Current Status

The repository currently includes:

- access control
- protocol configuration
- player registry
- club registry
- transfer marketplace
- transfer agreement manager
- escrow
- treasury
- integration tests

## Development Notes

- Solidity code is implemented incrementally in planned sprints.
- The architecture is documented in ARCHITECTURE.md.
- The project is intentionally organized for future growth and modular protocol development.

