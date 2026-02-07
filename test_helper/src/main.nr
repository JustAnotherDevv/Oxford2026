use std::hash::pedersen_hash;

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
    vk_1: Field,
    vk_2: Field,
) -> pub [Field; 6] {
    let comm1 = pedersen_hash([comm_val_1, comm_sec_1, comm_own_1]);
    let comm2 = pedersen_hash([comm_val_2, comm_sec_2, comm_own_2]);
    [
        pedersen_hash([null_secret_1, null_idx_1]),
        pedersen_hash([null_secret_2, null_idx_2]),
        comm1,
        comm2,
        comm_val_1 + pedersen_hash([vk_1, comm1]),
        comm_val_2 + pedersen_hash([vk_2, comm2]),
    ]
}
