// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Treasury
/// @author TransferChain
/// @notice Dedicated protocol treasury for receiving and managing protocol revenue.
contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    mapping(address => uint256) public tokenBalance;

    event TokenDeposited(address indexed token, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);

    error InvalidAddress();
    error InvalidAmount();
    error InsufficientBalance();

    constructor() Ownable(msg.sender) {}

    /// @notice Records a token deposit into the treasury.
    /// @param token_ The ERC-20 token address.
    /// @param amount_ The amount deposited.
    function depositToken(address token_, uint256 amount_) external {
        if (token_ == address(0)) revert InvalidAddress();
        if (amount_ == 0) revert InvalidAmount();

        IERC20 token = IERC20(token_);
        token.safeTransferFrom(msg.sender, address(this), amount_);
        tokenBalance[token_] += amount_;

        emit TokenDeposited(token_, amount_);
    }

    /// @notice Withdraws token funds from the treasury.
    /// @param token_ The ERC-20 token address.
    /// @param to_ The recipient address.
    /// @param amount_ The amount to withdraw.
    function withdrawToken(address token_, address to_, uint256 amount_) external onlyOwner {
        if (token_ == address(0) || to_ == address(0)) revert InvalidAddress();
        if (amount_ == 0) revert InvalidAmount();
        if (tokenBalance[token_] < amount_) revert InsufficientBalance();

        tokenBalance[token_] -= amount_;
        IERC20(token_).safeTransfer(to_, amount_);

        emit TokenWithdrawn(token_, to_, amount_);
    }
}
