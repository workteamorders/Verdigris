// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The 12 Signs: abstract geometry drawn in a -40..40 box centred on 0,0. Neutral shape names only.
library SignGlyphs {
    function name(uint8 s) internal pure returns (string memory) {
        if (s == 0) return "Arcs";
        if (s == 1) return "Quadrant";
        if (s == 2) return "Grid";
        if (s == 3) return "Tangent";
        if (s == 4) return "Crescent";
        if (s == 5) return "Chevrons";
        if (s == 6) return "Slashes";
        if (s == 7) return "Gap Ring";
        if (s == 8) return "Chord";
        if (s == 9) return "Diamond";
        if (s == 10) return "Half Disc";
        return "Squares";
    }

    function path(uint8 s) internal pure returns (string memory) {
        if (s == 0) return "M-36 16A36 36 0 0 1 36 16M-22 16A22 22 0 0 1 22 16M-8 16A8 8 0 0 1 8 16";
        if (s == 1) return "M-30 30H30A60 60 0 0 0 -30 -30Z";
        if (s == 2) return "M-30 -30H30V30H-30ZM-10 -30V30M10 -30V30M-30 -10H30M-30 10H30";
        if (s == 3) return "M-36 0a18 18 0 1 0 36 0a18 18 0 1 0 -36 0M0 0a18 18 0 1 0 36 0a18 18 0 1 0 -36 0";
        if (s == 4) return "M0 -34A34 34 0 1 0 0 34A24 24 0 1 1 0 -34Z";
        if (s == 5) return "M-30 -18L0 8L30 -18M-30 4L0 30L30 4";
        if (s == 6) return "M-26 30L6 -30M-6 30L26 -30M-14 30L18 -30";
        if (s == 7) return "M24 -22A32 32 0 1 0 24 22M30 -6V6";
        if (s == 8) return "M-32 0a32 32 0 1 0 64 0a32 32 0 1 0 -64 0M-32 8H32M0 8V32";
        if (s == 9) return "M0 -36L36 0L0 36L-36 0ZM0 -12a12 12 0 1 0 0.01 0";
        if (s == 10) return "M0 -32A32 32 0 0 0 0 32ZM0 -32A32 32 0 0 1 0 32";
        return "M-26 -26H26V26H-26ZM0 -38L38 0L0 38L-38 0Z";
    }

    /// @dev Closed shapes drawn as a solid mass (Quadrant, Crescent).
    function solid(uint8 s) internal pure returns (bool) {
        return s == 1 || s == 4;
    }

    /// @dev Half Disc fills its left half.
    function fillHalf(uint8 s) internal pure returns (bool) {
        return s == 10;
    }
}
