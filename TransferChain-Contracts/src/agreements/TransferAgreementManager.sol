// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

/// @title TransferAgreementManager
/// @author TransferChain
/// @notice Stores transfer agreements and their core commercial clauses.
contract TransferAgreementManager {
    enum AgreementStatus {
        Draft,
        Approved,
        Rejected,
        Expired,
        Signed
    }

    struct ClauseSet {
        uint256 transferFee;
        uint256 signingBonus;
        uint256 sellOnPercentage;
        uint256 releaseClause;
        uint256 installmentAmount;
        uint256 appearanceBonus;
        uint256 goalBonus;
        bool medicalApprovalRequired;
        uint256 negotiationDeadline;
        uint256 agreementExpiration;
        string metadataURI;
    }

    struct Agreement {
        uint256 id;
        uint256 listingId;
        address buyer;
        address seller;
        AgreementStatus status;
        ClauseSet clauses;
        bool buyerSigned;
        bool sellerSigned;
        uint256 createdAt;
    }

    uint256 public nextAgreementId;
    mapping(uint256 => Agreement) private agreements;

    event AgreementCreated(uint256 indexed agreementId, uint256 indexed listingId, address indexed buyer);
    event AgreementApproved(uint256 indexed agreementId);
    event AgreementRejected(uint256 indexed agreementId);
    event AgreementSigned(uint256 indexed agreementId);

    error AgreementNotFound();
    error Unauthorized();
    error InvalidAddress();
    error InvalidMetadataURI();

    constructor() {
        nextAgreementId = 1;
    }

    /// @notice Creates a new transfer agreement.
    function createAgreement(
        uint256 listingId_,
        address buyer_,
        address seller_,
        uint256 transferFee_,
        uint256 signingBonus_,
        uint256 sellOnPercentage_,
        uint256 releaseClause_,
        uint256 installmentAmount_,
        uint256 appearanceBonus_,
        uint256 goalBonus_,
        string calldata metadataUri_
    ) external {
        if (buyer_ == address(0) || seller_ == address(0)) revert InvalidAddress();
        if (buyer_ != msg.sender) revert Unauthorized();
        if (bytes(metadataUri_).length == 0) revert InvalidMetadataURI();

        uint256 agreementId = nextAgreementId;
        nextAgreementId += 1;

        agreements[agreementId] = Agreement({
            id: agreementId,
            listingId: listingId_,
            buyer: buyer_,
            seller: seller_,
            status: AgreementStatus.Draft,
            clauses: ClauseSet({
                transferFee: transferFee_,
                signingBonus: signingBonus_,
                sellOnPercentage: sellOnPercentage_,
                releaseClause: releaseClause_,
                installmentAmount: installmentAmount_,
                appearanceBonus: appearanceBonus_,
                goalBonus: goalBonus_,
                medicalApprovalRequired: false,
                negotiationDeadline: block.timestamp + 1 days,
                agreementExpiration: block.timestamp + 7 days,
                metadataURI: metadataUri_
            }),
            buyerSigned: false,
            sellerSigned: false,
            createdAt: block.timestamp
        });

        emit AgreementCreated(agreementId, listingId_, buyer_);
    }

    /// @notice Approves an agreement by the buyer.
    /// @param agreementId_ The agreement identifier.
    function approveAgreement(uint256 agreementId_) external {
        Agreement storage agreement = _requireAgreement(agreementId_);
        if (agreement.buyer != msg.sender) revert Unauthorized();

        agreement.status = AgreementStatus.Approved;
        emit AgreementApproved(agreementId_);
    }

    /// @notice Rejects an agreement by the buyer.
    /// @param agreementId_ The agreement identifier.
    function rejectAgreement(uint256 agreementId_) external {
        Agreement storage agreement = _requireAgreement(agreementId_);
        if (agreement.buyer != msg.sender) revert Unauthorized();

        agreement.status = AgreementStatus.Rejected;
        emit AgreementRejected(agreementId_);
    }

    /// @notice Returns the agreement by ID.
    /// @param agreementId_ The agreement identifier.
    /// @return The agreement struct.
    function getAgreement(uint256 agreementId_) external view returns (Agreement memory) {
        return agreements[agreementId_];
    }

    function _requireAgreement(uint256 agreementId_) internal view returns (Agreement storage agreement) {
        if (agreementId_ == 0 || agreementId_ >= nextAgreementId) revert AgreementNotFound();
        agreement = agreements[agreementId_];
    }
}
