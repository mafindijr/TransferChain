// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

/// @title TransferMarketplace
/// @author TransferChain
/// @notice Handles listing creation, updates, offers, and lifecycle state.
contract TransferMarketplace {
    enum ListingStatus {
        Active,
        Cancelled,
        Sold,
        Paused
    }

    enum OfferStatus {
        Pending,
        Accepted,
        Rejected,
        Expired
    }

    struct Listing {
        uint256 id;
        address seller;
        uint256 playerId;
        uint256 clubId;
        uint256 price;
        string metadataURI;
        ListingStatus status;
        uint256 createdAt;
    }

    struct Offer {
        uint256 listingId;
        address buyer;
        uint256 amount;
        OfferStatus status;
        uint256 createdAt;
    }

    uint256 public nextListingId;
    mapping(uint256 => Listing) private listings;
    mapping(uint256 => mapping(address => Offer)) private offers;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 indexed playerId, uint256 price);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event OfferMade(uint256 indexed listingId, address indexed buyer, uint256 amount);
    event OfferRejected(uint256 indexed listingId, address indexed buyer);

    error ListingNotFound();
    error Unauthorized();
    error InvalidPrice();
    error InvalidAddress();
    error InvalidMetadataURI();
    error OfferNotFound();

    constructor() {
        nextListingId = 1;
    }

    /// @notice Creates a new marketplace listing.
    /// @param seller_ The seller address.
    /// @param playerId_ The player identifier.
    /// @param clubId_ The club identifier.
    /// @param price_ The listing price.
    /// @param metadataUri_ Metadata URI for the listing.
    function createListing(
        address seller_,
        uint256 playerId_,
        uint256 clubId_,
        uint256 price_,
        string calldata metadataUri_
    ) external {
        if (seller_ == address(0)) revert InvalidAddress();
        if (seller_ != msg.sender) revert Unauthorized();
        if (price_ == 0) revert InvalidPrice();
        if (bytes(metadataUri_).length == 0) revert InvalidMetadataURI();

        uint256 listingId = nextListingId;
        nextListingId += 1;

        listings[listingId] = Listing({
            id: listingId,
            seller: seller_,
            playerId: playerId_,
            clubId: clubId_,
            price: price_,
            metadataURI: metadataUri_,
            status: ListingStatus.Active,
            createdAt: block.timestamp
        });

        emit ListingCreated(listingId, seller_, playerId_, price_);
    }

    /// @notice Cancels an existing listing.
    /// @param listingId_ The listing identifier.
    function cancelListing(uint256 listingId_) external {
        Listing storage listing = _requireListing(listingId_);
        if (listing.seller != msg.sender) revert Unauthorized();

        listing.status = ListingStatus.Cancelled;
        emit ListingCancelled(listingId_, msg.sender);
    }

    /// @notice Makes an offer for a listing.
    /// @param listingId_ The listing identifier.
    /// @param buyer_ The buyer address.
    /// @param amount_ The offer amount.
    function makeOffer(uint256 listingId_, address buyer_, uint256 amount_) external {
        _requireListing(listingId_);
        if (buyer_ == address(0)) revert InvalidAddress();
        if (buyer_ != msg.sender) revert Unauthorized();
        if (amount_ == 0) revert InvalidPrice();

        offers[listingId_][buyer_] = Offer({
            listingId: listingId_,
            buyer: buyer_,
            amount: amount_,
            status: OfferStatus.Pending,
            createdAt: block.timestamp
        });

        emit OfferMade(listingId_, buyer_, amount_);
    }

    /// @notice Rejects an existing offer.
    /// @param listingId_ The listing identifier.
    /// @param buyer_ The buyer address.
    function rejectOffer(uint256 listingId_, address buyer_) external {
        Listing storage listing = _requireListing(listingId_);
        if (listing.seller != msg.sender) revert Unauthorized();

        Offer storage offer = offers[listingId_][buyer_];
        if (offer.createdAt == 0) revert OfferNotFound();

        offer.status = OfferStatus.Rejected;
        emit OfferRejected(listingId_, buyer_);
    }

    /// @notice Returns the listing for a given identifier.
    /// @param listingId_ The listing identifier.
    /// @return The listing struct.
    function getListing(uint256 listingId_) external view returns (Listing memory) {
        return listings[listingId_];
    }

    /// @notice Returns the offer for a buyer and listing.
    /// @param listingId_ The listing identifier.
    /// @param buyer_ The buyer address.
    /// @return The offer struct.
    function getOffer(uint256 listingId_, address buyer_) external view returns (Offer memory) {
        return offers[listingId_][buyer_];
    }

    function _requireListing(uint256 listingId_) internal view returns (Listing storage listing) {
        if (listingId_ == 0 || listingId_ >= nextListingId) revert ListingNotFound();
        listing = listings[listingId_];
    }
}
