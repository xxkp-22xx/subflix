// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SubManager is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Subscription {
        uint256 expiresAt;
        string ipfsHash;
    }

    struct Content {
        string name;
        string ipfsHash;
        address creator;
        bool approved;
    }

    uint256 public subscriptionPrice = 0.01 ether;
    uint256 public creatorsPool;
    uint256 public platformPool;

    uint256 private constant CREATORS_SHARE = 90;
    uint256 private constant PLATFORM_SHARE = 10;

    mapping(uint256 => Subscription) private _subscriptions;
    mapping(uint256 => Content) private _registeredContents;
    mapping(string => uint256) private _ipfsToTokenId;

    event SubscriptionPurchased(
        uint256 indexed tokenId,
        address indexed subscriber,
        uint256 expiresAt,
        string ipfsHash
    );

    event ContentRegistered(
        uint256 indexed tokenId,
        string name,
        string ipfsHash,
        address indexed creator
    );

    event ContentApproved(uint256 indexed tokenId);

    event ContentDeleted(uint256 indexed tokenId);

    event FundsWithdrawn(
        address indexed recipient,
        uint256 amount,
        bool isPlatform
    );

    constructor() ERC721("ContentSubscription", "CSUB") {}

    function registerContent(string memory name, string memory ipfsHash, address creator) external {
        require(msg.sender == creator, "You must be the creator");
        require(_ipfsToTokenId[ipfsHash] == 0, "Content already registered");

        uint256 contentTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _registeredContents[contentTokenId] = Content({
            name: name,
            ipfsHash: ipfsHash,
            creator: creator,
            approved: false
        });

        _ipfsToTokenId[ipfsHash] = contentTokenId;

        emit ContentRegistered(contentTokenId, name, ipfsHash, creator);
    }

    function approveContent(uint256 contentTokenId) external onlyOwner {
        require(contentExists(contentTokenId), "Content not found");
        _registeredContents[contentTokenId].approved = true;
        emit ContentApproved(contentTokenId);
    }

    function deleteContent(uint256 contentTokenId) external onlyOwner {
        require(contentExists(contentTokenId), "Content not found");
        string memory ipfsHash = _registeredContents[contentTokenId].ipfsHash;
        delete _registeredContents[contentTokenId];
        delete _ipfsToTokenId[ipfsHash];
        emit ContentDeleted(contentTokenId);
    }

    function isContentApproved(uint256 contentTokenId) public view returns (bool) {
        return _registeredContents[contentTokenId].approved;
    }

    function purchaseSubscription(uint256 contentTokenId) external payable {
        require(msg.value >= subscriptionPrice, "Insufficient payment");
        require(contentExists(contentTokenId), "Content not registered");
        require(isContentApproved(contentTokenId), "Content not approved yet");

        uint256 creatorsShare = (msg.value * CREATORS_SHARE) / 100;
        uint256 platformShare = (msg.value * PLATFORM_SHARE) / 100;

        creatorsPool += creatorsShare;
        platformPool += platformShare;

        uint256 subscriptionTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, subscriptionTokenId);

        _subscriptions[subscriptionTokenId] = Subscription({
            expiresAt: block.timestamp + 30 days,
            ipfsHash: _registeredContents[contentTokenId].ipfsHash
        });

        emit SubscriptionPurchased(
            subscriptionTokenId,
            msg.sender,
            block.timestamp + 30 days,
            _registeredContents[contentTokenId].ipfsHash
        );
    }

    function contentExists(uint256 contentTokenId) public view returns (bool) {
        return _registeredContents[contentTokenId].creator != address(0);
    }

    function getContentByTokenId(uint256 contentTokenId) external view returns (Content memory) {
        require(contentExists(contentTokenId), "Content not found");
        return _registeredContents[contentTokenId];
    }

    function getTokenIdByIpfsHash(string memory ipfsHash) external view returns (uint256) {
        uint256 tokenId = _ipfsToTokenId[ipfsHash];
        require(tokenId != 0, "Content not found");
        return tokenId;
    }

    function isSubscriptionValid(uint256 subscriptionTokenId) public view returns (bool) {
        ownerOf(subscriptionTokenId);
        return _subscriptions[subscriptionTokenId].expiresAt >= block.timestamp;
    }

    function getContentIpfsHash(uint256 subscriptionTokenId) external view returns (string memory) {
        require(isSubscriptionValid(subscriptionTokenId), "Subscription expired");
        return _subscriptions[subscriptionTokenId].ipfsHash;
    }

    function getSubscriptionExpiry(uint256 tokenId) external view returns (uint256) {
        return _subscriptions[tokenId].expiresAt;
    }

    function withdrawCreatorFunds(uint256 contentTokenId) external {
        require(contentExists(contentTokenId), "Content not found");
        Content memory content = _registeredContents[contentTokenId];
        require(content.creator == msg.sender, "Not the content creator");

        uint256 amount = creatorsPool;
        creatorsPool = 0;

        (bool sent, ) = content.creator.call{value: amount}("");
        require(sent, "Failed to send Ether");

        emit FundsWithdrawn(content.creator, amount, false);
    }

    function withdrawPlatformFunds() external onlyOwner {
        uint256 amount = platformPool;
        platformPool = 0;

        (bool sent, ) = owner().call{value: amount}("");
        require(sent, "Failed to send Ether");

        emit FundsWithdrawn(owner(), amount, true);
    }

    function setSubscriptionPrice(uint256 newPrice) external onlyOwner {
        subscriptionPrice = newPrice;
    }

    function getTotalContent() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}