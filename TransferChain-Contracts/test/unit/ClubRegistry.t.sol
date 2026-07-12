// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {ClubRegistry} from "../../src/registries/ClubRegistry.sol";

contract ClubRegistryTest is Test {
    ClubRegistry public registry;

    address public owner = address(this);
    address public clubOwner = address(0xBEEF);

    function setUp() public {
        registry = new ClubRegistry();
    }

    function testRegisterClub() public {
        vm.prank(clubOwner);
        registry.registerClub(
            clubOwner,
            "FC Example",
            "ipfs://club-metadata",
            "England",
            "London",
            "Premier League",
            "ipfs://logo",
            "https://example.com"
        );

        ClubRegistry.Club memory club = registry.getClub(clubOwner);
        assertEq(club.owner, clubOwner);
        assertEq(club.name, "FC Example");
        assertEq(club.country, "England");
        assertEq(uint8(club.status), uint8(ClubRegistry.ClubStatus.Verified));
    }

    function testUpdateClubMetadata() public {
        vm.prank(clubOwner);
        registry.registerClub(
            clubOwner,
            "FC Example",
            "ipfs://club-metadata",
            "England",
            "London",
            "Premier League",
            "ipfs://logo",
            "https://example.com"
        );

        vm.prank(clubOwner);
        registry.updateClubMetadata(clubOwner, "ipfs://updated-club-metadata");
        ClubRegistry.Club memory club = registry.getClub(clubOwner);
        assertEq(club.metadataURI, "ipfs://updated-club-metadata");
    }

    function testSetClubStatus() public {
        vm.prank(clubOwner);
        registry.registerClub(
            clubOwner,
            "FC Example",
            "ipfs://club-metadata",
            "England",
            "London",
            "Premier League",
            "ipfs://logo",
            "https://example.com"
        );

        registry.setClubStatus(clubOwner, ClubRegistry.ClubStatus.Suspended);
        ClubRegistry.Club memory club = registry.getClub(clubOwner);
        assertEq(uint8(club.status), uint8(ClubRegistry.ClubStatus.Suspended));
    }

    function testDuplicateClubRegistrationReverts() public {
        vm.prank(clubOwner);
        registry.registerClub(
            clubOwner,
            "FC Example",
            "ipfs://club-metadata",
            "England",
            "London",
            "Premier League",
            "ipfs://logo",
            "https://example.com"
        );

        vm.expectRevert();
        vm.prank(clubOwner);
        registry.registerClub(
            clubOwner,
            "FC Example 2",
            "ipfs://club-metadata-2",
            "England",
            "London",
            "Premier League",
            "ipfs://logo-2",
            "https://example2.com"
        );
    }

    function testCannotRegisterForAnotherClubOwner() public {
        vm.expectRevert(ClubRegistry.Unauthorized.selector);
        registry.registerClub(
            clubOwner,
            "FC Example",
            "ipfs://club-metadata",
            "England",
            "London",
            "Premier League",
            "ipfs://logo",
            "https://example.com"
        );
    }

    function testOnlyClubOwnerCanUpdateMetadata() public {
        vm.prank(clubOwner);
        registry.registerClub(
            clubOwner,
            "FC Example",
            "ipfs://club-metadata",
            "England",
            "London",
            "Premier League",
            "ipfs://logo",
            "https://example.com"
        );

        vm.expectRevert(ClubRegistry.Unauthorized.selector);
        registry.updateClubMetadata(clubOwner, "ipfs://updated-club-metadata");
    }

    function testNonAdminCannotSetClubStatus() public {
        vm.prank(clubOwner);
        registry.registerClub(
            clubOwner,
            "FC Example",
            "ipfs://club-metadata",
            "England",
            "London",
            "Premier League",
            "ipfs://logo",
            "https://example.com"
        );

        vm.expectRevert();
        vm.prank(clubOwner);
        registry.setClubStatus(clubOwner, ClubRegistry.ClubStatus.Suspended);
    }}
