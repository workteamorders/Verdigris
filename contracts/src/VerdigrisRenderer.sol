// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IVerdigrisRenderer} from "./IVerdigrisRenderer.sol";
import {SignGlyphs} from "./SignGlyphs.sol";

/// @title Verdigris renderer
/// @notice Pure function from (Sign, Numeral, tier, serial, Patina level) to an SVG Disc and its metadata JSON.
/// @dev Layering rule: flat vector layers come first; texture filters live only on separate overlay layers with
///      fill="none", so a Disc stays readable if a marketplace strips filters. The tier reads from ring count in greyscale.
///      Stateless, no admin, no external calls.
contract VerdigrisRenderer is IVerdigrisRenderer {
    // Lookup tables: signed 16-bit values, cosine or sine times 1000.
    bytes private constant COS64 = hex"03e803e303d503bd039c0372033f030502c3027a022c01d7017f012200c300620000ff9eff3dfedefe81fe29fdd4fd86fd3dfcfbfcc1fc8efc64fc43fc2bfc1dfc18fc1dfc2bfc43fc64fc8efcc1fcfbfd3dfd86fdd4fe29fe81fedeff3dff9e0000006200c30122017f01d7022c027a02c30305033f0372039c03bd03d503e3";
    bytes private constant NOTCH = hex"0000fc18030efd9103cf00df01b20385fe4e0385fc3100dffcf2fd91"; // 7 x (cos, sin), first notch at the top, clockwise
    bytes private constant RIVET = hex"03c6010102c402c2010503c5feff03c6fd3e02c4fc3b0105fc3afefffd3cfd3efefbfc3b0101fc3a02c2fd3c03c5fefb"; // 12 x (cos, sin), offset by 0.26 rad

    string private constant EDGE = "#2A1810";
    string private constant LINE = "#2A1608";
    string private constant RING = "#D9A86E";
    string private constant RIVET_C = "#D98A4A";

    // ───────────────────────── Public surface ─────────────────────────
    function tokenURI(DiscView calldata v) external pure returns (string memory) {
        string memory svg = discSvg(v.sign, v.numeral, v.tier, v.level, v.serial);
        string memory json = string.concat(
            '{"name":"Verdigris Disc #', Strings.toString(v.id), '","description":"Day ', Strings.toString(uint256(v.day) + 1),
            ' of the Count. Sign ', SignGlyphs.name(v.sign)
        );
        json = string.concat(
            json, ', Numeral ', Strings.toString(v.numeral),
            '. Patina deepens with time since the Disc last moved. Drawn fully on-chain.",'
        );
        json = string.concat(json, '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '","attributes":', _attributes(v), "}");
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function collectionURI(address royaltyRecipient, uint96 royaltyBps, uint256 maxSupply) external pure returns (string memory) {
        string memory json = string.concat(
            '{"name":"Verdigris Discs","description":"A Count of 84 Days. One Disc design per Day, drawn fully on-chain. ',
            'Patina deepens with time since a Disc last moved. At most ', Strings.toString(maxSupply), '.",'
        );
        json = string.concat(json, '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(discSvg(4, 7, 2, 2, 1))), '",');
        json = string.concat(
            json, '"seller_fee_basis_points":', Strings.toString(royaltyBps), ',"fee_recipient":"', Strings.toHexString(royaltyRecipient), '"}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _attributes(DiscView calldata v) private pure returns (string memory out) {
        string memory tier = v.tier == 2 ? "Crown" : (v.tier == 1 ? "Fine" : "Ordinary");
        string[5] memory names = ["Fresh", "First bloom", "Spreading", "Settled", "Deep"];
        out = string.concat(
            '[{"trait_type":"Sign","value":"', SignGlyphs.name(v.sign), '"},{"trait_type":"Numeral","value":', Strings.toString(v.numeral),
            '},{"trait_type":"Tier","value":"', tier, '"}'
        );
        out = string.concat(
            out, ',{"trait_type":"Day","value":', Strings.toString(uint256(v.day) + 1), '},{"trait_type":"Serial","value":', Strings.toString(v.serial)
        );
        out = string.concat(
            out, '},{"trait_type":"Patina","value":"', names[v.level], '"},{"trait_type":"Patina level","value":', Strings.toString(v.level)
        );
        out = string.concat(out, '},{"trait_type":"Last moved","display_type":"date","value":', Strings.toString(v.lastMovedAt), "}]");
    }

    // ───────────────────────── SVG ─────────────────────────
    function discSvg(uint8 sign, uint8 numeral, uint8 tier, uint8 level, uint8 serial) public pure returns (string memory out) {
        bytes32 h = keccak256(abi.encodePacked("verdigris/0", sign, numeral, serial));
        out = string.concat('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">', _defs(h, level));
        out = string.concat(
            out, '<circle cx="200" cy="200" r="192" fill="', EDGE, '"/>',
            '<g clip-path="url(#vc)"><circle cx="200" cy="200" r="190" fill="url(#vb)"/>'
        );
        out = string.concat(
            out, '<rect width="400" height="400" fill="none" filter="url(#vr)" opacity="0.3"/>',
            '<circle cx="200" cy="200" r="190" fill="url(#vh)"/>'
        );
        out = string.concat(out, _rings(tier), _notches(numeral), _rivets(tier), _crown(tier), _glyph(sign, tier));
        out = string.concat(out, _patina(h, level, tier), "</g></svg>");
    }

    function _defs(bytes32 h, uint8 level) private pure returns (string memory out) {
        string[5] memory washStart = ["0", ".8", ".58", ".34", ".05"];
        string[5] memory washOp = ["0", ".35", ".55", ".72", ".88"];
        out = string.concat(
            '<defs><radialGradient id="vb" cx="36%" cy="30%" r="85%"><stop offset="0" stop-color="#BC8149"/><stop offset=".5" stop-color="#8F5A2D"/><stop offset="1" stop-color="#4F2F18"/></radialGradient>',
            '<linearGradient id="vh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>'
        );
        out = string.concat(
            out, '<radialGradient id="vw" cx="50%" cy="50%" r="50%"><stop offset="', washStart[level],
            '" stop-color="#3E9484" stop-opacity="0"/><stop offset="1" stop-color="', level == 4 ? "#133F43" : "#3E9484"
        );
        out = string.concat(
            out, '" stop-opacity="', washOp[level], '"/></radialGradient>', '<clipPath id="vc"><circle cx="200" cy="200" r="190"/></clipPath>'
        );
        out = string.concat(
            out, '<filter id="vr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="',
            Strings.toString(uint256(h) % 97),
            '" result="n"/><feDiffuseLighting in="n" lighting-color="#8F5A2D" surfaceScale="2.4"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting></filter>'
        );
        out = string.concat(
            out, '<filter id="vp" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="',
            Strings.toString(uint256(h) % 89),
            '" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="9"/></filter></defs>'
        );
    }

    function _ringRadii(uint8 tier) private pure returns (uint256[4] memory r, uint256 n) {
        if (tier == 0) return ([uint256(176), 120, 0, 0], 2);
        if (tier == 1) return ([uint256(176), 140, 104, 0], 3);
        return ([uint256(176), 148, 120, 92], 4);
    }

    function _rings(uint8 tier) private pure returns (string memory out) {
        (uint256[4] memory r, uint256 n) = _ringRadii(tier);
        // Two-tone band so the tier reads in greyscale.
        out = string.concat('<circle cx="200" cy="200" r="176" fill="none" stroke="', LINE, '" stroke-opacity=".18" stroke-width="', n == 2 ? "46" : "20", '"/>');
        for (uint256 i = 0; i < n; i++) {
            string memory a = string.concat('<circle cx="200" cy="200" r="', Strings.toString(r[i]), '" fill="none" stroke="', LINE, '" stroke-width="3.2"/>');
            string memory b = string.concat('<circle cx="200" cy="200" r="', Strings.toString(r[i] - 3), '" fill="none" stroke="', RING, '" stroke-width="1.1" opacity=".55"/>');
            out = string.concat(out, a, b);
        }
    }

    /// @dev 7 rim positions; the first `numeral` are cut deep.
    function _notches(uint8 numeral) private pure returns (string memory out) {
        for (uint256 i = 0; i < 7; i++) {
            uint256 r1 = i < numeral ? 1640 : 1800;
            int256 c = _t(NOTCH, 2 * i);
            int256 s = _t(NOTCH, 2 * i + 1);
            string memory a = string.concat('<line x1="', _i(_pt(c, r1)), '" y1="', _i(_pt(s, r1)), '" x2="', _i(_pt(c, 1900)));
            out = string.concat(out, a, '" y2="', _i(_pt(s, 1900)), '" stroke="', EDGE, '" stroke-width="', i < numeral ? "9" : "3", '"/>');
        }
    }

    function _rivets(uint8 tier) private pure returns (string memory out) {
        if (tier == 0) return "";
        uint256 rr = tier == 1 ? 1220 : 1340;
        for (uint256 i = 0; i < 12; i++) {
            uint256 x = _pt(_t(RIVET, 2 * i), rr);
            uint256 y = _pt(_t(RIVET, 2 * i + 1), rr);
            string memory a = string.concat('<circle cx="', _i(x), '" cy="', _i(y), '" r="6" fill="', RIVET_C, '" stroke="', LINE, '" stroke-width="1.6"/>');
            out = string.concat(out, a, '<circle cx="', _i(x - 18), '" cy="', _i(y - 20), '" r="2" fill="#fff" opacity=".6"/>');
        }
    }

    function _glyph(uint8 sign, uint8 tier) private pure returns (string memory out) {
        string memory d = SignGlyphs.path(sign);
        out = string.concat(
            '<g transform="translate(200 200) scale(', tier == 0 ? "1.45" : (tier == 1 ? "1.15" : "0.85"),
            ')" stroke-linejoin="round" stroke-linecap="round">'
        );
        out = string.concat(out, '<path d="', d, '" transform="translate(1.4 1.8)" fill="none" stroke="', RING, '" stroke-width="3" opacity=".5"/>');
        out = string.concat(
            out, '<path d="', d, '" fill="', SignGlyphs.solid(sign) ? LINE : "none", '" fill-opacity=".9" stroke="', LINE,
            '" stroke-width="3" fill-rule="evenodd"/>'
        );
        if (SignGlyphs.fillHalf(sign)) out = string.concat(out, '<path d="M0 -32A32 32 0 0 0 0 32Z" fill="', LINE, '"/>');
        out = string.concat(out, "</g>");
    }

    /// @dev Crown frame: an open diamond around the Sign, with a stud at each point. Drawn under the Sign so it stays readable.
    function _crown(uint8 tier) private pure returns (string memory) {
        if (tier != 2) return "";
        string memory studs;
        for (uint256 i = 0; i < 4; i++) {
            studs = string.concat(
                studs, '<circle cx="', i == 1 ? "258" : (i == 3 ? "142" : "200"), '" cy="', i == 0 ? "142" : (i == 2 ? "258" : "200"),
                '" r="4" fill="', RIVET_C, '" stroke="', LINE, '" stroke-width="1.2"/>'
            );
        }
        return string.concat('<path d="M200 142L258 200L200 258L142 200Z" fill="none" stroke="', RING, '" stroke-width="1.6" opacity=".95"/>', studs);
    }

    // ───────────────────────── Patina ─────────────────────────
    function _patinaCfg(uint8 level) private pure returns (uint256 n, uint256 smin, uint256 smax, uint256 rin, uint256 nf) {
        if (level == 1) return (8, 8, 16, 800, 6);
        if (level == 2) return (16, 12, 24, 580, 10);
        if (level == 3) return (28, 16, 34, 340, 16);
        return (40, 20, 44, 50, 24);
    }

    /// @dev Patina blooms from the rim inward. Blob i keeps its place at every level it exists in.
    ///      Elements are grouped by colour so the fill is written once per group.
    function _patina(bytes32 h, uint8 level, uint8 tier) private pure returns (string memory out) {
        if (level == 0) return "";
        (uint256 n, uint256 smin, uint256 smax, uint256 rin, uint256 nf) = _patinaCfg(level);
        out = string.concat('<g filter="url(#vp)"><circle cx="200" cy="200" r="190" fill="url(#vw)"/><g fill="#3E9484">', _group(h, tier, n, smin, smax, rin, false));
        out = string.concat(out, '</g><g fill="#1E5C59">', _group(h, tier, n, smin, smax, rin, true), '</g><g fill="#79D1BA">', _specks(h, nf), "</g></g>");
    }

    function _group(bytes32 h, uint8 tier, uint256 n, uint256 smin, uint256 smax, uint256 rin, bool deep) private pure returns (string memory out) {
        string memory chunk;
        for (uint256 i = 0; i < n; i++) {
            uint256 r = uint256(keccak256(abi.encodePacked(h, uint8(1), i)));
            if ((((r >> 72) % 3) == 2) != deep) continue;
            chunk = string.concat(chunk, _blob(r, tier, smin, smax, rin));
            if (bytes(chunk).length > 640) {
                out = string.concat(out, chunk);
                chunk = "";
            }
        }
        out = string.concat(out, chunk);
    }

    function _specks(bytes32 h, uint256 nf) private pure returns (string memory out) {
        string memory chunk;
        for (uint256 i = 0; i < nf; i++) {
            chunk = string.concat(chunk, _speck(uint256(keccak256(abi.encodePacked(h, uint8(2), i)))));
            if (bytes(chunk).length > 640) {
                out = string.concat(out, chunk);
                chunk = "";
            }
        }
        out = string.concat(out, chunk);
    }

    function _blobRadius(uint256 r, uint8 tier, uint256 rin) private pure returns (uint256 rad10) {
        if ((r & 0xff) < 90) {
            // groove: sits on one of the ring lines
            (uint256[4] memory rings, uint256 nr) = _ringRadii(tier);
            return rings[(r >> 16) % nr] * 10 + ((r >> 24) % 7) * 10 - 30;
        }
        uint256 s = Math.sqrt(((r >> 32) % 10000) * 10000); // 0..9999
        return (1900 * (rin + ((1000 - rin) * s) / 10000)) / 1000;
    }

    function _blob(uint256 r, uint8 tier, uint256 smin, uint256 smax, uint256 rin) private pure returns (string memory) {
        uint256 rad10 = _blobRadius(r, tier, rin);
        uint256 ai = (r >> 8) & 63;
        return string.concat(
            '<circle cx="', _i(_pt(_t(COS64, ai), rad10)), '" cy="', _i(_pt(_t(COS64, (ai + 48) & 63), rad10)), // sin(a) = cos(a - 16)
            '" r="', Strings.toString(smin + ((r >> 48) % (smax - smin + 1))), '" opacity=".', Strings.toString(32 + ((r >> 80) % 31)), '"/>'
        );
    }

    function _speck(uint256 r) private pure returns (string memory) {
        uint256 ai = r & 63;
        uint256 rad10 = 1500 + ((r >> 8) % 380);
        return string.concat(
            '<circle cx="', _i(_pt(_t(COS64, ai), rad10)), '" cy="', _i(_pt(_t(COS64, (ai + 48) & 63), rad10)),
            '" r="', Strings.toString(2 + ((r >> 24) % 5)), '" opacity=".', Strings.toString(50 + ((r >> 32) % 40)), '"/>'
        );
    }

    // ───────────────────────── Number helpers ─────────────────────────
    function _t(bytes memory tbl, uint256 i) private pure returns (int256) {
        unchecked {
            return int256(int16(uint16(uint8(tbl[2 * i])) << 8 | uint16(uint8(tbl[2 * i + 1]))));
        }
    }

    /// @dev Centre (200) plus trig(x1000) times radius (in tenths), result in tenths.
    function _pt(int256 trig, uint256 r10) private pure returns (uint256) {
        return uint256(2000 + (trig * int256(r10)) / 1000);
    }

    /// @dev Tenths to a rounded whole number.
    function _i(uint256 v10) private pure returns (string memory) {
        return Strings.toString((v10 + 5) / 10);
    }

}
