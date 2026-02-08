const { UltraHonkBackend } = require("@aztec/bb.js");
const fs = require("fs");
const path = require("path");

async function main() {
  const circuitPath = path.resolve(__dirname, "../../noir/target/noir.json");
  const circuit = JSON.parse(fs.readFileSync(circuitPath, "utf8"));

  console.log("Creating UltraHonkBackend...");
  const backend = new UltraHonkBackend(circuit.bytecode);

  console.log("Generating Solidity verifier...");
  const solidity = await backend.getSolidityVerifier();

  const outPath = path.resolve(__dirname, "../contracts/plonk_vk.sol");
  fs.writeFileSync(outPath, solidity);
  console.log(`Solidity verifier written to ${outPath}`);
  console.log(`File size: ${solidity.length} chars`);

  // Also extract key constants
  const proofSizeMatch = solidity.match(/PROOF_SIZE\s*=\s*(\d+)/);
  const logNMatch = solidity.match(/CONST_PROOF_SIZE_LOG_N\s*=\s*(\d+)/);
  const pubInputsMatch = solidity.match(/NUMBER_OF_PUBLIC_INPUTS\s*=\s*(\d+)/);
  const ppoMatch = solidity.match(/PAIRING_POINT_OBJECT_LENGTH\s*=\s*(\d+)/);

  if (proofSizeMatch) console.log(`PROOF_SIZE = ${proofSizeMatch[1]}`);
  if (logNMatch) console.log(`CONST_PROOF_SIZE_LOG_N = ${logNMatch[1]}`);
  if (pubInputsMatch) console.log(`NUMBER_OF_PUBLIC_INPUTS = ${pubInputsMatch[1]}`);
  if (ppoMatch) console.log(`PAIRING_POINT_OBJECT_LENGTH = ${ppoMatch[1]}`);

  await backend.destroy();
}

main().catch(console.error);
