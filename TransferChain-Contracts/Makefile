-include .env

.PHONY: build clean test deploy-testnet

build:
	forge build

clean:
	forge clean

test:
	forge test -vvv

deploy-testnet:
	forge script script/Deploy.s.sol \
		--rpc-url $(RPC_URL) \
		--broadcast \
		--legacy \
		-vvvv
