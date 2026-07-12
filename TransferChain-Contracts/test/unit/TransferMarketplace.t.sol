// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {TransferMarketplace} from "../../src/marketplace/TransferMarketplace.sol";

contract TransferMarketplaceTest is Test {
    TransferMarketplace public marketplace;

    address public seller = address(0xBEEF);
    address public buyer = address(0xCAFE);

    function setUp() public {
        marketplace = new TransferMarketplace();
    }

    function testCreateListing() public {
        vm.prank(seller);
        marketplace.createListing(seller, 1, 2, 1000 ether, "ipfs://listing");

        TransferMarketplace.Listing memory listing = marketplace.getListing(1);
        assertEq(listing.seller, seller);
        assertEq(listing.playerId, 1);
        assertEq(listing.clubId, 2);
        assertEq(listing.price, 1000 ether);
        assertEq(uint8(listing.status), uint8(TransferMarketplace.ListingStatus.Active));
    }

    function testCancelListing() public {
        vm.prank(seller);
        marketplace.createListing(seller, 1, 2, 1000 ether, "ipfs://listing");
        vm.prank(seller);
        marketplace.cancelListing(1);

        TransferMarketplace.Listing memory listing = marketplace.getListing(1);
        assertEq(uint8(listing.status), uint8(TransferMarketplace.ListingStatus.Cancelled));
    }

    function testMakeOffer() public {
        vm.prank(seller);
        marketplace.createListing(seller, 1, 2, 1000 ether, "ipfs://listing");
        vm.prank(buyer);
        marketplace.makeOffer(1, buyer, 900 ether);

        TransferMarketplace.Offer memory offer = marketplace.getOffer(1, buyer);
        assertEq(offer.buyer, buyer);
        assertEq(offer.amount, 900 ether);
        assertEq(uint8(offer.status), uint8(TransferMarketplace.OfferStatus.Pending));
    }

    function testRejectOffer() public {
        vm.prank(seller);
        marketplace.createListing(seller, 1, 2, 1000 ether, "ipfs://listing");
        vm.prank(buyer);
        marketplace.makeOffer(1, buyer, 900 ether);
        vm.prank(seller);
        marketplace.rejectOffer(1, buyer);

        TransferMarketplace.Offer memory offer = marketplace.getOffer(1, buyer);
        assertEq(uint8(offer.status), uint8(TransferMarketplace.OfferStatus.Rejected));
    }

    function testCannotCreateListingForAnotherSeller() public {
        vm.expectRevert(TransferMarketplace.Unauthorized.selector);
        marketplace.createListing(seller, 1, 2, 1000 ether, "ipfs://listing");
    }

    function testOnlySellerCanCancelListing() public {
        vm.prank(seller);
        marketplace.createListing(seller, 1, 2, 1000 ether, "ipfs://listing");

        vm.expectRevert(TransferMarketplace.Unauthorized.selector);
        vm.prank(buyer);
        marketplace.cancelListing(1);
    }

    function testCannotMakeOfferForAnotherBuyer() public {
        vm.prank(seller);
        marketplace.createListing(seller, 1, 2, 1000 ether, "ipfs://listing");

        vm.expectRevert(TransferMarketplace.Unauthorized.selector);
        marketplace.makeOffer(1, buyer, 900 ether);
    }}
