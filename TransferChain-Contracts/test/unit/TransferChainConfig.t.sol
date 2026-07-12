// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {TransferChainConfig} from "../../src/core/TransferChainConfig.sol";

contract TransferChainConfigTest is Test {
    TransferChainConfig public config;

    address public constant TREASURY = address(0xBEEF);

    function setUp() public {
        config = new TransferChainConfig(TREASURY, 250, 1);
    }

    function testInitialization() public {
        assertEq(config.treasury(), TREASURY);
        assertEq(config.marketplaceFeeBps(), 250);
        assertEq(config.protocolVersion(), 1);
    }

    function testAdminCanManageConfiguration() public {
        address token = address(0xCAFE);

        config.addSupportedPaymentToken(token);
        assertTrue(config.isPaymentTokenSupported(token));

        config.setMarketplaceFee(300);
        assertEq(config.marketplaceFeeBps(), 300);
    }

    function testNonAdminCannotManageConfiguration() public {
        vm.prank(address(0x1234));
        vm.expectRevert();
        config.addSupportedPaymentToken(address(0xDEAD));
    }

    function testEmergencyModeAndPauseBlockOperations() public {
        config.setEmergencyMode(true);
        assertTrue(config.emergencyMode());
        assertFalse(config.isProtocolOperational());

        config.setEmergencyMode(false);
        config.pause();
        assertFalse(config.isProtocolOperational());

        config.unpause();
        assertTrue(config.isProtocolOperational());
    }
}
