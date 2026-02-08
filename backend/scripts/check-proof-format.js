// Generate a proof using bb.js AND bb CLI, compare formats
const { Noir } = require("@noir-lang/noir_js");
const { UltraHonkBackend } = require("@aztec/bb.js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const NOIR_DIR = path.resolve(__dirname, "../../noir");
const HELPER_DIR = path.resolve(__dirname, "../../test_helper");
const BB = "/Users/nevvdevv/.bb/bb";
const NARGO = "/Users/nevvdevv/.nargo/bin/nargo";

async function main() {
  // Load circuits
  const helperCircuit = JSON.parse(fs.readFileSync(path.join(HELPER_DIR, "target/test_helper.json"), "utf8"));
  const mainCircuit = JSON.parse(fs.readFileSync(path.join(NOIR_DIR, "target/noir.json"), "utf8"));

  // Compute hashes using helper
  const helper = new Noir(helperCircuit);
  const { returnValue } = await helper.execute({
    null_secret_1: "12345", null_idx_1: "0",
    null_secret_2: "67890", null_idx_2: "1",
    comm_val_1: "0", comm_sec_1: "11111", comm_own_1: "1",
    comm_val_2: "0", comm_sec_2: "22222", comm_own_2: "2",
    vk_1: "55555", vk_2: "66666",
  });
  const [nullifier1, nullifier2, outCommitment1, outCommitment2, encryptedValue1, encryptedValue2] = returnValue;

  const circuitInputs = {
    merkle_root: "0",
    nullifier_1: nullifier1,
    nullifier_2: nullifier2,
    out_commitment_1: outCommitment1,
    out_commitment_2: outCommitment2,
    fee: "0",
    relayer: "0",
    encrypted_value_1: encryptedValue1,
    encrypted_value_2: encryptedValue2,
    in_value_1: "0", in_secret_1: "12345", in_owner_1: "1",
    in_leaf_index_1: "0",
    in_path_1: Array(20).fill("0"),
    in_dirs_1: Array(20).fill("0"),
    in_is_dummy_1: "1",
    in_value_2: "0", in_secret_2: "67890", in_owner_2: "2",
    in_leaf_index_2: "1",
    in_path_2: Array(20).fill("0"),
    in_dirs_2: Array(20).fill("0"),
    in_is_dummy_2: "1",
    out_value_1: "0", out_secret_1: "11111", out_owner_1: "1",
    out_value_2: "0", out_secret_2: "22222", out_owner_2: "2",
    out_viewing_key_1: "55555",
    out_viewing_key_2: "66666",
  };

  // ===== bb.js proof =====
  console.log("=== bb.js proof ===");
  const noir = new Noir(mainCircuit);
  const backend = new UltraHonkBackend(mainCircuit.bytecode);

  const { witness } = await noir.execute(circuitInputs);
  const proofData = await backend.generateProof(witness, { keccak: true });

  console.log(`proofData.proof.length = ${proofData.proof.length} bytes`);
  console.log(`proofData.proof.length - 4 = ${proofData.proof.length - 4} bytes = ${(proofData.proof.length - 4) / 32} fields`);
  console.log(`proofData.proof[100:].length = ${proofData.proof.length - 100} bytes = ${(proofData.proof.length - 100) / 32} fields`);
  console.log(`proofData.publicInputs.length = ${proofData.publicInputs.length}`);

  // Print first few field elements of the proof header
  console.log("\nFirst 5 field elements of proofData.proof (after 4-byte prefix):");
  for (let i = 0; i < 5; i++) {
    const offset = 4 + i * 32;
    const fieldHex = "0x" + Buffer.from(proofData.proof.slice(offset, offset + 32)).toString("hex");
    console.log(`  [${i}] = ${fieldHex}`);
  }

  // Print first few field elements of proofEnd (after 100-byte header)
  console.log("\nFirst 5 field elements of proofEnd (after 100-byte header):");
  for (let i = 0; i < 5; i++) {
    const offset = 100 + i * 32;
    const fieldHex = "0x" + Buffer.from(proofData.proof.slice(offset, offset + 32)).toString("hex");
    console.log(`  [${i}] = ${fieldHex}`);
  }

  // ===== bb CLI proof =====
  console.log("\n=== bb CLI proof ===");

  // Write Prover.toml
  const zeroPath = Array(20).fill('"0"').join(", ");
  const proverToml = [
    `merkle_root = "0"`,
    `nullifier_1 = "${nullifier1}"`,
    `nullifier_2 = "${nullifier2}"`,
    `out_commitment_1 = "${outCommitment1}"`,
    `out_commitment_2 = "${outCommitment2}"`,
    `fee = "0"`,
    `relayer = "0"`,
    `encrypted_value_1 = "${encryptedValue1}"`,
    `encrypted_value_2 = "${encryptedValue2}"`,
    `in_value_1 = "0"`, `in_secret_1 = "12345"`, `in_owner_1 = "1"`,
    `in_leaf_index_1 = "0"`,
    `in_path_1 = [${zeroPath}]`,
    `in_dirs_1 = [${zeroPath}]`,
    `in_is_dummy_1 = "1"`,
    `in_value_2 = "0"`, `in_secret_2 = "67890"`, `in_owner_2 = "2"`,
    `in_leaf_index_2 = "1"`,
    `in_path_2 = [${zeroPath}]`,
    `in_dirs_2 = [${zeroPath}]`,
    `in_is_dummy_2 = "1"`,
    `out_value_1 = "0"`, `out_secret_1 = "11111"`, `out_owner_1 = "1"`,
    `out_value_2 = "0"`, `out_secret_2 = "22222"`, `out_owner_2 = "2"`,
    `out_viewing_key_1 = "55555"`,
    `out_viewing_key_2 = "66666"`,
  ].join("\n");
  fs.writeFileSync(path.join(NOIR_DIR, "Prover.toml"), proverToml);

  execSync(`${NARGO} execute check_witness`, { cwd: NOIR_DIR });

  const witnessPath = path.join(NOIR_DIR, "target/check_witness.gz");
  const circuitPath = path.join(NOIR_DIR, "target/noir.json");
  const proofDir = path.join(NOIR_DIR, "target/proof_check");
  fs.mkdirSync(proofDir, { recursive: true });

  execSync(
    `${BB} prove -b ${circuitPath} -w ${witnessPath} -o ${proofDir} --oracle_hash keccak --init_kzg_accumulator`,
    { cwd: NOIR_DIR, timeout: 300000 }
  );

  const bbProofBytes = fs.readFileSync(path.join(proofDir, "proof"));
  const bbPubInputsBytes = fs.readFileSync(path.join(proofDir, "public_inputs"));

  console.log(`bb CLI proof file size = ${bbProofBytes.length} bytes = ${bbProofBytes.length / 32} fields`);
  console.log(`bb CLI public_inputs file size = ${bbPubInputsBytes.length} bytes = ${bbPubInputsBytes.length / 32} fields`);

  // Print first few field elements of bb CLI proof
  console.log("\nFirst 5 field elements of bb CLI proof:");
  for (let i = 0; i < 5; i++) {
    const offset = i * 32;
    const fieldHex = "0x" + bbProofBytes.slice(offset, offset + 32).toString("hex");
    console.log(`  [${i}] = ${fieldHex}`);
  }

  // Compare
  console.log("\n=== Comparison ===");
  console.log(`PROOF_SIZE in Solidity = 456 elements = ${456 * 32} bytes`);
  console.log(`bb CLI proof = ${bbProofBytes.length / 32} elements`);
  console.log(`bb.js proofEnd = ${(proofData.proof.length - 100) / 32} elements`);
  console.log(`bb.js full proof (minus 4-byte prefix) = ${(proofData.proof.length - 4) / 32} elements`);

  await backend.destroy();
}

main().catch(console.error);
