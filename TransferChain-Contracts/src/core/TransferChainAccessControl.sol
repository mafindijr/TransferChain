// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title TransferChainAccessControl
/// @author TransferChain
/// @notice Shared access control and emergency pause module for the protocol.
contract TransferChainAccessControl is AccessControl, Pausable {
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant MARKETPLACE_ADMIN_ROLE = keccak256("MARKETPLACE_ADMIN_ROLE");
    bytes32 public constant AGREEMENT_ADMIN_ROLE = keccak256("AGREEMENT_ADMIN_ROLE");
    bytes32 public constant ESCROW_MANAGER_ROLE = keccak256("ESCROW_MANAGER_ROLE");
    bytes32 public constant TREASURY_ADMIN_ROLE = keccak256("TREASURY_ADMIN_ROLE");
    bytes32 public constant CONFIG_ADMIN_ROLE = keccak256("CONFIG_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Initializes the contract with the deployer as the default admin.
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /// @notice Grants the pause role to an account.
    /// @param account The account to receive the pause role.
    function grantPauseRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PAUSER_ROLE, account);
    }

    /// @notice Revokes the pause role from an account.
    /// @param account The account to revoke the pause role from.
    function revokePauseRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(PAUSER_ROLE, account);
    }

    /// @notice Pauses the entire protocol.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpauses the entire protocol.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Example restricted action for role-based enforcement.
    function restrictedAction() external whenNotPaused onlyRole(REGISTRY_ADMIN_ROLE) {
        // Intentionally empty.
    }

    /// @notice Returns whether the contract is currently paused.
    /// @return True if paused, false otherwise.
    function isPaused() external view returns (bool) {
        return paused();
    }
}
