// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Base} from "./Base.t.sol";
import {VerdigrisDisc} from "../src/VerdigrisDisc.sol";

/// Random sequence of mints, transfers, withdrawals and time jumps.
contract Handler is Base {
    address[] public actors;
    uint256 public paid;
    uint256 public withdrawn;

    constructor(VerdigrisDisc d, address t) {
        disc = d;
        treasury = t;
        for (uint160 i = 1; i <= 6; i++) {
            actors.push(address(0x5000 + i));
            vm.deal(address(0x5000 + i), 1000 ether);
        }
    }

    function setUp() public override {}

    function mint(uint256 who, uint8 qty) external {
        address a = actors[who % actors.length];
        (uint8 st, uint8 day) = disc.countState();
        if (st != 1) return;
        qty = uint8(bound(qty, 1, 2));
        uint256 price = disc.priceOf(day) * qty;
        vm.prank(a);
        try disc.mint{value: price}(qty) {
            paid += price;
        } catch {}
    }

    function transfer(uint256 from, uint256 to, uint256 idSeed) external {
        uint256 n = disc.totalMinted();
        if (n == 0) return;
        uint256 id = (idSeed % n) + 1;
        address o = disc.ownerOf(id);
        vm.prank(o);
        disc.transferFrom(o, actors[to % actors.length], id);
        from;
    }

    function withdraw() external {
        uint256 before = address(disc).balance;
        if (before == 0) return;
        disc.withdraw();
        withdrawn += before;
    }

    function warp(uint32 secs) external {
        vm.warp(block.timestamp + bound(secs, 0, 3 days));
    }

    function actorsLength() external view returns (uint256) {
        return actors.length;
    }
}

contract InvariantsTest is StdInvariant, Base {
    Handler internal h;

    function setUp() public override {
        super.setUp();
        vm.warp(START);
        h = new Handler(disc, treasury);
        targetContract(address(h));
    }

    function invariant_supplyNeverExceeds1632() public view {
        assertLe(disc.totalMinted(), 1632);
    }

    function invariant_dayCountsRespectCapsAndSumToTotal() public view {
        uint256 sum;
        for (uint8 d = 0; d < 84; d++) {
            assertLe(disc.mintedOnDay(d), disc.capOf(d));
            sum += disc.mintedOnDay(d);
        }
        assertEq(sum, disc.totalMinted());
    }

    function invariant_walletCapPerDay() public view {
        for (uint256 i = 0; i < h.actorsLength(); i++) {
            for (uint8 d = 0; d < 84; d++) assertLe(disc.mintedByWalletOnDay(h.actors(i), d), 2);
        }
    }

    function invariant_balanceEqualsPaidMinusWithdrawn() public view {
        assertEq(address(disc).balance, h.paid() - h.withdrawn());
        assertEq(treasury.balance, h.withdrawn());
    }

    function invariant_patinaNeverAboveFour() public view {
        uint256 n = disc.totalMinted();
        for (uint256 id = 1; id <= n && id <= 40; id++) assertLe(disc.patinaLevel(id), 4);
    }
}
