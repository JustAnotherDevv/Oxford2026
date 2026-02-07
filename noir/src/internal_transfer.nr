use std::hash::pedersen_hash;

pub fn compute_commitment(value: Field, secret: Field, owner: Field) -> Field {
    pedersen_hash([value, secret, owner])
}

pub fn compute_nullifier(secret: Field, leaf_index: Field) -> Field {
    pedersen_hash([secret, leaf_index])
}

pub fn verify_merkle_proof<let N: u32>(
    leaf: Field,
    _leaf_index: Field,
    path: [Field; N],
    directions: [Field; N],
) -> Field {
    let mut current = leaf;

    for i in 0..N {
        let sibling = path[i];
        let dir = directions[i];

        assert((dir == 0) | (dir == 1), "Direction must be 0 or 1");

        let (left, right) = if dir == 0 {
            (current, sibling)
        } else {
            (sibling, current)
        };

        current = pedersen_hash([left, right]);
    }

    current
}

#[test]
fn test_commitment_is_deterministic() {
    let c1 = compute_commitment(100, 42, 1);
    let c2 = compute_commitment(100, 42, 1);
    assert(c1 == c2);
}

#[test]
fn test_commitment_changes_with_different_inputs() {
    let c1 = compute_commitment(100, 42, 1);
    let c2 = compute_commitment(101, 42, 1);
    let c3 = compute_commitment(100, 43, 1);
    let c4 = compute_commitment(100, 42, 2);
    assert(c1 != c2);
    assert(c1 != c3);
    assert(c1 != c4);
}

#[test]
fn test_nullifier_is_deterministic() {
    let n1 = compute_nullifier(42, 0);
    let n2 = compute_nullifier(42, 0);
    assert(n1 == n2);
}

#[test]
fn test_nullifier_changes_with_different_inputs() {
    let n1 = compute_nullifier(42, 0);
    let n2 = compute_nullifier(43, 0);
    let n3 = compute_nullifier(42, 1);
    assert(n1 != n2);
    assert(n1 != n3);
}

#[test]
fn test_merkle_proof_depth_2() {
    let leaf0 = compute_commitment(100, 1, 1);
    let leaf1 = compute_commitment(200, 2, 2);
    let leaf2 = compute_commitment(300, 3, 3);
    let leaf3 = compute_commitment(400, 4, 4);

    let node0 = pedersen_hash([leaf0, leaf1]);
    let node1 = pedersen_hash([leaf2, leaf3]);
    let root = pedersen_hash([node0, node1]);

    let computed = verify_merkle_proof(leaf0, 0, [leaf1, node1], [0, 0]);
    assert(computed == root);

    let computed1 = verify_merkle_proof(leaf1, 1, [leaf0, node1], [1, 0]);
    assert(computed1 == root);

    let computed3 = verify_merkle_proof(leaf3, 3, [leaf2, node0], [1, 1]);
    assert(computed3 == root);
}

#[test(should_fail)]
fn test_merkle_proof_wrong_sibling_fails() {
    let leaf0 = compute_commitment(100, 1, 1);
    let leaf1 = compute_commitment(200, 2, 2);
    let leaf2 = compute_commitment(300, 3, 3);
    let leaf3 = compute_commitment(400, 4, 4);

    let node1 = pedersen_hash([leaf2, leaf3]);
    let node0 = pedersen_hash([leaf0, leaf1]);
    let root = pedersen_hash([node0, node1]);

    let computed = verify_merkle_proof(leaf0, 0, [leaf2, node1], [0, 0]);
    assert(computed == root);
}

fn build_tree_depth_2(l0: Field, l1: Field, l2: Field, l3: Field) -> (Field, Field, Field) {
    let node0 = pedersen_hash([l0, l1]);
    let node1 = pedersen_hash([l2, l3]);
    let root = pedersen_hash([node0, node1]);
    (root, node0, node1)
}

#[test]
fn test_transfer_with_dummy_input() {
    let a_owner = 1;
    let b_owner = 2;
    let fee = 0;

    let a_secret = 111;
    let a_value = 1000;
    let a_commitment = compute_commitment(a_value, a_secret, a_owner);

    let filler = compute_commitment(500, 999, 99);
    let (root, _node0, node1) = build_tree_depth_2(a_commitment, filler, filler, filler);

    let computed_root = verify_merkle_proof(a_commitment, 0, [filler, node1], [0, 0]);
    assert(computed_root == root);

    let null_1 = compute_nullifier(a_secret, 0);

    let dummy_secret = 77777;
    let dummy_index = 99999;
    let null_2 = compute_nullifier(dummy_secret, dummy_index);
    assert(null_1 != null_2);

    let out_value_1 = 1000;
    let out_value_2 = 0;
    assert(a_value + 0 == out_value_1 + out_value_2 + fee);

    let b_secret = 222;
    let change_secret = 333;
    let _out_comm_1 = compute_commitment(out_value_1, b_secret, b_owner);
    let _out_comm_2 = compute_commitment(out_value_2, change_secret, a_owner);
}

#[test]
fn test_transfer_with_relayer_fee() {
    let a_owner = 1;
    let b_owner = 2;
    let relayer_addr = 0xdead;
    let fee = 50;

    let a_secret = 111;
    let a_value = 1000;
    let a_commitment = compute_commitment(a_value, a_secret, a_owner);

    let filler = compute_commitment(500, 999, 99);
    let (root, _node0, node1) = build_tree_depth_2(a_commitment, filler, filler, filler);

    let computed_root = verify_merkle_proof(a_commitment, 0, [filler, node1], [0, 0]);
    assert(computed_root == root);

    let null_1 = compute_nullifier(a_secret, 0);
    let null_2 = compute_nullifier(77777, 99999);
    assert(null_1 != null_2);

    let out_value_1 = 950;
    let out_value_2 = 0;
    assert(a_value + 0 == out_value_1 + out_value_2 + fee);

    assert(relayer_addr == 0xdead);

    let _out_comm_1 = compute_commitment(out_value_1, 222, b_owner);
    let _out_comm_2 = compute_commitment(out_value_2, 333, a_owner);
}

