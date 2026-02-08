import { Noir } from "@noir-lang/noir_js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CircuitArtifact = any;

let helperCircuit: CircuitArtifact | null = null;

async function loadCircuit(path: string): Promise<CircuitArtifact> {
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Failed to load circuit from ${path}`);
  return resp.json();
}

async function getHelperCircuit(): Promise<CircuitArtifact> {
  if (!helperCircuit) {
    helperCircuit = await loadCircuit("/circuits/test_helper.json");
  }
  return helperCircuit;
}

const PROVE_API_URL = "http://localhost:3001/api/prove";

// ── Hash computation via test_helper circuit ─────────────────────────

export interface HashInputs {
  nullSecret1: string;
  nullIdx1: string;
  nullSecret2: string;
  nullIdx2: string;
  commVal1: string;
  commSec1: string;
  commOwn1: string;
  commVal2: string;
  commSec2: string;
  commOwn2: string;
  vk1: string;
  vk2: string;
}

export interface HashOutputs {
  nullifier1: string;
  nullifier2: string;
  commitment1: string;
  commitment2: string;
  encryptedValue1: string;
  encryptedValue2: string;
}

export async function computeHashes(inputs: HashInputs): Promise<HashOutputs> {
  const circuit = await getHelperCircuit();
  const noir = new Noir(circuit);

  const { returnValue } = await noir.execute({
    null_secret_1: inputs.nullSecret1,
    null_idx_1: inputs.nullIdx1,
    null_secret_2: inputs.nullSecret2,
    null_idx_2: inputs.nullIdx2,
    comm_val_1: inputs.commVal1,
    comm_sec_1: inputs.commSec1,
    comm_own_1: inputs.commOwn1,
    comm_val_2: inputs.commVal2,
    comm_sec_2: inputs.commSec2,
    comm_own_2: inputs.commOwn2,
    vk_1: inputs.vk1,
    vk_2: inputs.vk2,
  });

  const values = returnValue as string[];
  return {
    nullifier1: values[0],
    nullifier2: values[1],
    commitment1: values[2],
    commitment2: values[3],
    encryptedValue1: values[4],
    encryptedValue2: values[5],
  };
}

export async function computeSingleCommitment(
  value: string,
  secret: string,
  owner: string,
): Promise<string> {
  const result = await computeHashes({
    nullSecret1: "0",
    nullIdx1: "0",
    nullSecret2: "0",
    nullIdx2: "1",
    commVal1: value,
    commSec1: secret,
    commOwn1: owner,
    commVal2: "0",
    commSec2: "0",
    commOwn2: "0",
    vk1: "0",
    vk2: "0",
  });
  return result.commitment1;
}

// ── Real proof generation ────────────────────────────────────────────

export interface CircuitInputs {
  // Public inputs
  merkle_root: string;
  nullifier_1: string;
  nullifier_2: string;
  out_commitment_1: string;
  out_commitment_2: string;
  fee: string;
  relayer: string;
  encrypted_value_1: string;
  encrypted_value_2: string;

  // Input note 1
  in_value_1: string;
  in_secret_1: string;
  in_owner_1: string;
  in_leaf_index_1: string;
  in_path_1: string[];
  in_dirs_1: string[];
  in_is_dummy_1: string;

  // Input note 2
  in_value_2: string;
  in_secret_2: string;
  in_owner_2: string;
  in_leaf_index_2: string;
  in_path_2: string[];
  in_dirs_2: string[];
  in_is_dummy_2: string;

  // Output note 1
  out_value_1: string;
  out_secret_1: string;
  out_owner_1: string;

  // Output note 2
  out_value_2: string;
  out_secret_2: string;
  out_owner_2: string;

  // Viewing keys
  out_viewing_key_1: string;
  out_viewing_key_2: string;
}

/**
 * Generate a real UltraHonk proof for the main circuit.
 * Delegates to a backend prove server (bb CLI) because bb.js 0.67.1 and the
 * bb CLI that generated the Solidity verifier use different Barretenberg versions
 * with incompatible proof formats (444 vs 456 field elements).
 *
 * The backend runs `nargo execute` + `bb prove --oracle_hash keccak --init_kzg_accumulator`
 * which produces proofs in the exact format the HonkVerifier Solidity contract expects.
 */
export async function generateProof(inputs: CircuitInputs): Promise<{
  proof: `0x${string}`;
  publicInputs: `0x${string}`[];
}> {
  console.log("Sending circuit inputs to prove server...");

  const resp = await fetch(PROVE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputs),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(`Prove server error: ${err.error}`);
  }

  const { proof, publicInputs } = (await resp.json()) as {
    proof: string;
    publicInputs: string[];
  };

  console.log(`Proof size: ${(proof.length - 2) / 2} bytes (expected: ${456 * 32})`);
  console.log(`Public inputs: ${publicInputs.length} (expected: 9)`);

  return {
    proof: proof as `0x${string}`,
    publicInputs: publicInputs as `0x${string}`[],
  };
}

// ── Utility ──────────────────────────────────────────────────────────

/** Convert a field element string to a 0x-prefixed bytes32 hex string */
export function fieldToBytes32(field: string): `0x${string}` {
  const bn = BigInt(field);
  return `0x${bn.toString(16).padStart(64, "0")}` as `0x${string}`;
}
