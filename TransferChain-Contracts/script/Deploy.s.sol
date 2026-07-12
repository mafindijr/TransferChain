// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script} from "forge-std/Script.sol";
import {TransferChainConfig} from "../src/core/TransferChainConfig.sol";
import {PlayerRegistry} from "../src/registries/PlayerRegistry.sol";
import {ClubRegistry} from "../src/registries/ClubRegistry.sol";
import {TransferMarketplace} from "../src/marketplace/TransferMarketplace.sol";
import {TransferAgreementManager} from "../src/agreements/TransferAgreementManager.sol";
import {Escrow} from "../src/escrow/Escrow.sol";
import {Treasury} from "../src/treasury/Treasury.sol";

contract DeployScript is Script {
    function run() external returns (
        TransferChainConfig config,
        PlayerRegistry players,
        ClubRegistry clubs,
        TransferMarketplace marketplace,
        TransferAgreementManager agreements,
        Escrow escrow,
        Treasury treasury
    ) {
        vm.startBroadcast();

        config = new TransferChainConfig(msg.sender, 250, 1);
        players = new PlayerRegistry();
        clubs = new ClubRegistry();
        marketplace = new TransferMarketplace();
        agreements = new TransferAgreementManager();
        escrow = new Escrow();
        treasury = new Treasury();

        config.setTreasury(address(treasury));

        vm.stopBroadcast();
    }
}