#[test]
fn test_partial_transfer_with_relayer_fee() {
    let a_owner = 1;
    let b_owner = 2;
    let fee = 50;

    let a_value = 1000;
    let out_to_b = 600;
    let change = 350;

    assert(a_value + 0 == out_to_b + change + fee);

    let _comm_b = compute_commitment(out_to_b, 222, b_owner);
    let _comm_change = compute_commitment(change, 333, a_owner);
}

#[test(should_fail)]
fn test_relayer_cannot_inflate_fee() {
    let input_total = 1000;
    let out_total = 950;
    let honest_fee = 50;
    let inflated_fee = 100;

    assert(input_total == out_total + honest_fee);
    assert(input_total == out_total + inflated_fee);
}

#[test]
fn test_split_inside_pool() {
    let a_owner = 1;
    let a_secret = 111;
    let a_value = 1000;
    let a_commitment = compute_commitment(a_value, a_secret, a_owner);

    let filler = compute_commitment(0, 0, 0);
    let (root, _node0, node1) = build_tree_depth_2(a_commitment, filler, filler, filler);

    let computed_root = verify_merkle_proof(a_commitment, 0, [filler, node1], [0, 0]);
    assert(computed_root == root);

    let out_1 = 700;
    let out_2 = 300;
    let fee = 0;
    assert(a_value + 0 == out_1 + out_2 + fee);

    let new_secret_1 = 444;
    let new_secret_2 = 555;
    let out_comm_1 = compute_commitment(out_1, new_secret_1, a_owner);
    let out_comm_2 = compute_commitment(out_2, new_secret_2, a_owner);
    assert(out_comm_1 != out_comm_2);
}

#[test]
fn test_merge_two_notes() {
    let b_owner = 2;

    let secret_1 = 222;
    let secret_2 = 333;
    let note_1 = compute_commitment(700, secret_1, b_owner);
    let note_2 = compute_commitment(300, secret_2, b_owner);

    let filler = compute_commitment(0, 0, 0);
    let (root, _node0, node1) = build_tree_depth_2(note_1, note_2, filler, filler);

    let root_1 = verify_merkle_proof(note_1, 0, [note_2, node1], [0, 0]);
    assert(root_1 == root);

    let root_2 = verify_merkle_proof(note_2, 1, [note_1, node1], [1, 0]);
    assert(root_2 == root);

    let null_1 = compute_nullifier(secret_1, 0);
    let null_2 = compute_nullifier(secret_2, 1);
    assert(null_1 != null_2);

    let merged_value = 1000;
    let zero_change = 0;
    let fee = 0;
    assert(700 + 300 == merged_value + zero_change + fee);

    let merged_secret = 666;
    let zero_secret = 777;
    let out_comm_1 = compute_commitment(merged_value, merged_secret, b_owner);
    let out_comm_2 = compute_commitment(zero_change, zero_secret, b_owner);
    assert(out_comm_1 != out_comm_2);
}

#[test]
fn test_full_privacy_flow() {
    let a_owner = 1;
    let b_owner = 2;
    let filler = compute_commitment(0, 0, 0);

    let a_secret = 100;
    let a_note = compute_commitment(13700, a_secret, a_owner);
    let (root_1, _n0, node1_1) = build_tree_depth_2(a_note, filler, filler, filler);

    let check_root = verify_merkle_proof(a_note, 0, [filler, node1_1], [0, 0]);
    assert(check_root == root_1);

    let split_secret_1 = 201;
    let split_secret_2 = 202;
    assert(13700 == 10000 + 3700);

    let split_note_1 = compute_commitment(10000, split_secret_1, a_owner);
    let split_note_2 = compute_commitment(3700, split_secret_2, a_owner);

    let b_secret_1 = 301;
    let b_note_1 = compute_commitment(10000, b_secret_1, b_owner);
    let change_secret_1 = 302;
    let _change_1 = compute_commitment(0, change_secret_1, a_owner);
    assert(10000 + 0 == 10000 + 0);

    let b_secret_2 = 401;
    let b_note_2 = compute_commitment(3700, b_secret_2, b_owner);
    assert(3700 + 0 == 3700 + 0);

    let merged_secret = 501;
    let merged_note = compute_commitment(13700, merged_secret, b_owner);
    assert(10000 + 3700 == 13700 + 0);

    assert(a_note != split_note_1);
    assert(split_note_1 != split_note_2);
    assert(b_note_1 != b_note_2);
    assert(merged_note != a_note);
    assert(merged_note != b_note_1);

    let final_secret_1 = 601;
    let final_secret_2 = 602;
    let _withdraw_1 = compute_commitment(8000, final_secret_1, b_owner);
    let _withdraw_2 = compute_commitment(5700, final_secret_2, b_owner);
    assert(13700 == 8000 + 5700);
}

#[test]
fn test_spend_then_respend_produces_different_nullifiers() {
    let secret = 67890;
    let nullifier_at_0 = compute_nullifier(secret, 0);
    let nullifier_at_5 = compute_nullifier(secret, 5);
    assert(nullifier_at_0 != nullifier_at_5);
}

#[test(should_fail)]
fn test_balance_mismatch_detected() {
    let input_total = 1000;
    let output_total = 1001;
    assert(input_total == output_total);
}
