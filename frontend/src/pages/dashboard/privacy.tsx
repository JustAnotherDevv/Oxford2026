import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { parseUnits, formatUnits, parseAbiItem } from "viem";
import {
  Shield,
  Lock,
  Unlock,
  EyeOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat2,
  Copy,
  Loader2,
  Check,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  PRIVATE_POOL_ADDRESS,
  TOKEN_ADDRESS,
  privatePoolAbi,
  erc20Abi,
} from "@/lib/contracts";
import {
  type Note,
  saveNote,
  getUnspentNotes,
  markNoteSpent,
  generateNoteId,
  generateSecret,
  addressToOwnerField,
} from "@/lib/notes";
import {
  computeHashes,
  computeSingleCommitment,
  generateProof,
  fieldToBytes32,
  type CircuitInputs,
} from "@/lib/noir";
import { getTree, rebuildTreeFromEvents } from "@/lib/merkle";

function truncateHex(hex: string, chars = 6): string {
  if (hex.length <= chars * 2 + 2) return hex;
  return `${hex.slice(0, chars + 2)}...${hex.slice(-chars)}`;
}

const TREE_DEPTH = 20;

// ── Component ───────────────────────────────────────────────────────

export default function PrivacyPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // ── Local note state ──
  const [notes, setNotes] = useState<Note[]>([]);
  const [treeReady, setTreeReady] = useState(false);

  const refreshNotes = useCallback(() => {
    if (address) setNotes(getUnspentNotes(address));
  }, [address]);

  // Rebuild Merkle tree from on-chain events
  const rebuildTree = useCallback(async () => {
    if (!publicClient || !isConnected) return;
    setTreeReady(false);
    try {
      const logs = await publicClient.getLogs({
        address: PRIVATE_POOL_ADDRESS,
        event: parseAbiItem(
          "event LeafInserted(bytes32 indexed commitment, uint256 leafIndex)",
        ),
        fromBlock: 0n,
        toBlock: "latest",
      });

      // Sort by leafIndex to ensure correct insertion order
      const sorted = [...logs].sort((a, b) => {
        const idxA = Number(a.args.leafIndex ?? 0n);
        const idxB = Number(b.args.leafIndex ?? 0n);
        return idxA - idxB;
      });

      const commitments = sorted.map((log) => log.args.commitment as string);
      await rebuildTreeFromEvents(commitments);
      setTreeReady(true);
    } catch (err) {
      console.error("Failed to rebuild Merkle tree:", err);
      // Tree may be empty, still mark as ready
      await getTree(); // Initialize empty tree
      setTreeReady(true);
    }
  }, [publicClient, isConnected]);

  useEffect(() => {
    refreshNotes();
    rebuildTree();
  }, [refreshNotes, rebuildTree]);

  // ── On-chain reads ──
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: tokenDecimals } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: isConnected },
  });

  const { data: tokenSymbol } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: isConnected },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, PRIVATE_POOL_ADDRESS] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const decimals = tokenDecimals ?? 18;
  const symbol = tokenSymbol ?? "TOKEN";

  // ── Computed stats ──
  const shieldedBalance = notes.reduce(
    (sum, n) => sum + BigInt(n.value),
    0n,
  );

  // ── Deposit state ──
  const [depositAmount, setDepositAmount] = useState("");
  const [depositStatus, setDepositStatus] = useState<
    "idle" | "computing" | "approving" | "depositing" | "done" | "error"
  >("idle");
  const [depositError, setDepositError] = useState("");
  const [depositTxHash, setDepositTxHash] = useState("");

  const { writeContractAsync } = useWriteContract();

  // ── Transfer state ──
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(
    new Set(),
  );
  const [transferStatus, setTransferStatus] = useState<
    "idle" | "computing" | "proving" | "submitting" | "done" | "error"
  >("idle");
  const [transferError, setTransferError] = useState("");
  const [transferTxHash, setTransferTxHash] = useState("");

  // ── Withdraw state ──
  const [withdrawRecipient, setWithdrawRecipient] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNoteIds, setWithdrawNoteIds] = useState<Set<string>>(
    new Set(),
  );
  const [withdrawStatus, setWithdrawStatus] = useState<
    "idle" | "computing" | "proving" | "submitting" | "done" | "error"
  >("idle");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawTxHash, setWithdrawTxHash] = useState("");

  // ── Wait for deposit receipt (for leafIndex from event) ──
  const { data: depositReceipt } = useWaitForTransactionReceipt({
    hash: depositTxHash as `0x${string}` | undefined,
    query: { enabled: !!depositTxHash },
  });

  useEffect(() => {
    if (depositReceipt && depositStatus === "depositing") {
      // Parse Deposit event to get leafIndex
      const depositLog = depositReceipt.logs[depositReceipt.logs.length - 1];
      if (depositLog && depositLog.data) {
        const data = depositLog.data;
        const leafIndexHex = data.slice(2, 66);
        const leafIndex = parseInt(leafIndexHex, 16);

        const pendingRaw = sessionStorage.getItem("pending_deposit");
        if (pendingRaw && address) {
          const pending = JSON.parse(pendingRaw);
          const note: Note = {
            id: generateNoteId(),
            value: pending.value,
            secret: pending.secret,
            owner: pending.owner,
            commitment: pending.commitment,
            leafIndex,
            spent: false,
            createdAt: Date.now(),
          };
          saveNote(note);
          sessionStorage.removeItem("pending_deposit");
          // Also insert into local Merkle tree
          getTree().then((tree) => tree.insertLeaf(pending.commitment));
          refreshNotes();
          refetchBalance();
        }
      }
      setDepositStatus("done");
    }
  }, [depositReceipt, depositStatus, address, refreshNotes, refetchBalance]);

  // ── Deposit handler ──
  async function handleDeposit() {
    if (!address || !depositAmount) return;
    setDepositStatus("computing");
    setDepositError("");
    setDepositTxHash("");

    try {
      const amountWei = parseUnits(depositAmount, decimals);
      const secret = generateSecret();
      const ownerField = addressToOwnerField(address);

      const commitment = await computeSingleCommitment(
        amountWei.toString(),
        secret,
        ownerField,
      );

      const commitmentBytes32 = fieldToBytes32(commitment);

      sessionStorage.setItem(
        "pending_deposit",
        JSON.stringify({
          value: amountWei.toString(),
          secret,
          owner: ownerField,
          commitment: commitmentBytes32,
        }),
      );

      // Check allowance and approve if needed
      const currentAllowance = allowance ?? 0n;
      if (currentAllowance < amountWei) {
        setDepositStatus("approving");
        await writeContractAsync({
          address: TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [PRIVATE_POOL_ADDRESS, amountWei],
        });
        let attempts = 0;
        while (attempts < 30) {
          await new Promise((r) => setTimeout(r, 2000));
          const { data: newAllowance } = await refetchAllowance();
          if (newAllowance !== undefined && newAllowance >= amountWei) break;
          attempts++;
        }
      }

      // Deposit
      setDepositStatus("depositing");
      const tx = await writeContractAsync({
        address: PRIVATE_POOL_ADDRESS,
        abi: privatePoolAbi,
        functionName: "deposit",
        args: [commitmentBytes32, amountWei],
      });
      setDepositTxHash(tx);
    } catch (err) {
      console.error("Deposit error:", err);
      setDepositError(err instanceof Error ? err.message : "Deposit failed");
      setDepositStatus("error");
    }
  }

  // ── Transfer handler ──
  async function handleTransfer() {
    if (!address || !transferAmount || !transferRecipient) return;
    if (!treeReady) {
      setTransferError("Merkle tree not ready. Please wait...");
      return;
    }
    setTransferStatus("computing");
    setTransferError("");
    setTransferTxHash("");

    try {
      const selectedNotes = notes.filter((n) => selectedNoteIds.has(n.id));
      if (selectedNotes.length === 0 || selectedNotes.length > 2) {
        throw new Error("Select 1 or 2 notes to spend");
      }

      const sendAmount = parseUnits(transferAmount, decimals);
      const totalIn = selectedNotes.reduce(
        (s, n) => s + BigInt(n.value),
        0n,
      );
      if (totalIn < sendAmount) {
        throw new Error("Insufficient note value for transfer amount");
      }
      const changeAmount = totalIn - sendAmount;

      const recipientField = BigInt(transferRecipient).toString();
      const ownerField = addressToOwnerField(address);

      const in1 = selectedNotes[0];
      const in2 = selectedNotes.length > 1 ? selectedNotes[1] : null;

      const dummySecret = generateSecret();
      const dummyIndex = "999999";

      const outSecret1 = generateSecret();
      const outSecret2 = generateSecret();
      const outViewingKey1 = generateSecret();
      const outViewingKey2 = generateSecret();

      // Compute Pedersen hashes
      const hashes = await computeHashes({
        nullSecret1: in1.secret,
        nullIdx1: in1.leafIndex.toString(),
        nullSecret2: in2 ? in2.secret : dummySecret,
        nullIdx2: in2 ? in2.leafIndex.toString() : dummyIndex,
        commVal1: sendAmount.toString(),
        commSec1: outSecret1,
        commOwn1: recipientField,
        commVal2: changeAmount.toString(),
        commSec2: outSecret2,
        commOwn2: ownerField,
        vk1: outViewingKey1,
        vk2: outViewingKey2,
      });

      // Get Merkle proofs from frontend Pedersen tree
      const tree = await getTree();
      const proof1 = await tree.getMerkleProof(in1.leafIndex);

      // For dummy input, use zeros
      const dummyPath = new Array(TREE_DEPTH).fill("0");
      const dummyDirs = new Array(TREE_DEPTH).fill(0);

      const proof2 = in2
        ? await tree.getMerkleProof(in2.leafIndex)
        : { root: proof1.root, path: dummyPath, directions: dummyDirs };

      setTransferStatus("proving");

      // Assemble full circuit inputs
      const circuitInputs: CircuitInputs = {
        merkle_root: BigInt(proof1.root).toString(),
        nullifier_1: hashes.nullifier1,
        nullifier_2: hashes.nullifier2,
        out_commitment_1: hashes.commitment1,
        out_commitment_2: hashes.commitment2,
        fee: "0",
        relayer: "0",
        encrypted_value_1: hashes.encryptedValue1,
        encrypted_value_2: hashes.encryptedValue2,

        in_value_1: in1.value,
        in_secret_1: in1.secret,
        in_owner_1: in1.owner,
        in_leaf_index_1: in1.leafIndex.toString(),
        in_path_1: proof1.path,
        in_dirs_1: proof1.directions.map(String),
        in_is_dummy_1: "0",

        in_value_2: in2 ? in2.value : "0",
        in_secret_2: in2 ? in2.secret : dummySecret,
        in_owner_2: in2 ? in2.owner : "0",
        in_leaf_index_2: in2 ? in2.leafIndex.toString() : dummyIndex,
        in_path_2: proof2.path,
        in_dirs_2: proof2.directions.map(String),
        in_is_dummy_2: in2 ? "0" : "1",

        out_value_1: sendAmount.toString(),
        out_secret_1: outSecret1,
        out_owner_1: recipientField,

        out_value_2: changeAmount.toString(),
        out_secret_2: outSecret2,
        out_owner_2: ownerField,

        out_viewing_key_1: outViewingKey1,
        out_viewing_key_2: outViewingKey2,
      };

      // Generate real ZK proof
      const { proof, publicInputs } = await generateProof(circuitInputs);

      setTransferStatus("submitting");
      const tx = await writeContractAsync({
        address: PRIVATE_POOL_ADDRESS,
        abi: privatePoolAbi,
        functionName: "transact",
        args: [proof, publicInputs],
      });

      // Mark input notes as spent
      for (const n of selectedNotes) {
        markNoteSpent(n.id);
      }

      // Save output notes globally
      // Note 1: recipient's note
      saveNote({
        id: generateNoteId(),
        value: sendAmount.toString(),
        secret: outSecret1,
        owner: recipientField,
        commitment: fieldToBytes32(hashes.commitment1),
        leafIndex: tree.leafCount, // Will be assigned by contract
        spent: false,
        createdAt: Date.now(),
      });

      // Note 2: change note (back to sender)
      if (changeAmount > 0n) {
        saveNote({
          id: generateNoteId(),
          value: changeAmount.toString(),
          secret: outSecret2,
          owner: ownerField,
          commitment: fieldToBytes32(hashes.commitment2),
          leafIndex: tree.leafCount + 1,
          spent: false,
          createdAt: Date.now(),
        });
      }

      // Insert new commitments into local tree
      await tree.insertLeaf(fieldToBytes32(hashes.commitment1));
      await tree.insertLeaf(fieldToBytes32(hashes.commitment2));

      setTransferTxHash(tx);
      setTransferStatus("done");
      refreshNotes();
      setSelectedNoteIds(new Set());
    } catch (err) {
      console.error("Transfer error:", err);
      setTransferError(
        err instanceof Error ? err.message : "Transfer failed",
      );
      setTransferStatus("error");
    }
  }

  // ── Withdraw handler ──
  async function handleWithdraw() {
    if (!address || !withdrawAmount || !withdrawRecipient) return;
    if (!treeReady) {
      setWithdrawError("Merkle tree not ready. Please wait...");
      return;
    }
    setWithdrawStatus("computing");
    setWithdrawError("");
    setWithdrawTxHash("");

    try {
      const selectedNotes = notes.filter((n) => withdrawNoteIds.has(n.id));
      if (selectedNotes.length === 0 || selectedNotes.length > 2) {
        throw new Error("Select 1 or 2 notes to spend");
      }

      const wdAmount = parseUnits(withdrawAmount, decimals);
      const totalIn = selectedNotes.reduce(
        (s, n) => s + BigInt(n.value),
        0n,
      );
      if (totalIn < wdAmount) {
        throw new Error("Insufficient note value for withdrawal amount");
      }
      const changeAmount = totalIn - wdAmount;

      const ownerField = addressToOwnerField(address);

      const in1 = selectedNotes[0];
      const in2 = selectedNotes.length > 1 ? selectedNotes[1] : null;

      const dummySecret = generateSecret();
      const dummyIndex = "999999";

      const outSecret1 = generateSecret();
      const outSecret2 = generateSecret();
      const outViewingKey1 = generateSecret();
      const outViewingKey2 = generateSecret();

      // For withdraw, output 1 value is 0 (withdrawn amount leaves the pool)
      // output 2 is change back to sender
      const hashes = await computeHashes({
        nullSecret1: in1.secret,
        nullIdx1: in1.leafIndex.toString(),
        nullSecret2: in2 ? in2.secret : dummySecret,
        nullIdx2: in2 ? in2.leafIndex.toString() : dummyIndex,
        commVal1: "0",
        commSec1: outSecret1,
        commOwn1: ownerField,
        commVal2: changeAmount.toString(),
        commSec2: outSecret2,
        commOwn2: ownerField,
        vk1: outViewingKey1,
        vk2: outViewingKey2,
      });

      // Get Merkle proofs
      const tree = await getTree();
      const proof1 = await tree.getMerkleProof(in1.leafIndex);

      const dummyPath = new Array(TREE_DEPTH).fill("0");
      const dummyDirs = new Array(TREE_DEPTH).fill(0);

      const proof2 = in2
        ? await tree.getMerkleProof(in2.leafIndex)
        : { root: proof1.root, path: dummyPath, directions: dummyDirs };

      setWithdrawStatus("proving");

      const circuitInputs: CircuitInputs = {
        merkle_root: BigInt(proof1.root).toString(),
        nullifier_1: hashes.nullifier1,
        nullifier_2: hashes.nullifier2,
        out_commitment_1: hashes.commitment1,
        out_commitment_2: hashes.commitment2,
        fee: "0",
        relayer: "0",
        encrypted_value_1: hashes.encryptedValue1,
        encrypted_value_2: hashes.encryptedValue2,

        in_value_1: in1.value,
        in_secret_1: in1.secret,
        in_owner_1: in1.owner,
        in_leaf_index_1: in1.leafIndex.toString(),
        in_path_1: proof1.path,
        in_dirs_1: proof1.directions.map(String),
        in_is_dummy_1: "0",

        in_value_2: in2 ? in2.value : "0",
        in_secret_2: in2 ? in2.secret : dummySecret,
        in_owner_2: in2 ? in2.owner : "0",
        in_leaf_index_2: in2 ? in2.leafIndex.toString() : dummyIndex,
        in_path_2: proof2.path,
        in_dirs_2: proof2.directions.map(String),
        in_is_dummy_2: in2 ? "0" : "1",

        out_value_1: "0",
        out_secret_1: outSecret1,
        out_owner_1: ownerField,

        out_value_2: changeAmount.toString(),
        out_secret_2: outSecret2,
        out_owner_2: ownerField,

        out_viewing_key_1: outViewingKey1,
        out_viewing_key_2: outViewingKey2,
      };

      const { proof, publicInputs } = await generateProof(circuitInputs);

      setWithdrawStatus("submitting");
      const tx = await writeContractAsync({
        address: PRIVATE_POOL_ADDRESS,
        abi: privatePoolAbi,
        functionName: "withdraw",
        args: [
          proof,
          publicInputs,
          withdrawRecipient as `0x${string}`,
          wdAmount,
        ],
      });

      for (const n of selectedNotes) {
        markNoteSpent(n.id);
      }

      if (changeAmount > 0n) {
        saveNote({
          id: generateNoteId(),
          value: changeAmount.toString(),
          secret: outSecret2,
          owner: ownerField,
          commitment: fieldToBytes32(hashes.commitment2),
          leafIndex: tree.leafCount + 1,
          spent: false,
          createdAt: Date.now(),
        });
      }

      // Insert new commitments into local tree
      await tree.insertLeaf(fieldToBytes32(hashes.commitment1));
      await tree.insertLeaf(fieldToBytes32(hashes.commitment2));

      setWithdrawTxHash(tx);
      setWithdrawStatus("done");
      refreshNotes();
      refetchBalance();
      setWithdrawNoteIds(new Set());
    } catch (err) {
      console.error("Withdraw error:", err);
      setWithdrawError(
        err instanceof Error ? err.message : "Withdrawal failed",
      );
      setWithdrawStatus("error");
    }
  }

  // ── Toggle note selection helpers ──
  function toggleTransferNote(id: string) {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      return next;
    });
  }

  function toggleWithdrawNote(id: string) {
    setWithdrawNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      return next;
    });
  }

  // ── Not connected state ──
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Connect Wallet
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to access the Privacy Pool. You can deposit,
          transfer, and withdraw funds privately using zero-knowledge proofs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">
                Privacy Pool
              </h1>
              <Badge variant="secondary" className="text-[10px]">
                ZK Proofs Enabled
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Shield, transfer, and withdraw funds privately using ZK proofs.
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Shielded Balance</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              {formatUnits(shieldedBalance, decimals)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{symbol}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Unspent Notes</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              {notes.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">UTXOs</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              {tokenBalance !== undefined
                ? formatUnits(tokenBalance, decimals)
                : "\u2014"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{symbol}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Merkle Tree</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">
              {treeReady ? "Synced" : "Loading..."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pedersen tree from events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notes + Actions two-column */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Private Notes */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Private Notes (UTXOs)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {notes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No unspent notes. Deposit funds to create your first UTXO.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Unlock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-card-foreground">
                        {formatUnits(BigInt(note.value), decimals)} {symbol}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono">
                          {truncateHex(note.commitment)}
                        </span>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(note.commitment)
                          }
                          className="hover:text-foreground transition-colors"
                          title="Copy commitment"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        Unspent
                      </Badge>
                      {note.leafIndex >= 0 && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Leaf #{note.leafIndex}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="deposit">
              <TabsList className="w-full">
                <TabsTrigger value="deposit" className="flex-1 gap-1.5">
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  Deposit
                </TabsTrigger>
                <TabsTrigger value="transfer" className="flex-1 gap-1.5">
                  <Repeat2 className="h-3.5 w-3.5" />
                  Transfer
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="flex-1 gap-1.5">
                  <ArrowUpFromLine className="h-3.5 w-3.5" />
                  Withdraw
                </TabsTrigger>
              </TabsList>

              {/* ── Deposit Tab ── */}
              <TabsContent
                value="deposit"
                className="mt-4 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deposit-amount">Amount ({symbol})</Label>
                    {tokenBalance !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        Balance: {formatUnits(tokenBalance, decimals)}
                      </span>
                    )}
                  </div>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="100"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={
                      depositStatus !== "idle" &&
                      depositStatus !== "done" &&
                      depositStatus !== "error"
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Funds will be shielded into a new UTXO commitment on-chain.
                </p>
                {depositError && (
                  <p className="text-xs text-destructive">{depositError}</p>
                )}
                {depositStatus === "done" && depositTxHash && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Deposited! Tx: {truncateHex(depositTxHash)}
                  </p>
                )}
                <Button
                  className="gap-2"
                  onClick={handleDeposit}
                  disabled={
                    !depositAmount ||
                    (depositStatus !== "idle" &&
                      depositStatus !== "done" &&
                      depositStatus !== "error")
                  }
                >
                  {depositStatus === "computing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Computing
                      commitment...
                    </>
                  ) : depositStatus === "approving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Approving...
                    </>
                  ) : depositStatus === "depositing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />{" "}
                      Depositing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" /> Shield &amp; Deposit
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* ── Transfer Tab ── */}
              <TabsContent
                value="transfer"
                className="mt-4 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="transfer-recipient">
                    Recipient Address (0x...)
                  </Label>
                  <Input
                    id="transfer-recipient"
                    placeholder="0x..."
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    disabled={
                      transferStatus !== "idle" &&
                      transferStatus !== "done" &&
                      transferStatus !== "error"
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="transfer-amount">Amount ({symbol})</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    placeholder="50"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    disabled={
                      transferStatus !== "idle" &&
                      transferStatus !== "done" &&
                      transferStatus !== "error"
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Select Notes to Spend (max 2)</Label>
                  <div className="flex flex-wrap gap-2">
                    {notes.map((note) => (
                      <Badge
                        key={note.id}
                        variant={
                          selectedNoteIds.has(note.id) ? "default" : "outline"
                        }
                        className="cursor-pointer hover:bg-secondary text-xs"
                        onClick={() => toggleTransferNote(note.id)}
                      >
                        {formatUnits(BigInt(note.value), decimals)} {symbol}
                      </Badge>
                    ))}
                    {notes.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        No notes available
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  A ZK proof will be generated (this may take 30-60 seconds).
                </p>
                {transferError && (
                  <p className="text-xs text-destructive">{transferError}</p>
                )}
                {transferStatus === "done" && transferTxHash && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Transfer submitted! Tx: {truncateHex(transferTxHash)}
                  </p>
                )}
                <Button
                  className="gap-2"
                  onClick={handleTransfer}
                  disabled={
                    !transferAmount ||
                    !transferRecipient ||
                    selectedNoteIds.size === 0 ||
                    !treeReady ||
                    (transferStatus !== "idle" &&
                      transferStatus !== "done" &&
                      transferStatus !== "error")
                  }
                >
                  {transferStatus === "computing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Computing
                      hashes...
                    </>
                  ) : transferStatus === "proving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating
                      ZK proof...
                    </>
                  ) : transferStatus === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                      tx...
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" /> Private Transfer
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* ── Withdraw Tab ── */}
              <TabsContent
                value="withdraw"
                className="mt-4 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="withdraw-address">Recipient Address</Label>
                  <Input
                    id="withdraw-address"
                    placeholder="0x..."
                    value={withdrawRecipient}
                    onChange={(e) => setWithdrawRecipient(e.target.value)}
                    disabled={
                      withdrawStatus !== "idle" &&
                      withdrawStatus !== "done" &&
                      withdrawStatus !== "error"
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="withdraw-amount">Amount ({symbol})</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="50"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={
                      withdrawStatus !== "idle" &&
                      withdrawStatus !== "done" &&
                      withdrawStatus !== "error"
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Select Notes to Spend (max 2)</Label>
                  <div className="flex flex-wrap gap-2">
                    {notes.map((note) => (
                      <Badge
                        key={note.id}
                        variant={
                          withdrawNoteIds.has(note.id) ? "default" : "outline"
                        }
                        className="cursor-pointer hover:bg-secondary text-xs"
                        onClick={() => toggleWithdrawNote(note.id)}
                      >
                        {formatUnits(BigInt(note.value), decimals)} {symbol}
                      </Badge>
                    ))}
                    {notes.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        No notes available
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Funds will be unshielded and sent to the recipient address.
                  ZK proof generation may take 30-60 seconds.
                </p>
                {withdrawError && (
                  <p className="text-xs text-destructive">{withdrawError}</p>
                )}
                {withdrawStatus === "done" && withdrawTxHash && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Withdrawal submitted! Tx: {truncateHex(withdrawTxHash)}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent"
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount ||
                    !withdrawRecipient ||
                    withdrawNoteIds.size === 0 ||
                    !treeReady ||
                    (withdrawStatus !== "idle" &&
                      withdrawStatus !== "done" &&
                      withdrawStatus !== "error")
                  }
                >
                  {withdrawStatus === "computing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Computing
                      hashes...
                    </>
                  ) : withdrawStatus === "proving" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating
                      ZK proof...
                    </>
                  ) : withdrawStatus === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                      tx...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="h-4 w-4" /> Withdraw to
                      Address
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
