// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ClubRegistry
/// @author TransferChain
/// @notice Minimal registry for club identities with off-chain metadata pointers.
contract ClubRegistry is Ownable {
    enum ClubStatus {
        Unverified,
        Verified,
        Suspended,
        Inactive
    }

    struct Club {
        uint256 id;
        address owner;
        string name;
        string metadataURI;
        string country;
        string city;
        string league;
        string logoURI;
        string website;
        ClubStatus status;
        uint256 registeredAt;
    }

    uint256 public nextClubId;
    mapping(address => Club) private clubs;
    mapping(uint256 => address) private clubById;
    mapping(address => bool) private registeredClubs;

    event ClubRegistered(address indexed owner, uint256 indexed clubId, string name);
    event ClubMetadataUpdated(address indexed owner, uint256 indexed clubId, string metadataURI);
    event ClubStatusUpdated(address indexed owner, uint256 indexed clubId, ClubStatus status);

    error ClubAlreadyRegistered();
    error ClubNotFound();
    error InvalidAddress();
    error InvalidMetadataURI();
    error Unauthorized();

    constructor() Ownable(msg.sender) {
        nextClubId = 1;
    }

    /// @notice Registers a new club.
    /// @param owner_ The address that will own the club record.
    /// @param name_ The club name.
    /// @param metadataUri_ The metadata URI.
    /// @param country_ The club country.
    /// @param city_ The club city.
    /// @param league_ The league the club belongs to.
    /// @param logoUri_ The logo URI.
    /// @param website_ The club website.
    function registerClub(
        address owner_,
        string calldata name_,
        string calldata metadataUri_,
        string calldata country_,
        string calldata city_,
        string calldata league_,
        string calldata logoUri_,
        string calldata website_
    ) external {
        if (owner_ == address(0)) revert InvalidAddress();
        if (owner_ != msg.sender) revert Unauthorized();
        if (bytes(metadataUri_).length == 0) revert InvalidMetadataURI();
        if (registeredClubs[owner_]) revert ClubAlreadyRegistered();

        uint256 clubId = nextClubId;
        nextClubId += 1;

        Club storage clubData = clubs[owner_];
        clubData.id = clubId;
        clubData.owner = owner_;
        clubData.name = name_;
        clubData.metadataURI = metadataUri_;
        clubData.country = country_;
        clubData.city = city_;
        clubData.league = league_;
        clubData.logoURI = logoUri_;
        clubData.website = website_;
        clubData.status = ClubStatus.Verified;
        clubData.registeredAt = block.timestamp;

        clubById[clubId] = owner_;
        registeredClubs[owner_] = true;

        emit ClubRegistered(owner_, clubId, name_);
    }

    /// @notice Updates the metadata URI for an existing club.
    /// @param owner_ The club owner address.
    /// @param metadataUri_ The new metadata URI.
    function updateClubMetadata(address owner_, string calldata metadataUri_) external {
        Club storage clubData = _requireClub(owner_);
        if (owner_ != msg.sender) revert Unauthorized();
        if (bytes(metadataUri_).length == 0) revert InvalidMetadataURI();

        clubData.metadataURI = metadataUri_;
        emit ClubMetadataUpdated(owner_, clubData.id, metadataUri_);
    }

    /// @notice Updates the status of an existing club.
    /// @param owner_ The club owner address.
    /// @param status_ The new status.
    function setClubStatus(address owner_, ClubStatus status_) external onlyOwner {
        Club storage clubData = _requireClub(owner_);
        clubData.status = status_;
        emit ClubStatusUpdated(owner_, clubData.id, status_);
    }

    /// @notice Returns the club information for a given owner address.
    /// @param owner_ The owner address of the club.
    /// @return The club struct.
    function getClub(address owner_) external view returns (Club memory) {
        return clubs[owner_];
    }

    /// @notice Returns the owner address for a club ID.
    /// @param clubId The club ID.
    /// @return The owner address.
    function getClubOwner(uint256 clubId) external view returns (address) {
        return clubById[clubId];
    }

    function _requireClub(address owner_) internal view returns (Club storage clubData) {
        if (!registeredClubs[owner_]) revert ClubNotFound();
        clubData = clubs[owner_];
    }
}
