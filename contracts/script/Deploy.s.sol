// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {VerdigrisDisc} from "../src/VerdigrisDisc.sol";
import {VerdigrisRenderer} from "../src/VerdigrisRenderer.sol";

/// @notice Deploys the renderer and the Disc contract. Holds no key: the signer comes from the forge command line
///         (`--account <keystore>` or `--ledger`). Parameters come from non-secret environment variables.
///         Run through scripts/deploy-anvil.sh (local) or scripts/deploy-owner.sh (the owner, by hand).
contract Deploy is Script {
    uint256 internal constant ROBINHOOD_MAINNET = 4663;

    function run() external returns (VerdigrisRenderer renderer, VerdigrisDisc disc) {
        address treasury = vm.envAddress("TREASURY");
        uint256 startTime = vm.envUint("START_TIME");
        uint256 slotSeconds = vm.envUint("SLOT_SECONDS");
        uint256[3] memory prices = [vm.envUint("PRICE_ORDINARY_WEI"), vm.envUint("PRICE_FINE_WEI"), vm.envUint("PRICE_CROWN_WEI")];
        uint32[4] memory patina = [
            uint32(vm.envUint("PATINA_1_SECONDS")),
            uint32(vm.envUint("PATINA_2_SECONDS")),
            uint32(vm.envUint("PATINA_3_SECONDS")),
            uint32(vm.envUint("PATINA_4_SECONDS"))
        ];

        require(treasury != address(0), "TREASURY is zero");
        require(startTime > block.timestamp, "START_TIME must be in the future");
        if (block.chainid == ROBINHOOD_MAINNET) {
            require(keccak256(bytes(vm.envOr("CONFIRM_MAINNET", string("")))) == keccak256("yes"), "set CONFIRM_MAINNET=yes");
            require(slotSeconds == 86400, "mainnet Day must be 86400 seconds");
        }

        console2.log("chainid", block.chainid);
        console2.log("treasury (immutable, receives every withdraw and all royalties)", treasury);
        console2.log("start", startTime);
        console2.log("slot seconds (immutable)", slotSeconds);

        vm.startBroadcast();
        renderer = new VerdigrisRenderer();
        disc = new VerdigrisDisc(treasury, renderer, startTime, slotSeconds, prices, patina);
        vm.stopBroadcast();

        console2.log("renderer", address(renderer));
        console2.log("disc", address(disc));
    }
}
