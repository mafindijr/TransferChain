// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {PlayerRegistry} from "../../src/registries/PlayerRegistry.sol";

contract PlayerRegistryTest is Test {
    PlayerRegistry public registry;

    address public owner = address(this);
    address public player = address(0xBEEF);

    function setUp() public {
        registry = new PlayerRegistry();
    }

    function testRegisterPlayer() public {
        vm.prank(player);
        registry.registerPlayer(player, "ipfs://player-metadata", "Player One");

        PlayerRegistry.Player memory playerData = registry.getPlayer(player);
        assertEq(playerData.owner, player);
        assertEq(playerData.metadataURI, "ipfs://player-metadata");
        assertEq(uint8(playerData.status), uint8(PlayerRegistry.PlayerStatus.Active));
        assertEq(playerData.name, "Player One");
    }

    function testUpdatePlayerMetadata() public {
        vm.prank(player);
        registry.registerPlayer(player, "ipfs://player-metadata", "Player One");
        vm.prank(player);
        registry.updatePlayerMetadata(player, "ipfs://updated-metadata");

        PlayerRegistry.Player memory playerData = registry.getPlayer(player);
        assertEq(playerData.metadataURI, "ipfs://updated-metadata");
    }

    function testSetPlayerStatus() public {
        vm.prank(player);
        registry.registerPlayer(player, "ipfs://player-metadata", "Player One");
        registry.setPlayerStatus(player, PlayerRegistry.PlayerStatus.Suspended);

        PlayerRegistry.Player memory playerData = registry.getPlayer(player);
        assertEq(uint8(playerData.status), uint8(PlayerRegistry.PlayerStatus.Suspended));
    }

    function testCannotRegisterDuplicatePlayer() public {
        vm.prank(player);
        registry.registerPlayer(player, "ipfs://player-metadata", "Player One");

        vm.expectRevert();
        vm.prank(player);
        registry.registerPlayer(player, "ipfs://second", "Player Two");
    }

    function testCannotRegisterForAnotherPlayer() public {
        vm.expectRevert(PlayerRegistry.Unauthorized.selector);
        registry.registerPlayer(player, "ipfs://player-metadata", "Player One");
    }

    function testOnlyPlayerCanUpdateMetadata() public {
        vm.prank(player);
        registry.registerPlayer(player, "ipfs://player-metadata", "Player One");

        vm.expectRevert(PlayerRegistry.Unauthorized.selector);
        registry.updatePlayerMetadata(player, "ipfs://updated-metadata");
    }

    function testNonAdminCannotSetPlayerStatus() public {
        vm.prank(player);
        registry.registerPlayer(player, "ipfs://player-metadata", "Player One");

        vm.expectRevert();
        vm.prank(player);
        registry.setPlayerStatus(player, PlayerRegistry.PlayerStatus.Suspended);
    }}
