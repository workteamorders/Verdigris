// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VerdigrisRenderer} from "../src/VerdigrisRenderer.sol";
import {IVerdigrisRenderer} from "../src/IVerdigrisRenderer.sol";

contract RendererTest is Test {
    VerdigrisRenderer r = new VerdigrisRenderer();

    function _tier(uint8 n) private pure returns (uint8) {
        return n >= 7 ? 2 : (n >= 5 ? 1 : 0);
    }

    function test_deterministic() public view {
        assertEq(r.discSvg(3, 4, 0, 2, 7), r.discSvg(3, 4, 0, 2, 7));
        assertTrue(keccak256(bytes(r.discSvg(3, 4, 0, 2, 7))) != keccak256(bytes(r.discSvg(3, 4, 0, 2, 8))));
    }

    function test_patinaLevelChangesImage() public view {
        for (uint8 l = 1; l < 5; l++) {
            assertTrue(keccak256(bytes(r.discSvg(0, 1, 0, l, 1))) != keccak256(bytes(r.discSvg(0, 1, 0, l - 1, 1))));
        }
    }

    function test_filtersLiveOnOverlayLayersOnly() public view {
        string memory svg = r.discSvg(5, 3, 0, 4, 2);
        // The only filtered elements are the roughness rect (fill="none") and the Patina group.
        assertEq(_count(svg, 'fill="none" filter="url(#vr)"'), 1);
        assertEq(_count(svg, 'filter="url(#vp)"'), 1);
        assertEq(_count(svg, "filter=\""), 2);
    }

    function test_noForbiddenMarkup() public view {
        string memory svg = r.discSvg(11, 7, 2, 4, 3);
        assertEq(_count(svg, "<script"), 0);
        assertEq(_count(svg, "<image"), 0);
        assertEq(_count(svg, "href"), 0);
        assertEq(_count(svg, "<foreignObject"), 0);
    }

    function test_allDaysRenderUnderGasBudget() public view {
        for (uint8 d = 0; d < 84; d++) {
            uint8 n = (d % 7) + 1;
            uint256 g = gasleft();
            r.discSvg(d % 12, n, _tier(n), 4, 24);
            assertLt(g - gasleft(), 3_000_000);
        }
    }

    function test_tokenURIIsDataUriJson() public view {
        IVerdigrisRenderer.DiscView memory v = IVerdigrisRenderer.DiscView(12, 40, 4, 5, 0, 3, 1, 1000, 2000);
        string memory u = r.tokenURI(v);
        assertGt(bytes(u).length, 500);
    }

    function _count(string memory hay, string memory needle) private pure returns (uint256 c) {
        bytes memory h = bytes(hay);
        bytes memory n = bytes(needle);
        if (n.length == 0 || h.length < n.length) return 0;
        for (uint256 i = 0; i + n.length <= h.length; i++) {
            bool m = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) { m = false; break; }
            }
            if (m) { c++; i += n.length - 1; }
        }
    }
}
