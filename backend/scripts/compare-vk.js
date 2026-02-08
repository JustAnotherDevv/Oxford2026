// Compare VK from bb.js with VK embedded in plonk_vk.sol
const { UltraHonkBackend } = require("@aztec/bb.js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const NOIR_DIR = path.resolve(__dirname, "../../noir");
const BB = "/Users/nevvdevv/.bb/bb";

async function main() {
  const circuitPath = path.join(NOIR_DIR, "target/noir.json");
  const circuit = JSON.parse(fs.readFileSync(circuitPath, "utf8"));

  // Get VK from bb.js
  console.log("=== bb.js VK ===");
  const backend = new UltraHonkBackend(circuit.bytecode);
  const vkBytes = await backend.getVerificationKey();
  console.log(`VK size: ${vkBytes.length} bytes`);

  // Print first 100 bytes as hex
  console.log("First 128 bytes:");
  for (let i = 0; i < 128 && i < vkBytes.length; i += 32) {
    const hex = "0x" + Buffer.from(vkBytes.slice(i, i + 32)).toString("hex");
    console.log(`  [${i/32}] = ${hex}`);
  }

  // Get VK from bb CLI
  console.log("\n=== bb CLI VK ===");
  const vkDir = path.join(NOIR_DIR, "target/vk_check");
  fs.mkdirSync(vkDir, { recursive: true });
  execSync(`${BB} write_vk -b ${circuitPath} -o ${vkDir}/vk`, { cwd: NOIR_DIR, timeout: 60000 });
  const bbVkBytes = fs.readFileSync(path.join(vkDir, "vk"));
  console.log(`VK size: ${bbVkBytes.length} bytes`);

  console.log("First 128 bytes:");
  for (let i = 0; i < 128 && i < bbVkBytes.length; i += 32) {
    const hex = "0x" + bbVkBytes.slice(i, i + 32).toString("hex");
    console.log(`  [${i/32}] = ${hex}`);
  }

  // Compare
  console.log("\n=== Comparison ===");
  console.log(`bb.js VK size: ${vkBytes.length} bytes`);
  console.log(`bb CLI VK size: ${bbVkBytes.length} bytes`);
  if (vkBytes.length === bbVkBytes.length) {
    let same = true;
    for (let i = 0; i < vkBytes.length; i++) {
      if (vkBytes[i] !== bbVkBytes[i]) {
        same = false;
        console.log(`First difference at byte ${i}`);
        break;
      }
    }
    if (same) console.log("VKs are IDENTICAL");
  } else {
    console.log("VKs have DIFFERENT sizes - different formats/versions");
  }

  await backend.destroy();
}

main().catch(console.error);
