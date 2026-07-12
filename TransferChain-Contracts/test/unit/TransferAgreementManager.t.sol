// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {TransferAgreementManager} from "../../src/agreements/TransferAgreementManager.sol";

contract TransferAgreementManagerTest is Test {
    TransferAgreementManager public manager;

    address public buyer = address(0xBEEF);
    address public seller = address(0xCAFE);

    function setUp() public {
        manager = new TransferAgreementManager();
    }

    function testCreateAgreement() public {
        vm.prank(buyer);
        manager.createAgreement(1, buyer, seller, 1000 ether, 500 ether, 10, 100, 1000, 1 days, 7 days, "ipfs://agreement");

        TransferAgreementManager.Agreement memory agreement = manager.getAgreement(1);
        assertEq(agreement.buyer, buyer);
        assertEq(agreement.seller, seller);
        assertEq(agreement.clauses.transferFee, 1000 ether);
        assertEq(uint8(agreement.status), uint8(TransferAgreementManager.AgreementStatus.Draft));
    }

    function testApproveAgreement() public {
        vm.prank(buyer);
        manager.createAgreement(1, buyer, seller, 1000 ether, 500 ether, 10, 100, 1000, 1 days, 7 days, "ipfs://agreement");
        vm.prank(buyer);
        manager.approveAgreement(1);

        TransferAgreementManager.Agreement memory agreement = manager.getAgreement(1);
        assertEq(uint8(agreement.status), uint8(TransferAgreementManager.AgreementStatus.Approved));
    }

    function testRejectAgreement() public {
        vm.prank(buyer);
        manager.createAgreement(1, buyer, seller, 1000 ether, 500 ether, 10, 100, 1000, 1 days, 7 days, "ipfs://agreement");
        vm.prank(buyer);
        manager.rejectAgreement(1);

        TransferAgreementManager.Agreement memory agreement = manager.getAgreement(1);
        assertEq(uint8(agreement.status), uint8(TransferAgreementManager.AgreementStatus.Rejected));
    }

    function testCannotCreateAgreementForAnotherBuyer() public {
        vm.expectRevert(TransferAgreementManager.Unauthorized.selector);
        manager.createAgreement(1, buyer, seller, 1000 ether, 500 ether, 10, 100, 1000, 1 days, 7 days, "ipfs://agreement");
    }

    function testOnlyBuyerCanApproveAgreement() public {
        vm.prank(buyer);
        manager.createAgreement(1, buyer, seller, 1000 ether, 500 ether, 10, 100, 1000, 1 days, 7 days, "ipfs://agreement");

        vm.expectRevert(TransferAgreementManager.Unauthorized.selector);
        vm.prank(seller);
        manager.approveAgreement(1);
    }}
