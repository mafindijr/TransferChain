// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TransferChainConfig
/// @author TransferChain
/// @notice Centralized protocol configuration for fees, payment tokens, and emergency controls.
contract TransferChainConfig is Ownable {
    uint256 public marketplaceFeeBps;
    uint256 public protocolVersion;
    address public treasury;
    bool public emergencyMode;
    bool public paused;

    mapping(address => bool) public supportedPaymentTokens;

    event TreasuryUpdated(address indexed treasury);
    event MarketplaceFeeUpdated(uint256 indexed feeBps);
    event PaymentTokenUpdated(address indexed token, bool indexed supported);
    event EmergencyModeUpdated(bool indexed enabled);
    event ProtocolPaused(bool indexed paused);

    error NotAuthorized();
    error InvalidFee();
    error InvalidAddress();
    error TokenAlreadySupported();
    error TokenNotSupported();

    constructor(address _treasury, uint256 _marketplaceFeeBps, uint256 _protocolVersion) Ownable(msg.sender) {
        if (_treasury == address(0)) revert InvalidAddress();
        if (_marketplaceFeeBps > 10_000) revert InvalidFee();

        treasury = _treasury;
        marketplaceFeeBps = _marketplaceFeeBps;
        protocolVersion = _protocolVersion;
        paused = false;
        emergencyMode = false;
    }

    /// @notice Returns whether the protocol is operational.
    /// @return True if the protocol is active and not paused.
    function isProtocolOperational() external view returns (bool) {
        return !paused && !emergencyMode;
    }

    /// @notice Adds a token to the supported payment token list.
    /// @param token The ERC-20 token address to support.
    function addSupportedPaymentToken(address token) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        if (supportedPaymentTokens[token]) revert TokenAlreadySupported();

        supportedPaymentTokens[token] = true;
        emit PaymentTokenUpdated(token, true);
    }

    /// @notice Removes a token from the supported payment token list.
    /// @param token The ERC-20 token address to remove.
    function removeSupportedPaymentToken(address token) external onlyOwner {
        if (!supportedPaymentTokens[token]) revert TokenNotSupported();

        supportedPaymentTokens[token] = false;
        emit PaymentTokenUpdated(token, false);
    }

    /// @notice Returns whether the provided token is supported.
    /// @param token The ERC-20 token address to query.
    /// @return True if supported, false otherwise.
    function isPaymentTokenSupported(address token) external view returns (bool) {
        return supportedPaymentTokens[token];
    }

    /// @notice Sets the protocol treasury address.
    /// @param _treasury The new treasury address.
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress();

        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /// @notice Updates the marketplace fee in basis points.
    /// @param feeBps The new fee percentage in basis points.
    function setMarketplaceFee(uint256 feeBps) external onlyOwner {
        if (feeBps > 10_000) revert InvalidFee();

        marketplaceFeeBps = feeBps;
        emit MarketplaceFeeUpdated(feeBps);
    }

    /// @notice Sets the protocol version.
    /// @param version The new version.
    function setProtocolVersion(uint256 version) external onlyOwner {
        protocolVersion = version;
    }

    /// @notice Enables or disables emergency mode.
    /// @param enabled True to enable emergency mode.
    function setEmergencyMode(bool enabled) external onlyOwner {
        emergencyMode = enabled;
        emit EmergencyModeUpdated(enabled);
    }

    /// @notice Pauses the protocol.
    function pause() external onlyOwner {
        paused = true;
        emit ProtocolPaused(true);
    }

    /// @notice Unpauses the protocol.
    function unpause() external onlyOwner {
        paused = false;
        emit ProtocolPaused(false);
    }
}
