// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @notice Mock verifier that always returns true. For testing only.
contract MockVerifier {
    function verify(
        bytes calldata,
        bytes32[] calldata
    ) external pure returns (bool) {
        return true;
    }
}
