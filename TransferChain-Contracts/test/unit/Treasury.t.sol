// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {Treasury} from "../../src/treasury/Treasury.sol";
import {ERC20Mock} from "../../test/mocks/ERC20Mock.sol";

contract TreasuryTest is Test {
    Treasury public treasury;
    ERC20Mock public token;

    address public admin = address(this);
    address public recipient = address(0xBEEF);

    function setUp() public {
        treasury = new Treasury();
        token = new ERC20Mock("Mock", "MCK");
        token.mint(address(treasury), 5_000 ether);
    }

    function testDepositAndWithdraw() public {
        token.mint(address(this), 1_000 ether);
        token.approve(address(treasury), 1_000 ether);
        treasury.depositToken(address(token), 1_000 ether);
        assertEq(treasury.tokenBalance(address(token)), 1_000 ether);

        treasury.withdrawToken(address(token), recipient, 500 ether);
        assertEq(token.balanceOf(recipient), 500 ether);
    }

    function testOnlyAdminCanWithdraw() public {
        vm.prank(address(0x1234));
        vm.expectRevert();
        treasury.withdrawToken(address(token), recipient, 100 ether);
    }
}
