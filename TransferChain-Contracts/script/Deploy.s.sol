// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TransferChainAccessControl} from "../src/core/TransferChainAccessControl.sol";
import {TransferChainConfig} from "../src/core/TransferChainConfig.sol";
import {PlayerRegistry} from "../src/registries/PlayerRegistry.sol";
import {ClubRegistry} from "../src/registries/ClubRegistry.sol";
import {TransferMarketplace} from "../src/marketplace/TransferMarketplace.sol";
import {TransferAgreementManager} from "../src/agreements/TransferAgreementManager.sol";
import {Escrow} from "../src/escrow/Escrow.sol";
import {Treasury} from "../src/treasury/Treasury.sol";

contract DeployScript is Script {
    function run() external {
        uint256 marketplaceFeeBps = vm.envOr("MARKETPLACE_FEE_BPS", uint256(250));
        uint256 protocolVersion = vm.envOr("PROTOCOL_VERSION", uint256(1));

        if (marketplaceFeeBps > 10_000) {
            revert("MARKETPLACE_FEE_BPS exceeds maximum (10000)");
        }

        vm.startBroadcast();

        // 1. Access control hub
        TransferChainAccessControl accessControl = new TransferChainAccessControl();

        // 2. Treasury (must exist before Config, since Config requires a non-zero treasury)
        Treasury treasury = new Treasury();

        // 3. Protocol configuration
        TransferChainConfig config = new TransferChainConfig(
            address(treasury),
            marketplaceFeeBps,
            protocolVersion
        );

        // 4. Registries
        PlayerRegistry players = new PlayerRegistry();
        ClubRegistry clubs = new ClubRegistry();

        // 5. Transaction layer
        TransferMarketplace marketplace = new TransferMarketplace();
        TransferAgreementManager agreements = new TransferAgreementManager();
        Escrow escrow = new Escrow();

        // 6. Grant protocol roles to the deployer
        address admin = msg.sender;

        accessControl.grantRole(accessControl.REGISTRY_ADMIN_ROLE(), admin);
        accessControl.grantRole(accessControl.MARKETPLACE_ADMIN_ROLE(), admin);
        accessControl.grantRole(accessControl.AGREEMENT_ADMIN_ROLE(), admin);
        accessControl.grantRole(accessControl.ESCROW_MANAGER_ROLE(), admin);
        accessControl.grantRole(accessControl.TREASURY_ADMIN_ROLE(), admin);
        accessControl.grantRole(accessControl.CONFIG_ADMIN_ROLE(), admin);

        vm.stopBroadcast();

        // 7. Print deployed addresses
        console.log("=== TransferChain Testnet Deployment ===");
        console.log("Chain ID:", block.chainid);
        console.log("");
        console.log("AccessControl :", address(accessControl));
        console.log("Treasury      :", address(treasury));
        console.log("Config        :", address(config));
        console.log("PlayerRegistry:", address(players));
        console.log("ClubRegistry  :", address(clubs));
        console.log("Marketplace   :", address(marketplace));
        console.log("Agreements    :", address(agreements));
        console.log("Escrow        :", address(escrow));
        console.log("");
        console.log("Admin (deployer):", admin);
        console.log("Marketplace Fee :", marketplaceFeeBps, "bps");
        console.log("Protocol Version:", protocolVersion);
    }
}
