const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Noir } = require("@noir-lang/noir_js");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const NOIR_DIR = path.resolve(__dirname, "../../noir");
const HELPER_DIR = path.resolve(__dirname, "../../test_helper");
const NARGO = "/Users/nevvdevv/.nargo/bin/nargo";
const BB = "/Users/nevvdevv/.bb/bb";

describe("E2E: Real Proof Verification", function () {
  this.timeout(600000);

  let helperCircuit;

  before(async function () {
    execSync(`${NARGO} compile`, { cwd: NOIR_DIR });
    execSync(`${NARGO} compile`, { cwd: HELPER_DIR });

    const helperPath = path.join(HELPER_DIR, "target/test_helper.json");
    helperCircuit = JSON.parse(fs.readFileSync(helperPath, "utf8"));
  });

  it("should generate a real proof and verify it on the HonkVerifier contract", async function () {
    const helper = new Noir(helperCircuit);

    const testValues = {
      in_secret_1: "12345", in_leaf_index_1: "0",
      in_secret_2: "67890", in_leaf_index_2: "1",
      out_value_1: "0", out_secret_1: "11111", out_owner_1: "1",
      out_value_2: "0", out_secret_2: "22222", out_owner_2: "2",
      out_viewing_key_1: "55555",
      out_viewing_key_2: "66666",
    };

    const { returnValue } = await helper.execute({
      null_secret_1: testValues.in_secret_1,
      null_idx_1: testValues.in_leaf_index_1,
      null_secret_2: testValues.in_secret_2,
      null_idx_2: testValues.in_leaf_index_2,
      comm_val_1: testValues.out_value_1,
      comm_sec_1: testValues.out_secret_1,
      comm_own_1: testValues.out_owner_1,
      comm_val_2: testValues.out_value_2,
      comm_sec_2: testValues.out_secret_2,
      comm_own_2: testValues.out_owner_2,
      vk_1: testValues.out_viewing_key_1,
      vk_2: testValues.out_viewing_key_2,
    });

    const [nullifier1, nullifier2, outCommitment1, outCommitment2, encryptedValue1, encryptedValue2] = returnValue;

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
      `in_value_1 = "0"`,
      `in_secret_1 = "${testValues.in_secret_1}"`,
      `in_owner_1 = "1"`,
      `in_leaf_index_1 = "${testValues.in_leaf_index_1}"`,
      `in_path_1 = [${zeroPath}]`,
      `in_dirs_1 = [${zeroPath}]`,
      `in_is_dummy_1 = "1"`,
      `in_value_2 = "0"`,
      `in_secret_2 = "${testValues.in_secret_2}"`,
      `in_owner_2 = "2"`,
      `in_leaf_index_2 = "${testValues.in_leaf_index_2}"`,
      `in_path_2 = [${zeroPath}]`,
      `in_dirs_2 = [${zeroPath}]`,
      `in_is_dummy_2 = "1"`,
      `out_value_1 = "${testValues.out_value_1}"`,
      `out_secret_1 = "${testValues.out_secret_1}"`,
      `out_owner_1 = "${testValues.out_owner_1}"`,
      `out_value_2 = "${testValues.out_value_2}"`,
      `out_secret_2 = "${testValues.out_secret_2}"`,
      `out_owner_2 = "${testValues.out_owner_2}"`,
      `out_viewing_key_1 = "${testValues.out_viewing_key_1}"`,
      `out_viewing_key_2 = "${testValues.out_viewing_key_2}"`,
    ].join("\n");
    fs.writeFileSync(path.join(NOIR_DIR, "Prover.toml"), proverToml);

    execSync(`${NARGO} execute e2e_witness`, { cwd: NOIR_DIR });

    const witnessPath = path.join(NOIR_DIR, "target/e2e_witness.gz");
    const circuitPath = path.join(NOIR_DIR, "target/noir.json");
    const proofDir = path.join(NOIR_DIR, "target/proof");
    fs.mkdirSync(proofDir, { recursive: true });

    execSync(
      `${BB} prove -b ${circuitPath} -w ${witnessPath} -o ${proofDir} --oracle_hash keccak --init_kzg_accumulator`,
      { cwd: NOIR_DIR, timeout: 300000 }
    );

    const proofBytes = fs.readFileSync(path.join(proofDir, "proof"));
    const pubInputsBytes = fs.readFileSync(path.join(proofDir, "public_inputs"));

    const proofHex = "0x" + proofBytes.toString("hex");

    const publicInputsHex = [];
    for (let i = 0; i < pubInputsBytes.length; i += 32) {
      publicInputsHex.push("0x" + pubInputsBytes.slice(i, i + 32).toString("hex"));
    }
    expect(publicInputsHex.length).to.equal(9);

    const HonkVerifier = await ethers.getContractFactory("HonkVerifier");
    const verifier = await HonkVerifier.deploy();
    await verifier.waitForDeployment();

    const result = await verifier.verify(proofHex, publicInputsHex);
    expect(result).to.be.true;
  });
});
