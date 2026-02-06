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
