// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./Base.t.sol";
import {VerdigrisDisc} from "../src/VerdigrisDisc.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// Receiver that tries to mint again from inside onERC721Received.
contract ReentrantMinter is IERC721Receiver {
    VerdigrisDisc public disc;
    bool public reentered;
    bool public reentryReverted;

    constructor(VerdigrisDisc d) {
        disc = d;
    }

    function go(uint256 price) external payable {
        disc.mint{value: price}(1);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        if (!reentered) {
            reentered = true;
            (, uint8 day) = disc.countState();
            try disc.mint{value: disc.priceOf(day) * 2}(2) {} catch { reentryReverted = true; }
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}

contract RejectingTreasury {
    receive() external payable { revert("no"); }
}

contract VerdigrisDiscTest is Base {
    event MetadataUpdate(uint256 _tokenId);

    // ── Count and Day rules ──
    function test_notStartedReverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VerdigrisDisc.NotStarted.selector, START));
        disc.mint{value: P_ORD}(1);
    }

    function test_dayIdentity() public view {
        for (uint8 d = 0; d < 84; d++) {
            assertEq(disc.signOf(d), d % 12);
            assertEq(disc.numeralOf(d), (d % 7) + 1);
        }
    }

    function test_shortSlotClockForTestDeployments() public {
        VerdigrisDisc d2 = new VerdigrisDisc(
            treasury, renderer, START, 300, [P_ORD, P_FINE, P_CROWN], [uint32(60), uint32(120), uint32(240), uint32(480)]
        );
        vm.warp(START + 300 * 5 + 1);
        (uint8 st, uint8 day) = d2.countState();
        assertEq(st, 1);
        assertEq(day, 5);
        vm.warp(START + 300 * 84);
        (st,) = d2.countState();
        assertEq(st, 2);
    }

    function test_84SlotsAreDistinctAndSumTo1632() public view {
        uint256 total;
        bool[84] memory seen;
        for (uint8 d = 0; d < 84; d++) {
            uint256 k = uint256(disc.signOf(d)) * 7 + (disc.numeralOf(d) - 1);
            assertFalse(seen[k]);
            seen[k] = true;
            total += disc.capOf(d);
        }
        assertEq(total, 1632);
        assertEq(disc.MAX_SUPPLY(), 1632);
    }

    function test_tierBoundaries() public view {
        // Numeral 4 is Ordinary, 5 and 6 Fine, 7 Crown.
        assertEq(disc.tierOf(3), 0); // numeral 4
        assertEq(disc.tierOf(4), 1); // numeral 5
        assertEq(disc.tierOf(5), 1); // numeral 6
        assertEq(disc.tierOf(6), 2); // numeral 7
        assertEq(disc.capOf(3), 24);
        assertEq(disc.capOf(4), 16);
        assertEq(disc.capOf(6), 8);
    }

    function test_countStateAcrossTime() public {
        (uint8 st,) = disc.countState();
        assertEq(st, 0);
        vm.warp(START);
        (st,) = disc.countState();
        assertEq(st, 1);
        vm.warp(START + 84 * DAY - 1);
        (uint8 st2, uint8 day) = disc.countState();
        assertEq(st2, 1);
        assertEq(day, 83);
        vm.warp(START + 84 * DAY);
        (st,) = disc.countState();
        assertEq(st, 2);
        vm.prank(alice);
        vm.expectRevert(VerdigrisDisc.CountEnded.selector);
        disc.mint{value: P_ORD}(1);
    }

    // ── Mint rules ──
    function test_exactPaymentOnly() public {
        _goToDay(0);
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(VerdigrisDisc.WrongPayment.selector, P_ORD, P_ORD - 1));
        disc.mint{value: P_ORD - 1}(1);
        vm.expectRevert(abi.encodeWithSelector(VerdigrisDisc.WrongPayment.selector, P_ORD, P_ORD + 1));
        disc.mint{value: P_ORD + 1}(1);
        vm.expectRevert(abi.encodeWithSelector(VerdigrisDisc.WrongPayment.selector, P_ORD * 2, P_ORD));
        disc.mint{value: P_ORD}(2);
        vm.stopPrank();
        assertEq(address(disc).balance, 0);
    }

    function test_quantityBounds() public {
        _goToDay(0);
        vm.startPrank(alice);
        vm.expectRevert(VerdigrisDisc.BadQuantity.selector);
        disc.mint{value: 0}(0);
        vm.expectRevert(VerdigrisDisc.BadQuantity.selector);
        disc.mint{value: P_ORD * 3}(3);
        vm.stopPrank();
    }

    function test_walletCapPerDay() public {
        _goToDay(0);
        _mint(alice, 1);
        _mint(alice, 1);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VerdigrisDisc.WalletCapReached.selector, 0, 0));
        disc.mint{value: P_ORD}(1);
        // Next Day the allowance is fresh.
        _goToDay(1);
        _mint(alice, 2);
        assertEq(disc.balanceOf(alice), 4);
    }

    function test_walletCapCountsQuantity() public {
        _goToDay(0);
        _mint(alice, 1);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VerdigrisDisc.WalletCapReached.selector, 0, 1));
        disc.mint{value: P_ORD * 2}(2);
    }

    function test_daySoldOutAt24() public {
        _goToDay(0);
        for (uint160 i = 0; i < 12; i++) _mint(address(0x1000 + i), 2);
        assertEq(disc.mintedOnDay(0), 24);
        vm.deal(bob, 10 ether);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(VerdigrisDisc.DaySoldOut.selector, 0, 0));
        disc.mint{value: P_ORD}(1);
    }

    function test_crownCapIs8() public {
        _goToDay(6);
        for (uint160 i = 0; i < 4; i++) _mint(address(0x2000 + i), 2);
        assertEq(disc.mintedOnDay(6), 8);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(VerdigrisDisc.DaySoldOut.selector, 6, 0));
        disc.mint{value: P_CROWN}(1);
    }

    function test_serialsAndIdsAreSequential() public {
        _goToDay(0);
        uint256 a = _mint(alice, 2);
        uint256 b = _mint(bob, 1);
        assertEq(a, 1);
        assertEq(b, 3);
        assertEq(disc.discInfo(1).serial, 1);
        assertEq(disc.discInfo(2).serial, 2);
        assertEq(disc.discInfo(3).serial, 3);
        assertEq(disc.discInfo(3).day, 0);
    }

    function test_reentrancyCannotExceedCaps() public {
        _goToDay(0);
        ReentrantMinter m = new ReentrantMinter(disc);
        vm.deal(address(m), 10 ether);
        m.go(P_ORD);
        assertTrue(m.reentered());
        // One mint of 1, then the re-entrant mint of 2 would be 3 > WALLET_SLOT_CAP, so it must have reverted.
        assertTrue(m.reentryReverted());
        assertEq(disc.balanceOf(address(m)), 1);
    }

    // ── Patina ──
    function test_patinaThresholdsAndReset() public {
        _goToDay(0);
        uint256 id = _mint(alice, 1);
        uint256 t0 = block.timestamp;
        assertEq(disc.patinaLevel(id), 0);
        vm.warp(t0 + 3 days - 1);
        assertEq(disc.patinaLevel(id), 0);
        vm.warp(t0 + 3 days);
        assertEq(disc.patinaLevel(id), 1);
        vm.warp(t0 + 14 days);
        assertEq(disc.patinaLevel(id), 2);
        vm.warp(t0 + 45 days);
        assertEq(disc.patinaLevel(id), 3);
        vm.warp(t0 + 120 days);
        assertEq(disc.patinaLevel(id), 4);
        vm.prank(alice);
        disc.transferFrom(alice, bob, id);
        assertEq(disc.patinaLevel(id), 0);
        assertEq(disc.discInfo(id).lastMovedAt, block.timestamp);
    }

    function test_safeTransferAndSelfTransferAlsoReset() public {
        _goToDay(0);
        uint256 id = _mint(alice, 1);
        vm.warp(block.timestamp + 20 days);
        assertEq(disc.patinaLevel(id), 2);
        vm.prank(alice);
        disc.safeTransferFrom(alice, bob, id);
        assertEq(disc.patinaLevel(id), 0);
        vm.warp(block.timestamp + 20 days);
        vm.prank(bob);
        disc.transferFrom(bob, bob, id);
        assertEq(disc.patinaLevel(id), 0);
    }

    function test_approvalAloneDoesNotReset() public {
        _goToDay(0);
        uint256 id = _mint(alice, 1);
        vm.warp(block.timestamp + 20 days);
        vm.prank(alice);
        disc.approve(bob, id);
        assertEq(disc.patinaLevel(id), 2);
    }

    function test_transferEmitsMetadataUpdate() public {
        _goToDay(0);
        uint256 id = _mint(alice, 1);
        vm.expectEmit(false, false, false, true, address(disc));
        emit MetadataUpdate(id);
        vm.prank(alice);
        disc.transferFrom(alice, bob, id);
    }

    function testFuzz_patinaMonotonic(uint32 a, uint32 b) public view {
        (a, b) = a <= b ? (a, b) : (b, a);
        assertLe(disc.patinaLevelAt(a), disc.patinaLevelAt(b));
        assertLe(disc.patinaLevelAt(b), 4);
    }

    // ── Treasury ──
    function test_withdrawIsPermissionlessAndOnlyToTreasury() public {
        _goToDay(0);
        _mint(alice, 2);
        uint256 held = address(disc).balance;
        assertEq(held, P_ORD * 2);
        vm.prank(address(0xDEAD));
        disc.withdraw();
        assertEq(address(disc).balance, 0);
        assertEq(treasury.balance, held);
        vm.expectRevert(VerdigrisDisc.NothingToWithdraw.selector);
        disc.withdraw();
    }

    function test_withdrawFailureReverts() public {
        RejectingTreasury bad = new RejectingTreasury();
        VerdigrisDisc d2 = new VerdigrisDisc(
            address(bad), renderer, START, 1 days, [P_ORD, P_FINE, P_CROWN], [uint32(3 days), uint32(14 days), uint32(45 days), uint32(120 days)]
        );
        vm.warp(START + 1);
        vm.prank(alice);
        d2.mint{value: P_ORD}(1);
        vm.expectRevert(VerdigrisDisc.WithdrawFailed.selector);
        d2.withdraw();
    }

    function test_plainEtherTransferIsRejected() public {
        vm.prank(alice);
        (bool ok,) = address(disc).call{value: 1 ether}("");
        assertFalse(ok);
    }

    // ── Standards ──
    function test_interfaces() public view {
        assertTrue(disc.supportsInterface(0x80ac58cd)); // ERC-721
        assertTrue(disc.supportsInterface(0x5b5e139f)); // ERC-721 Metadata
        assertTrue(disc.supportsInterface(0x2a55205a)); // ERC-2981
        assertTrue(disc.supportsInterface(0x49064906)); // ERC-4906
        assertFalse(disc.supportsInterface(0xffffffff));
    }

    function test_royalty500bps() public view {
        (address to, uint256 amt) = disc.royaltyInfo(1, 10_000);
        assertEq(to, treasury);
        assertEq(amt, 500);
        assertEq(disc.name(), "Verdigris Discs");
        assertEq(disc.symbol(), "VERD");
    }

    function test_constructorRejectsBadConfig() public {
        uint256[3] memory p = [P_ORD, P_FINE, P_CROWN];
        vm.expectRevert(VerdigrisDisc.BadConfig.selector);
        new VerdigrisDisc(address(0), renderer, START, 1 days, p, [uint32(1), 2, 3, 4]);
        vm.expectRevert(VerdigrisDisc.BadConfig.selector);
        new VerdigrisDisc(treasury, renderer, 0, 1 days, p, [uint32(1), 2, 3, 4]);
        vm.expectRevert(VerdigrisDisc.BadConfig.selector);
        new VerdigrisDisc(treasury, renderer, START, 1 days, p, [uint32(3), 3, 5, 6]);
        vm.expectRevert(VerdigrisDisc.BadConfig.selector);
        new VerdigrisDisc(treasury, renderer, START, 1 days, p, [uint32(0), 2, 3, 4]);
        vm.expectRevert(VerdigrisDisc.BadConfig.selector);
        new VerdigrisDisc(treasury, renderer, START, 59, p, [uint32(1), 2, 3, 4]);
    }

    // ── Views ──
    function test_tokenURIAndGas() public {
        _goToDay(6);
        uint256 id = _mint(alice, 1);
        vm.warp(block.timestamp + 130 days); // deepest Patina, heaviest SVG
        uint256 g = gasleft();
        string memory uri = disc.tokenURI(id);
        uint256 used = g - gasleft();
        assertLt(used, 3_000_000);
        assertGt(bytes(uri).length, 1000);
        assertEq(_slice(uri, 29), "data:application/json;base64,");
        vm.expectRevert();
        disc.tokenURI(999);
    }

    function test_contractURI() public view {
        assertGt(bytes(disc.contractURI()).length, 500);
    }

    function test_mintedAllMatchesPerDay() public {
        _goToDay(0);
        _mint(alice, 2);
        _goToDay(6);
        _mint(bob, 1);
        uint16[84] memory all = disc.mintedAll();
        assertEq(all[0], 2);
        assertEq(all[6], 1);
        assertEq(all[7], 0);
    }

    function test_ownedIdsPaging() public {
        _goToDay(0);
        _mint(alice, 2);
        _mint(bob, 2);
        _goToDay(1);
        _mint(alice, 2);
        (uint256[] memory ids, uint256 next) = disc.ownedIds(alice, 1, 100);
        assertEq(ids.length, 4);
        assertEq(next, 0);
        (ids, next) = disc.ownedIds(alice, 1, 2); // scans ids 1..2 only
        assertEq(ids.length, 2);
        assertEq(next, 3);
        (ids, next) = disc.ownedIds(alice, next, 2); // scans 3..4: Bob's
        assertEq(ids.length, 0);
        assertEq(next, 5);
    }

    function testFuzz_dayInfoMatchesRules(uint8 day) public view {
        day = uint8(bound(day, 0, 83));
        (uint8 sign, uint8 numeral, uint8 tier, uint256 cap, uint256 minted, uint256 price) = disc.dayInfo(day);
        assertEq(sign, day % 12);
        assertEq(numeral, (day % 7) + 1);
        assertEq(tier, numeral >= 7 ? 2 : (numeral >= 5 ? 1 : 0));
        assertEq(cap, tier == 2 ? 8 : (tier == 1 ? 16 : 24));
        assertEq(minted, 0);
        assertEq(price, _priceOf(day));
    }

    function testFuzz_anyWrongValueReverts(uint256 value) public {
        _goToDay(0);
        vm.assume(value != P_ORD);
        vm.deal(alice, value);
        vm.prank(alice);
        vm.expectRevert();
        disc.mint{value: value}(1);
    }

    function _slice(string memory s, uint256 n) private pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory o = new bytes(n);
        for (uint256 i = 0; i < n; i++) o[i] = b[i];
        return string(o);
    }
}
