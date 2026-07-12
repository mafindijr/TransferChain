// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PlayerRegistry
/// @author TransferChain
/// @notice Minimal registry for player identities with off-chain metadata pointers.
contract PlayerRegistry is Ownable {
    enum PlayerStatus {
        Active,
        Suspended,
        Inactive
    }

    struct Player {
        uint256 id;
        address owner;
        string name;
        string metadataURI;
        PlayerStatus status;
        uint256 registeredAt;
    }

    uint256 public nextPlayerId;
    mapping(address => Player) private players;
    mapping(uint256 => address) private playerById;
    mapping(address => bool) private registeredPlayers;

    event PlayerRegistered(address indexed owner, uint256 indexed playerId, string metadataURI);
    event PlayerMetadataUpdated(address indexed owner, uint256 indexed playerId, string metadataURI);
    event PlayerStatusUpdated(address indexed owner, uint256 indexed playerId, PlayerStatus status);

    error PlayerAlreadyRegistered();
    error PlayerNotFound();
    error InvalidAddress();
    error InvalidMetadataURI();
    error Unauthorized();

    constructor() Ownable(msg.sender) {
        nextPlayerId = 1;
    }

    /// @notice Registers a new player profile.
    /// @param owner_ The wallet that owns the player identity.
    /// @param metadataURI_ The IPFS or similar URI for the player metadata.
    /// @param name_ The display name for the player.
    function registerPlayer(address owner_, string calldata metadataURI_, string calldata name_) external {
        if (owner_ == address(0)) revert InvalidAddress();
        if (owner_ != msg.sender) revert Unauthorized();
        if (bytes(metadataURI_).length == 0) revert InvalidMetadataURI();
        if (registeredPlayers[owner_]) revert PlayerAlreadyRegistered();

        uint256 playerId = nextPlayerId++;
        players[owner_] = Player({
            id: playerId,
            owner: owner_,
            name: name_,
            metadataURI: metadataURI_,
            status: PlayerStatus.Active,
            registeredAt: block.timestamp
        });
        playerById[playerId] = owner_;
        registeredPlayers[owner_] = true;

        emit PlayerRegistered(owner_, playerId, metadataURI_);
    }

    /// @notice Updates the metadata URI for an existing player.
    /// @param owner_ The wallet that owns the player identity.
    /// @param metadataURI_ The new metadata URI.
    function updatePlayerMetadata(address owner_, string calldata metadataURI_) external {
        Player storage playerData = _requirePlayer(owner_);
        if (owner_ != msg.sender) revert Unauthorized();
        if (bytes(metadataURI_).length == 0) revert InvalidMetadataURI();

        playerData.metadataURI = metadataURI_;
        emit PlayerMetadataUpdated(owner_, playerData.id, metadataURI_);
    }

    /// @notice Updates the status of an existing player.
    /// @param owner_ The wallet that owns the player identity.
    /// @param status_ The new status.
    function setPlayerStatus(address owner_, PlayerStatus status_) external onlyOwner {
        Player storage playerData = _requirePlayer(owner_);
        playerData.status = status_;
        emit PlayerStatusUpdated(owner_, playerData.id, status_);
    }

    /// @notice Returns the player information for a given owner address.
    /// @param owner_ The owner address of the player.
    /// @return The player struct.
    function getPlayer(address owner_) external view returns (Player memory) {
        return players[owner_];
    }

    /// @notice Returns the owner address for a player ID.
    /// @param playerId The player ID.
    /// @return The owner address.
    function getPlayerOwner(uint256 playerId) external view returns (address) {
        return playerById[playerId];
    }

    function _requirePlayer(address owner_) internal view returns (Player storage playerData) {
        if (!registeredPlayers[owner_]) revert PlayerNotFound();
        playerData = players[owner_];
    }
}
