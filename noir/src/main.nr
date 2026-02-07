mod internal_transfer;

use internal_transfer::{compute_commitment, compute_nullifier, verify_merkle_proof, compute_encrypted_value};

global TREE_DEPTH: u32 = 20;

fn main(
    // --- public inputs ---
    merkle_root: pub Field,
    nullifier_1: pub Field,
    nullifier_2: pub Field,
    out_commitment_1: pub Field,
    out_commitment_2: pub Field,
    fee: pub Field,
    relayer: pub Field,
    encrypted_value_1: pub Field,
    encrypted_value_2: pub Field,

    // --- input note 1 ---
    in_value_1: Field,
    in_secret_1: Field,
    in_owner_1: Field,
    in_leaf_index_1: Field,
    in_path_1: [Field; TREE_DEPTH],
    in_dirs_1: [Field; TREE_DEPTH],
    in_is_dummy_1: Field,

    // --- input note 2 ---
    in_value_2: Field,
    in_secret_2: Field,
    in_owner_2: Field,
    in_leaf_index_2: Field,
    in_path_2: [Field; TREE_DEPTH],
    in_dirs_2: [Field; TREE_DEPTH],
    in_is_dummy_2: Field,

    // --- output note 1 ---
    out_value_1: Field,
    out_secret_1: Field,
    out_owner_1: Field,

    // --- output note 2 ---
    out_value_2: Field,
    out_secret_2: Field,
    out_owner_2: Field,

    // --- viewing keys ---
    out_viewing_key_1: Field,
    out_viewing_key_2: Field,
) {
    // ========== Input 1 ==========
    assert((in_is_dummy_1 == 0) | (in_is_dummy_1 == 1), "Dummy flag must be 0 or 1");

    let commitment_1 = compute_commitment(in_value_1, in_secret_1, in_owner_1);
    let root_1 = verify_merkle_proof(commitment_1, in_leaf_index_1, in_path_1, in_dirs_1);

    assert((in_is_dummy_1 == 1) | (root_1 == merkle_root), "Input 1: Merkle proof invalid");
    assert((in_is_dummy_1 == 0) | (in_value_1 == 0), "Dummy input 1 must have zero value");

    let computed_null_1 = compute_nullifier(in_secret_1, in_leaf_index_1);
    assert(computed_null_1 == nullifier_1, "Input 1: nullifier mismatch");

    // ========== Input 2 ==========
    assert((in_is_dummy_2 == 0) | (in_is_dummy_2 == 1), "Dummy flag must be 0 or 1");

    let commitment_2 = compute_commitment(in_value_2, in_secret_2, in_owner_2);
    let root_2 = verify_merkle_proof(commitment_2, in_leaf_index_2, in_path_2, in_dirs_2);

    assert((in_is_dummy_2 == 1) | (root_2 == merkle_root), "Input 2: Merkle proof invalid");
    assert((in_is_dummy_2 == 0) | (in_value_2 == 0), "Dummy input 2 must have zero value");

    let computed_null_2 = compute_nullifier(in_secret_2, in_leaf_index_2);
    assert(computed_null_2 == nullifier_2, "Input 2: nullifier mismatch");

    // ========== Cross-input checks ==========
    assert(nullifier_1 != nullifier_2, "Duplicate nullifier");

    // ========== Balance conservation ==========
    let total_in = in_value_1 + in_value_2;
    let total_out = out_value_1 + out_value_2;
    assert(total_in == total_out + fee, "Amounts do not balance");

    out_value_1.assert_max_bit_size::<126>();
    out_value_2.assert_max_bit_size::<126>();
    fee.assert_max_bit_size::<126>();

    // ========== Output commitments ==========
    let computed_out_1 = compute_commitment(out_value_1, out_secret_1, out_owner_1);
    assert(computed_out_1 == out_commitment_1, "Output 1: commitment mismatch");

    let computed_out_2 = compute_commitment(out_value_2, out_secret_2, out_owner_2);
    assert(computed_out_2 == out_commitment_2, "Output 2: commitment mismatch");

    // ========== Viewing key encryption ==========
    let computed_enc_1 = compute_encrypted_value(out_value_1, out_viewing_key_1, out_commitment_1);
    assert(computed_enc_1 == encrypted_value_1, "Encrypted value 1 mismatch");

    let computed_enc_2 = compute_encrypted_value(out_value_2, out_viewing_key_2, out_commitment_2);
    assert(computed_enc_2 == encrypted_value_2, "Encrypted value 2 mismatch");
}
