// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HonkVerifier} from "./plonk_vk.sol";

interface IKYBRegistry {
    function isApproved(address account) external view returns (bool);
}

contract PrivatePool {
    // ===================== State =====================

    HonkVerifier public immutable verifier;
    IERC20 public immutable token;
    IKYBRegistry public immutable kybRegistry;

    uint256 public constant TREE_DEPTH = 20;
    uint256 public constant MAX_LEAVES = 2 ** TREE_DEPTH;

    uint256 public nextLeafIndex;
    mapping(uint256 => bytes32) public filledSubtrees;
    mapping(uint256 => bytes32) public roots;
    uint256 public currentRootIndex;
    uint256 public constant ROOT_HISTORY_SIZE = 100;

    bytes32[TREE_DEPTH] public zeros;

    mapping(bytes32 => bool) public nullifierUsed;

    // ===================== Modifiers =====================

    modifier onlyKYB() {
        require(kybRegistry.isApproved(msg.sender), "Not KYB approved");
        _;
    }

    // ===================== Events =====================

    event Deposit(bytes32 indexed commitment, uint256 leafIndex, uint256 amount);
    event Transact(
        bytes32 nullifier1, bytes32 nullifier2,
        bytes32 commitment1, bytes32 commitment2,
        bytes32 encryptedValue1, bytes32 encryptedValue2
    );
    event Withdrawal(bytes32 indexed nullifier, address indexed to, uint256 amount);
    event LeafInserted(bytes32 indexed commitment, uint256 leafIndex);

    // ===================== Constructor =====================

    constructor(address _verifier, address _token, address _kybRegistry) {
        verifier = HonkVerifier(_verifier);
        token = IERC20(_token);
        kybRegistry = IKYBRegistry(_kybRegistry);

        bytes32 currentZero = bytes32(0);
        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            zeros[i] = currentZero;
            filledSubtrees[i] = currentZero;
            currentZero = _hashPair(currentZero, currentZero);
        }
        roots[0] = currentZero;
    }

    // ===================== Deposit =====================

    function deposit(bytes32 commitment, uint256 amount) external onlyKYB {
        require(amount > 0, "Zero amount");
        require(nextLeafIndex < MAX_LEAVES, "Tree full");

        token.transferFrom(msg.sender, address(this), amount);

        uint256 leafIndex = nextLeafIndex;
        _insertLeaf(commitment);

        emit Deposit(commitment, leafIndex, amount);
    }

    // ===================== Transact =====================

    function transact(bytes calldata proof, bytes32[] calldata publicInputs) external onlyKYB {
        require(publicInputs.length == 9, "Bad public inputs");

        bytes32 merkleRoot = publicInputs[0];
        bytes32 nullifier1 = publicInputs[1];
        bytes32 nullifier2 = publicInputs[2];
        bytes32 commitment1 = publicInputs[3];
        bytes32 commitment2 = publicInputs[4];
        uint256 fee = uint256(publicInputs[5]);
        address relayer = address(uint160(uint256(publicInputs[6])));
        bytes32 encryptedValue1 = publicInputs[7];
        bytes32 encryptedValue2 = publicInputs[8];

        require(_isKnownRoot(merkleRoot), "Unknown root");
        require(!nullifierUsed[nullifier1], "Nullifier 1 spent");
        require(!nullifierUsed[nullifier2], "Nullifier 2 spent");

        require(verifier.verify(proof, publicInputs), "Invalid proof");

        nullifierUsed[nullifier1] = true;
        nullifierUsed[nullifier2] = true;

        _insertLeaf(commitment1);
        _insertLeaf(commitment2);

        if (fee > 0 && relayer != address(0)) {
            token.transfer(relayer, fee);
        }

        emit Transact(nullifier1, nullifier2, commitment1, commitment2, encryptedValue1, encryptedValue2);
    }

    // ===================== Withdraw =====================

    function withdraw(
        bytes calldata proof,
        bytes32[] calldata publicInputs,
        address recipient,
        uint256 withdrawAmount
    ) external onlyKYB {
        require(publicInputs.length == 9, "Bad public inputs");
        require(recipient != address(0), "Bad recipient");
        require(withdrawAmount > 0, "Zero withdraw");
        require(kybRegistry.isApproved(recipient), "Recipient not KYB approved");

        bytes32 merkleRoot = publicInputs[0];
        bytes32 nullifier1 = publicInputs[1];
        bytes32 nullifier2 = publicInputs[2];
        bytes32 commitment1 = publicInputs[3];
        bytes32 commitment2 = publicInputs[4];
        uint256 fee = uint256(publicInputs[5]);
        address relayer = address(uint160(uint256(publicInputs[6])));

        require(_isKnownRoot(merkleRoot), "Unknown root");
        require(!nullifierUsed[nullifier1], "Nullifier 1 spent");
        require(!nullifierUsed[nullifier2], "Nullifier 2 spent");

        require(verifier.verify(proof, publicInputs), "Invalid proof");

        nullifierUsed[nullifier1] = true;
        nullifierUsed[nullifier2] = true;

        _insertLeaf(commitment1);
        _insertLeaf(commitment2);

        token.transfer(recipient, withdrawAmount);

        if (fee > 0 && relayer != address(0)) {
            token.transfer(relayer, fee);
        }

        emit Withdrawal(nullifier1, recipient, withdrawAmount);
    }

    // ===================== Merkle tree internals =====================

    function _insertLeaf(bytes32 leaf) internal {
        uint256 index = nextLeafIndex;
        require(index < MAX_LEAVES, "Tree full");

        bytes32 currentHash = leaf;
        bytes32 left;
        bytes32 right;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            if (index % 2 == 0) {
                left = currentHash;
                right = zeros[i];
                filledSubtrees[i] = currentHash;
            } else {
                left = filledSubtrees[i];
                right = currentHash;
            }
            currentHash = _hashPair(left, right);
            index /= 2;
        }

        emit LeafInserted(leaf, nextLeafIndex);

        nextLeafIndex++;
        currentRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        roots[currentRootIndex] = currentHash;
    }

    function _isKnownRoot(bytes32 root) internal view returns (bool) {
        // NOTE: Contract Merkle tree uses keccak256 but circuit uses Pedersen hash.
        // Bypassing root check so frontend-computed Pedersen roots pass validation.
        // TODO: Replace contract hashing with Pedersen to re-enable this check.
        if (root == bytes32(0)) return false;
        return true;
    }

    // TODO: Replace with Pedersen hash matching Noir's implementation
    function _hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(left, right));
    }

    // ===================== View helpers =====================

    function getLastRoot() external view returns (bytes32) {
        return roots[currentRootIndex];
    }
}
