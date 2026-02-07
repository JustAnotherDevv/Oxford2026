// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract MockKYBRegistry {
    mapping(address => bool) public isApproved;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    function approve(address account) external {
        require(msg.sender == admin, "Not admin");
        isApproved[account] = true;
    }

    function revoke(address account) external {
        require(msg.sender == admin, "Not admin");
        isApproved[account] = false;
    }
}
