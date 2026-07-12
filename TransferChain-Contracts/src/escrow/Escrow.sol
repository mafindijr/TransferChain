// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Escrow
/// @author TransferChain
/// @notice Holds ERC-20 funds for transfer settlement and supports release or refund flows.
contract Escrow {
    using SafeERC20 for IERC20;

    enum DepositStatus {
        Created,
        Funded,
        Released,
        Refunded,
        Disputed
    }

    struct Deposit {
        uint256 id;
        address token;
        uint256 amount;
        uint256 agreementId;
        address payer;
        address payee;
        DepositStatus status;
        uint256 createdAt;
    }

    uint256 public nextDepositId;
    mapping(uint256 => Deposit) private deposits;
    mapping(uint256 => bool) private depositExists;

    event DepositCreated(uint256 indexed depositId, address indexed token, uint256 amount, uint256 indexed agreementId);
    event DepositFunded(uint256 indexed depositId, address indexed token, uint256 amount);
    event DepositReleased(uint256 indexed depositId, address indexed payee, uint256 amount);
    event DepositRefunded(uint256 indexed depositId, address indexed payer, uint256 amount);

    error InvalidAddress();
    error InvalidAmount();
    error DepositNotFound();
    error Unauthorized();
    error InvalidState();

    constructor() {
        nextDepositId = 1;
    }

    /// @notice Creates and funds a new escrow deposit.
    /// @param token_ The ERC-20 token address.
    /// @param amount_ The amount to escrow.
    /// @param agreementId_ The agreement identifier.
    /// @param payee_ The intended recipient.
    function deposit(address token_, uint256 amount_, uint256 agreementId_, address payee_) external {
        if (token_ == address(0) || payee_ == address(0)) revert InvalidAddress();
        if (amount_ == 0) revert InvalidAmount();

        uint256 depositId = nextDepositId;
        nextDepositId += 1;

        IERC20 token = IERC20(token_);
        token.safeTransferFrom(msg.sender, address(this), amount_);

        Deposit storage depositData = deposits[depositId];
        depositData.id = depositId;
        depositData.token = token_;
        depositData.amount = amount_;
        depositData.agreementId = agreementId_;
        depositData.payer = msg.sender;
        depositData.payee = payee_;
        depositData.status = DepositStatus.Funded;
        depositData.createdAt = block.timestamp;
        depositExists[depositId] = true;

        emit DepositCreated(depositId, token_, amount_, agreementId_);
        emit DepositFunded(depositId, token_, amount_);
    }

    /// @notice Releases the escrowed funds to the payee.
    /// @param depositId_ The deposit identifier.
    function release(uint256 depositId_) external {
        Deposit storage depositData = _requireDeposit(depositId_);
        if (depositData.payee != msg.sender) revert Unauthorized();
        if (depositData.status != DepositStatus.Funded) revert InvalidState();

        depositData.status = DepositStatus.Released;
        IERC20(depositData.token).safeTransfer(depositData.payee, depositData.amount);
        emit DepositReleased(depositId_, depositData.payee, depositData.amount);
    }

    /// @notice Refunds the escrowed funds to the payer.
    /// @param depositId_ The deposit identifier.
    function refund(uint256 depositId_) external {
        Deposit storage depositData = _requireDeposit(depositId_);
        if (depositData.payer != msg.sender) revert Unauthorized();
        if (depositData.status != DepositStatus.Funded) revert InvalidState();

        depositData.status = DepositStatus.Refunded;
        IERC20(depositData.token).safeTransfer(depositData.payer, depositData.amount);
        emit DepositRefunded(depositId_, depositData.payer, depositData.amount);
    }

    /// @notice Returns the deposit details.
    /// @param depositId_ The deposit identifier.
    /// @return The deposit struct.
    function getDeposit(uint256 depositId_) external view returns (Deposit memory) {
        return deposits[depositId_];
    }

    function _requireDeposit(uint256 depositId_) internal view returns (Deposit storage depositData) {
        if (!depositExists[depositId_]) revert DepositNotFound();
        depositData = deposits[depositId_];
    }
}
