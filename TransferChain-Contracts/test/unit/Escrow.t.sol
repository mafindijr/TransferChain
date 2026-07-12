// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {Escrow} from "../../src/escrow/Escrow.sol";
import {ERC20Mock} from "../../test/mocks/ERC20Mock.sol";

contract EscrowTest is Test {
    Escrow public escrow;
    ERC20Mock public token;

    address public payer = address(0xBEEF);
    address public payee = address(0xCAFE);

    function setUp() public {
        escrow = new Escrow();
        token = new ERC20Mock("Mock", "MCK");
        token.mint(payer, 10_000 ether);
    }

    function testDepositAndRelease() public {
        vm.startPrank(payer);
        token.approve(address(escrow), 1_000 ether);
        escrow.deposit(address(token), 1_000 ether, 1, payee);
        vm.stopPrank();

        Escrow.Deposit memory deposit = escrow.getDeposit(1);
        assertEq(deposit.amount, 1_000 ether);
        assertEq(uint8(deposit.status), uint8(Escrow.DepositStatus.Funded));

        vm.prank(payee);
        escrow.release(1);
        deposit = escrow.getDeposit(1);
        assertEq(uint8(deposit.status), uint8(Escrow.DepositStatus.Released));
    }

    function testRefundDeposit() public {
        vm.startPrank(payer);
        token.approve(address(escrow), 1_000 ether);
        escrow.deposit(address(token), 1_000 ether, 1, payee);
        vm.stopPrank();

        vm.prank(payer);
        escrow.refund(1);
        Escrow.Deposit memory deposit = escrow.getDeposit(1);
        assertEq(uint8(deposit.status), uint8(Escrow.DepositStatus.Refunded));
    }

    function testOnlyPayeeCanRelease() public {
        vm.startPrank(payer);
        token.approve(address(escrow), 1_000 ether);
        escrow.deposit(address(token), 1_000 ether, 1, payee);
        vm.stopPrank();

        vm.expectRevert(Escrow.Unauthorized.selector);
        vm.prank(payer);
        escrow.release(1);
    }

    function testOnlyPayerCanRefund() public {
        vm.startPrank(payer);
        token.approve(address(escrow), 1_000 ether);
        escrow.deposit(address(token), 1_000 ether, 1, payee);
        vm.stopPrank();

        vm.expectRevert(Escrow.Unauthorized.selector);
        vm.prank(payee);
        escrow.refund(1);
    }}
