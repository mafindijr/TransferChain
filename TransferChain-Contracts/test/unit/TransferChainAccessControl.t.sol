// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {TransferChainAccessControl} from "../../src/core/TransferChainAccessControl.sol";

contract TransferChainAccessControlTest is Test {
    TransferChainAccessControl public accessControl;

    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function setUp() public {
        accessControl = new TransferChainAccessControl();
        accessControl.grantRole(accessControl.DEFAULT_ADMIN_ROLE(), address(this));
    }

    function testGrantAndRevokeRole() public {
        address user = address(0xBEEF);

        accessControl.grantRole(REGISTRY_ADMIN_ROLE, user);
        assertTrue(accessControl.hasRole(REGISTRY_ADMIN_ROLE, user));

        accessControl.revokeRole(REGISTRY_ADMIN_ROLE, user);
        assertFalse(accessControl.hasRole(REGISTRY_ADMIN_ROLE, user));
    }

    function testPauseRoleCanPauseAndUnpause() public {
        address user = address(0x1234);
        accessControl.grantRole(PAUSER_ROLE, user);

        vm.prank(user);
        accessControl.pause();
        assertTrue(accessControl.isPaused());

        vm.prank(user);
        accessControl.unpause();
        assertFalse(accessControl.isPaused());
    }
}
