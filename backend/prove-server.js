const express = require("express");
const cors = require("cors");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const NOIR_DIR = path.resolve(__dirname, "../noir");
const BB = "/Users/nevvdevv/.bb/bb";
const NARGO = "/Users/nevvdevv/.nargo/bin/nargo";
const CIRCUIT_PATH = path.join(NOIR_DIR, "target/noir.json");

app.post("/api/prove", async (req, res) => {
  const inputs = req.body;
  const id = crypto.randomBytes(8).toString("hex");
  const witnessName = `w_${id}`;
  const proofDir = path.join(NOIR_DIR, `target/proof_${id}`);

  try {
    // Build Prover.toml from the inputs
    const lines = [];
    for (const [key, value] of Object.entries(inputs)) {
      if (Array.isArray(value)) {
        lines.push(`${key} = [${value.map((v) => `"${v}"`).join(", ")}]`);
      } else {
        lines.push(`${key} = "${value}"`);
      }
    }
    fs.writeFileSync(path.join(NOIR_DIR, "Prover.toml"), lines.join("\n"));

    // Generate witness
    execSync(`${NARGO} execute ${witnessName}`, {
      cwd: NOIR_DIR,
      timeout: 60000,
      stdio: "pipe",
    });

    // Generate proof with bb CLI
    const witnessPath = path.join(NOIR_DIR, `target/${witnessName}.gz`);
    fs.mkdirSync(proofDir, { recursive: true });
    execSync(
      `${BB} prove -b ${CIRCUIT_PATH} -w ${witnessPath} -o ${proofDir} --oracle_hash keccak --init_kzg_accumulator`,
      { cwd: NOIR_DIR, timeout: 300000, stdio: "pipe" }
    );

    // Read proof and public inputs
    const proofBytes = fs.readFileSync(path.join(proofDir, "proof"));
    const pubInputsBytes = fs.readFileSync(path.join(proofDir, "public_inputs"));

    const proofHex = "0x" + proofBytes.toString("hex");

    const publicInputs = [];
    for (let i = 0; i < pubInputsBytes.length; i += 32) {
      publicInputs.push("0x" + pubInputsBytes.slice(i, i + 32).toString("hex"));
    }

    console.log(
      `[${id}] Proof generated: ${proofBytes.length} bytes, ${publicInputs.length} public inputs`
    );

    res.json({ proof: proofHex, publicInputs });
  } catch (err) {
    console.error(`[${id}] Error:`, err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Cleanup
    try {
      fs.rmSync(proofDir, { recursive: true, force: true });
      const witnessPath = path.join(NOIR_DIR, `target/${witnessName}.gz`);
      if (fs.existsSync(witnessPath)) fs.unlinkSync(witnessPath);
    } catch {}
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Prove server running on http://localhost:${PORT}`);
  console.log(`POST /api/prove with circuit inputs as JSON body`);
});
