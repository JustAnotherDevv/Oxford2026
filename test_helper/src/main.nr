use std::hash::pedersen_hash;

// Helper circuit that computes Pedersen hashes for test fixtures.
// Execute with noir_js to get the return values, then use them
// as public inputs for the main circuit.
fn main(
    null_secret_1: Field,
    null_idx_1: Field,
    null_secret_2: Field,
    null_idx_2: Field,
    comm_val_1: Field,
    comm_sec_1: Field,
    comm_own_1: Field,
    comm_val_2: Field,
    comm_sec_2: Field,
    comm_own_2: Field,
) -> pub [Field; 4] {
    [
        pedersen_hash([null_secret_1, null_idx_1]),
        pedersen_hash([null_secret_2, null_idx_2]),
        pedersen_hash([comm_val_1, comm_sec_1, comm_own_1]),
        pedersen_hash([comm_val_2, comm_sec_2, comm_own_2]),
    ]
}
