// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VerdigrisDisc} from "../src/VerdigrisDisc.sol";
import {VerdigrisRenderer} from "../src/VerdigrisRenderer.sol";

abstract contract Base is Test {
    uint256 internal constant START = 1_800_000_000;
    uint256 internal constant DAY = 1 days;
    uint256 internal constant P_ORD = 0.002 ether;
    uint256 internal constant P_FINE = 0.004 ether;
    uint256 internal constant P_CROWN = 0.01 ether;

    VerdigrisDisc internal disc;
    VerdigrisRenderer internal renderer;
    address internal treasury = address(0x7E45);
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public virtual {
        vm.warp(START - 1 days);
        renderer = new VerdigrisRenderer();
        disc = new VerdigrisDisc(
            treasury, renderer, START, 1 days, [P_ORD, P_FINE, P_CROWN], [uint32(3 days), uint32(14 days), uint32(45 days), uint32(120 days)]
        );
        vm.deal(alice, 1000 ether);
        vm.deal(bob, 1000 ether);
    }

    function _priceOf(uint8 day) internal pure returns (uint256) {
        uint8 n = (day % 7) + 1;
        return n >= 7 ? P_CROWN : (n >= 5 ? P_FINE : P_ORD);
    }

    function _goToDay(uint8 day) internal {
        vm.warp(START + uint256(day) * DAY + 1 hours);
    }

    function _mint(address who, uint8 qty) internal returns (uint256 firstId) {
        (, uint8 day) = disc.countState();
        firstId = disc.totalMinted() + 1;
        uint256 price = _priceOf(day) * qty;
        vm.deal(who, who.balance + price);
        vm.prank(who);
        disc.mint{value: price}(qty);
    }
}
