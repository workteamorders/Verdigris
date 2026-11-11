// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Everything the renderer needs to draw one Disc. The renderer is a pure function of this struct.
interface IVerdigrisRenderer {
    struct DiscView {
        uint16 id;
        uint8 day; // 0-based Day index inside the Count (0..83). Shown to people as Day + 1.
        uint8 sign; // day % 12
        uint8 numeral; // day % 7 + 1
        uint8 tier; // 0 Ordinary, 1 Fine, 2 Crown
        uint8 serial; // 1-based position inside its Day
        uint8 level; // Patina level 0..4
        uint40 mintedAt;
        uint40 lastMovedAt;
    }

    function tokenURI(DiscView calldata v) external view returns (string memory);

    function collectionURI(address royaltyRecipient, uint96 royaltyBps, uint256 maxSupply) external view returns (string memory);
}
