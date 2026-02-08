import { Barretenberg, Fr } from "@aztec/bb.js";

const TREE_DEPTH = 20;

let bbInstance: Barretenberg | null = null;
let zeroHashes: Fr[] | null = null;

async function getBb(): Promise<Barretenberg> {
  if (!bbInstance) {
    bbInstance = await Barretenberg.new({ threads: 1 });
  }
  return bbInstance;
}

function bigintToFr(val: bigint): Fr {
  return new Fr(val);
}

function hexToFr(hex: string): Fr {
  return new Fr(BigInt(hex));
}

async function pedersenHash2(bb: Barretenberg, left: Fr, right: Fr): Promise<Fr> {
  return bb.pedersenHash([left, right], 0);
}

/** Precompute zero hashes for each level: zeros[0] = 0, zeros[i] = H(zeros[i-1], zeros[i-1]) */
async function getZeroHashes(bb: Barretenberg): Promise<Fr[]> {
  if (zeroHashes) return zeroHashes;
  const zeros: Fr[] = new Array(TREE_DEPTH + 1);
  zeros[0] = Fr.ZERO;
  for (let i = 1; i <= TREE_DEPTH; i++) {
    zeros[i] = await pedersenHash2(bb, zeros[i - 1], zeros[i - 1]);
  }
  zeroHashes = zeros;
  return zeros;
}

/**
 * In-memory Pedersen Merkle tree (depth 20).
 * Mirrors the contract's incremental tree but uses Pedersen hashing.
 */
export class PedersenMerkleTree {
  private leaves: Fr[] = [];
  private bb: Barretenberg | null = null;
  private zeros: Fr[] = [];

  async init(): Promise<void> {
    this.bb = await getBb();
    this.zeros = await getZeroHashes(this.bb);
  }

  get leafCount(): number {
    return this.leaves.length;
  }

  /** Insert a leaf (commitment as hex string e.g. "0x...") */
  async insertLeaf(commitmentHex: string): Promise<number> {
    const leaf = hexToFr(commitmentHex);
    const index = this.leaves.length;
    this.leaves.push(leaf);
    return index;
  }

  /** Insert a leaf from a bigint field element */
  async insertLeafField(commitment: bigint): Promise<number> {
    const leaf = bigintToFr(commitment);
    const index = this.leaves.length;
    this.leaves.push(leaf);
    return index;
  }

  /** Compute the current root by rebuilding the tree */
  async getRoot(): Promise<Fr> {
    if (!this.bb) throw new Error("Tree not initialized");
    if (this.leaves.length === 0) {
      return this.zeros[TREE_DEPTH];
    }
    return this._computeRoot();
  }

  /** Get Merkle proof for a leaf at the given index */
  async getMerkleProof(leafIndex: number): Promise<{
    root: string;
    path: string[];
    directions: number[];
  }> {
    if (!this.bb) throw new Error("Tree not initialized");
    if (leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of range (${this.leaves.length} leaves)`);
    }

    const { root, siblings, directions } = await this._computeProof(leafIndex);

    return {
      root: "0x" + root.toString().slice(2).padStart(64, "0"),
      path: siblings.map((s) => BigInt("0x" + s.toString().slice(2)).toString()),
      directions: directions,
    };
  }

  private async _computeRoot(): Promise<Fr> {
    if (!this.bb) throw new Error("Tree not initialized");
    const bb = this.bb;

    // Build tree level by level
    let currentLevel = [...this.leaves];

    for (let depth = 0; depth < TREE_DEPTH; depth++) {
      const nextLevel: Fr[] = [];
      const levelLen = currentLevel.length;

      for (let i = 0; i < levelLen; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < levelLen ? currentLevel[i + 1] : this.zeros[depth];
        nextLevel.push(await pedersenHash2(bb, left, right));
      }

      // If the level is empty after pairing, fill with zero
      if (nextLevel.length === 0) {
        nextLevel.push(this.zeros[depth + 1]);
      }

      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  private async _computeProof(leafIndex: number): Promise<{
    root: Fr;
    siblings: Fr[];
    directions: number[];
  }> {
    if (!this.bb) throw new Error("Tree not initialized");
    const bb = this.bb;

    const siblings: Fr[] = [];
    const directions: number[] = [];

    // Build tree level by level, tracking the path
    let currentLevel = [...this.leaves];
    let idx = leafIndex;

    for (let depth = 0; depth < TREE_DEPTH; depth++) {
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

      // Direction: 0 if current is on the left (even index), 1 if on the right (odd index)
      directions.push(idx % 2 === 0 ? 0 : 1);

      // Get sibling (or zero if beyond tree)
      if (siblingIdx < currentLevel.length) {
        siblings.push(currentLevel[siblingIdx]);
      } else {
        siblings.push(this.zeros[depth]);
      }

      // Move to next level
      const nextLevel: Fr[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : this.zeros[depth];
        nextLevel.push(await pedersenHash2(bb, left, right));
      }
      if (nextLevel.length === 0) {
        nextLevel.push(this.zeros[depth + 1]);
      }

      currentLevel = nextLevel;
      idx = Math.floor(idx / 2);
    }

    return { root: currentLevel[0], siblings, directions };
  }
}

/** Singleton tree instance */
let treeInstance: PedersenMerkleTree | null = null;

export async function getTree(): Promise<PedersenMerkleTree> {
  if (!treeInstance) {
    treeInstance = new PedersenMerkleTree();
    await treeInstance.init();
  }
  return treeInstance;
}

/** Reset the tree (e.g., on chain change or reconnect) */
export function resetTree(): void {
  treeInstance = null;
}

/**
 * Rebuild tree from on-chain events.
 * Call this on page load to sync with the contract state.
 */
export async function rebuildTreeFromEvents(
  commitments: string[],
): Promise<PedersenMerkleTree> {
  resetTree();
  const tree = await getTree();
  for (const commitment of commitments) {
    await tree.insertLeaf(commitment);
  }
  return tree;
}
