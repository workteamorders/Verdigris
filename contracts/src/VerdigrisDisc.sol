// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IVerdigrisRenderer} from "./IVerdigrisRenderer.sol";

/// @title Verdigris Discs
/// @notice A Count of 84 Days (one Day = SLOT_SECONDS, 86400 on mainnet). Each Day is one slot: Sign = day % 12, Numeral = day % 7 + 1.
///         Numerals 1-4 are Ordinary (24 per Day), 5-6 Fine (16 per Day), 7 Crown (8 per Day): at most 1,632 Discs.
///         A Disc's Patina deepens with the time since it last moved and resets on any transfer.
/// @dev Immutable. No owner, no admin, no pause, no upgrade. Payment is exact and never refunded.
///      `withdraw()` is permissionless and can only send the balance to the immutable TREASURY.
///      Timestamps come from the chain's block clock; on Arbitrum-family chains that is the sequencer clock,
///      so a Day boundary can be off by minutes. Nothing here depends on minute precision.
contract VerdigrisDisc is ERC721, ERC2981, IERC4906 {
    // ───────────────────────── Constants ─────────────────────────
    uint256 public constant COUNT_DAYS = 84;
    uint256 public constant WALLET_SLOT_CAP = 2;
    uint256 public constant TX_CAP = 2;
    uint256 public constant MAX_SUPPLY = 1632;
    uint96 public constant ROYALTY_BPS = 500;
    uint256 public constant CAP_ORDINARY = 24;
    uint256 public constant CAP_FINE = 16;
    uint256 public constant CAP_CROWN = 8;

    // ───────────────────────── Immutables ─────────────────────────
    address public immutable TREASURY;
    IVerdigrisRenderer public immutable RENDERER;
    /// @notice Unix time at which Day 0 begins.
    uint256 public immutable START_TIME;
    /// @notice Seconds per Day. 86400 on mainnet; a short value only on test deployments (the site shows a TEST CLOCK banner).
    uint256 public immutable SLOT_SECONDS;
    uint256 public immutable PRICE_ORDINARY;
    uint256 public immutable PRICE_FINE;
    uint256 public immutable PRICE_CROWN;
    /// @notice Seconds without a move at which Patina level 1, 2, 3 and 4 begin.
    uint32 public immutable PATINA_1;
    uint32 public immutable PATINA_2;
    uint32 public immutable PATINA_3;
    uint32 public immutable PATINA_4;

    // ───────────────────────── Storage ─────────────────────────
    struct Disc {
        uint8 day;
        uint8 serial;
        uint40 mintedAt;
        uint40 lastMovedAt;
    }

    uint256 private _nextId = 1;
    mapping(uint256 id => Disc) private _discs;
    mapping(uint8 day => uint16) public mintedOnDay;
    mapping(address wallet => mapping(uint8 day => uint8)) public mintedByWalletOnDay;

    // ───────────────────────── Events / errors ─────────────────────────
    event Minted(address indexed to, uint8 indexed day, uint256 firstId, uint8 quantity);
    event Withdrawn(address indexed treasury, uint256 amount);

    error NotStarted(uint256 startsAt);
    error CountEnded();
    error BadQuantity();
    error DaySoldOut(uint8 day, uint256 remaining);
    error WalletCapReached(uint8 day, uint256 remaining);
    error WrongPayment(uint256 expected, uint256 sent);
    error NothingToWithdraw();
    error WithdrawFailed();
    error BadConfig();

    constructor(
        address treasury,
        IVerdigrisRenderer renderer,
        uint256 startTime,
        uint256 slotSeconds,
        uint256[3] memory prices, // Ordinary, Fine, Crown (wei)
        uint32[4] memory patinaSeconds // level 1..4 starts
    ) ERC721("Verdigris Discs", "VERD") {
        if (treasury == address(0) || address(renderer) == address(0) || startTime == 0 || slotSeconds < 60) revert BadConfig();
        if (
            patinaSeconds[0] == 0 || patinaSeconds[0] >= patinaSeconds[1] || patinaSeconds[1] >= patinaSeconds[2]
                || patinaSeconds[2] >= patinaSeconds[3]
        ) revert BadConfig();
        TREASURY = treasury;
        RENDERER = renderer;
        START_TIME = startTime;
        SLOT_SECONDS = slotSeconds;
        PRICE_ORDINARY = prices[0];
        PRICE_FINE = prices[1];
        PRICE_CROWN = prices[2];
        PATINA_1 = patinaSeconds[0];
        PATINA_2 = patinaSeconds[1];
        PATINA_3 = patinaSeconds[2];
        PATINA_4 = patinaSeconds[3];
        _setDefaultRoyalty(treasury, ROYALTY_BPS);
    }

    // ───────────────────────── Count and slots (pure rules) ─────────────────────────
    function signOf(uint8 day) public pure returns (uint8) {
        return day % 12;
    }

    function numeralOf(uint8 day) public pure returns (uint8) {
        return (day % 7) + 1;
    }

    /// @return 0 Ordinary (Numerals 1-4), 1 Fine (5-6), 2 Crown (7)
    function tierOf(uint8 day) public pure returns (uint8) {
        uint8 n = numeralOf(day);
        return n >= 7 ? 2 : (n >= 5 ? 1 : 0);
    }

    function capOf(uint8 day) public pure returns (uint256) {
        uint8 t = tierOf(day);
        return t == 2 ? CAP_CROWN : (t == 1 ? CAP_FINE : CAP_ORDINARY);
    }

    function priceOf(uint8 day) public view returns (uint256) {
        uint8 t = tierOf(day);
        return t == 2 ? PRICE_CROWN : (t == 1 ? PRICE_FINE : PRICE_ORDINARY);
    }

    /// @return status 0 not started, 1 live, 2 ended
    /// @return day the live Day (0..83); 0 when not live
    function countState() public view returns (uint8 status, uint8 day) {
        if (block.timestamp < START_TIME) return (0, 0);
        uint256 d = (block.timestamp - START_TIME) / SLOT_SECONDS;
        if (d >= COUNT_DAYS) return (2, 0);
        return (1, uint8(d));
    }

    /// @notice Everything the Mint page needs for one Day in a single call.
    function dayInfo(uint8 day)
        external
        view
        returns (uint8 sign, uint8 numeral, uint8 tier, uint256 cap, uint256 minted, uint256 price)
    {
        require(day < COUNT_DAYS, "day");
        return (signOf(day), numeralOf(day), tierOf(day), capOf(day), mintedOnDay[day], priceOf(day));
    }

    /// @notice Minted count for every Day in one call. The Calendar needs all 84 and Multicall3 is not assumed to exist.
    function mintedAll() external view returns (uint16[84] memory out) {
        for (uint8 d = 0; d < 84; d++) out[d] = mintedOnDay[d];
    }

    // ───────────────────────── Mint ─────────────────────────
    /// @notice Mint `quantity` Discs of the live Day to the caller. `msg.value` must equal the price exactly.
    function mint(uint8 quantity) external payable {
        (uint8 status, uint8 day) = countState();
        if (status == 0) revert NotStarted(START_TIME);
        if (status == 2) revert CountEnded();
        if (quantity == 0 || quantity > TX_CAP) revert BadQuantity();

        uint256 minted = mintedOnDay[day];
        uint256 cap = capOf(day);
        if (minted + quantity > cap) revert DaySoldOut(day, cap - minted);

        uint256 byWallet = mintedByWalletOnDay[msg.sender][day];
        if (byWallet + quantity > WALLET_SLOT_CAP) revert WalletCapReached(day, WALLET_SLOT_CAP - byWallet);

        uint256 expected = priceOf(day) * quantity;
        if (msg.value != expected) revert WrongPayment(expected, msg.value);

        // Effects first: every counter is final before any external call.
        mintedOnDay[day] = uint16(minted + quantity);
        mintedByWalletOnDay[msg.sender][day] = uint8(byWallet + quantity);
        uint256 firstId = _nextId;
        _nextId = firstId + quantity;
        for (uint256 i = 0; i < quantity; i++) {
            _discs[firstId + i] = Disc({
                day: day,
                serial: uint8(minted + i + 1),
                mintedAt: uint40(block.timestamp),
                lastMovedAt: uint40(block.timestamp)
            });
        }
        emit Minted(msg.sender, day, firstId, quantity);
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, firstId + i);
        }
    }

    // ───────────────────────── Treasury ─────────────────────────
    /// @notice Anyone may call. Sends the whole balance to the immutable TREASURY. Nothing else can move funds.
    function withdraw() external {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();
        (bool ok,) = TREASURY.call{value: amount}("");
        if (!ok) revert WithdrawFailed();
        emit Withdrawn(TREASURY, amount);
    }

    // ───────────────────────── Patina ─────────────────────────
    /// @dev Single hook for mint, transfer and safeTransfer: any move resets the Patina clock.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = super._update(to, tokenId, auth);
        _discs[tokenId].lastMovedAt = uint40(block.timestamp);
        emit MetadataUpdate(tokenId);
    }

    function patinaLevelAt(uint256 elapsed) public view returns (uint8) {
        if (elapsed >= PATINA_4) return 4;
        if (elapsed >= PATINA_3) return 3;
        if (elapsed >= PATINA_2) return 2;
        if (elapsed >= PATINA_1) return 1;
        return 0;
    }

    function patinaLevel(uint256 id) public view returns (uint8) {
        _requireOwned(id);
        uint256 last = _discs[id].lastMovedAt;
        return block.timestamp <= last ? 0 : patinaLevelAt(block.timestamp - last);
    }

    function patinaThresholds() external view returns (uint32[4] memory t) {
        t = [PATINA_1, PATINA_2, PATINA_3, PATINA_4];
    }

    // ───────────────────────── Reads ─────────────────────────
    function totalMinted() public view returns (uint256) {
        return _nextId - 1;
    }

    struct DiscInfo {
        uint8 day;
        uint8 sign;
        uint8 numeral;
        uint8 tier;
        uint8 serial;
        uint8 level;
        uint40 mintedAt;
        uint40 lastMovedAt;
        address owner;
    }

    function discInfo(uint256 id) external view returns (DiscInfo memory info) {
        info.owner = _requireOwned(id);
        Disc memory d = _discs[id];
        info.day = d.day;
        info.sign = signOf(d.day);
        info.numeral = numeralOf(d.day);
        info.tier = tierOf(d.day);
        info.serial = d.serial;
        info.level = patinaLevel(id);
        info.mintedAt = d.mintedAt;
        info.lastMovedAt = d.lastMovedAt;
    }

    /// @notice Bounded scan so no enumeration extension is needed. Scans ids fromId .. fromId+scan-1.
    /// @return ids the ids owned by `holder` inside the scanned range
    /// @return nextId where to continue, or 0 when the end was reached
    function ownedIds(address holder, uint256 fromId, uint256 scan) external view returns (uint256[] memory ids, uint256 nextId) {
        uint256 last = _nextId - 1;
        if (fromId == 0) fromId = 1;
        uint256 end = fromId + scan - 1;
        if (end > last) end = last;
        uint256 found;
        uint256 cap = balanceOf(holder);
        ids = new uint256[](cap);
        for (uint256 id = fromId; id <= end && found < cap; id++) {
            if (_ownerOf(id) == holder) ids[found++] = id;
        }
        assembly {
            mstore(ids, found)
        }
        nextId = (end >= last || found == cap) ? 0 : end + 1;
    }

    function _view(uint256 id) private view returns (IVerdigrisRenderer.DiscView memory v) {
        Disc memory d = _discs[id];
        v = IVerdigrisRenderer.DiscView({
            id: uint16(id),
            day: d.day,
            sign: signOf(d.day),
            numeral: numeralOf(d.day),
            tier: tierOf(d.day),
            serial: d.serial,
            level: patinaLevel(id),
            mintedAt: d.mintedAt,
            lastMovedAt: d.lastMovedAt
        });
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        _requireOwned(id);
        return RENDERER.tokenURI(_view(id));
    }

    function contractURI() external view returns (string memory) {
        return RENDERER.collectionURI(TREASURY, ROYALTY_BPS, MAX_SUPPLY);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981, IERC165) returns (bool) {
        return interfaceId == bytes4(0x49064906) || super.supportsInterface(interfaceId);
    }
}
