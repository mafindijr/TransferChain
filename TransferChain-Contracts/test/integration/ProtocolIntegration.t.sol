// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {TransferChainConfig} from "../../src/core/TransferChainConfig.sol";
import {PlayerRegistry} from "../../src/registries/PlayerRegistry.sol";
import {ClubRegistry} from "../../src/registries/ClubRegistry.sol";
import {TransferMarketplace} from "../../src/marketplace/TransferMarketplace.sol";
import {TransferAgreementManager} from "../../src/agreements/TransferAgreementManager.sol";
import {Escrow} from "../../src/escrow/Escrow.sol";
import {Treasury} from "../../src/treasury/Treasury.sol";
import {ERC20Mock} from "../mocks/ERC20Mock.sol";

contract ProtocolIntegrationTest is Test {
    TransferChainConfig public config;
    PlayerRegistry public players;
    ClubRegistry public clubs;
    TransferMarketplace public marketplace;
    TransferAgreementManager public agreements;
    Escrow public escrow;
    Treasury public treasury;
    ERC20Mock public token;

    address public admin = address(this);
    address public seller = address(0xBEEF);
    address public buyer = address(0xCAFE);

    function setUp() public {
        config = new TransferChainConfig(admin, 250, 1);
        players = new PlayerRegistry();
        clubs = new ClubRegistry();
        marketplace = new TransferMarketplace();
        agreements = new TransferAgreementManager();
        escrow = new Escrow();
        treasury = new Treasury();
        token = new ERC20Mock("Mock", "MCK");

        config.addSupportedPaymentToken(address(token));
        config.setTreasury(address(treasury));
        token.mint(buyer, 10_000 ether);
    }

    function testProtocolFlow() public {
        vm.prank(seller);
        players.registerPlayer(seller, "ipfs://player", "Alice");
        vm.prank(seller);
        clubs.registerClub(seller, "FC Example", "ipfs://club", "England", "London", "Premier League", "ipfs://logo", "https://example.com");

        vm.prank(seller);
        marketplace.createListing(seller, 1, 1, 1000 ether, "ipfs://listing");
        vm.prank(buyer);
        marketplace.makeOffer(1, buyer, 900 ether);

        vm.prank(buyer);
        agreements.createAgreement(1, buyer, seller, 1000 ether, 500 ether, 10, 100, 1000, 100, 50, "ipfs://agreement");
        vm.prank(buyer);
        agreements.approveAgreement(1);

        vm.startPrank(buyer);
        token.approve(address(escrow), 1000 ether);
        escrow.deposit(address(token), 1000 ether, 1, seller);
        vm.stopPrank();

        vm.prank(seller);
        escrow.release(1);

        token.mint(address(this), 100 ether);
        token.approve(address(treasury), 100 ether);
        treasury.depositToken(address(token), 100 ether);

        assertEq(players.getPlayer(seller).owner, seller);
        assertEq(clubs.getClub(seller).owner, seller);
        assertEq(uint8(marketplace.getListing(1).status), uint8(TransferMarketplace.ListingStatus.Active));
        assertEq(uint8(agreements.getAgreement(1).status), uint8(TransferAgreementManager.AgreementStatus.Approved));
        assertEq(uint8(escrow.getDeposit(1).status), uint8(Escrow.DepositStatus.Released));
    }
}
