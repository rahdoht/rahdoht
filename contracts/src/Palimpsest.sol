// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "solady/src/tokens/ERC721.sol";
import {Ownable} from "solady/src/auth/Ownable.sol";

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

/// @title Palimpsest
/// @notice NFT where text is inscribed onto a cigarette pack image and minted on Base.
///         Text lives only in the image. Mint price pegged to ~$8.50 USD via Chainlink.
contract Palimpsest is ERC721, Ownable {
    mapping(uint256 => string) private _parents;
    mapping(uint256 => string) private _uris;
    uint256 private _nextTokenId;

    bool public mintPaused;
    AggregatorV3Interface internal priceFeed;
    uint256 public packPriceUsd = 850; // in cents ($8.50)
    uint256 public constant STALENESS_THRESHOLD = 3600; // 1 hour

    error StaleOracle();
    error InvalidOraclePrice();
    error MintPaused();
    error InsufficientPayment();
    error WithdrawFailed();

    constructor(address _priceFeed) {
        _initializeOwner(msg.sender);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function name() public pure override returns (string memory) { return "Palimpsest"; }
    function symbol() public pure override returns (string memory) { return "PLMP"; }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        return _uris[tokenId];
    }

    /// @notice Mint a Palimpsest. parent is a string referencing anything.
    /// @param parent  What this Palimpsest responds to (URL, book, token, feeling).
    /// @param _tokenURI  IPFS URI of the metadata JSON.
    function mint(string calldata parent, string calldata _tokenURI) external payable {
        if (mintPaused) revert MintPaused();
        if (msg.value < packPriceInEth()) revert InsufficientPayment();

        uint256 tokenId = _nextTokenId++;
        _parents[tokenId] = parent;
        _uris[tokenId] = _tokenURI;
        _mint(msg.sender, tokenId);
    }

    /// @notice Current mint price in wei, pegged to packPriceUsd via Chainlink ETH/USD.
    function packPriceInEth() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt,) = priceFeed.latestRoundData();
        if (price <= 0) revert InvalidOraclePrice();
        if (block.timestamp - updatedAt > STALENESS_THRESHOLD) revert StaleOracle();
        // price has 8 decimals; packPriceUsd is cents
        // result = (packPriceUsd / 100) / (price / 1e8) ETH
        //        = packPriceUsd * 1e8 * 1e18 / (100 * price) wei
        //        = packPriceUsd * 1e26 / (100 * price)
        return (packPriceUsd * 10 ** 26) / (100 * uint256(price));
    }

    /// @notice Parent reference string for a token.
    function getParent(uint256 tokenId) external view returns (string memory) {
        return _parents[tokenId];
    }

    // ── Admin ──────────────────────────────────────────────────────────────

    function pauseMint(bool _paused) external onlyOwner {
        mintPaused = _paused;
    }

    function withdraw() external onlyOwner {
        (bool ok,) = msg.sender.call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    function setPackPriceUsd(uint256 _priceInCents) external onlyOwner {
        packPriceUsd = _priceInCents;
    }
}
